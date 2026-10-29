<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

/**
 * trialing (trial_ends_at passed)                   → past_due
 * active   (current_period_end passed)               → past_due
 * any      (that end + usta.grace_days passed)       → expired
 * Listing already follows the dates in real time; this keeps the stored
 * status (shown to the owner) in step.
 */
class ExpireSubscriptions extends Command
{
    protected $signature = 'usta:expire-subscriptions';

    protected $description = 'Move lapsed trials and paid periods to past_due, then expired after the grace period';

    public function handle(): int
    {
        $now = now();
        $cutoff = $now->copy()->subDays((int) config('usta.grace_days'));

        // First, so a long-lapsed trial goes straight to expired.
        $expired = $this->each(Subscription::query()->whereIn('status', Subscription::LIVE_STATUSES)
            ->whereRaw('COALESCE(current_period_end, trial_ends_at) <= ?', [$cutoff]), Subscription::EXPIRED);

        $trials = $this->each(Subscription::query()->where('status', Subscription::TRIALING)
            ->where('trial_ends_at', '<=', $now), Subscription::PAST_DUE);

        $paid = $this->each(Subscription::query()->where('status', Subscription::ACTIVE)
            ->where('current_period_end', '<=', $now), Subscription::PAST_DUE);

        $this->info("Trials ended: {$trials}; paid periods ended: {$paid}; expired after grace: {$expired}.");

        return self::SUCCESS;
    }

    private function each($query, string $status): int
    {
        $n = 0;
        // Model saves (not a bulk update) so the catalogue cache is flushed.
        $query->each(function (Subscription $s) use ($status, &$n) {
            $s->forceFill(['status' => $status])->save();
            $n++;
        });

        return $n;
    }
}
