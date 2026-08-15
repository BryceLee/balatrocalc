import {
  jsonResponse,
  errorResponse,
  getPaypalAccessToken,
  paypalApiBase,
  nowIso
} from '../../_utils.js';
import { assertSameOrigin, packageConfig, requireAiSession } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const body = await request.json().catch(() => null);
  const config = packageConfig(body?.packageId);
  if (!config) return errorResponse('Invalid credit package');

  const token = await getPaypalAccessToken(env);
  const origin = new URL(request.url).origin;
  const returnUrl = new URL('/balatro-ai-assistant', origin);
  returnUrl.searchParams.set('paypal', 'success');
  returnUrl.searchParams.set('package', config.id);
  const cancelUrl = new URL('/balatro-ai-assistant', origin);
  cancelUrl.searchParams.set('paypal', 'cancel');

  const paypalResponse = await fetch(`${paypalApiBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `ai-order-${session.user_id}-${config.id}-${crypto.randomUUID()}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `ai-${config.id}`,
        custom_id: `ai:${session.google_sub}`,
        description: `Balatro AI ${config.label}`,
        amount: {
          currency_code: 'USD',
          value: config.amount
        }
      }],
      application_context: {
        brand_name: 'BalatroCalc AI',
        landing_page: 'NO_PREFERENCE',
        return_url: returnUrl.toString(),
        cancel_url: cancelUrl.toString(),
        user_action: 'PAY_NOW'
      }
    })
  });
  const payload = await paypalResponse.json().catch(() => null);
  if (!paypalResponse.ok || !payload?.id) {
    console.error('AI PayPal order failed', payload?.name || paypalResponse.status);
    return errorResponse('PayPal checkout is temporarily unavailable', 502);
  }

  const approvalUrl = payload.links?.find((link) => link.rel === 'approve')?.href;
  if (!approvalUrl) return errorResponse('Missing PayPal approval link', 502);
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO ai_topup_orders
      (user_id, order_id, package_id, amount_cents, credits_micros, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    session.user_id,
    payload.id,
    config.id,
    Math.round(Number(config.amount) * 100),
    config.creditsMicros,
    payload.status || 'CREATED',
    now,
    now
  ).run();

  return jsonResponse({ approvalUrl, orderId: payload.id });
}
