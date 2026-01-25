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
  if (plan !== 'monthly' && plan !== 'yearly') {
    return errorResponse('Invalid subscription plan');
  }

  const email = normalizeEmail(body.email);
  const config = planConfig(plan);
  if (!config) return errorResponse('Invalid plan');

  const planId = plan === 'monthly' ? env.PAYPAL_PLAN_MONTHLY : env.PAYPAL_PLAN_YEARLY;
  if (!planId) {
    return errorResponse('Missing PayPal plan id');
  }

  const { returnUrl, cancelUrl } = getReturnUrls(request, plan);
  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: email,
      subscriber: {
        email_address: email
      },
      application_context: {
        brand_name: 'Balatro Seed Analyzer',
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    return errorResponse('PayPal subscription failed', 502, { details: data });
  }

  const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href;
  if (!approvalUrl) {
    return errorResponse('Missing PayPal approval link', 502);
  }

  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO subscriptions (email, plan, provider, subscription_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    email,
    plan,
    'paypal',
    data.id,
    data.status || 'CREATED',
    now,
    now
  ).run();

  return jsonResponse({ approvalUrl, subscriptionId: data.id });
}
