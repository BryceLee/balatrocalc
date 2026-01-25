import { jsonResponse, errorResponse, normalizeEmail } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  if (!emailParam) {
    return errorResponse('Missing email');
  }
  const email = normalizeEmail(emailParam);

  const payment = await env.DB.prepare(
    'SELECT plan, expires_at FROM payments WHERE email = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(email, 'paid').first();

  const now = Date.now();
  if (payment) {
    if (!payment.expires_at || new Date(payment.expires_at).getTime() > now) {
      return jsonResponse({
        active: true,
        email,
        plan: payment.plan,
        expiresAt: payment.expires_at || null
      });
    }
  }

  const subscription = await env.DB.prepare(
    'SELECT plan, status, next_billing_at FROM subscriptions WHERE email = ? ORDER BY updated_at DESC LIMIT 1'
  ).bind(email).first();

  if (subscription && subscription.status === 'ACTIVE') {
    return jsonResponse({
      active: true,
      email,
      plan: subscription.plan,
      expiresAt: subscription.next_billing_at || null
    });
  }

  return jsonResponse({ active: false, email });
}
