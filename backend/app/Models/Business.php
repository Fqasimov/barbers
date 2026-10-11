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
     * one master, and a trial or paid period that hasn't run out.
     */
    public function scopeListable(Builder $q): Builder
    {
        $now = now();

        return $q->where('status', self::LIVE)
            ->whereHas('services')
            ->whereHas('masters')
            ->whereHas('subscription', function (Builder $s) use ($now) {
                $s->where(function (Builder $w) use ($now) {
                    $w->where('status', Subscription::TRIALING)->where('trial_ends_at', '>', $now);
                })->orWhere(function (Builder $w) use ($now) {
                    $w->where('status', Subscription::ACTIVE)->where('current_period_end', '>', $now);
                });
            });
    }

    public function isListable(): bool
    {
        return static::query()->listable()->whereKey($this->getKey())->exists();
    }
}
