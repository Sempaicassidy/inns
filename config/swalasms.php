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

    'api_key' => env('SWALASMS_API_KEY', env('SWAHILIES_API_KEY', 'swl_live_3rRTD7pHVgLewdEEmDZNvk762gvfkMefkzl7ESSQ6xQi7QNL')),

    'base_url' => env('SWALASMS_BASE_URL', 'https://api.swalasms.com'),

    'sender_id' => env('SWALASMS_SENDER_ID', 'SWALATECH'),

    'environment' => env('SWALASMS_ENV', 'live'),

    'currency' => env('SWALASMS_CURRENCY', 'TZS'),

    'webhook_secret' => env('SWALASMS_WEBHOOK_SECRET', null),

];

