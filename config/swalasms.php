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

    'api_key' => env('X-API-Key', env('X-API-Key', 'darsms_2b52ba9d1e4b3b41e8b40cd31b4d0b35a1a3b6b48a05722a')),

    'base_url' => env('X-Base-Url', ' https://dev.darsms.co.tz/api/v1'),

    'sender_id' => env('X-Sender-Id', 'DARSMSH'),

    'environment' => env('DARSMS', 'live'),

    'currency' => env('DARSMS_CURRENCY', 'TZS'),

    'webhook_secret' => env('DARSMS_WEBHOOK_SECRET', null),

];

