export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Test endpoint to verify environment variable binding
    if (url.pathname === '/api/db-config-test') {
      return new Response(JSON.stringify({
        status: 'ok',
        backend_url: env.BACKEND_URL,
        database: {
          connection: env.DB_CONNECTION,
          host: env.DB_HOST,
          port: env.DB_PORT,
          database: env.DB_DATABASE,
          username: env.DB_USERNAME,
          password_configured: !!env.DB_PASSWORD
        }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route API requests to the backend server
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = env.BACKEND_URL || 'https://laravel-api-hsite.vercel.app';
      const targetUrl = new URL(url.pathname + url.search, backendUrl);

      // Clone the request with the new target URL
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual'
      });

      try {
        return await fetch(proxyRequest);
      } catch (err) {
        return new Response('Backend proxy error: ' + err.message, { status: 502 });
      }
    }

    // Serve static assets for all other routes
    return await env.ASSETS.fetch(request);
  }
};
