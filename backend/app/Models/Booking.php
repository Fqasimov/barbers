<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\BusyCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasStringId;

    public const UPCOMING = 'upcoming';

    public const COMPLETED = 'completed';

    public const CANCELLED = 'cancelled';

    public const NO_SHOW = 'no_show';

    /** A Pro salon's deposit is not paid yet: the slot is held until hold_until. */
    public const PENDING_PAYMENT = 'pending_payment';

    /** A client's appointment. */
    public const VISIT = 'visit';

    /** Time the salon closed off: a break, a day off, a holiday. */
    public const BLOCK = 'block';

    protected $guarded = [];

    protected static function booted(): void
    {
        // Free slots everyone sees depend on bookings; recompute them after any change.
        static::saved(fn () => BusyCache::flush());
        static::deleted(fn () => BusyCache::flush());
    }

    protected function casts(): array
    {
        return [
            'services' => 'array',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'reminded_24h_at' => 'datetime',
            'reminded_2h_at' => 'datetime',
            'hold_until' => 'datetime',
            'deposit' => 'integer',
            'duration_min' => 'integer',
            'total' => 'integer',
        ];
    }

    /** Bookings that take the master's time: upcoming, or waiting for a deposit inside the hold. */
    public function scopeBlocking(Builder $q): void
    {
        $q->where(fn (Builder $q) => $q->where('status', self::UPCOMING)
            ->orWhere(fn (Builder $q) => $q->where('status', self::PENDING_PAYMENT)->where('hold_until', '>', now())));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class)->withTrashed();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function isBlock(): bool
    {
        return $this->kind === self::BLOCK;
    }

    /** @return list<string> */
    public function serviceIds(): array
    {
        return array_values(array_map(fn ($s) => (string) $s['id'], $this->services ?? []));
    }

    public function hasEnded(): bool
    {
        return $this->end_at->lte(now());
    }

    /** What the customer sees: an upcoming booking whose time has passed reads as completed. */
    public function customerStatus(): string
    {
        return $this->status === self::UPCOMING && $this->hasEnded() ? self::COMPLETED : $this->status;
    }
}
