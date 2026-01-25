import { jsonResponse, errorResponse, normalizeEmail } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  if (!emailParam) {
    return errorResponse('Missing email');
  }
  const email = normalizeEmail(emailParam);

  const { results } = await env.DB.prepare(
    'SELECT id, email, plan, amount, currency, provider, txn_id, status, created_at, expires_at FROM payments WHERE email = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(email).all();

  return jsonResponse({ ok: true, results });
}
