<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SwalaSMS API Configuration
    |--------------------------------------------------------------------------
    |
    | Official SwalaSMS Developer API for SMS dispatch, balance queries,
    | sender ID management, and delivery webhooks across Tanzania.
    |
    | Base URL: https://api.swalasms.com
    | Docs: https://docs.swalasms.com
    |
    */

    'api_key' => env('SWALASMS_API_KEY', env('X-API-Key')),

    'base_url' => env('SWALASMS_BASE_URL', env('X-Base-Url', 'https://api.swalasms.com')),

    'sender_id' => env('SWALASMS_SENDER_ID', env('X-Sender-Id', 'SWALATECH')),

    'environment' => env('SWALASMS_ENV', env('DARSMS', 'live')),

    'currency' => env('SWALASMS_CURRENCY', 'TZS'),

    'webhook_secret' => env('SWALASMS_WEBHOOK_SECRET', env('DARSMS_WEBHOOK_SECRET')),

    /*
    |--------------------------------------------------------------------------
    | TLS Certificate Verification
    |--------------------------------------------------------------------------
    |
    | Keep TLS verification enabled in all environments. Only disable for
    | local development against endpoints with self-signed certificates.
    |
    */

    'verify_tls' => env('SWALASMS_VERIFY_TLS', true),

];
