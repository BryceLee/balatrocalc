import { jsonResponse, errorResponse, normalizeEmail, nowIso } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || (!body.email && !body.id)) {
    return errorResponse('Missing email or id');
  }

  const now = nowIso();
  if (body.id) {
    await env.DB.prepare(
      'UPDATE memberships SET status = ?, expires_at = ? WHERE id = ?'
    ).bind('revoked', now, body.id).run();
    return jsonResponse({ ok: true });
  }

  const email = normalizeEmail(body.email);
  await env.DB.prepare(
    'UPDATE memberships SET status = ?, expires_at = ? WHERE email = ? AND status = ?'
  ).bind('revoked', now, email, 'paid').run();

  return jsonResponse({ ok: true });
}
