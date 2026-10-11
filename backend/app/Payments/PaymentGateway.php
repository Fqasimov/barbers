<?php

namespace App\Payments;

use App\Models\Business;
use App\Models\Payment;
use Illuminate\Http\Request;

interface PaymentGateway
{
    /** The {provider} segment of POST /api/payments/{provider}/callback. */
    public function name(): string;

    /** Creates the order with the provider and returns its hosted checkout page. */
    public function createCheckout(Business $business, string $plan, Payment $payment): CheckoutResult;

    /**
     * Verifies the provider's signature on a callback and reads it.
     *
     * @throws InvalidCallback when the signature or payload is not valid
     */
    public function verifyCallback(Request $request): CallbackResult;
}
