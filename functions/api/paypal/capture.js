import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  getPaypalAccessToken,
  paypalApiBase,
  nowIso
} from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const orderId = body?.orderId;
  if (!orderId) {
    return errorResponse('Missing orderId');
  }

  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    return errorResponse('PayPal capture failed', 502, { details: data });
  }

  const order = await env.DB.prepare(
    'SELECT email, plan, feature_key FROM orders WHERE order_id = ? LIMIT 1'
  ).bind(orderId).first();

  if (!order) {
    return errorResponse('Order not found', 404);
  }

  const email = normalizeEmail(
    order.email || data.purchase_units?.[0]?.custom_id || ''
  );
  const plan = order.plan;
  const config = planConfig(plan);
  if (!email) {
    return errorResponse('Missing email for order', 500);
  }
  if (!config) {
    return errorResponse('Invalid plan for order', 500);
  }

  await env.DB.prepare(
    'UPDATE orders SET status = ? WHERE order_id = ?'
  ).bind(data.status || 'COMPLETED', orderId).run();

  const existingPayment = await env.DB.prepare(
    'SELECT id FROM memberships WHERE txn_id = ? AND provider = ? LIMIT 1'
  ).bind(orderId, 'paypal').first();

  if (!existingPayment) {
    await env.DB.prepare(
      'INSERT INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      email,
      order?.feature_key || config.feature,
      plan,
      config.amount,
      'USD',
      'paypal',
      orderId,
      'paid',
      nowIso(),
      null
    ).run();
  }

  return jsonResponse({
    active: true,
    email,
    plan,
    expiresAt: null
  });
}
