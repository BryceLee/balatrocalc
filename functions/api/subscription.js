import {
  jsonResponse,
  errorResponse,
  normalizeEmail,
  nowIso,
  planConfig,
  deriveSubscriptionAccessExpiresAt,
  getPaypalSubscriptionDetails,
  extractPaypalPayerProfile
} from './_utils.js';

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

async function findActiveMembership(env, email, feature, now) {
  return env.DB.prepare(
    `SELECT plan, expires_at
     FROM memberships
     WHERE email = ?
       AND feature_key = ?
       AND status = ?
       AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END DESC,
              expires_at DESC,
              created_at DESC
     LIMIT 1`
  ).bind(email, feature, 'paid', now).first();
}

async function findLatestSubscription(env, email, feature) {
  return env.DB.prepare(
    `SELECT email, feature_key, plan, provider, subscription_id, status, created_at, updated_at,
            last_payment_at, next_billing_at, checkout_source, checkout_source_meta,
            payer_email, payer_name, payer_id
     FROM subscriptions
     WHERE email = ? AND feature_key = ?
     ORDER BY updated_at DESC
     LIMIT 1`
  ).bind(email, feature).first();
}

async function backfillMembershipFromSubscription(env, subscription, accessExpiresAt, lastPaymentAt) {
  if (!subscription?.email || !subscription?.feature_key || !subscription?.plan || !accessExpiresAt || !lastPaymentAt) {
    return;
  }

  const config = planConfig(subscription.plan);
  if (!config) return;

  const existingPeriod = await env.DB.prepare(
    `SELECT id
     FROM memberships
     WHERE email = ?
       AND feature_key = ?
       AND status = ?
       AND plan = ?
       AND expires_at = ?
     LIMIT 1`
  ).bind(
    subscription.email,
    subscription.feature_key,
    'paid',
    subscription.plan,
    accessExpiresAt
  ).first();

  if (existingPeriod) return;

  const txnId = `paypal_sync_${subscription.subscription_id}_${lastPaymentAt.replace(/[^0-9A-Za-z]/g, '')}`;

  await env.DB.prepare(
    `INSERT INTO memberships
      (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at, checkout_source, checkout_source_meta, payer_email, payer_name, payer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    subscription.email,
    subscription.feature_key,
    subscription.plan,
    config.amount,
    'USD',
    'paypal',
    txnId,
    'paid',
    lastPaymentAt,
    accessExpiresAt,
    subscription.checkout_source || 'unknown',
    subscription.checkout_source_meta || null,
    subscription.payer_email || null,
    subscription.payer_name || null,
    subscription.payer_id || null
  ).run();
}

async function reconcilePaypalSubscription(env, subscription) {
  if (!subscription?.subscription_id || subscription.provider !== 'paypal') {
    return subscription;
  }

  const live = await getPaypalSubscriptionDetails(env, subscription.subscription_id);
  const liveStatus = live.status || subscription.status || 'UNKNOWN';
  const lastPaymentAt = live.billing_info?.last_payment?.time || subscription.last_payment_at || null;
  const payer = extractPaypalPayerProfile(live);
  const accessExpiresAt = deriveSubscriptionAccessExpiresAt(subscription.plan, {
    nextBillingTime: live.billing_info?.next_billing_time || null,
    lastPaymentTime: lastPaymentAt
  });

  const updatedSubscription = {
    ...subscription,
    status: liveStatus,
    last_payment_at: lastPaymentAt,
    next_billing_at: accessExpiresAt || subscription.next_billing_at || null,
    payer_email: payer.payerEmail || subscription.payer_email || null,
    payer_name: payer.payerName || subscription.payer_name || null,
    payer_id: payer.payerId || subscription.payer_id || null
  };

  await env.DB.prepare(
    `UPDATE subscriptions
     SET status = ?, updated_at = ?, next_billing_at = ?, last_payment_at = ?, payer_email = ?, payer_name = ?, payer_id = ?
     WHERE subscription_id = ?`
  ).bind(
    updatedSubscription.status,
    nowIso(),
    updatedSubscription.next_billing_at,
    updatedSubscription.last_payment_at,
    updatedSubscription.payer_email,
    updatedSubscription.payer_name,
    updatedSubscription.payer_id,
    subscription.subscription_id
  ).run();

  if (accessExpiresAt && lastPaymentAt) {
    await backfillMembershipFromSubscription(env, updatedSubscription, accessExpiresAt, lastPaymentAt);
  }

  return updatedSubscription;
}

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
  const now = nowIso();
  const nowTime = Date.now();

  const membership = await findActiveMembership(env, email, feature, now);
  if (membership) {
    return jsonResponse({
      active: true,
      email,
      plan: membership.plan,
      expiresAt: membership.expires_at || null
    });
  }

  let subscription = await findLatestSubscription(env, email, feature);
  if (!subscription) {
    return jsonResponse({ active: false, email, feature });
  }

  try {
    subscription = await reconcilePaypalSubscription(env, subscription);
  } catch (error) {
    console.error('PayPal subscription reconcile failed', {
      subscriptionId: subscription.subscription_id,
      email,
      feature,
      error: error?.message || String(error)
    });
  }

  const accessExpiresAt = deriveSubscriptionAccessExpiresAt(subscription.plan, {
    nextBillingTime: subscription.next_billing_at,
    lastPaymentTime: subscription.last_payment_at || null
  });

  if (accessExpiresAt && toTime(accessExpiresAt) > nowTime) {
    return jsonResponse({
      active: true,
      email,
      plan: subscription.plan,
      expiresAt: accessExpiresAt
    });
  }

  return jsonResponse({ active: false, email, feature });
}
