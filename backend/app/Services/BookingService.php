<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\User;
use App\Support\Baku;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private Availability $availability, private Notifier $notifier, private RatingService $ratings) {}

    /** @param array{salon_id:string, master_id:string, service_ids:list<string>, start:string, note?:?string} $data */
    public function create(User $user, array $data): Booking
    {
        $salon = Business::query()->listable()->with(['services', 'masters.services'])->find($data['salon_id']);
        if (! $salon) {
            throw ApiException::notFound('This salon is not taking bookings.');
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

        $booking = DB::transaction(function () use ($user, $salon, $master, $ordered, $start, $end, $duration, $total, $data) {
            // Serialises bookings per master; the overlap check below is then race-free.
            Master::query()->whereKey($master->id)->lockForUpdate()->first();
            $taken = Booking::query()->where('master_id', $master->id)->where('status', Booking::UPCOMING)
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
                'status' => Booking::UPCOMING,
            ])->save();

            return $booking;
        });

        $this->notifier->bookingCreated($booking);

        return $booking;
    }

    public function cancelByCustomer(Booking $booking): Booking
    {
        if ($booking->status === Booking::CANCELLED) {
            return $booking;
        }
        $limit = $booking->start_at->copy()->subHours(config('usta.bookings.cancel_until_hours'));
        if ($booking->status !== Booking::UPCOMING || now()->gt($limit)) {
            throw new ApiException(422, 'too_late_to_cancel', 'Bookings can be cancelled until 2 hours before the start.');
        }
        $booking->forceFill(['status' => Booking::CANCELLED, 'cancelled_by' => 'customer', 'cancelled_at' => now()])->save();
        $this->notifier->bookingCancelledByCustomer($booking);

        return $booking;
    }

    public function cancelBySalon(Booking $booking, ?string $reason): Booking
    {
        if ($booking->status === Booking::CANCELLED) {
            return $booking;
        }
        if ($booking->status !== Booking::UPCOMING) {
            throw ValidationException::withMessages(['status' => ['Only upcoming bookings can be cancelled.']]);
        }
        $booking->forceFill([
            'status' => Booking::CANCELLED,
            'cancelled_by' => 'salon',
            'cancel_reason' => $reason,
            'cancelled_at' => now(),
        ])->save();
        $this->notifier->bookingCancelledBySalon($booking);

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
