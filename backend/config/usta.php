<?php

return [

    /*
    | Clock times, calendar dates and weekdays in the API are in this zone.
    | Timestamps are stored and returned in UTC (config app.timezone).
    */
    'timezone' => 'Asia/Baku',

    // "*" or comma-separated proxy IPs in front of the app (load balancer).
    'trusted_proxies' => env('TRUSTED_PROXIES', ''),

    // URL scheme of the mobile app, used by /billing/return.
    'app_scheme' => env('APP_SCHEME', 'usta'),

    // Disk for salon photos. Must produce absolute public URLs (public, s3…).
    'photo_disk' => env('PHOTO_DISK', 'public'),
    'max_photos' => 12,
    'photo_max_px' => 1600,

    'availability' => [
        'slot_step' => 30,      // minutes between candidate starts
        'lead_minutes' => 30,   // same-day starts must be this far from now
        'window_days' => 7,     // bookable days ahead, including today
    ],

    'bookings' => [
        'cancel_until_hours' => 2,
    ],

    'otp' => [
        'ttl_minutes' => 10,
        'resend_seconds' => 60,
        'max_attempts' => 5,
        'reset_token_minutes' => 15,
    ],

    'trial_days' => 30,
    'grace_days' => 3,

    // Monthly prices in whole AZN.
    'plans' => [
        'start' => (int) env('PLAN_PRICE_START', 29),
        'pro' => (int) env('PLAN_PRICE_PRO', 59),
        'studio' => (int) env('PLAN_PRICE_STUDIO', 99),
    ],

    'currency' => 'AZN',

    'tones' => ['oxblood', 'forest', 'navy', 'clay', 'olive', 'sand', 'slate', 'rose', 'ink', 'bone'],

    'categories' => ['barber', 'hair', 'nails', 'brows', 'spa', 'makeup'],

    'review_tags' => ['skilled', 'punctual', 'friendly', 'clean', 'value', 'relaxing'],

    // Shown for a live salon that never set its pin (Baku centre).
    'default_coords' => ['latitude' => 40.4093, 'longitude' => 49.8671],
];
