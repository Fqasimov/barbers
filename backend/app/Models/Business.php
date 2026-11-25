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
            'voice_until' => 'datetime',
            'voice_minutes' => 'integer',
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

        return $this->usesSubdomain($slug)
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
        // Fərdi (one person): <address>.yazilnow.az once wildcard subdomains are on.
        // Start and Pro: link.yazilnow.az/<address>.
        $subdomain = $slug && $this->usesSubdomain($slug);
        if ($link !== '' && ! $subdomain) {
            return $link.'/'.($slug ?: $account->id);
        }

        return $this->pageUrl() ?? rtrim((string) config('usta.web_url'), '/').'/u/'.$account->id;
    }

    /** A personal subdomain is Fərdi's: on when wildcard subdomains are (or this address has its own). */
    private function usesSubdomain(string $slug): bool
    {
        return $this->planId() === 'ferdi'
            && (config('usta.page_subdomains') || in_array($slug, (array) config('usta.page_subdomain_slugs'), true));
    }

    /** Lowercase latin letters, digits and single hyphens, 3–30 long: it is also a subdomain. */
    public const SLUG_PATTERN = '/^[a-z0-9]+(-[a-z0-9]+)*$/';

    /** Why an address can't be used, or null when it is free: invalid | reserved | taken. */
    public static function slugProblem(string $slug, ?string $ignoreId = null): ?string
    {
        if (strlen($slug) < 3 || strlen($slug) > 30 || ! preg_match(self::SLUG_PATTERN, $slug)) {
            return 'invalid';
        }
        if (in_array($slug, (array) config('usta.reserved_slugs'), true)) {
            return 'reserved';
        }
        $taken = self::query()->withTrashed()->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            // A sign-up whose code expired unconfirmed doesn't hold its address.
            ->whereNot(fn ($q) => $q->whereIn('owner_id', self::staleSignups()))
            ->exists();

        return $taken ? 'taken' : null;
    }

    /** Owners who never confirmed their email within the code's lifetime: abandoned sign-ups. */
    public static function staleSignups(): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()->select('id')->whereNull('email_verified_at')
            ->where('created_at', '<', now()->subMinutes((int) config('usta.otp.ttl_minutes', 10)));
    }

    /**
     * Fərdi is one person, so the owner is the salon's only master: created on demand, doing
     * every service, working the salon's hours. The panel has no "add master" there.
     */
    public function ensureSoloMaster(): void
    {
        if ($this->planId() !== 'ferdi') {
            return;
        }
        $master = $this->masters()->first();
        if (! $master) {
            $owner = $this->account()->owner;
            $name = trim(($owner?->first_name ?? '').' '.($owner?->last_name ?? '')) ?: $this->name;
            $master = new Master;
            $master->forceFill([
                'business_id' => $this->id,
                'name' => mb_substr($name, 0, 80),
                'role' => ['az' => 'Usta', 'ru' => 'Мастер', 'en' => 'Master'],
                'languages' => ['az'],
                'position' => 1,
                'work_days' => [],
                'shift_start' => $this->hours_open ?? '09:00',
                'shift_end' => $this->hours_close ?? '20:00',
            ]);
        }
        $week = $this->weekHours();
        $open = array_values(array_filter($week));
        $master->forceFill([
            'work_days' => array_keys(array_filter($week)),
            'shift_start' => $open[0]['open'] ?? ($this->hours_open ?? '09:00'),
            'shift_end' => $open[0]['close'] ?? ($this->hours_close ?? '20:00'),
            'schedule' => array_map(fn ($h) => $h ? ['start' => $h['open'], 'end' => $h['close']] : null, $week),
        ])->save();
        $master->services()->sync($this->services()->pluck('id')->all());
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

    /** Plans that unlock a feature (config usta.plan_features). */
    public static function plansWith(string $feature): array
    {
        return array_keys(array_filter(config('usta.plan_features'), fn ($f) => in_array($feature, $f, true)));
    }

    /** The market a set of categories belongs to (beauty, couture), or null when they mix markets. */
    public static function marketOf(array $categories): ?string
    {
        foreach (config('usta.markets') as $id => $m) {
            if ($categories && ! array_diff($categories, $m['categories'])) {
                return $id;
            }
        }

        return null;
    }

    /** This business's market, from the main salon's categories (beauty when unknown). */
    public function market(): string
    {
        return self::marketOf(array_values($this->account()->categories ?? [])) ?? 'beauty';
    }

    /** The voice assistant add-on is paid up (set on the main salon; branches share it). */
    public function hasVoiceAssistant(): bool
    {
        $until = $this->account()->voice_until;

        return $until !== null && $until->isFuture() && $this->takesBookings();
    }

    /**
     * The voice assistant's minutes in a month (Baku time): the pack, minutes used, extra minutes
     * past the pack and what they cost, and whether the cap (1.5 × the pack) is reached.
     *
     * @return array{month:string, pack:int, used:int, extra:int, owed:float, cap:int, capped:bool}
     */
    public function voiceUsage(?\Carbon\CarbonImmutable $month = null): array
    {
        $account = $this->account();
        $from = ($month ?? \App\Support\Baku::now())->setTimezone(\App\Support\Baku::tz())->startOfMonth();
        $seconds = (int) VoiceCall::query()
            ->whereIn('business_id', $account->locations()->pluck('id'))
            ->where('started_at', '>=', $from->utc())
            ->where('started_at', '<', $from->addMonth()->utc())
            ->sum('seconds');
        $pack = (int) $account->voice_minutes;
        $used = (int) ceil($seconds / 60);
        $extra = max(0, $used - $pack);
        $cap = (int) floor($pack * (float) config('usta.voice.cap'));

        return [
            'month' => $from->format('Y-m'),
            'pack' => $pack,
            'used' => $used,
            'extra' => $extra,
            'owed' => round($extra * (float) config('usta.voice.extra_price'), 2),
            'cap' => $cap,
            'capped' => $used >= $cap,
        ];
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
            ->where('is_test', false)
            ->where(fn (Builder $q) => $q
                ->where(fn (Builder $q) => $q->whereNull('parent_id')->whereHas('subscription', $running))
                ->orWhere(fn (Builder $q) => $q->whereNotNull('parent_id')->whereHas('parent', fn (Builder $p) => $p
                    ->where('status', self::LIVE)
                    ->whereHas('subscription', fn (Builder $s) => $running($s)->whereIn('plan', self::plansWith('branches'))))))
            // Every listing shows at least one service with a price; booking ones also need someone to book.
            ->whereHas('services')
            ->where(fn (Builder $q) => $q
                ->whereHas('masters')
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
