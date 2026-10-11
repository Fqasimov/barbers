<?php

use App\Payments\FakeGateway;
use App\Payments\ProviderGateway;

return [

    /*
    | Which gateway handles subscription checkout:
    |   fake     – local/testing only. The checkout URL points at this server
    |              and simulates a successful payment. Refused in production.
    |   provider – the Azerbaijani card acquirer (app/Payments/ProviderGateway.php),
    |              still a stub until the provider is chosen.
    */
    'driver' => env('PAYMENT_DRIVER', 'fake'),

    'drivers' => [
        'fake' => [
            'class' => FakeGateway::class,
            // HMAC key the fake callback is signed with. Defaults to APP_KEY.
            'secret' => env('PAYMENT_FAKE_SECRET'),
        ],

        'provider' => [
            'class' => ProviderGateway::class,
            'name' => env('PAYMENT_PROVIDER_NAME', 'provider'),
            'base_url' => env('PAYMENT_BASE_URL'),
            'merchant_id' => env('PAYMENT_MERCHANT_ID'),
            'secret_key' => env('PAYMENT_SECRET_KEY'),
            'callback_secret' => env('PAYMENT_CALLBACK_SECRET'),
        ],
    ],
];
