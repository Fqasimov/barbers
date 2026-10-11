<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\Notifier;
use App\Support\Baku;
use Illuminate\Console\Command;

/** Emails the owner when the trial ends in 3 days, and on the day it ends (Baku dates). */
class TrialReminders extends Command
{
    protected $signature = 'usta:trial-reminders';

    protected $description = 'Email salon owners whose trial ends in 3 days or today';

    public function handle(Notifier $notifier): int
    {
        $today = Baku::today();
        $sent = 0;

        Subscription::query()->where('status', Subscription::TRIALING)
            ->where('trial_ends_at', '>=', $today->utc())
            ->where('trial_ends_at', '<', $today->addDays(4)->utc())
            ->where(fn ($q) => $q->whereNull('trial_reminded_3d_at')->orWhereNull('trial_reminded_0d_at'))
            ->with('business.owner')
            ->each(function (Subscription $s) use ($notifier, $today, &$sent) {
                if (! $s->business) {
                    return;
                }
                $days = (int) $today->diffInDays(Baku::local($s->trial_ends_at)->startOfDay());
                if ($days === 0 && $s->trial_reminded_0d_at === null) {
                    $notifier->trialEnding($s->business, 0);
                    $s->forceFill(['trial_reminded_0d_at' => now(), 'trial_reminded_3d_at' => $s->trial_reminded_3d_at ?? now()])->saveQuietly();
                    $sent++;
                } elseif ($days > 0 && $days <= 3 && $s->trial_reminded_3d_at === null) {
                    $notifier->trialEnding($s->business, $days);
                    $s->forceFill(['trial_reminded_3d_at' => now()])->saveQuietly();
                    $sent++;
                }
            });

        $this->info("Sent {$sent} trial emails.");

        return self::SUCCESS;
    }
}
