<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use App\Support\Baku;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private Availability $availability,
        private Notifier $notifier,
        private RatingService $ratings,
        private PaymentService $payments,
        private Waitlist $waitlist,
    ) {}

    /** No-shows of a client across every salon. */
    public function noShows(User $user): int
    {
        return Booking::query()->where('user_id', $user->id)->where('status', Booking::NO_SHOW)->count();
    }

    /** Clients who skipped this many visits pay a deposit at every salon that takes deposits. */
    public function depositRequired(User $user): bool
    {
        return $this->noShows($user) >= (int) config('usta.deposits.no_show_limit');
    }

    /**
     * The deposit in whole AZN for these services at a Pro salon: what each
     * service asks (fixed or a share of its price), or, for a client with
     * too many no-shows, at least the default share. Never above the total.
     *
     * @param  iterable<Service>  $services
     */
    public function depositFor(Business $salon, iterable $services, ?User $user): int
    {
        if (! $salon->hasFeature('deposits')) {
            return 0;
        }
        $sum = 0;
        $total = 0;
        foreach ($services as $s) {
            $price = (int) $s->price;
            $total += $price;
            $sum += match ($s->deposit_type) {
                'fixed' => min($price, (int) $s->deposit_value),
                'percent' => (int) ceil($price * min(100, (int) $s->deposit_value) / 100),
                default => 0,
            };
        }
        if ($sum === 0 && $user && $this->depositRequired($user)) {
            $sum = max((int) config('usta.deposits.default_min'), (int) ceil($total * (int) config('usta.deposits.default_percent') / 100));
        }

        return min($sum, $total);
    }

    /** @param array{salon_id:string, master_id:string, service_ids:list<string>, start:string, note?:?string} $data */
    public function create(User $user, array $data): Booking
    {
        $salon = Business::query()->listable()->with(['services', 'masters.services'])->find($data['salon_id']);
        if (! $salon) {
            throw ApiException::notFound('This salon is not taking bookings.');
        }
        if (! $salon->takesBookings()) {
            throw new ApiException(422, 'booking_external', 'This salon takes bookings on its own page.');
        }

        $ids = array_values(array_unique($data['service_ids']));
        $services = $salon->services->whereIn('id', $ids);
        if ($services->count() !== count($ids)) {
            throw ValidationException::withMessages(['service_ids' => ['One of the services is not offered by this salon.']]);
        }
        /** @var Master|null $master */
        $master = $salon->masters->firstWhere('id', $data['master_id']);
        if (! $master) {
            throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
        }
        if (! $master->doesAll($ids)) {
            throw ValidationException::withMessages(['master_id' => ['This master does not do every chosen service.']]);
        }

        // Server prices and durations, in the order the client chose them.
        $ordered = collect($ids)->map(fn ($id) => $services->firstWhere('id', $id));
        $duration = (int) $ordered->sum('duration_min');
        $total = (int) $ordered->sum('price');

        $start = CarbonImmutable::parse($data['start'])->utc()->startOfMinute();
        $local = Baku::local($start);
        $day = $this->availability->day($salon, $master, $local->startOfDay(), $duration, [], ignoreBusy: true);
        if (! in_array(Baku::minutesOfDay($start), $day['slots'], true)) {
            throw ValidationException::withMessages(['start' => ['This time is not bookable.']]);
        }
        $end = $start->addMinutes($duration);

        $deposit = $this->depositFor($salon, $ordered, $user);

        $booking = DB::transaction(function () use ($user, $salon, $master, $ordered, $start, $end, $duration, $total, $data, $deposit) {
            // Serialises bookings per master; the overlap check below is then race-free.
            Master::query()->whereKey($master->id)->lockForUpdate()->first();
            $taken = Booking::query()->where('master_id', $master->id)->blocking()
                ->where('start_at', '<', $end)->where('end_at', '>', $start)->exists();
            if ($taken) {
                throw new ApiException(409, 'slot_taken', 'Someone just took this time. Pick another one.');
            }

            $booking = new Booking;
            $booking->forceFill([
                'business_id' => $salon->id,
                'user_id' => $user->id,
                'master_id' => $master->id,
                'services' => $ordered->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'duration_min' => (int) $s->duration_min,
                    'price' => (int) $s->price,
                ])->values()->all(),
                'start_at' => $start,
                'end_at' => $end,
                'duration_min' => $duration,
                'total' => $total,
                'note' => isset($data['note']) && trim((string) $data['note']) !== '' ? trim($data['note']) : null,
                'deposit' => $deposit,
                'deposit_status' => $deposit > 0 ? 'pending' : null,
                // With a deposit the slot is held while the client pays.
                'status' => $deposit > 0 ? Booking::PENDING_PAYMENT : Booking::UPCOMING,
                'hold_until' => $deposit > 0 ? now()->addMinutes((int) config('usta.deposits.hold_minutes')) : null,
            ])->save();

            return $booking;
        });

        if ($deposit > 0) {
            $booking->checkout_url = $this->payments->depositCheckout($booking, $user)['checkout_url'];
        } else {
            $this->notifier->bookingCreated($booking);
        }

        return $booking;
    }

    /** A new payment page for a booking still waiting for its deposit. */
    public function payDeposit(User $user, Booking $booking): string
    {
        if ($booking->status !== Booking::PENDING_PAYMENT || ! $booking->hold_until?->isFuture()) {
            throw new ApiException(422, 'hold_expired', 'The time is no longer held. Book again.');
        }

        return $this->payments->depositCheckout($booking, $user)['checkout_url'];
    }

    /** Unpaid holds that ran out: the slot goes back (and to the waitlist). */
    public function expireHolds(): int
    {
        $n = 0;
        Booking::query()->where('status', Booking::PENDING_PAYMENT)->where('hold_until', '<=', now())
            ->chunkById(100, function ($rows) use (&$n) {
                foreach ($rows as $b) {
                    $b->forceFill(['status' => Booking::CANCELLED, 'cancelled_by' => 'system', 'cancelled_at' => now(), 'deposit_status' => 'expired'])->save();
                    $this->waitlist->slotFreed($b);
                    $n++;
                }
            });

        return $n;
    }

    /**
     * A booking the salon adds itself: a phone call or a walk-in. The salon may
     * book outside the app's 30-minute grid and 7-day window, but never over
     * another booking or time off.
     *
     * @param  array{master_id:string, service_ids:list<string>, start:string, client_name:string, client_phone?:?string, note?:?string}  $data
     */
    public function createBySalon(Business $salon, array $data): Booking
    {
        $salon->loadMissing(['services', 'masters.services']);
        $ids = array_values(array_unique($data['service_ids']));
        $services = $salon->services->whereIn('id', $ids);
        if ($services->count() !== count($ids)) {
            throw ValidationException::withMessages(['service_ids' => ['One of the services is not offered by this salon.']]);
        }
        /** @var Master|null $master */
        $master = $salon->masters->firstWhere('id', $data['master_id']);
        if (! $master) {
            throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
        }
        $ordered = collect($ids)->map(fn ($id) => $services->firstWhere('id', $id));
        $duration = (int) $ordered->sum('duration_min');
        $start = $this->salonStart($data['start']);
        $end = $start->addMinutes($duration);

        return $this->insert($master, $start, $end, [
            'business_id' => $salon->id,
            'kind' => Booking::VISIT,
            'source' => 'salon',
            'client_name' => trim($data['client_name']),
            'client_phone' => isset($data['client_phone']) ? (preg_replace('/\D+/', '', $data['client_phone']) ?: null) : null,
            'services' => $ordered->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'duration_min' => (int) $s->duration_min,
                'price' => (int) $s->price,
            ])->values()->all(),
            'duration_min' => $duration,
            'total' => (int) $ordered->sum('price'),
            'note' => isset($data['note']) && trim((string) $data['note']) !== '' ? trim($data['note']) : null,
        ]);
    }

    /**
     * Closes off time for one master, or every master when master_id is null:
     * a break, a day off, a holiday. Refused when it would cover a booking, so
     * nobody's visit disappears silently; cancel those first.
     *
     * @param  array{master_id?:?string, start:string, end:string, note?:?string}  $data
     * @return list<Booking>
     */
    public function block(Business $salon, array $data): array
    {
        $salon->loadMissing('masters');
        $start = $this->salonStart($data['start']);
        $end = CarbonImmutable::parse($data['end'])->utc()->startOfMinute();
        if ($end->lte($start)) {
            throw ValidationException::withMessages(['end' => ['The end must be after the start.']]);
        }
        if ($start->diffInDays($end) > config('usta.bookings.block_max_days')) {
            throw ValidationException::withMessages(['end' => ['Time off can be at most '.config('usta.bookings.block_max_days').' days at a time.']]);
        }
        if (! empty($data['master_id'])) {
            $master = $salon->masters->firstWhere('id', $data['master_id'])
                ?? throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
            $masters = collect([$master]);
        } else {
            $masters = $salon->masters;
        }
        if ($masters->isEmpty()) {
            throw ValidationException::withMessages(['master_id' => ['Add a master first.']]);
        }

        return DB::transaction(fn () => $masters->map(fn (Master $m) => $this->insert($m, $start, $end, [
            'business_id' => $salon->id,
            'kind' => Booking::BLOCK,
            'source' => 'salon',
            'services' => [],
            'duration_min' => (int) $start->diffInMinutes($end),
            'total' => 0,
            'note' => isset($data['note']) && trim((string) $data['note']) !== '' ? trim($data['note']) : null,
        ], 'overlaps_bookings'))->values()->all());
    }

    private function salonStart(string $value): CarbonImmutable
    {
        $start = CarbonImmutable::parse($value)->utc()->startOfMinute();
        if ($start->minute % 5 !== 0) {
            throw ValidationException::withMessages(['start' => ['Use a time on a 5-minute mark.']]);
        }
        // A walk-in who just sat down still counts.
        if ($start->lt(now()->subMinutes(30))) {
            throw ValidationException::withMessages(['start' => ['This time has passed.']]);
        }
        if ($start->gt(now()->addDays(config('usta.bookings.salon_days_ahead')))) {
            throw ValidationException::withMessages(['start' => ['This is too far ahead.']]);
        }

        return $start;
    }

    /** Saves a booking for a master unless it overlaps anything upcoming (locked per master). */
    private function insert(Master $master, CarbonImmutable $start, CarbonImmutable $end, array $attrs, string $conflict = 'slot_taken'): Booking
    {
        return DB::transaction(function () use ($master, $start, $end, $attrs, $conflict) {
            Master::query()->whereKey($master->id)->lockForUpdate()->first();
            $taken = Booking::query()->where('master_id', $master->id)->blocking()
                ->where('start_at', '<', $end)->where('end_at', '>', $start)->exists();
            if ($taken) {
                throw new ApiException(409, $conflict, $conflict === 'slot_taken'
                    ? 'This master is busy at this time.'
                    : "{$master->name} has bookings in this time. Cancel them first.");
            }
            $booking = new Booking;
            $booking->forceFill($attrs + [
                'master_id' => $master->id,
                'start_at' => $start,
                'end_at' => $end,
                'status' => Booking::UPCOMING,
            ])->save();

            return $booking;
        });
    }

    public function cancelByCustomer(Booking $booking): Booking
    {
        if ($booking->status === Booking::CANCELLED) {
            return $booking;
        }
        // Not paid yet: just let go of the slot.
        if ($booking->status === Booking::PENDING_PAYMENT) {
            $booking->forceFill(['status' => Booking::CANCELLED, 'cancelled_by' => 'customer', 'cancelled_at' => now(), 'deposit_status' => null, 'hold_until' => null])->save();
            $this->waitlist->slotFreed($booking);

            return $booking;
        }
        $limit = $booking->start_at->copy()->subHours(config('usta.bookings.cancel_until_hours'));
        if ($booking->status !== Booking::UPCOMING || now()->gt($limit)) {
            throw new ApiException(422, 'too_late_to_cancel', 'Bookings can be cancelled until 2 hours before the start.');
        }
        $booking->forceFill(['status' => Booking::CANCELLED, 'cancelled_by' => 'customer', 'cancelled_at' => now()])->save();
        // In time (2 h+ before): the deposit goes back in full.
        $this->refundDeposit($booking);
        $this->notifier->bookingCancelledByCustomer($booking);
        $this->waitlist->slotFreed($booking);

        return $booking->fresh();
    }

    public function cancelBySalon(Booking $booking, ?string $reason): Booking
    {
        if ($booking->status === Booking::CANCELLED) {
            return $booking;
        }
        if (! in_array($booking->status, [Booking::UPCOMING, Booking::PENDING_PAYMENT], true)) {
            throw ValidationException::withMessages(['status' => ['Only upcoming bookings can be cancelled.']]);
        }
        $booking->forceFill([
            'status' => Booking::CANCELLED,
            'cancelled_by' => 'salon',
            'cancel_reason' => $reason,
            'cancelled_at' => now(),
        ])->save();
        // The salon cancelled: the client always gets the deposit back.
        $this->refundDeposit($booking);
        $this->notifier->bookingCancelledBySalon($booking);
        $this->waitlist->slotFreed($booking);

        return $booking->fresh();
    }

    private function refundDeposit(Booking $booking): void
    {
        if ($booking->deposit_status === 'paid' && ($payment = $this->payments->depositPayment($booking))) {
            $this->payments->refund($payment);
        } elseif ($booking->deposit_status === 'pending') {
            $booking->forceFill(['deposit_status' => null])->save();
        }
    }

    /** The visit happened: a paid deposit counts toward the bill. */
    public function complete(Booking $booking): Booking
    {
        if ($booking->status !== Booking::COMPLETED) {
            if ($booking->status !== Booking::UPCOMING) {
                throw ValidationException::withMessages(['status' => ['Only upcoming bookings can be marked as done.']]);
            }
            $booking->forceFill(['status' => Booking::COMPLETED] + ($booking->deposit_status === 'paid' ? ['deposit_status' => 'applied'] : []))->save();
        }

        return $booking;
    }

    /** The client didn't come: the salon keeps a paid deposit. */
    public function noShow(Booking $booking): Booking
    {
        if ($booking->status !== Booking::NO_SHOW) {
            if (! in_array($booking->status, [Booking::UPCOMING, Booking::COMPLETED], true)) {
                throw ValidationException::withMessages(['status' => ['A cancelled booking can’t be marked as a no-show.']]);
            }
            if ($booking->start_at->isFuture()) {
                throw ValidationException::withMessages(['status' => ['A no-show can only be marked after the start time.']]);
            }
            $booking->forceFill(['status' => Booking::NO_SHOW] + (in_array($booking->deposit_status, ['paid', 'applied'], true) ? ['deposit_status' => 'kept'] : []))->save();
        }

        return $booking;
    }

    public function review(User $user, Booking $booking, array $data): Review
    {
        return DB::transaction(function () use ($user, $booking, $data) {
            $booking = Booking::query()->whereKey($booking->id)->lockForUpdate()->first();
            $reviewable = in_array($booking->status, [Booking::UPCOMING, Booking::COMPLETED], true)
                && $booking->hasEnded()
                && ! Review::query()->where('booking_id', $booking->id)->exists();
            if (! $reviewable) {
                throw new ApiException(422, 'not_reviewable', 'This visit can’t be reviewed.');
            }

            $masterId = $data['master_id'] ?? $booking->master_id;
            $master = Master::query()->where('business_id', $booking->business_id)->find($masterId);
            if (! $master && ($data['master_id'] ?? null)) {
                throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
            }

            $review = new Review;
            $review->forceFill([
                'business_id' => $booking->business_id,
                'master_id' => $master?->id,
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'author' => $user->shortName() ?: 'İstifadəçi',
                'rating' => (int) $data['rating'],
                'text' => trim((string) ($data['text'] ?? '')),
                'tags' => array_values(array_unique($data['tags'] ?? [])),
                'service_name' => $booking->services[0]['name'] ?? null,
            ])->save();

            if ($booking->status === Booking::UPCOMING) {
                $booking->forceFill(['status' => Booking::COMPLETED])->save();
            }
            if ($business = Business::withTrashed()->find($booking->business_id)) {
                $this->ratings->refreshBusiness($business);
            }
            if ($master) {
                $this->ratings->refreshMaster($master);
            }

            return $review;
        });
    }
}
