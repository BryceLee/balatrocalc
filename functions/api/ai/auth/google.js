import { jsonResponse, errorResponse, nowIso } from '../../_utils.js';
import {
  assertSameOrigin,
  getAccountSnapshot,
  isAiEmailAllowed,
  newSessionToken,
  sessionCookie,
  sha256Hex,
  verifyGoogleCredential
} from '../_shared.js';

export async function onRequestPost({ request, env }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const body = await request.json().catch(() => null);
  if (!body?.credential) return errorResponse('Missing Google credential');

  let profile;
  try {
    profile = await verifyGoogleCredential(body.credential, env);
  } catch (error) {
    console.error('Google AI sign-in failed', error?.message || String(error));
    return errorResponse('Google sign-in could not be verified', 401);
  }
  if (!isAiEmailAllowed(env, profile.email)) {
    return errorResponse('AI Advisor is not available for this account', 403);
  }

  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO ai_users (google_sub, email, name, picture, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(google_sub) DO UPDATE SET
       email = excluded.email,
       name = excluded.name,
       picture = excluded.picture,
       updated_at = excluded.updated_at`
  ).bind(profile.googleSub, profile.email, profile.name, profile.picture, now, now).run();

  const user = await env.DB.prepare(
    'SELECT id, google_sub, email, name, picture FROM ai_users WHERE google_sub = ? LIMIT 1'
  ).bind(profile.googleSub).first();
  if (!user) return errorResponse('Unable to create AI account', 500);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO ai_wallets
      (user_id, balance_micros, reserved_micros, exact_usage_nanos, billed_usage_micros, created_at, updated_at)
     VALUES (?, 0, 0, 0, 0, ?, ?)`
  ).bind(user.id, now, now).run();

  const token = newSessionToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO ai_sessions (user_id, token_hash, created_at, expires_at, last_seen_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, NULL)`
  ).bind(user.id, tokenHash, now, expiresAt, now).run();

  const account = await getAccountSnapshot(env, user.id);
  return new Response(JSON.stringify({
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture
    },
    account
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': sessionCookie(request, token)
    }
  });
}
