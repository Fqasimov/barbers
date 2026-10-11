<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessBookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use App\Support\Baku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BusinessBookingController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d'],
            'status' => ['sometimes', Rule::in([Booking::UPCOMING, Booking::COMPLETED, Booking::CANCELLED, Booking::NO_SHOW])],
        ]);
        $from = isset($data['from']) ? Baku::date($data['from']) : Baku::today();
        $to = isset($data['to']) ? Baku::date($data['to']) : Baku::today()->addDays(7);
        if ($to->lt($from)) {
            throw ValidationException::withMessages(['to' => ['The end date must not be before the start date.']]);
        }

        $rows = Booking::query()->where('business_id', $this->business($request)->id)
            ->where('start_at', '>=', $from->utc())
            ->where('start_at', '<', $to->addDay()->utc())
            ->when($data['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->with('user')->withExists('review')
            ->orderBy('start_at')->limit(2000)->get();

        return response()->json(BusinessBookingResource::collection($rows)->resolve($request));
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $booking = $this->bookings->cancelBySalon($this->owned($request, Booking::class, $id), $data['reason'] ?? null);

        return $this->show($request, $booking);
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $booking = $this->owned($request, Booking::class, $id);
        if ($booking->status !== Booking::COMPLETED) {
            if ($booking->status !== Booking::UPCOMING) {
                throw ValidationException::withMessages(['status' => ['Only upcoming bookings can be marked as done.']]);
            }
            $booking->forceFill(['status' => Booking::COMPLETED])->save();
        }

        return $this->show($request, $booking);
    }

    public function noShow(Request $request, string $id): JsonResponse
    {
        $booking = $this->owned($request, Booking::class, $id);
        if ($booking->status !== Booking::NO_SHOW) {
            if (! in_array($booking->status, [Booking::UPCOMING, Booking::COMPLETED], true)) {
                throw ValidationException::withMessages(['status' => ['A cancelled booking can’t be marked as a no-show.']]);
            }
            if ($booking->start_at->isFuture()) {
                throw ValidationException::withMessages(['status' => ['A no-show can only be marked after the start time.']]);
            }
            $booking->forceFill(['status' => Booking::NO_SHOW])->save();
        }

        return $this->show($request, $booking);
    }

    private function show(Request $request, Booking $booking): JsonResponse
    {
        $booking->load('user')->loadExists('review');

        return response()->json((new BusinessBookingResource($booking))->resolve($request));
    }
}
