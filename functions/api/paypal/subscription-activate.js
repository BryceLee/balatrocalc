import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  nowIso,
  addDaysIso,
  deriveSubscriptionAccessExpiresAt,
  getPaypalSubscriptionDetails
} from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const subscriptionId = body?.subscriptionId;
  if (!subscriptionId) {
    return errorResponse('Missing subscriptionId');
  }

  let data;
  try {
    data = await getPaypalSubscriptionDetails(env, subscriptionId);
  } catch (error) {
    return errorResponse('PayPal subscription lookup failed', 502, { details: error.message || String(error) });
  }

  const email = normalizeEmail(data.custom_id || data.subscriber?.email_address || '');
  const status = data.status || 'UNKNOWN';
  const now = nowIso();

  const existing = await env.DB.prepare(
    'SELECT id, email, plan, feature_key, checkout_source, checkout_source_meta FROM subscriptions WHERE subscription_id = ? LIMIT 1'
  ).bind(subscriptionId).first();

  const plan = existing?.plan;
  const featureKey = existing?.feature_key;
  const storedEmail = existing?.email;
  const resolvedEmail = normalizeEmail(storedEmail || email);

  if (!existing) {
    return errorResponse('Subscription not found', 404);
  }
  if (!plan || !featureKey) {
    return errorResponse('Subscription plan missing', 500);
  }

  const lastPaymentAt = data.billing_info?.last_payment?.time || null;
  const accessExpiresAt = deriveSubscriptionAccessExpiresAt(plan, {
    nextBillingTime: data.billing_info?.next_billing_time || null,
    lastPaymentTime: lastPaymentAt
  });

  await env.DB.prepare(
    'UPDATE subscriptions SET status = ?, updated_at = ?, next_billing_at = ?, last_payment_at = ? WHERE subscription_id = ?'
  ).bind(
    status,
    now,
    accessExpiresAt,
    lastPaymentAt,
    subscriptionId
  ).run();

  if (status !== 'ACTIVE') {
    return jsonResponse({ active: false, plan, email: resolvedEmail, expiresAt: null });
  }

  const config = planConfig(plan);
  if (!config) {
    return errorResponse('Invalid plan', 500);
  }

  const targetFeature = featureKey || config.feature;
  const existingPayment = await env.DB.prepare(
    'SELECT id, expires_at FROM memberships WHERE txn_id = ? AND provider = ? LIMIT 1'
  ).bind(subscriptionId, 'paypal').first();

  let expiresAt = existingPayment?.expires_at || accessExpiresAt || null;
  if (!existingPayment) {
    if (config.days === null) {
      expiresAt = null;
    } else {
      const lifetime = await env.DB.prepare(
        'SELECT id FROM memberships WHERE email = ? AND feature_key = ? AND status = ? AND expires_at IS NULL LIMIT 1'
      ).bind(resolvedEmail, targetFeature, 'paid').first();
      if (lifetime) {
        expiresAt = null;
      } else {
        const latest = await env.DB.prepare(
          'SELECT MAX(expires_at) AS expires_at FROM memberships WHERE email = ? AND feature_key = ? AND status = ? AND expires_at IS NOT NULL'
        ).bind(resolvedEmail, targetFeature, 'paid').first();
        const baseTime = latest?.expires_at && latest.expires_at > now ? latest.expires_at : now;
        expiresAt = addDaysIso(config.days, baseTime);
      }
    }
    await env.DB.prepare(
      'INSERT INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at, checkout_source, checkout_source_meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      resolvedEmail,
      targetFeature,
      plan,
      config.amount,
      'USD',
      'paypal',
      subscriptionId,
      'paid',
      now,
      expiresAt,
      existing.checkout_source || 'unknown',
      existing.checkout_source_meta || null
    ).run();
  }

  return jsonResponse({
    active: true,
    email: resolvedEmail,
    plan,
    expiresAt
  });
}
