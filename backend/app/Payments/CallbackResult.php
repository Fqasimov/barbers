<?php

namespace App\Payments;

final class CallbackResult
{
    public function __construct(
        public readonly string $paymentId,
        /** paid | failed | pending */
        public readonly string $status,
        /** Whole AZN, as the provider reports it. */
        public readonly int $amount,
        public readonly string $currency,
        public readonly ?string $providerRef = null,
    ) {}
}
