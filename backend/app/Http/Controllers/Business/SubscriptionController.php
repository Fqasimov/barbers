<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $sub = $this->business($request)->subscription()->first();
        if (! $sub) {
            throw new ApiException(402, 'subscription_required', 'This salon has no plan yet. Start the free trial.');
        }

        return response()->json((new SubscriptionResource($sub))->resolve($request));
    }

    /** The 30-day trial, once per business. Calling it again only changes the plan. */
    public function trial(Request $request): JsonResponse
    {
        $data = $request->validate(['plan' => ['required', Rule::in(array_keys(config('usta.plans')))]]);
        $business = $this->business($request);

        DB::transaction(function () use ($business, $data) {
            $sub = Subscription::query()->where('business_id', $business->id)->lockForUpdate()->first();
            if ($sub) {
                $sub->forceFill(['plan' => $data['plan']])->save();

                return;
            }
            $now = now();
            (new Subscription)->forceFill([
                'business_id' => $business->id,
                'plan' => $data['plan'],
                'status' => Subscription::TRIALING,
                'started_at' => $now,
                'trial_ends_at' => $now->copy()->addDays(config('usta.trial_days')),
            ])->save();
        });

        return response()->json((new BusinessResource($business->fresh()))->resolve($request));
    }

    public function checkout(Request $request, PaymentService $payments): JsonResponse
    {
        $data = $request->validate(['plan' => ['required', Rule::in(array_keys(config('usta.plans')))]]);

        return response()->json($payments->checkout($this->business($request), $data['plan']));
    }
}
