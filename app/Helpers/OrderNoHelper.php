<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class OrderNoHelper
{
    /**
     * Generate a random order number.
     *
     * @return string
     */
    public static function generate(): string
    {
        return 'ODN' . random_int(1000000, 9999999);
    }
}
