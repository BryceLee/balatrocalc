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

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) {
    return next();
  }

  const expectedPass = env.ADMIN_PASS || '';
  const auth = parseBasicAuth(request.headers.get('Authorization') || '');
  const allowedEmails = getAllowedAdminEmails(env);
  const requestedEmail = normalizeEmail(auth?.user);

  if (!expectedPass || !requestedEmail || auth?.pass !== expectedPass || !allowedEmails.has(requestedEmail)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  return next();
}
