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

    'swalasms' => [
        'api_key' => env('SWALASMS_API_KEY', env('SWAHILIES_API_KEY', 'swl_live_3rRTD7pHVgLewdEEmDZNvk762gvfkMefkzl7ESSQ6xQi7QNL')),
        'base_url' => env('SWALASMS_BASE_URL', 'https://api.swalasms.com'),
        'sender_id' => env('SWALASMS_SENDER_ID', 'SWALATECH'),
        'env' => env('SWALASMS_ENV', 'live'),
    ],

    'swahilies' => [
        'api_key' => env('SWAHILIES_API_KEY', 'swl_live_3rRTD7pHVgLewdEEmDZNvk762gvfkMefkzl7ESSQ6xQi7QNL'),
        'base_url' => env('SWAHILIES_BASE_URL', 'https://api.swalasms.com'),
        'env' => env('SWAHILIES_ENV', 'live'),
    ],

];
