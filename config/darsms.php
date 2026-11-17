<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dar SMS API Configuration
    |--------------------------------------------------------------------------
    |
    | Official Dar SMS Developer API for SMS dispatch, balance queries,
    | sender ID management across Tanzania.
    |
    | Base URL: https://dev.darsms.co.tz/api/v1
    |
    */

    'api_key' => env('DARSMS_API_KEY'),

    'base_url' => env('DARSMS_BASE_URL', 'https://dev.darsms.co.tz/api/v1'),

    'sender_id' => env('DARSMS_SENDER_ID', 'DARSMS'),

    'environment' => env('DARSMS_ENV', 'live'),

];
