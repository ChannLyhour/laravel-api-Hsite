<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || (int)$user->role_id !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Super Administrator privileges required.',
                'code' => 403
            ], 403);
        }

        return $next($request);
    }
}
