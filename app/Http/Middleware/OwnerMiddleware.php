<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OwnerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array((int)$user->role_id, [1, 30003])) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Store Owner privileges required.',
                'code' => 403
            ], 403);
        }

        return $next($request);
    }
}
