const DEFAULT_ADMIN_EMAIL = 'bryceleezx@gmail.com';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function parseBasicAuth(value) {
  if (!value || !value.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = atob(value.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      user: decoded.slice(0, separator),
      pass: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

function getAllowedAdminEmails(env) {
  const raw = env.ADMIN_ALLOWED_EMAILS || env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  return new Set(
    String(raw)
      .split(',')
      .map(normalizeEmail)
      .filter(Boolean)
  );
}

const TRACKER_TAG = '<script defer src="/bc-analytics.js"></script>';

// Adds the first-party behavior tracker to every public HTML page.
async function withBehaviorTracker(request, env, next) {
  const response = await next();
  if (env.BEHAVIOR_TRACKING === 'off' || typeof HTMLRewriter === 'undefined') return response;
  if (request.method !== 'GET' || response.status !== 200) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('head', { element(element) { element.append(TRACKER_TAG, { html: true }); } })
    .transform(response);
}

export async function onRequest({ request, next, env, data }) {
  const url = new URL(request.url);
  if (url.hostname === 'www.balatrocalc.com' && (request.method === 'GET' || request.method === 'HEAD')) {
    url.hostname = 'balatrocalc.com';
    return Response.redirect(url.toString(), 301);
  }

  // Pages serves decoded asset paths. Authenticate the same normalized path,
  // otherwise /%61dmin/... can expose a protected static admin page.
  let path = url.pathname;
  try {
    for (let depth = 0; depth < 4; depth++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
    path = new URL(path.replace(/\\/g, '/').replace(/\/+/g, '/'), url.origin).pathname;
  } catch {
    return new Response('Invalid path', { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) {
    return path.startsWith('/api/') ? next() : withBehaviorTracker(request, env, next);
  }

  const expectedPass = env.ADMIN_PASS || '';
  const auth = parseBasicAuth(request.headers.get('Authorization') || '');
  const allowedEmails = getAllowedAdminEmails(env);
  const requestedEmail = normalizeEmail(auth?.user);

  if (!expectedPass || !requestedEmail || auth?.pass !== expectedPass || !allowedEmails.has(requestedEmail)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"', 'Cache-Control': 'private, no-store' }
    });
  }

  if (data) data.adminEmail = requestedEmail;
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Referrer-Policy', 'no-referrer');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
