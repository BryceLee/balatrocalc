import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  planConfig,
  nowIso,
  addDaysIso,
  deriveSubscriptionAccessExpiresAt,
  getPaypalSubscriptionDetails,
  extractPaypalPayerProfile,
  buildPaypalSubscriptionPeriodTxnId
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
  const payer = extractPaypalPayerProfile(data);

  const existing = await env.DB.prepare(
    'SELECT id, email, plan, feature_key, checkout_source, checkout_source_meta, payer_email, payer_name, payer_id FROM subscriptions WHERE subscription_id = ? LIMIT 1'
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
    'UPDATE subscriptions SET status = ?, updated_at = ?, next_billing_at = ?, last_payment_at = ?, payer_email = ?, payer_name = ?, payer_id = ? WHERE subscription_id = ?'
  ).bind(
    status,
    now,
    accessExpiresAt,
    lastPaymentAt,
    payer.payerEmail || existing?.payer_email || null,
    payer.payerName || existing?.payer_name || null,
    payer.payerId || existing?.payer_id || null,
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
  ).bind(
    buildPaypalSubscriptionPeriodTxnId(subscriptionId, lastPaymentAt || accessExpiresAt || now) || subscriptionId,
    'paypal'
  ).first();

  const existingLegacyPayment = await env.DB.prepare(
    'SELECT id, expires_at FROM memberships WHERE txn_id = ? AND provider = ? LIMIT 1'
  ).bind(subscriptionId, 'paypal').first();

  let expiresAt = existingPayment?.expires_at || existingLegacyPayment?.expires_at || accessExpiresAt || addDaysIso(config.days, lastPaymentAt || now);
  const periodTxnId = buildPaypalSubscriptionPeriodTxnId(subscriptionId, lastPaymentAt || expiresAt || now) || subscriptionId;
  const existingPeriod = expiresAt
    ? await env.DB.prepare(
      `SELECT id, expires_at
       FROM memberships
       WHERE email = ?
         AND feature_key = ?
         AND status = ?
         AND plan = ?
         AND expires_at = ?
       LIMIT 1`
    ).bind(resolvedEmail, targetFeature, 'paid', plan, expiresAt).first()
    : null;

  if (!existingPayment && !existingLegacyPayment && !existingPeriod) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at, checkout_source, checkout_source_meta, payer_email, payer_name, payer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      resolvedEmail,
      targetFeature,
      plan,
      config.amount,
      'USD',
      'paypal',
      periodTxnId,
      'paid',
      lastPaymentAt || now,
      expiresAt,
      existing.checkout_source || 'unknown',
      existing.checkout_source_meta || null,
      payer.payerEmail || existing?.payer_email || null,
      payer.payerName || existing?.payer_name || null,
      payer.payerId || existing?.payer_id || null
    ).run();
  }

  return jsonResponse({
    active: true,
    email: resolvedEmail,
    plan,
    expiresAt
  });
}
