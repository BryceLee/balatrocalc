export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) {
    return next();
  }

  const auth = request.headers.get('Authorization') || '';
  const expectedUser = env.ADMIN_USER || '';
  const expectedPass = env.ADMIN_PASS || '';
  const expectedToken = `Basic ${btoa(`${expectedUser}:${expectedPass}`)}`;

  if (!expectedUser || !expectedPass || auth !== expectedToken) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  return next();
}
