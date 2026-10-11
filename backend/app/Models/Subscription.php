<?php

namespace App\Models;

use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * States:
 *  - trialing: free trial until trial_ends_at (30 days, once per business).
 *  - active:   paid until current_period_end.
 *  - past_due: the paid period ended without renewal; a 3-day grace to pay
 *              before it becomes expired. Hidden from search like expired.
 *  - expired:  the trial or the grace ran out. Existing bookings stay valid.
 * A successful payment always moves the subscription to active.
 */
class Subscription extends Model
{
    public const TRIALING = 'trialing';

    public const ACTIVE = 'active';

    public const PAST_DUE = 'past_due';

    public const EXPIRED = 'expired';

    protected $guarded = ['id'];

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
