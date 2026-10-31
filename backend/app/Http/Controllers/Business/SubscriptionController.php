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
        $sub = $this->account($request)->subscription()->first();
        if (! $sub) {
            throw new ApiException(402, 'subscription_required', 'This salon has no plan yet. Start the free trial.');
        }

        return response()->json((new SubscriptionResource($sub))->resolve($request));
    }

    /**
     * The 30-day trial, once per business, with no payment details. Calling it
     * again only changes the plan. `period` is the billing the owner picked,
     * kept as the default for the first payment.
     */
    public function trial(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in(array_keys(config('usta.plans')))],
            'period' => ['sometimes', Rule::in(config('usta.billing_periods'))],
        ]);
        $this->ownerOnly($request);
        $business = $this->account($request);

        DB::transaction(function () use ($business, $data) {
            $sub = Subscription::query()->where('business_id', $business->id)->lockForUpdate()->first();
            $period = $data['period'] ?? $sub?->billing_period ?? 'month';
            if ($sub) {
                // A paid period's billing changes with the next payment, not here.
                $sub->forceFill(['plan' => $data['plan']] + ($sub->current_period_end ? [] : ['billing_period' => $period]))->save();

                return;
            }
            $now = now();
            (new Subscription)->forceFill([
                'business_id' => $business->id,
                'plan' => $data['plan'],
                'billing_period' => $period,
                'status' => Subscription::TRIALING,
                'started_at' => $now,
                'trial_ends_at' => $now->copy()->addDays(config('usta.trial_days')),
            ])->save();
        });

        return response()->json((new BusinessResource($this->business($request)->fresh()))->resolve($request));
    }

    /** `period`: month (default) or year; a year costs ten months and adds twelve. */
    public function checkout(Request $request, PaymentService $payments): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in(array_keys(config('usta.plans')))],
            'period' => ['sometimes', Rule::in(config('usta.billing_periods'))],
        ]);

        $this->ownerOnly($request);

        return response()->json($payments->checkout($this->account($request), $data['plan'], $data['period'] ?? 'month'));
    }
}
