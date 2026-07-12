//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = { async fetch(request, env, ctx) {
	const url = new URL(request.url);
	if (url.pathname.startsWith("/api/")) {
		const backendUrl = env.BACKEND_URL || "https://laravel-api-hsite.vercel.app";
		const targetUrl = new URL(url.pathname + url.search, backendUrl);
		const proxyRequest = new Request(targetUrl, {
			method: request.method,
			headers: request.headers,
			body: request.body,
			redirect: "manual"
		});
		try {
			return await fetch(proxyRequest);
		} catch (err) {
			return new Response("Backend proxy error: " + err.message, { status: 502 });
		}
	}
	return await env.ASSETS.fetch(request);
} };
//#endregion
export { worker_entry_default as default };
