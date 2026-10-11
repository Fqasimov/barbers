<?php

namespace App\Payments;

final class CheckoutResult
{
    public function __construct(
        /** The provider's hosted payment page the app opens. */
        public readonly string $url,
        /** The provider's order/transaction id. */
        public readonly ?string $providerRef = null,
    ) {}
}
