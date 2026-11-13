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
        // Bookings and time off the salon adds itself (phone calls, walk-ins, holidays).
        'salon_days_ahead' => 90,
        'block_max_days' => 31,
    ],

    'reviews' => [
        // A review is hidden until checked once this many people report it.
        'auto_hide_reports' => 3,
    ],

    'otp' => [
        'ttl_minutes' => 10,
        'resend_seconds' => 60,
        'max_attempts' => 5,
        // Wrong codes per email and purpose in 24 hours, across new codes.
        'daily_failures' => 15,
        // Code emails per address per hour; more requests reuse the last code.
        'mails_per_hour' => 6,
        'reset_token_minutes' => 15,
    ],

    // PAYMENTS_ENABLED=false: nothing can be bought and no deposits are taken (testing without a provider).
    'payments_enabled' => (bool) env('PAYMENTS_ENABLED', true),

    'trial_days' => 30,
    // After an unpaid trial or a lapsed paid period: still listed and
    // bookable for this many days, then hidden until the owner pays.
    'grace_days' => 7,

    // Prices in whole AZN. A year costs ten months unless set otherwise.
    'plans' => [
        // On the map with QR reviews and a "Book" button to the salon's own page.
        'sade' => [
            'month' => (int) env('PLAN_PRICE_SADE', 10),
            'year' => (int) env('PLAN_PRICE_SADE_YEAR', 10 * (int) env('PLAN_PRICE_SADE', 10)),
        ],
        // One person (a solo master, or one master at a salon): everything in Start, one master, a personal page.
        'ferdi' => [
            'month' => (int) env('PLAN_PRICE_FERDI', 10),
            'year' => (int) env('PLAN_PRICE_FERDI_YEAR', 10 * (int) env('PLAN_PRICE_FERDI', 10)),
        ],
        'start' => [
            'month' => (int) env('PLAN_PRICE_START', 29),
            'year' => (int) env('PLAN_PRICE_START_YEAR', 10 * (int) env('PLAN_PRICE_START', 29)),
        ],
        'pro' => [
            'month' => (int) env('PLAN_PRICE_PRO', 49),
            'year' => (int) env('PLAN_PRICE_PRO_YEAR', 10 * (int) env('PLAN_PRICE_PRO', 49)),
        ],
    ],

    // What each plan unlocks. A Pro trial unlocks Pro.
    'plan_features' => [
        'sade' => ['listing', 'qr_reviews', 'replies', 'gallery', 'booking_link', 'click_report'],
        'ferdi' => ['listing', 'qr_reviews', 'replies', 'gallery', 'booking_link', 'click_report', 'booking', 'whatsapp_addon', 'personal_page'],
        'start' => ['listing', 'qr_reviews', 'replies', 'gallery', 'booking_link', 'click_report', 'booking', 'whatsapp_addon', 'personal_page'],
        'pro' => ['listing', 'qr_reviews', 'replies', 'gallery', 'booking_link', 'click_report', 'booking', 'whatsapp_addon',
            'personal_page', 'branches', 'managers', 'deposits', 'waitlist', 'stats', 'priority_support'],
    ],

    // Plans with a cap on masters (Fərdi is one person).
    'master_limit' => ['ferdi' => 1],

    // Personal pages: <slug>.<page_domain> (needs a wildcard DNS record and certificate) and <web_url>/u/<slug>.
    'page_domain' => env('PAGE_DOMAIN', 'yazilnow.az'),
    // Off until the hosting has a wildcard DNS record, domain and certificate (docs/ferdi-plan.md).
    'page_subdomains' => (bool) env('PAGE_SUBDOMAINS', false),
    // Addresses that already have their own subdomain in cPanel (the plan allows a few), comma-separated:
    // PAGE_SUBDOMAIN_SLUGS=orxanosmanov,elvinbarber. Those pages show as <slug>.yazilnow.az.
    'page_subdomain_slugs' => array_values(array_filter(array_map(
        fn ($s) => strtolower(trim($s)), explode(',', (string) env('PAGE_SUBDOMAIN_SLUGS', ''))))),
    'reserved_slugs' => ['www', 'app', 'api', 'admin', 'mail', 'smtp', 'panel', 'help', 'support', 'privacy', 'terms',
        'billing', 'static', 'assets', 'cdn', 'blog', 'status', 'dev', 'test', 'staging', 'webmail', 'cpanel', 'ftp',
        'ns1', 'ns2', 'yazilnow', 'usta', 'salon', 'salons', 'r', 's', 'u'],

    // Pro: locations (the main salon + branches) in the price, then each extra one per month.
    'branches' => [
        'included' => 3,
        'extra_month' => (int) env('PLAN_PRICE_BRANCH', 15),
        'max' => 20,
    ],

    'deposits' => [
        // Unpaid deposit bookings hold the slot this long, then free it.
        'hold_minutes' => 15,
        // Clients with this many no-shows pay a deposit at every salon that takes them…
        'no_show_limit' => 2,
        // …of this share of the price, at least this much, when the service has none set.
        'default_percent' => 20,
        'default_min' => 5,
    ],

    'qr_reviews' => [
        'ttl_hours' => 24,
        // New codes a location can make in 24 hours.
        'codes_per_day' => 150,
        // A QR review counts this much of a review after a booked visit (in tenths).
        'weight' => 8,
        // One QR review per salon per account in this many days, and at most this many a day.
        'per_salon_days' => 30,
        'per_day' => 3,
    ],

    'waitlist' => [
        'per_user' => 5,
    ],

    // Paid add-on for Start and Pro: confirmations and reminders on WhatsApp.
    'whatsapp' => [
        'price' => (int) env('WHATSAPP_PACK_PRICE', 10),
        'messages' => (int) env('WHATSAPP_PACK_MESSAGES', 300),
        'days' => 30,
        // log (default: writes to the log) | meta (WhatsApp Cloud API)
        'driver' => env('WHATSAPP_DRIVER', 'log'),
        'token' => env('WHATSAPP_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'template_confirm' => env('WHATSAPP_TEMPLATE_CONFIRM', 'booking_confirmed'),
        'template_reminder' => env('WHATSAPP_TEMPLATE_REMINDER', 'booking_reminder'),
        'template_lang' => env('WHATSAPP_TEMPLATE_LANG', 'az'),
    ],

    'support' => [
        'email' => env('SUPPORT_EMAIL', 'support@yazilnow.az'),
        // Pro only: the priority phone line. Empty: Pro sees email support only.
        'phone' => env('SUPPORT_PHONE') ?: null,
        'hours' => env('SUPPORT_HOURS', '09:00–21:00'),
    ],

    // Where QR codes and shared links point.
    'web_url' => env('WEB_URL', 'https://yazilnow.az'),
    // The app in a browser; client emails link to its bookings page.
    'app_web_url' => env('APP_WEB_URL', rtrim((string) env('WEB_URL', 'https://yazilnow.az'), '/').'/app'),

    'billing_periods' => ['month', 'year'],

    'currency' => 'AZN',

    'tones' => ['oxblood', 'forest', 'navy', 'clay', 'olive', 'sand', 'slate', 'rose', 'ink', 'bone'],

    'categories' => ['barber', 'hair', 'nails', 'brows', 'spa', 'makeup', 'aesthetics'],

    'review_tags' => ['skilled', 'punctual', 'friendly', 'clean', 'value', 'relaxing'],

    // Shown for a live salon that never set its pin (Baku centre).
    'default_coords' => ['latitude' => 40.4093, 'longitude' => 49.8671],
];
