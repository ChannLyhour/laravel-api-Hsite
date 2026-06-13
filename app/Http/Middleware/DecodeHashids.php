<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Vinkla\Hashids\Facades\Hashids;

class DecodeHashids
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Decode specific query/input parameters if present and non-numeric
        $keysToDecode = ['created_by', 'owner_id', 'vendor_id', 'store_id', 'createdBy', 'ownerId', 'vendorId', 'storeId'];
        foreach ($keysToDecode as $key) {
            if ($request->has($key)) {
                $value = $request->input($key);
                if (is_string($value) && !is_numeric($value) && !empty($value)) {
                    $decoded = Hashids::decode($value);
                    if (!empty($decoded)) {
                        // Update the request input and query parameters
                        $request->merge([$key => $decoded[0]]);
                        $request->query->set($key, $decoded[0]);
                    }
                }
            }
        }

        // Decode specific route parameters if present and non-numeric
        $route = $request->route();
        if ($route) {
            foreach ($keysToDecode as $key) {
                if ($route->hasParameter($key)) {
                    $value = $route->parameter($key);
                    if (is_string($value) && !is_numeric($value) && !empty($value)) {
                        $decoded = Hashids::decode($value);
                        if (!empty($decoded)) {
                            $route->setParameter($key, $decoded[0]);
                        }
                    }
                }
            }
        }

        return $next($request);
    }
}
