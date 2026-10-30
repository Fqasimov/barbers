<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * The owner's business and the public salon are one row: `id` is the salon id.
 *
 * @property string $id
 * @property ?string $owner_id
 * @property string $name
 * @property string $status pending_review | live | suspended
 */
class Business extends Model
{
    use HasStringId, SoftDeletes;

    public const PENDING = 'pending_review';

    public const LIVE = 'live';

    public const SUSPENDED = 'suspended';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'kind' => 'array',
            'categories' => 'array',
            'tagline' => 'array',
            'about' => 'array',
            'closed_days' => 'array',
            'amenities' => 'array',
            'base_distribution' => 'array',
            'review_stars' => 'array',
            'base_rating' => 'float',
            'suspended_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'price_level' => 'integer',
            'base_review_count' => 'integer',
            'review_count' => 'integer',
            'review_sum' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function masters(): HasMany
    {
        return $this->hasMany(Master::class)->orderBy('position')->orderBy('created_at');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class)->orderBy('position')->orderBy('created_at');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class)->orderBy('position')->orderBy('created_at');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Salons customers can see and book: live, with at least one service and
     * one master, and a trial or paid period that ended less than the grace
     * period ago. Existing bookings of a salon that drops out stay valid.
     */
    public function scopeListable(Builder $q): Builder
    {
        $cutoff = now()->subDays((int) config('usta.grace_days'));

        return $q->where('status', self::LIVE)
            ->whereHas('services')
            ->whereHas('masters')
            ->whereHas('subscription', fn (Builder $s) => $s
                ->whereIn('status', Subscription::LIVE_STATUSES)
                ->whereRaw('COALESCE(current_period_end, trial_ends_at) > ?', [$cutoff]));
    }

    /** Review passed: live (in search once it has a service, a master and a running plan). */
    public function approve(): void
    {
        $this->forceFill(['status' => self::LIVE, 'approved_at' => $this->approved_at ?? now(), 'suspended_at' => null, 'suspended_reason' => null])->save();
    }

    /** Hidden from search and closed to new bookings; existing bookings stay. */
    public function suspend(?string $reason = null): void
    {
        $this->forceFill(['status' => self::SUSPENDED, 'suspended_at' => now(), 'suspended_reason' => $reason])->save();
    }

    public function isListable(): bool
    {
        return static::query()->listable()->whereKey($this->getKey())->exists();
    }
}
