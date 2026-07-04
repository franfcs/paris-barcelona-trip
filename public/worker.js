// Trip planner Worker: serves static assets + a tiny sync API backed by KV.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/state') {
      if (request.method === 'GET') {
        const data = await env.TRIP_KV.get('state');
        return json(data || '{}');
      }
      if (request.method === 'PUT' || request.method === 'POST') {
        const body = await request.text();
        // basic guard: cap payload so a bad client can't blow up KV
        if (body.length > 512 * 1024) return json('{"error":"too_large"}', 413);
        await env.TRIP_KV.put('state', body);
        return json('{"ok":true}');
      }
      return json('{"error":"method_not_allowed"}', 405);
    }
    // Serve the app directly at the root — no redirect, no stale index page.
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const u = new URL(request.url);
      u.pathname = '/paris-barcelona-trip';
      return env.ASSETS.fetch(new Request(u, request));
    }
    // Everything else → static assets (HTML, manifest, sw.js, etc.)
    return env.ASSETS.fetch(request);
  }
};

function json(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
