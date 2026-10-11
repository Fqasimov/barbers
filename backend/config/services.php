<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Social sign-in. The id_token's `aud` must be one of these client IDs
    | (comma separated: the iOS, Android and Web OAuth client IDs for Google;
    | the bundle ID and/or Services ID for Apple).
    */
    'google' => [
        'client_ids' => array_values(array_filter(array_map('trim', explode(',', (string) env('GOOGLE_CLIENT_IDS', ''))))),
        'jwks_url' => 'https://www.googleapis.com/oauth2/v3/certs',
        'issuers' => ['accounts.google.com', 'https://accounts.google.com'],
    ],

    'apple' => [
        'client_ids' => array_values(array_filter(array_map('trim', explode(',', (string) env('APPLE_CLIENT_IDS', ''))))),
        'jwks_url' => 'https://appleid.apple.com/auth/keys',
        'issuers' => ['https://appleid.apple.com'],
    ],

    'expo' => [
        'push_url' => 'https://exp.host/--/api/v2/push/send',
        // Optional: only needed when "Enhanced push security" is on in Expo.
        'access_token' => env('EXPO_ACCESS_TOKEN'),
    ],

];
