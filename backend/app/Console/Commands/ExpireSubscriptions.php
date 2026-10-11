<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

/**
 * trialing (trial_ends_at passed)            → expired
 * active   (current_period_end passed)        → past_due
 * past_due (current_period_end + 3 days)      → expired
 * Listing already hides lapsed salons in real time; this keeps the stored
 * status (shown to the owner) in step.
 */
class ExpireSubscriptions extends Command
{
    protected $signature = 'usta:expire-subscriptions';

    protected $description = 'Move lapsed trials and paid periods to past_due / expired';

    public function handle(): int
    {
        $now = now();
        $grace = (int) config('usta.grace_days');

        $expiredTrials = $this->each(Subscription::query()->where('status', Subscription::TRIALING)
            ->where('trial_ends_at', '<=', $now), Subscription::EXPIRED);

        // Long-lapsed active periods go straight to expired.
        $expiredPaid = $this->each(Subscription::query()->whereIn('status', [Subscription::ACTIVE, Subscription::PAST_DUE])
            ->where('current_period_end', '<=', $now->copy()->subDays($grace)), Subscription::EXPIRED);

        $pastDue = $this->each(Subscription::query()->where('status', Subscription::ACTIVE)
            ->where('current_period_end', '<=', $now), Subscription::PAST_DUE);

        $this->info("Trials expired: {$expiredTrials}; past due: {$pastDue}; expired after grace: {$expiredPaid}.");

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
