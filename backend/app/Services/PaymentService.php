<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Subscription;
use App\Payments\CallbackResult;
use App\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    public function __construct(private PaymentGateway $gateway) {}

    /** @return array{checkout_url:string, payment_id:string} */
    public function checkout(Business $business, string $plan): array
    {
        $payment = new Payment;
        $payment->forceFill([
            'business_id' => $business->id,
            'plan' => $plan,
            'amount' => (int) config("usta.plans.{$plan}"),
            'currency' => config('usta.currency'),
            'status' => Payment::PENDING,
            'provider' => $this->gateway->name(),
        ])->save();

        $result = $this->gateway->createCheckout($business, $plan, $payment);
        $payment->forceFill(['provider_ref' => $result->providerRef])->save();

        return ['checkout_url' => $result->url, 'payment_id' => $payment->id];
    }

    /**
     * Applies a verified callback. Idempotent: a payment that is already paid
     * is left alone. Amount and currency must match what we asked for.
     */
    public function apply(CallbackResult $result, array $raw = []): Payment
    {
        $mismatch = false;
        $payment = DB::transaction(function () use ($result, $raw, &$mismatch) {
            $payment = Payment::query()->whereKey($result->paymentId)->lockForUpdate()->first();
            if (! $payment) {
                throw ApiException::notFound('Unknown payment.');
            }
            if ($payment->status === Payment::PAID) {
                return $payment;
            }

            $payment->raw_callback = $raw ?: null;
            if ($result->providerRef && ! $payment->provider_ref) {
                $payment->provider_ref = $result->providerRef;
            }

            if ($result->status === Payment::PAID) {
                if ($result->amount !== (int) $payment->amount || strtoupper($result->currency) !== $payment->currency) {
                    // Kept pending with the raw callback stored for investigation.
                    $payment->save();
                    $mismatch = true;

                    return $payment;
                }
                $payment->forceFill(['status' => Payment::PAID, 'paid_at' => now()])->save();
                $this->activate($payment);
            } elseif ($result->status === Payment::FAILED) {
                $payment->status = Payment::FAILED;
                $payment->save();
            } else {
                $payment->save();
            }

            return $payment;
        });

        if ($mismatch) {
            Log::warning('Payment callback amount/currency mismatch', ['payment' => $payment->id]);
            throw new ApiException(422, 'amount_mismatch', 'The paid amount or currency does not match the order.');
        }

        return $payment;
    }

    private function activate(Payment $payment): void
    {
        $now = now();
        $sub = Subscription::query()->where('business_id', $payment->business_id)->lockForUpdate()->first();
        if (! $sub) {
            $sub = new Subscription;
            // Paying first uses up the free trial.
            $sub->forceFill(['business_id' => $payment->business_id, 'started_at' => $now, 'trial_ends_at' => $now]);
        }
        $from = $sub->current_period_end && $sub->current_period_end->gt($now) ? $sub->current_period_end : $now;
        $sub->forceFill([
            'plan' => $payment->plan,
            'status' => Subscription::ACTIVE,
            'current_period_end' => $from->copy()->addMonthNoOverflow(),
        ])->save();
    }
}
