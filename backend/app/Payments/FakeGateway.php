<?php

namespace App\Payments;

use App\Models\Business;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * Local/testing only. checkout_url is a signed page on this server that
 * "pays" at once and runs the same callback logic as a real provider.
 * Callbacks are HMAC-signed with PAYMENT_FAKE_SECRET (default APP_KEY).
 */
class FakeGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'fake';
    }

    public function createCheckout(Business $business, string $plan, Payment $payment): CheckoutResult
    {
        return new CheckoutResult(
            URL::temporarySignedRoute('billing.fake', now()->addHour(), ['payment' => $payment->id]),
            'fake_'.$payment->id,
        );
    }

    public function verifyCallback(Request $request): CallbackResult
    {
        $data = $request->only(['payment_id', 'status', 'amount', 'currency', 'signature']);
        foreach (['payment_id', 'status', 'amount', 'currency', 'signature'] as $k) {
            if (! isset($data[$k]) || ! is_scalar($data[$k])) {
                throw new InvalidCallback;
            }
        }
        $expected = self::sign((string) $data['payment_id'], (string) $data['status'], (int) $data['amount'], (string) $data['currency']);
        if (! hash_equals($expected, (string) $data['signature'])) {
            throw new InvalidCallback;
        }

        return new CallbackResult((string) $data['payment_id'], (string) $data['status'], (int) $data['amount'], (string) $data['currency'], 'fake_'.$data['payment_id']);
    }

    public static function sign(string $paymentId, string $status, int $amount, string $currency): string
    {
        $secret = config('payments.drivers.fake.secret') ?: config('app.key');

        return hash_hmac('sha256', "{$paymentId}|{$status}|{$amount}|{$currency}", (string) $secret);
    }
}
