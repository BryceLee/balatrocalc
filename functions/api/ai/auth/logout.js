import { jsonResponse, errorResponse, nowIso } from '../../_utils.js';
import { assertSameOrigin, clearSessionCookie, getAiSession } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const session = await getAiSession(env, request);
  if (session) {
    await env.DB.prepare(
      'UPDATE ai_sessions SET revoked_at = ?, last_seen_at = ? WHERE id = ?'
    ).bind(nowIso(), nowIso(), session.session_id).run();
  }
  const response = jsonResponse({ signedOut: true });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Set-Cookie', clearSessionCookie(request));
  return response;
}
