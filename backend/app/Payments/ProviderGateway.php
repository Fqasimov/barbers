<?php

namespace App\Payments;

use App\Models\Business;
use App\Models\Payment;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The real Azerbaijani card acquirer. NOT CHOSEN YET — this is a stub.
 * Select it with PAYMENT_DRIVER=provider once implemented.
 *
 * TODO when the provider (and its API docs) are known:
 *
 * 1. name(): return the provider's short name (PAYMENT_PROVIDER_NAME). The
 *    provider's callback/webhook URL is then
 *    https://<domain>/api/payments/<name>/callback — register it in the
 *    provider's merchant cabinet.
 *
 * 2. createCheckout():
 *    - Call the provider's "create order" API (config('payments.drivers.provider.base_url'),
 *      authenticate with merchant_id + secret_key) using Http::timeout(10).
 *    - Send: amount = $payment->amount (whole AZN; convert to qəpik ×100 if
 *      the API expects minor units), currency AZN (ISO 944 if numeric),
 *      order/description "Usta {$plan} ({$payment->billing_period}) — {$business->name}", our reference
 *      = $payment->id, language az/ru/en.
 *    - Success/return URL: url('/billing/return?payment_id='.$payment->id)
 *      (the app is sent on to usta://billing/return from there).
 *    - Callback URL as in step 1, if the API takes it per order.
 *    - Return new CheckoutResult($hostedPageUrl, $providerOrderId).
 *    - Throw on any non-2xx so the app gets a 500 and nothing is charged.
 *
 * 3. verifyCallback():
 *    - Verify the provider's signature (usually an HMAC/RSA signature over the
 *      body or selected fields, with callback_secret or the provider's public
 *      key). Throw InvalidCallback when it doesn't match. Never trust an
 *      unsigned field.
 *    - If the provider only sends an order id, call its "order status" API
 *      server-to-server and use that answer instead of the callback body.
 *    - Map the provider status to paid | failed | pending.
 *    - Return new CallbackResult($ourPaymentId, $status, $amountWholeAzn, 'AZN', $providerRef).
 *    PaymentService then checks amount/currency, applies it idempotently and
 *    extends the subscription. If the provider needs a specific response body
 *    (e.g. "OK"), adjust PaymentCallbackController.
 *
 * 4. refund(): call the provider's refund/reverse API for $payment->provider_ref
 *    (full amount). Return true on success. Deposits use it when a client
 *    cancels in time or the salon cancels.
 *
 * 5. Tests: add a feature test with Http::fake() for the create-order call and
 *    a signed sample callback from the provider's docs.
 */
class ProviderGateway implements PaymentGateway
{
    public function __construct(private array $config = []) {}

    public function name(): string
    {
        return (string) ($this->config['name'] ?? 'provider');
    }

    public function createCheckout(Business $business, string $plan, Payment $payment): CheckoutResult
    {
        throw new RuntimeException('ProviderGateway is not implemented yet. See the TODO in app/Payments/ProviderGateway.php.');
    }

    public function refund(Payment $payment): bool
    {
        throw new RuntimeException('ProviderGateway refunds are not implemented yet.');
    }

    public function verifyCallback(Request $request): CallbackResult
    {
        throw new InvalidCallback('ProviderGateway is not implemented yet.');
    }
}
