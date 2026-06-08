<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     * Adds CORS headers to every response and short-circuits OPTIONS preflight requests.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

        // Default CORS headers
        $allowOrigin = '*';
        $allowCredentials = false;

        // If origin is allowed, use it specifically and allow credentials
        if (in_array($origin, $allowedOrigins)) {
            $allowOrigin = $origin;
            $allowCredentials = true;
        }

        $headers = [
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, Accept, X-Requested-With, X-Auth-Token, Origin, Application, X-CSRF-TOKEN',
            'Access-Control-Max-Age' => '86400',
        ];

        // Short-circuit OPTIONS preflight immediately — no need to hit the router
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204);
            $response->header('Access-Control-Allow-Origin', $allowOrigin);
            foreach ($headers as $key => $value) {
                $response->header($key, $value);
            }
            if ($allowCredentials) {
                $response->header('Access-Control-Allow-Credentials', 'true');
            }
            return $response;
        }

        /** @var Response $response */
        $response = $next($request);

        // Add headers to the response
        if ($response instanceof Response) {
            $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
            foreach ($headers as $key => $value) {
                $response->headers->set($key, $value);
            }
            if ($allowCredentials) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
        }

        return $response;
    }
}
