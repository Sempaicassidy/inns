<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SWAHILIES / SWALASMS API CONFIGURATION (Live Payments & SMS Gateway)
    |--------------------------------------------------------------------------
    |
    | Hapa unaweza kubadilisha au kuhariri API Key ya SwalaSMS, Base URL,
    | pamoja na mazingira (live au sandbox/test).
    |
    | Unaweza pia kubadilisha thamani hizi moja kwa moja kwenye faili ya .env:
    | SWALASMS_API_KEY=swl_live_...
    | SWALASMS_BASE_URL=https://api.swalasms.com
    | SWALASMS_SENDER_ID=SWALATECH
    |
    */

    'api_key' => env('SWALASMS_API_KEY', env('SWAHILIES_API_KEY', 'swl_live_3rRTD7pHVgLewdEEmDZNvk762gvfkMefkzl7ESSQ6xQi7QNL')),

    'base_url' => env('SWALASMS_BASE_URL', env('SWAHILIES_BASE_URL', 'https://api.swalasms.com')),

    'sender_id' => env('SWALASMS_SENDER_ID', 'SWALATECH'),

    'environment' => env('SWALASMS_ENV', env('SWAHILIES_ENV', 'live')),

    'currency' => env('SWALASMS_CURRENCY', env('SWAHILIES_CURRENCY', 'TZS')),

    'webhook_secret' => env('SWALASMS_WEBHOOK_SECRET', env('SWAHILIES_WEBHOOK_SECRET', null)),

];
