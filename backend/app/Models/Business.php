<?php

namespace App\Models;

use App\Exceptions\ApiException;
use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use App\Support\PublicFile;
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
            'hours_week' => 'array',
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

    /**
     * Opening hours on a weekday (0 = Sunday) as [open, close] "HH:MM", or null when closed.
     * Per-day hours (hours_week) win; otherwise the one pair for every open day.
     *
     * @return array{0:string,1:string}|null
     */
    public function dayHours(int $dow): ?array
    {
        $week = $this->hours_week;
        if (is_array($week) && count($week) === 7) {
            $d = $week[$dow] ?? null;

            return is_array($d) && isset($d['open'], $d['close']) ? [$d['open'], $d['close']] : null;
        }
        if (in_array($dow, array_map('intval', $this->closed_days ?? []), true)) {
            return null;
        }

        return [$this->hours_open, $this->hours_close];
    }

    /** The full week as the API sends it: 7 entries, {open, close} or null. */
    public function weekHours(): array
    {
        return array_map(function ($dow) {
            $h = $this->dayHours($dow);

            return $h ? ['open' => $h[0], 'close' => $h[1]] : null;
        }, range(0, 6));
    }

    public function logoUrl(): ?string
    {
        return PublicFile::url($this->logo_path);
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

    /** How many masters the plan allows (Fərdi: one person), or null for no limit. */
    public function masterLimit(): ?int
    {
        $limit = config('usta.master_limit.'.$this->planId());

        return $limit === null ? null : (int) $limit;
    }

    /**
     * The personal page, if the salon has picked an address: <web_url>/u/<slug>, or
     * https://<slug>.yazilnow.az for addresses that have a subdomain in cPanel
     * (PAGE_SUBDOMAIN_SLUGS), or for every address once the hosting has wildcard subdomains
     * (PAGE_SUBDOMAINS=true).
     */
    public function pageUrl(): ?string
    {
        $slug = $this->account()->slug;
        if (! $slug) {
            return null;
        }

        $subdomain = config('usta.page_subdomains') || in_array($slug, (array) config('usta.page_subdomain_slugs'), true);

        return $subdomain
            ? 'https://'.$slug.'.'.config('usta.page_domain')
            : rtrim((string) config('usta.web_url'), '/').'/u/'.$slug;
    }

    /**
     * The salon's own booking link, for an Instagram bio or a message to clients. Every plan
     * that takes bookings has one (Fərdi, Start, Pro; not Sadə): the personal page if an
     * address is picked, otherwise <web_url>/u/<id>. It opens the salon with its masters,
     * hours and free times, and on Pro lets the client pick a branch first.
     */
    public function shareUrl(): ?string
    {
        if (! $this->hasFeature('personal_page')) {
            return null;
        }

        $account = $this->account();
        $slug = $account->slug ?: $account->assignSlugFromName();
        $link = rtrim((string) config('usta.link_url'), '/');
        // link.yazilnow.az/<address>, unless the address has its own subdomain.
        $subdomain = $slug && (config('usta.page_subdomains') || in_array($slug, (array) config('usta.page_subdomain_slugs'), true));
        if ($link !== '' && ! $subdomain) {
            return $link.'/'.($slug ?: $account->id);
        }

        return $this->pageUrl() ?? rtrim((string) config('usta.web_url'), '/').'/u/'.$account->id;
    }

    /**
     * Gives the salon an address made from its name ("Elvin Bərbər" → elvin-berber), adding
     * -2, -3 … when it is taken or reserved. The owner can change it later. Null if the name
     * has no letters to make one from.
     */
    public function assignSlugFromName(): ?string
    {
        $base = \Illuminate\Support\Str::limit(\Illuminate\Support\Str::slug((string) $this->name), 26, '');
        $base = trim($base, '-');
        if (strlen($base) < 3) {
            return null;
        }

        $reserved = (array) config('usta.reserved_slugs');
        for ($n = 1; $n < 100; $n++) {
            $candidate = $n === 1 ? $base : $base.'-'.$n;
            $taken = in_array($candidate, $reserved, true)
                || self::query()->withTrashed()->where('slug', $candidate)->whereKeyNot($this->id)->exists();
            if (! $taken) {
                $this->forceFill(['slug' => $candidate])->saveQuietly();

                return $candidate;
            }
        }

        return null;
    }

    /** In-app booking (Fərdi, Start and Pro); Sadə sends clients to its own link. */
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

    /** The account's owner or anyone on its team (managers, staff): they can't review or report it. */
    public function isTeam(?User $user): bool
    {
        if (! $user) {
            return false;
        }
        $account = $this->account();

        return $account->owner_id === $user->id
            || BusinessMember::query()->where('business_id', $account->id)->where('user_id', $user->id)->exists();
    }

    public function isListable(): bool
    {
        return static::query()->listable()->whereKey($this->getKey())->exists();
    }
}
