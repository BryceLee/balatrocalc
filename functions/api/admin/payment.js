import { jsonResponse, errorResponse, normalizeEmail, planConfig, nowIso, addDaysIso } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.plan || !body.amount) {
    return errorResponse('Missing email, plan, or amount');
  }

  const email = normalizeEmail(body.email);
  const plan = body.plan;
  const config = planConfig(plan);
  if (!config) return errorResponse('Invalid plan');

  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    return errorResponse('Invalid amount');
  }

  const txnId = body.txn_id || body.txnId || `manual_${Date.now()}`;
  const expiresAt = plan === 'lifetime' ? null : addDaysIso(config.days);

  await env.DB.prepare(
    'INSERT INTO payments (email, plan, amount, currency, provider, txn_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    email,
    plan,
    amount,
    'USD',
    'usdt',
    txnId,
    'paid',
    nowIso(),
    expiresAt
  ).run();

  return jsonResponse({ ok: true, email, plan, expiresAt });
}
