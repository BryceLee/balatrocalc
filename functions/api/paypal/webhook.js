import {
  jsonResponse,
  errorResponse,
  planConfig,
  verifyPaypalWebhook,
  nowIso,
  addDaysIso
} from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse('Invalid webhook payload');
  }

  const verified = await verifyPaypalWebhook(request, env, body);
  if (!verified) {
    return errorResponse('Invalid webhook signature', 400);
  }

  const eventType = body.event_type || '';
  const resource = body.resource || {};
  const now = nowIso();

  if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
    const subscriptionId = resource.id;
    if (subscriptionId) {
      await env.DB.prepare(
        'UPDATE subscriptions SET status = ?, updated_at = ? WHERE subscription_id = ?'
      ).bind(resource.status || eventType.replace('BILLING.SUBSCRIPTION.', ''), now, subscriptionId).run();
    }
    return jsonResponse({ ok: true });
  }

  if (eventType === 'PAYMENT.SALE.COMPLETED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const subscriptionId = resource.billing_agreement_id || resource.subscription_id;
    if (!subscriptionId) {
      return jsonResponse({ ok: true });
    }

    const subscription = await env.DB.prepare(
      'SELECT email, plan, feature_key FROM subscriptions WHERE subscription_id = ? LIMIT 1'
    ).bind(subscriptionId).first();

    if (!subscription) {
      return jsonResponse({ ok: true });
    }

    const config = planConfig(subscription.plan);
    if (!config) {
      return jsonResponse({ ok: true });
    }

    const targetFeature = subscription.feature_key || config.feature;
    const existingPayment = await env.DB.prepare(
      'SELECT id FROM memberships WHERE txn_id = ? LIMIT 1'
    ).bind(resource.id).first();

    if (!existingPayment) {
      let expiresAt = null;
      if (config.days === null) {
        expiresAt = null;
      } else {
        const lifetime = await env.DB.prepare(
          'SELECT id FROM memberships WHERE email = ? AND feature_key = ? AND status = ? AND expires_at IS NULL LIMIT 1'
        ).bind(subscription.email, targetFeature, 'paid').first();
        if (lifetime) {
          expiresAt = null;
        } else {
          const latest = await env.DB.prepare(
            'SELECT MAX(expires_at) AS expires_at FROM memberships WHERE email = ? AND feature_key = ? AND status = ? AND expires_at IS NOT NULL'
          ).bind(subscription.email, targetFeature, 'paid').first();
          const baseTime = latest?.expires_at && latest.expires_at > now ? latest.expires_at : now;
          expiresAt = addDaysIso(config.days, baseTime);
        }
      }
      await env.DB.prepare(
        'INSERT INTO memberships (email, feature_key, plan, amount, currency, provider, txn_id, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        subscription.email,
        targetFeature,
        subscription.plan,
        config.amount,
        'USD',
        'paypal',
        resource.id,
        'paid',
        now,
        expiresAt
      ).run();
    }

    await env.DB.prepare(
      'UPDATE subscriptions SET status = ?, updated_at = ?, last_payment_at = ? WHERE subscription_id = ?'
    ).bind('ACTIVE', now, now, subscriptionId).run();

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
}
