<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Bakong KHQR API Configuration
    |--------------------------------------------------------------------------
    |
    | Here you can configure the default Bakong API settings.
    | VHsite is a multi-store platform, so these values serve as system-wide
    | sandbox/production fallbacks when individual store owners have not yet
    | configured their payment gateway details.
    |
    */

    'api_token' => env('BAKONG_API_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMDFkZTkxZjVlZjJmNDNkOSJ9LCJpYXQiOjE3ODE1ODA5MDMsImV4cCI6MTc4OTM1NjkwM30.AeUiWG-mS__GNL20QFGwVsX6PLifCIQUvXcbIUCWBHg'),
    
    'api_url' => env('BAKONG_API_URL', 'https://api-bakong.nbc.gov.kh'),
    
    'is_sandbox' => env('BAKONG_IS_SANDBOX', true),
];
