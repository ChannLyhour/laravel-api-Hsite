<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // role_id 2 = Customer, role_id 1 = Admin, role_id 30003 = Owner
        if (!$user || !in_array((int)$user->role_id, [1, 2, 30003])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Customer, Owner, or Administrator privileges required.',
                'code' => 403
            ], 403);
        }

        return $next($request);
    }
}
