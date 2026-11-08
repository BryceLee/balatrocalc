// API routes must never fall through to Pages' HTML homepage fallback.
// Keep crawlers able to see noindex rather than hiding it behind robots.txt.
const PAYPAL_POST_ROUTES = new Set([
  '/api/paypal/create-order', '/api/paypal/create-subscription',
  '/api/paypal/capture', '/api/paypal/subscription-activate', '/api/paypal/webhook'
]);

export async function onRequest({ request, next }) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, '');
  let response;
  if (PAYPAL_POST_ROUTES.has(pathname) && (request.method === 'GET' || request.method === 'HEAD')) {
    response = new Response(request.method === 'HEAD' ? null : JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } else {
    response = await next();
  }
  if ((response.headers.get('Content-Type') || '').includes('text/html')) {
    response = new Response(request.method === 'HEAD' ? null : JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
