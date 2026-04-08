import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  nowIso,
  addDaysIso,
  normalizeCheckoutSource,
  serializeCheckoutSourceMeta
} from '../_utils.js';

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
  const expiresAt = config.period === 'lifetime' ? null : addDaysIso(config.days);
  const checkoutSource = normalizeCheckoutSource(body.checkoutSource || 'admin_manual');
  const checkoutSourceMeta = serializeCheckoutSourceMeta(
    body.checkoutSourceMeta || { page: '/admin', component: 'manual-payment', feature: config.feature }
  );

  await env.DB.prepare(
    'INSERT INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at, checkout_source, checkout_source_meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    email,
    config.feature,
    plan,
    amount,
    'USD',
    'usdt',
    txnId,
    'paid',
    nowIso(),
    expiresAt,
    checkoutSource,
    checkoutSourceMeta
  ).run();

  return jsonResponse({ ok: true, email, plan, expiresAt });
}
