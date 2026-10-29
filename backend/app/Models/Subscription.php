<?php

namespace App\Models;

use App\Support\CatalogueCache;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * States:
 *  - trialing: free trial until trial_ends_at (30 days, once per business).
 *  - active:   paid until current_period_end.
 *  - past_due: the trial or the paid period ended unpaid. A 7-day grace
 *              (usta.grace_days): still listed and bookable, the owner is
 *              asked to pay.
 *  - expired:  the grace ran out. Hidden from search, no new bookings;
 *              existing bookings stay valid.
 * A successful payment always moves the subscription to active. Listing goes
 * by the dates (see Business::scopeListable), so a late cron run never hides
 * or shows a salon early; the stored status follows within minutes.
 */
class Subscription extends Model
{
    public const TRIALING = 'trialing';

    public const ACTIVE = 'active';

    public const PAST_DUE = 'past_due';

    public const EXPIRED = 'expired';

    public const LIVE_STATUSES = [self::TRIALING, self::ACTIVE, self::PAST_DUE];

    protected $guarded = ['id'];

    /** The end of what the salon has: the paid period, or the trial when it never paid. */
    public function coveredUntil(): ?CarbonInterface
    {
        return $this->current_period_end ?? $this->trial_ends_at;
    }

    /** When the salon leaves search unless it pays. */
    public function graceEndsAt(): ?CarbonInterface
    {
        return $this->coveredUntil()?->copy()->addDays((int) config('usta.grace_days'));
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'current_period_end' => 'datetime',
            'trial_reminded_3d_at' => 'datetime',
            'trial_reminded_0d_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
