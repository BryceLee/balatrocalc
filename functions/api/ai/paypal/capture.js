import {
  jsonResponse,
  errorResponse,
  getPaypalAccessToken,
  paypalApiBase,
  nowIso
} from '../../_utils.js';
import {
  assertSameOrigin,
  cents,
  getAccountSnapshot,
  packageConfig,
  requireAiSession
} from '../_shared.js';

function findCapture(payload, requiredStatus = null) {
  for (const purchaseUnit of payload?.purchase_units || []) {
    for (const capture of purchaseUnit?.payments?.captures || []) {
      if (!requiredStatus || capture?.status === requiredStatus) return { capture, purchaseUnit };
    }
  }
  return null;
}

export async function onRequestPost({ request, env }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '').trim();
  if (!orderId) return errorResponse('Missing PayPal order');

  const order = await env.DB.prepare(
    `SELECT order_id, package_id, amount_cents, credits_micros, status, credited_at, capture_id
     FROM ai_topup_orders WHERE order_id = ? AND user_id = ? LIMIT 1`
  ).bind(orderId, session.user_id).first();
  if (!order) return errorResponse('AI credit order not found', 404);
  if (order.credited_at) {
    return jsonResponse({ credited: true, account: await getAccountSnapshot(env, session.user_id) });
  }

  const config = packageConfig(order.package_id);
  if (!config || Number(order.amount_cents) !== Math.round(Number(config.amount) * 100)) {
    return errorResponse('Stored credit package is invalid', 409);
  }

  const token = await getPaypalAccessToken(env);
  const paypalResponse = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `ai-capture-${orderId}`,
      Prefer: 'return=representation'
    }
  });
  const payload = await paypalResponse.json().catch(() => null);
  if (!paypalResponse.ok) {
    console.error('AI PayPal capture failed', payload?.name || paypalResponse.status);
    return errorResponse('PayPal payment could not be captured', 502);
  }

  const completed = findCapture(payload, 'COMPLETED');
  const reported = completed || findCapture(payload);
  const status = reported?.capture?.status || payload?.status || 'PENDING';
  const now = nowIso();
  await env.DB.prepare(
    'UPDATE ai_topup_orders SET status = ?, updated_at = ? WHERE order_id = ? AND user_id = ?'
  ).bind(status, now, orderId, session.user_id).run();
  if (!completed) return jsonResponse({ credited: false, status });

  const grossCents = cents(completed.capture?.amount?.value);
  const currency = completed.capture?.amount?.currency_code;
  const customId = completed.purchaseUnit?.custom_id;
  if (
    grossCents !== Number(order.amount_cents) ||
    currency !== 'USD' ||
    customId !== `ai:${session.google_sub}`
  ) {
    return errorResponse('PayPal payment does not match this AI account', 409);
  }

  const breakdown = completed.capture?.seller_receivable_breakdown || {};
  const paypalFeeCents = cents(breakdown.paypal_fee?.value);
  const netAmountCents = cents(breakdown.net_amount?.value);
  const captureId = String(completed.capture?.id || '').trim() || null;
  const createdAt = completed.capture?.create_time || now;

  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO ai_topups
        (user_id, order_id, capture_id, package_id, credits_micros, gross_amount_cents,
         paypal_fee_cents, net_amount_cents, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      session.user_id,
      orderId,
      captureId,
      config.id,
      config.creditsMicros,
      grossCents,
      paypalFeeCents,
      netAmountCents,
      currency,
      createdAt
    ),
    env.DB.prepare(
      `UPDATE ai_wallets
       SET balance_micros = balance_micros + ?, updated_at = ?
       WHERE user_id = ?
         AND EXISTS (
           SELECT 1 FROM ai_topup_orders
           WHERE order_id = ? AND user_id = ? AND credited_at IS NULL
         )`
    ).bind(config.creditsMicros, now, session.user_id, orderId, session.user_id),
    env.DB.prepare(
      `UPDATE ai_topup_orders
       SET status = 'COMPLETED', credited_at = ?, capture_id = ?, updated_at = ?
       WHERE order_id = ? AND user_id = ? AND credited_at IS NULL`
    ).bind(now, captureId, now, orderId, session.user_id)
  ]);

  return jsonResponse({ credited: true, account: await getAccountSnapshot(env, session.user_id) });
}
