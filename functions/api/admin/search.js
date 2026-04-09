import { jsonResponse, errorResponse, normalizeEmail } from '../_utils.js';

async function queryAll(env, sql, email) {
  const { results } = await env.DB.prepare(sql).bind(email, email).all();
  return results || [];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  if (!emailParam) {
    return errorResponse('Missing email');
  }

  const email = normalizeEmail(emailParam);

  const memberships = await queryAll(
    env,
    `SELECT id, email, payer_email, payer_name, payer_id, feature_key, plan, amount, currency, provider, txn_id,
            status, created_at, expires_at, checkout_source, checkout_source_meta
     FROM memberships
     WHERE email = ? OR payer_email = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    email
  );

  const subscriptions = await queryAll(
    env,
    `SELECT id, email, payer_email, payer_name, payer_id, feature_key, plan, provider, subscription_id,
            status, created_at, updated_at, last_payment_at, next_billing_at, checkout_source, checkout_source_meta
     FROM subscriptions
     WHERE email = ? OR payer_email = ?
     ORDER BY updated_at DESC
     LIMIT 20`,
    email
  );

  const orders = await queryAll(
    env,
    `SELECT id, email, payer_email, payer_name, payer_id, feature_key, order_id, plan, status,
            created_at, checkout_source, checkout_source_meta
     FROM orders
     WHERE email = ? OR payer_email = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    email
  );

  return jsonResponse({
    ok: true,
    results: {
      memberships,
      subscriptions,
      orders
    }
  });
}
