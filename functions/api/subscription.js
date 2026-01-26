import { jsonResponse, errorResponse, normalizeEmail } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  const featureParam = url.searchParams.get('feature');
  if (!emailParam) {
    return errorResponse('Missing email');
  }
  if (!featureParam) {
    return errorResponse('Missing feature');
  }
  const email = normalizeEmail(emailParam);
  const feature = String(featureParam).trim().toLowerCase();

  const payment = await env.DB.prepare(
    'SELECT plan, expires_at FROM memberships WHERE email = ? AND feature_key = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(email, feature, 'paid').first();

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
    'SELECT plan, status, next_billing_at FROM subscriptions WHERE email = ? AND feature_key = ? ORDER BY updated_at DESC LIMIT 1'
  ).bind(email, feature).first();

  if (subscription && subscription.status === 'ACTIVE') {
    return jsonResponse({
      active: true,
      email,
      plan: subscription.plan,
      expiresAt: subscription.next_billing_at || null
    });
  }

  return jsonResponse({ active: false, email, feature });
}
