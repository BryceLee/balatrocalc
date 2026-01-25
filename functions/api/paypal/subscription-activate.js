import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  getPaypalAccessToken,
  paypalApiBase,
  nowIso,
  addDaysIso
} from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const subscriptionId = body?.subscriptionId;
  if (!subscriptionId) {
    return errorResponse('Missing subscriptionId');
  }

  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    return errorResponse('PayPal subscription lookup failed', 502, { details: data });
  }

  const email = normalizeEmail(data.custom_id || data.subscriber?.email_address || '');
  const status = data.status || 'UNKNOWN';
  const now = nowIso();

  const existing = await env.DB.prepare(
    'SELECT id, plan FROM subscriptions WHERE subscription_id = ? LIMIT 1'
  ).bind(subscriptionId).first();

  const plan = existing?.plan || (data.plan_id === env.PAYPAL_PLAN_YEARLY ? 'yearly' : 'monthly');

  if (existing) {
    await env.DB.prepare(
      'UPDATE subscriptions SET status = ?, updated_at = ?, next_billing_at = ?, last_payment_at = ? WHERE subscription_id = ?'
    ).bind(
      status,
      now,
      data.billing_info?.next_billing_time || null,
      data.billing_info?.last_payment?.time || null,
      subscriptionId
    ).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO subscriptions (email, plan, provider, subscription_id, status, created_at, updated_at, next_billing_at, last_payment_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      email,
      plan,
      'paypal',
      subscriptionId,
      status,
      now,
      now,
      data.billing_info?.next_billing_time || null,
      data.billing_info?.last_payment?.time || null
    ).run();
  }

  if (status !== 'ACTIVE') {
    return jsonResponse({ active: false, plan, email, expiresAt: null });
  }

  const config = planConfig(plan);
  if (!config) {
    return errorResponse('Invalid plan', 500);
  }

  const existingPayment = await env.DB.prepare(
    'SELECT id FROM payments WHERE txn_id = ? AND provider = ? LIMIT 1'
  ).bind(subscriptionId, 'paypal').first();

  const expiresAt = addDaysIso(config.days);
  if (!existingPayment) {
    await env.DB.prepare(
      'INSERT INTO payments (email, plan, amount, currency, provider, txn_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      email,
      plan,
      config.amount,
      'USD',
      'paypal',
      subscriptionId,
      'paid',
      now,
      expiresAt
    ).run();
  }

  return jsonResponse({
    active: true,
    email,
    plan,
    expiresAt
  });
}
