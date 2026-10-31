<?php

namespace App\Models;

use App\Exceptions\ApiException;
use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

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
            'review_weight' => 'integer',
            'review_weighted_sum' => 'integer',
            'whatsapp_quota' => 'integer',
            'whatsapp_used' => 'integer',
            'whatsapp_until' => 'datetime',
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

    /** The main salon of a Pro branch. */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** A Pro salon's other locations. */
    public function branches(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at');
    }

    public function members(): HasMany
    {
        return $this->hasMany(BusinessMember::class);
    }

    /** Who pays: the main salon for a branch, else the salon itself. */
    public function account(): self
    {
        return $this->parent_id ? ($this->parent ?? $this) : $this;
    }

    /** Every location of the account: the main salon first, then its branches. */
    public function locations(): Collection
    {
        $main = $this->account();

        return collect([$main])->concat($main->branches()->get());
    }

    /** The account's plan id (sade | start | pro), whatever the payment state. */
    public function planId(): ?string
    {
        return $this->account()->subscription?->plan;
    }

    /** What the plan unlocks (config usta.plan_features). */
    public function hasFeature(string $feature): bool
    {
        $plan = $this->planId();

        return $plan !== null && in_array($feature, config("usta.plan_features.{$plan}", []), true);
    }

    /** In-app booking (Start and Pro); Sadə sends clients to its own link. */
    public function takesBookings(): bool
    {
        return $this->hasFeature('booking');
    }

    /** Throws 402 plan_required unless the plan includes the feature. */
    public function requireFeature(string $feature): void
    {
        if (! $this->hasFeature($feature)) {
            throw new ApiException(402, 'plan_required', 'Your plan doesn’t include this. Upgrade to use it.');
        }
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
     * Salons customers can see: live with a trial or paid period that ended
     * less than the grace period ago. Booking plans also need a service and a
     * master; a Sadə salon is on the map without them. A branch goes by its
     * main salon, which must be live on Pro. Existing bookings of a salon
     * that drops out stay valid.
     */
    public function scopeListable(Builder $q): Builder
    {
        $cutoff = now()->subDays((int) config('usta.grace_days'));
        $running = fn (Builder $s) => $s
            ->whereIn('status', Subscription::LIVE_STATUSES)
            ->whereRaw('COALESCE(current_period_end, trial_ends_at) > ?', [$cutoff]);

        return $q->where('status', self::LIVE)
            ->where(fn (Builder $q) => $q
                ->where(fn (Builder $q) => $q->whereNull('parent_id')->whereHas('subscription', $running))
                ->orWhere(fn (Builder $q) => $q->whereNotNull('parent_id')->whereHas('parent', fn (Builder $p) => $p
                    ->where('status', self::LIVE)
                    ->whereHas('subscription', fn (Builder $s) => $running($s)->where('plan', 'pro')))))
            ->where(fn (Builder $q) => $q
                ->where(fn (Builder $q) => $q->whereHas('services')->whereHas('masters'))
                ->orWhere(fn (Builder $q) => $q->whereNull('parent_id')->whereHas('subscription', fn (Builder $s) => $s->where('plan', 'sade'))));
    }

    /** Listed salons that take bookings in the app (not Sadə). */
    public function scopeBookable(Builder $q): Builder
    {
        return $q->listable()->where(fn (Builder $q) => $q
            ->whereNotNull('parent_id')
            ->orWhereHas('subscription', fn (Builder $s) => $s->where('plan', '!=', 'sade')));
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
