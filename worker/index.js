const STATIC_ROUTES = new Map([
  ["/", "/index.html"],
  ["/exam", "/exam.html"],
  ["/review", "/review.html"],
]);

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetPath = STATIC_ROUTES.get(url.pathname);

    if (assetPath) {
      url.pathname = assetPath;
      request = new Request(url, request);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
