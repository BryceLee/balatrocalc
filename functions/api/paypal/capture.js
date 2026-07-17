import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  getPaypalAccessToken,
  paypalApiBase,
  nowIso,
  extractPaypalPayerProfile
} from '../_utils.js';

function findCapture(payload, requiredStatus = null) {
  for (const purchaseUnit of payload?.purchase_units || []) {
    for (const capture of purchaseUnit?.payments?.captures || []) {
      if (!requiredStatus || capture?.status === requiredStatus) {
        return { capture, purchaseUnit };
      }
    }
  }
  return null;
}

function captureMatchesOrder(completedCapture, order, config) {
  const captureAmount = Number(completedCapture?.capture?.amount?.value);
  const captureCurrency = completedCapture?.capture?.amount?.currency_code;
  const responseEmail = normalizeEmail(completedCapture?.purchaseUnit?.custom_id || '');
  const storedEmail = normalizeEmail(order?.email || '');

  return Number.isFinite(captureAmount) &&
    captureAmount === Number(config.amount) &&
    captureCurrency === 'USD' &&
    responseEmail === storedEmail;
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const orderId = body?.orderId;
  if (!orderId) {
    return errorResponse('Missing orderId');
  }

  const order = await env.DB.prepare(
    'SELECT email, plan, feature_key, checkout_source, checkout_source_meta, payer_email, payer_name, payer_id FROM orders WHERE order_id = ? LIMIT 1'
  ).bind(orderId).first();

  if (!order) {
    return errorResponse('Order not found', 404);
  }

  const email = normalizeEmail(order.email || '');
  const plan = order.plan;
  const config = planConfig(plan);
  if (!email) {
    return errorResponse('Missing email for order', 500);
  }
  if (!config) {
    return errorResponse('Invalid plan for order', 500);
  }

  const existingPayment = await env.DB.prepare(
    'SELECT id FROM memberships WHERE txn_id = ? AND provider = ? LIMIT 1'
  ).bind(orderId, 'paypal').first();

  if (existingPayment) {
    return jsonResponse({
      active: true,
      email,
      plan,
      expiresAt: null
    });
  }

  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `capture-${orderId}`,
      Prefer: 'return=representation'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    return errorResponse('PayPal capture failed', 502, { details: data });
  }

  const payer = extractPaypalPayerProfile(data);
  const completedCapture = findCapture(data, 'COMPLETED');
  const reportedCapture = completedCapture || findCapture(data);
  const captureStatus = reportedCapture?.capture?.status || data.status || 'PENDING';

  await env.DB.prepare(
    'UPDATE orders SET status = ?, payer_email = ?, payer_name = ?, payer_id = ? WHERE order_id = ?'
  ).bind(
    captureStatus,
    payer.payerEmail || order.payer_email || null,
    payer.payerName || order.payer_name || null,
    payer.payerId || order.payer_id || null,
    orderId
  ).run();

  if (!completedCapture) {
    return jsonResponse({
      active: false,
      email,
      plan,
      status: captureStatus
    });
  }

  if (!captureMatchesOrder(completedCapture, order, config)) {
    return errorResponse('PayPal capture does not match order', 409);
  }

  await env.DB.prepare(
    'INSERT OR IGNORE INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at, checkout_source, checkout_source_meta, payer_email, payer_name, payer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    email,
    order?.feature_key || config.feature,
    plan,
    config.amount,
    'USD',
    'paypal',
    orderId,
    'paid',
    completedCapture.capture.create_time || nowIso(),
    null,
    order?.checkout_source || 'unknown',
    order?.checkout_source_meta || null,
    payer.payerEmail || order?.payer_email || null,
    payer.payerName || order?.payer_name || null,
    payer.payerId || order?.payer_id || null
  ).run();

  return jsonResponse({
    active: true,
    email,
    plan,
    expiresAt: null
  });
}
