import { jsonResponse, errorResponse, nowIso } from '../_utils.js';
import {
  AI_COST_MULTIPLIER,
  AI_CREDITS_PER_USD,
  AI_MIN_REQUEST_BALANCE_MICROS,
  AI_REQUEST_RESERVE_MICROS,
  aiSystemPrompt,
  assertSameOrigin,
  changedRows,
  requireAiSession,
  sha256Hex
} from './_shared.js';
import { jokerGroundingForMessages } from './_joker-grounding.js';
import {
  contextForConversation,
  normalizeConversationId,
  persistConversationExchange
} from './_conversations.js';

const MAX_MESSAGE_CHARS = 2_000;
const MAX_OUTPUT_TOKENS = 700;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function cleanQuestion(body) {
  const question = String(body?.message || '').trim();
  if (!question || question.length > MAX_MESSAGE_CHARS) return null;
  return question;
}

export function exactCreditsNanosForCost(costUsd) {
  return Math.ceil(Number(costUsd) * AI_CREDITS_PER_USD * AI_COST_MULTIPLIER * 1_000_000_000);
}

export function billedCreditsMicrosForExact(exactCreditsNanos) {
  if (!Number.isFinite(exactCreditsNanos) || exactCreditsNanos <= 0) return 0;
  return Math.ceil(exactCreditsNanos / 100_000_000) * 100_000;
}

async function enforceRateLimit(env, session, request) {
  const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const counts = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS minute_count,
       COUNT(*) AS day_count
     FROM ai_request_attempts
     WHERE user_id = ? AND created_at > ?`
  ).bind(minuteAgo, session.user_id, dayAgo).first();
  if (Number(counts?.minute_count || 0) >= 8 || Number(counts?.day_count || 0) >= 80) {
    return errorResponse('AI request limit reached. Please wait before trying again.', 429);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = ip && env.AI_IP_HASH_SALT ? await sha256Hex(`${env.AI_IP_HASH_SALT}:${ip}`) : null;
  await env.DB.prepare(
    'INSERT INTO ai_request_attempts (user_id, created_at, ip_hash) VALUES (?, ?, ?)'
  ).bind(session.user_id, nowIso(), ipHash).run();
  return null;
}

async function reserveCredits(env, userId) {
  const wallet = await env.DB.prepare(
    'SELECT balance_micros, reserved_micros FROM ai_wallets WHERE user_id = ? LIMIT 1'
  ).bind(userId).first();
  const available = Number(wallet?.balance_micros || 0) - Number(wallet?.reserved_micros || 0);
  if (available < AI_MIN_REQUEST_BALANCE_MICROS) return 0;
  const reserveMicros = Math.min(AI_REQUEST_RESERVE_MICROS, available);
  const result = await env.DB.prepare(
    `UPDATE ai_wallets
     SET reserved_micros = reserved_micros + ?, updated_at = ?
     WHERE user_id = ? AND balance_micros - reserved_micros >= ?`
  ).bind(reserveMicros, nowIso(), userId, reserveMicros).run();
  return changedRows(result) > 0 ? reserveMicros : 0;
}

async function releaseCredits(env, userId, reserveMicros) {
  if (!reserveMicros) return;
  await env.DB.prepare(
    `UPDATE ai_wallets
     SET reserved_micros = MAX(0, reserved_micros - ?), updated_at = ?
     WHERE user_id = ?`
  ).bind(reserveMicros, nowIso(), userId).run();
}

async function lookup302Cost(apiKey, requestId) {
  for (const wait of [0, 250, 750]) {
    if (wait) await delay(wait);
    const response = await fetch(`https://api.302.ai/dashboard/record/${encodeURIComponent(requestId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      }
    }).catch(() => null);
    if (!response?.ok) continue;
    const payload = await response.json().catch(() => null);
    const cost = Number(payload?.data?.cost);
    if (Number.isFinite(cost) && cost >= 0) {
      return {
        cost,
        inputTokens: Number(payload?.data?.input_token || 0),
        outputTokens: Number(payload?.data?.output_token || 0),
        model: String(payload?.data?.model || '').trim() || null
      };
    }
  }
  return null;
}

async function settleCredits(env, userId, exactCreditsNanos, reserveMicros) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const wallet = await env.DB.prepare(
      `SELECT balance_micros, reserved_micros, exact_usage_nanos, billed_usage_micros
       FROM ai_wallets WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();
    if (!wallet) break;
    const previousExact = Number(wallet.exact_usage_nanos || 0);
    const previousBilled = Number(wallet.billed_usage_micros || 0);
    const nextExact = previousExact + exactCreditsNanos;
    const nextBilled = billedCreditsMicrosForExact(nextExact);
    const requiredDebit = Math.max(0, nextBilled - previousBilled);
    const debit = Math.min(requiredDebit, Number(wallet.balance_micros || 0));

    const result = await env.DB.prepare(
      `UPDATE ai_wallets
       SET balance_micros = balance_micros - ?,
           reserved_micros = MAX(0, reserved_micros - ?),
           exact_usage_nanos = ?,
           billed_usage_micros = ?,
           updated_at = ?
       WHERE user_id = ?
         AND exact_usage_nanos = ?
         AND billed_usage_micros = ?
         AND balance_micros >= ?`
    ).bind(
      debit,
      reserveMicros,
      nextExact,
      nextBilled,
      nowIso(),
      userId,
      previousExact,
      previousBilled,
      debit
    ).run();
    if (changedRows(result) > 0) {
      return {
        debitMicros: debit,
        balanceMicros: Number(wallet.balance_micros) - debit,
        partiallyWaived: debit < requiredDebit
      };
    }
  }
  await releaseCredits(env, userId, reserveMicros);
  return null;
}

async function updateLedger(env, userId, clientRequestId, fields) {
  await env.DB.prepare(
    `UPDATE ai_usage_ledger
     SET provider_request_id = ?, model = ?, input_tokens = ?, output_tokens = ?,
         cost_usd_nanos = ?, exact_credits_nanos = ?, billed_credits_micros = ?, status = ?
     WHERE user_id = ? AND client_request_id = ?`
  ).bind(
    fields.providerRequestId || null,
    fields.model,
    fields.inputTokens || 0,
    fields.outputTokens || 0,
    fields.costUsdNanos || 0,
    fields.exactCreditsNanos || 0,
    fields.billedCreditsMicros || 0,
    fields.status,
    userId,
    clientRequestId
  ).run();
}

async function saveConversationAnswer(env, details) {
  try {
    return await persistConversationExchange(env, details);
  } catch (error) {
    console.error('AI conversation persistence failed', error?.message || String(error));
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  if (!env.AI302_API_KEY) return errorResponse('AI service is not configured yet', 503);

  const body = await request.json().catch(() => null);
  const question = cleanQuestion(body);
  const clientRequestId = String(body?.clientRequestId || '').trim();
  if (!question) return errorResponse(`Message must be between 1 and ${MAX_MESSAGE_CHARS} characters`);
  if (!/^[0-9a-f-]{20,64}$/i.test(clientRequestId)) return errorResponse('Invalid request identifier');

  const rawConversationId = String(body?.conversationId || '').trim();
  const conversationId = rawConversationId ? normalizeConversationId(rawConversationId) : null;
  if (rawConversationId && !conversationId) return errorResponse('Invalid conversation identifier');
  let conversation = null;
  let history = [];
  if (conversationId) {
    const context = await contextForConversation(env, session.user_id, conversationId, question);
    if (!context.conversation) return errorResponse('Conversation not found', 404);
    conversation = context.conversation;
    history = context.messages;
  }
  const messages = [...history, { role: 'user', content: question }];

  const rateLimitResponse = await enforceRateLimit(env, session, request);
  if (rateLimitResponse) return rateLimitResponse;
  const model = String(env.AI302_MODEL || 'gpt-4o-mini').trim();
  try {
    await env.DB.prepare(
      `INSERT INTO ai_usage_ledger
        (user_id, client_request_id, provider_request_id, model, input_tokens, output_tokens,
         cost_usd_nanos, exact_credits_nanos, billed_credits_micros, status, created_at)
       VALUES (?, ?, NULL, ?, 0, 0, 0, 0, 0, 'pending', ?)`
    ).bind(session.user_id, clientRequestId, model, nowIso()).run();
  } catch {
    return errorResponse('This AI request has already been submitted', 409);
  }

  const reserveMicros = await reserveCredits(env, session.user_id);
  if (!reserveMicros) {
    await updateLedger(env, session.user_id, clientRequestId, { model, status: 'insufficient_balance' });
    return errorResponse('At least 0.1 Credit is required to ask a question', 402, { needsTopup: true });
  }

  let providerResponse;
  let payload;
  try {
    const jokerGrounding = jokerGroundingForMessages(messages);
    const systemMessages = [{ role: 'system', content: aiSystemPrompt() }];
    if (jokerGrounding) systemMessages.push({ role: 'system', content: jokerGrounding });
    providerResponse = await fetch('https://api.302.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI302_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        temperature: 0.25,
        max_tokens: MAX_OUTPUT_TOKENS
      }),
      signal: request.signal
    });
    payload = await providerResponse.json().catch(() => null);
  } catch (error) {
    await releaseCredits(env, session.user_id, reserveMicros);
    await updateLedger(env, session.user_id, clientRequestId, { model, status: 'provider_unavailable' });
    return errorResponse('AI service is temporarily unavailable', 502);
  }

  const providerRequestId = providerResponse.headers.get('request-id') || providerResponse.headers.get('x-request-id');
  const answer = String(payload?.choices?.[0]?.message?.content || '').trim();
  if (!providerResponse.ok || !answer) {
    await releaseCredits(env, session.user_id, reserveMicros);
    await updateLedger(env, session.user_id, clientRequestId, {
      providerRequestId,
      model,
      status: providerResponse.ok ? 'empty_response' : 'provider_error'
    });
    return errorResponse('The AI could not answer this question. No Credits were charged.', 502);
  }

  const costRecord = providerRequestId ? await lookup302Cost(env.AI302_API_KEY, providerRequestId) : null;
  if (!costRecord) {
    await releaseCredits(env, session.user_id, reserveMicros);
    await updateLedger(env, session.user_id, clientRequestId, {
      providerRequestId,
      model: String(payload?.model || model),
      inputTokens: Number(payload?.usage?.prompt_tokens || 0),
      outputTokens: Number(payload?.usage?.completion_tokens || 0),
      status: 'cost_unavailable'
    });
    const billing = {
      billedCredits: 0,
      exactCredits: 0,
      inputTokens: Number(payload?.usage?.prompt_tokens || 0),
      outputTokens: Number(payload?.usage?.completion_tokens || 0),
      model: String(payload?.model || model),
      status: 'unavailable',
      note: 'Billing details were unavailable, so this answer was not charged.'
    };
    const savedConversation = await saveConversationAnswer(env, {
      userId: session.user_id,
      conversationId: conversation?.id,
      conversationTitle: conversation?.title,
      question,
      answer,
      clientRequestId,
      providerRequestId,
      model: billing.model,
      inputTokens: billing.inputTokens,
      outputTokens: billing.outputTokens,
      billedCreditsMicros: 0,
      billingStatus: billing.status,
      createdAt: nowIso()
    });
    return jsonResponse({
      answer,
      billing,
      conversation: savedConversation,
      historySaved: Boolean(savedConversation)
    });
  }

  const costUsdNanos = Math.round(costRecord.cost * 1_000_000_000);
  const exactCreditsNanos = exactCreditsNanosForCost(costRecord.cost);
  const settlement = await settleCredits(env, session.user_id, exactCreditsNanos, reserveMicros);
  if (!settlement) {
    await updateLedger(env, session.user_id, clientRequestId, {
      providerRequestId,
      model: costRecord.model || model,
      inputTokens: costRecord.inputTokens,
      outputTokens: costRecord.outputTokens,
      costUsdNanos,
      exactCreditsNanos,
      status: 'settlement_failed'
    });
    const billing = {
      billedCredits: 0,
      exactCredits: exactCreditsNanos / 1_000_000_000,
      inputTokens: costRecord.inputTokens,
      outputTokens: costRecord.outputTokens,
      model: costRecord.model || model,
      status: 'waived',
      note: 'This answer was not charged because billing could not be completed.'
    };
    const savedConversation = await saveConversationAnswer(env, {
      userId: session.user_id,
      conversationId: conversation?.id,
      conversationTitle: conversation?.title,
      question,
      answer,
      clientRequestId,
      providerRequestId,
      model: billing.model,
      inputTokens: billing.inputTokens,
      outputTokens: billing.outputTokens,
      billedCreditsMicros: 0,
      billingStatus: billing.status,
      createdAt: nowIso()
    });
    return jsonResponse({
      answer,
      billing,
      conversation: savedConversation,
      historySaved: Boolean(savedConversation)
    });
  }

  await updateLedger(env, session.user_id, clientRequestId, {
    providerRequestId,
    model: costRecord.model || model,
    inputTokens: costRecord.inputTokens,
    outputTokens: costRecord.outputTokens,
    costUsdNanos,
    exactCreditsNanos,
    billedCreditsMicros: settlement.debitMicros,
    status: settlement.partiallyWaived ? 'partially_waived' : 'billed'
  });

  const billing = {
    billedCredits: settlement.debitMicros / 1_000_000,
    exactCredits: exactCreditsNanos / 1_000_000_000,
    inputTokens: costRecord.inputTokens,
    outputTokens: costRecord.outputTokens,
    model: costRecord.model || model,
    status: settlement.partiallyWaived ? 'partially_waived' : 'billed',
    note: settlement.partiallyWaived
      ? 'Your remaining balance was used. The unpaid remainder for this answer was waived.'
      : undefined
  };
  const savedConversation = await saveConversationAnswer(env, {
    userId: session.user_id,
    conversationId: conversation?.id,
    conversationTitle: conversation?.title,
    question,
    answer,
    clientRequestId,
    providerRequestId,
    model: billing.model,
    inputTokens: billing.inputTokens,
    outputTokens: billing.outputTokens,
    billedCreditsMicros: settlement.debitMicros,
    billingStatus: billing.status,
    createdAt: nowIso()
  });

  return jsonResponse({
    answer,
    balance: settlement.balanceMicros / 1_000_000,
    billing,
    conversation: savedConversation,
    historySaved: Boolean(savedConversation)
  });
}
