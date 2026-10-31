<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Business;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Pro: the account's other locations. Three locations are in the price, each further one 15 ₼ a month. */
class BranchController extends Controller
{
    public function index(Request $request, PaymentService $payments): JsonResponse
    {
        $account = $this->account($request);

        return response()->json([
            'data' => $account->locations()->map(fn (Business $b) => $this->row($b))->values()->all(),
            'included' => (int) config('usta.branches.included'),
            'extra_price' => (int) config('usta.branches.extra_month'),
            'price' => $account->subscription?->plan === 'pro' ? $payments->price($account, 'pro')['amount'] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $this->normalize($request);
        $data = $request->validate([
            'salon_name' => ['required', 'string', 'min:2', 'max:120'],
            'address' => ['required', 'string', 'max:255'],
            'district' => ['required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);
        $account = $this->account($request);
        $account->requireFeature('branches');
        if ($account->branches()->count() + 1 >= (int) config('usta.branches.max')) {
            throw new ApiException(422, 'branch_limit', 'Contact support to add more locations.');
        }
        $b = new Business;
        $b->forceFill([
            'owner_id' => $account->owner_id,
            'parent_id' => $account->id,
            'name' => $data['salon_name'],
            'categories' => $account->categories,
            'district' => $data['district'],
            'address' => $data['address'],
            'audience' => $account->audience,
            'hours_open' => $account->hours_open,
            'hours_close' => $account->hours_close,
            'closed_days' => $account->closed_days ?? [],
            'phone' => $data['phone'] ?? $account->phone,
            'whatsapp' => $account->whatsapp,
            // An approved salon's branches need no second review.
            'status' => $account->status === Business::LIVE ? Business::LIVE : Business::PENDING,
            'approved_at' => $account->status === Business::LIVE ? now() : null,
        ])->save();

        return response()->json($this->row($b), 201);
    }

    public function destroy(Request $request, string $id): Response
    {
        $this->ownerOnly($request);
        $b = $this->account($request)->branches()->find($id) ?? throw ApiException::notFound();
        if (Booking::query()->where('business_id', $b->id)->blocking()->where('end_at', '>', now())->where('kind', Booking::VISIT)->exists()) {
            throw new ApiException(409, 'has_bookings', 'This location has upcoming bookings. Cancel them first.');
        }
        $b->delete();

        return response()->noContent();
    }

    private function row(Business $b): array
    {
        return [
            'id' => $b->id,
            'name' => $b->name,
            'address' => $b->address,
            'district' => $b->district,
            'status' => $b->status,
            'is_main' => $b->parent_id === null,
            'masters' => $b->masters()->count(),
        ];
    }
}
