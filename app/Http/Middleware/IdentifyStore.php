<?php

namespace App\Http\Middleware;

use App\Models\StoreDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyStore
{
    /**
     * Handle an incoming request.
     *
     * Resolves the "current store" from one of:
     *   1. X-Store-Domain header (sent by Next.js SSR)
     *   2. ?owner_id or ?created_by query parameter (existing SPA behavior)
     *
     * Injects `current_store_owner_id` into the request for downstream controllers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Priority 1: X-Store-Domain header (from Next.js SSR or any SSR client)
        $domain = $request->header('X-Store-Domain');

        if ($domain) {
            $domain = strtolower(trim($domain));

            $ownerId = StoreDomain::resolveOwner($domain);

            if (!$ownerId) {
                return response()->json([
                    'message' => 'Store not found for domain: ' . $domain,
                ], 404);
            }

            $request->merge([
                'current_store_owner_id' => $ownerId,
                'current_store_domain'   => $domain,
            ]);

            return $next($request);
        }

        // Priority 2: Query parameters (backward compatibility with existing React SPA)
        $ownerId = $request->query('owner_id') ?? $request->query('created_by');

        if ($ownerId) {
            $request->merge([
                'current_store_owner_id' => (int) $ownerId,
            ]);
        }

        // If neither header nor query param is present, the request passes through
        // without store context (suitable for global/public endpoints).
        return $next($request);
    }
}
