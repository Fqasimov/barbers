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
     * Gives a paid order back in full (a refunded deposit). True when the
     * provider accepted it; false or an exception leaves it to staff.
     */
    public function refund(Payment $payment): bool;

    /**
     * Verifies the provider's signature on a callback and reads it.
     *
     * @throws InvalidCallback when the signature or payload is not valid
     */
    public function verifyCallback(Request $request): CallbackResult;
}
