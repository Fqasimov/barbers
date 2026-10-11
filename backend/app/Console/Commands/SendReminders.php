<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\Notifier;
use Illuminate\Console\Command;

/**
 * Push reminders 24 h and 2 h before each upcoming visit, each sent once
 * (reminded_24h_at / reminded_2h_at). A reminder is skipped when the booking
 * was made after its moment (booking for "in an hour" gets no reminder).
 */
class SendReminders extends Command
{
    protected $signature = 'usta:send-reminders';

    protected $description = 'Send 24 h and 2 h booking reminders (run every 5 minutes)';

    public function handle(Notifier $notifier): int
    {
        $now = now();
        $sent = 0;

        Booking::query()->where('status', Booking::UPCOMING)
            ->where('start_at', '>', $now)
            ->where('start_at', '<=', $now->copy()->addHours(24))
            ->where(fn ($q) => $q->whereNull('reminded_24h_at')->orWhereNull('reminded_2h_at'))
            ->with(['business', 'user'])
            ->chunkById(200, function ($bookings) use ($notifier, $now, &$sent) {
                foreach ($bookings as $b) {
                    $within2h = $b->start_at->lte($now->copy()->addHours(2));
                    $updates = [];
                    if ($within2h) {
                        if ($b->reminded_2h_at === null) {
                            if ($b->created_at->lt($b->start_at->copy()->subHours(2))) {
                                $notifier->reminder($b, '2h');
                                $sent++;
                            }
                            $updates['reminded_2h_at'] = $now;
                        }
                        // Too late for the 24 h one now.
                        $updates['reminded_24h_at'] = $b->reminded_24h_at ?? $now;
                    } elseif ($b->reminded_24h_at === null) {
                        if ($b->created_at->lt($b->start_at->copy()->subHours(24))) {
                            $notifier->reminder($b, '24h');
                            $sent++;
                        }
                        $updates['reminded_24h_at'] = $now;
                    }
                    if ($updates) {
                        $b->forceFill($updates)->saveQuietly();
                    }
                }
            });

        $this->info("Sent {$sent} reminders.");

        return self::SUCCESS;
    }
}
