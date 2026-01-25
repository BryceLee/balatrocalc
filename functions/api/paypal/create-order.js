import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  getPaypalAccessToken,
  paypalApiBase,
  getReturnUrls,
  nowIso
} from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.plan) {
    return errorResponse('Missing email or plan');
  }

  const plan = body.plan;
  if (plan !== 'lifetime') {
    return errorResponse('Plan not supported for one-time order');
  }

  const email = normalizeEmail(body.email);
  const config = planConfig(plan);
  if (!config) return errorResponse('Invalid plan');

  const { returnUrl, cancelUrl } = getReturnUrls(request, plan);
  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: String(config.amount)
          },
          custom_id: email
        }
      ],
      application_context: {
        brand_name: 'Balatro Seed Analyzer',
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW'
      }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    return errorResponse('PayPal order failed', 502, { details: data });
  }

  const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href;
  if (!approvalUrl) {
    return errorResponse('Missing PayPal approval link', 502);
  }

  await env.DB.prepare(
    'INSERT INTO orders (email, order_id, plan, status, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(email, data.id, plan, data.status || 'CREATED', nowIso()).run();

  return jsonResponse({ approvalUrl, orderId: data.id });
}
