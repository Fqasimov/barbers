<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Http\Resources\BookingResource;
use App\Http\Resources\ReviewResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function index(Request $request): JsonResponse
    {
        $rows = Booking::query()->where('user_id', $request->user()->id)
            ->withExists('review')->orderByDesc('start_at')->orderByDesc('created_at')->get();

        return response()->json(BookingResource::collection($rows)->resolve($request));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'salon_id' => ['required', 'string', 'max:64'],
            'master_id' => ['required', 'string', 'max:64'],
            'service_ids' => ['required', 'array', 'min:1', 'max:10'],
            'service_ids.*' => ['string', 'max:64'],
            'start' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $booking = $this->bookings->create($request->user(), $data);
        $booking->review_exists = false;

        return response()->json((new BookingResource($booking))->resolve($request), 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $booking = $this->mine($request, $id);
        $booking = $this->bookings->cancelByCustomer($booking);

        return response()->json((new BookingResource($booking))->resolve($request));
    }

    /** A fresh payment page for a booking waiting for its deposit. */
    public function pay(Request $request, string $id): JsonResponse
    {
        $booking = $this->mine($request, $id);

        return response()->json(['checkout_url' => $this->bookings->payDeposit($request->user(), $booking)]);
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text' => ['present', 'nullable', 'string', 'max:2000'],
            'tags' => ['sometimes', 'array', 'max:6'],
            'tags.*' => ['string', Rule::in(config('usta.review_tags'))],
            'master_id' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        $review = $this->bookings->review($request->user(), $this->mine($request, $id), $data);

        return response()->json((new ReviewResource($review))->resolve($request), 201);
    }

    /** Another customer's booking is simply not found. */
    private function mine(Request $request, string $id): Booking
    {
        return Booking::query()->where('user_id', $request->user()->id)->find($id)
            ?? throw ApiException::notFound('Booking not found.');
    }
}
