<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /** Origins allowed to access this API. Use '*' for fully public APIs. */
    private const ALLOWED_ORIGIN = '*';

    private const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

    private const ALLOWED_HEADERS = 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN';

    /**
     * Handle an incoming request.
     * Adds CORS headers to every response and short-circuits OPTIONS preflight requests.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Short-circuit OPTIONS preflight immediately — no need to hit the router
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN)
                ->header('Access-Control-Allow-Methods', self::ALLOWED_METHODS)
                ->header('Access-Control-Allow-Headers', self::ALLOWED_HEADERS)
                ->header('Access-Control-Max-Age', '86400');
        }

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN);
        $response->headers->set('Access-Control-Allow-Methods', self::ALLOWED_METHODS);
        $response->headers->set('Access-Control-Allow-Headers', self::ALLOWED_HEADERS);

        return $response;
    }
}
