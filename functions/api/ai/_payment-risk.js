import { nowIso } from '../_utils.js';

function amountCents(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function disputeCaptureId(resource) {
  for (const transaction of resource?.disputed_transactions || []) {
    const id = String(transaction?.seller_transaction_id || '').trim();
    if (id) return id;
  }
  return null;
}

export function classifyAiPaymentEvent(event) {
  const eventType = String(event?.event_type || '');
  const resource = event?.resource || {};
  const eventId = String(event?.id || '').trim();
  if (!eventId) return null;

  if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
    return {
      action: 'debit',
      eventId,
      kind: 'refund',
      caseId: String(resource.id || eventId),
      captureId: String(resource?.supplementary_data?.related_ids?.capture_id || resource.capture_id || '').trim(),
      amountCents: amountCents(resource?.amount?.value),
      fullReversal: false
    };
  }

  if (eventType === 'PAYMENT.CAPTURE.REVERSED') {
    return {
      action: 'debit',
      eventId,
      kind: 'reversal',
      caseId: String(resource.id || eventId),
      captureId: String(resource.id || resource.capture_id || '').trim(),
      amountCents: amountCents(resource?.amount?.value),
      fullReversal: true
    };
  }

  if (eventType === 'CUSTOMER.DISPUTE.CREATED') {
    return {
      action: 'debit',
      eventId,
      kind: 'dispute_hold',
      caseId: String(resource.dispute_id || resource.id || eventId),
      captureId: disputeCaptureId(resource),
      amountCents: amountCents(resource?.dispute_amount?.value),
      fullReversal: true
    };
  }

  if (eventType === 'CUSTOMER.DISPUTE.RESOLVED') {
    const outcome = String(resource?.dispute_outcome?.outcome_code || '');
    if (!outcome.includes('SELLER_FAVOR')) return { action: 'record_only', eventId };
    return {
      action: 'restore',
      eventId,
      kind: 'dispute_release',
      caseId: String(resource.dispute_id || resource.id || eventId),
      captureId: disputeCaptureId(resource)
    };
  }

  return null;
}

async function applyAdjustment(env, details, topup, creditsDeltaMicros, createdAt) {
  if (!creditsDeltaMicros) return false;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO ai_payment_adjustments
        (event_id, provider_case_id, user_id, capture_id, kind, amount_cents,
         credits_delta_micros, created_at, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`
    ).bind(
      details.eventId,
      details.caseId || null,
      topup.user_id,
      topup.capture_id,
      details.kind,
      details.amountCents,
      creditsDeltaMicros,
      createdAt
    ),
    env.DB.prepare(
      `UPDATE ai_wallets
       SET balance_micros = balance_micros + ?, updated_at = ?
       WHERE user_id = ?
         AND EXISTS (
           SELECT 1 FROM ai_payment_adjustments
           WHERE event_id = ? AND applied_at IS NULL
         )`
    ).bind(creditsDeltaMicros, createdAt, topup.user_id, details.eventId),
    env.DB.prepare(
      `UPDATE ai_payment_adjustments SET applied_at = ?
       WHERE event_id = ? AND applied_at IS NULL`
    ).bind(createdAt, details.eventId)
  ]);
  return true;
}

export async function handleAiPaymentRiskEvent(env, event, createdAt = nowIso()) {
  const details = classifyAiPaymentEvent(event);
  if (!details) return false;
  if (details.action === 'record_only') return true;

  const duplicate = await env.DB.prepare(
    'SELECT event_id FROM ai_payment_adjustments WHERE event_id = ? LIMIT 1'
  ).bind(details.eventId).first();
  if (duplicate) return true;

  if (details.action === 'restore') {
    const held = await env.DB.prepare(
      `SELECT a.user_id, a.capture_id,
              SUM(a.credits_delta_micros) AS net_delta_micros
       FROM ai_payment_adjustments a
       WHERE a.provider_case_id = ? AND a.applied_at IS NOT NULL
       GROUP BY a.user_id, a.capture_id
       LIMIT 1`
    ).bind(details.caseId).first();
    const restoreMicros = Math.max(0, -Number(held?.net_delta_micros || 0));
    if (!held || !restoreMicros) return true;
    return applyAdjustment(env, details, held, restoreMicros, createdAt);
  }

  if (!details.captureId) return true;
  const topup = await env.DB.prepare(
    `SELECT user_id, capture_id, credits_micros, gross_amount_cents
     FROM ai_topups WHERE capture_id = ? LIMIT 1`
  ).bind(details.captureId).first();
  if (!topup) return true;

  const adjustmentTotal = await env.DB.prepare(
    `SELECT COALESCE(SUM(credits_delta_micros), 0) AS net_delta_micros
     FROM ai_payment_adjustments WHERE capture_id = ? AND applied_at IS NOT NULL`
  ).bind(topup.capture_id).first();
  const currentlyReversed = Math.max(0, -Number(adjustmentTotal?.net_delta_micros || 0));
  const maximumCredits = Number(topup.credits_micros || 0);
  const targetReversed = details.fullReversal
    ? maximumCredits
    : Math.min(
        maximumCredits,
        Math.ceil(maximumCredits * Number(details.amountCents || 0) / Number(topup.gross_amount_cents || 1))
      );
  const additionalDebit = Math.max(0, targetReversed - currentlyReversed);
  return applyAdjustment(env, details, topup, -additionalDebit, createdAt);
}
