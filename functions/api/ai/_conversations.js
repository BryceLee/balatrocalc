const CONVERSATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE_CHARS = 72;
const MAX_CONTEXT_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 12_000;

function creditsFromMicros(value) {
  return Math.round(Number(value || 0)) / 1_000_000;
}

export function normalizeConversationId(value) {
  const id = String(value || '').trim();
  return CONVERSATION_ID_PATTERN.test(id) ? id.toLowerCase() : null;
}

export function conversationTitleForQuestion(question) {
  const title = String(question || '').replace(/\s+/g, ' ').trim();
  if (!title) return 'Untitled table';
  return title.length > MAX_TITLE_CHARS ? `${title.slice(0, MAX_TITLE_CHARS - 1).trimEnd()}…` : title;
}

export function trimMessagesForContext(rows, question = '') {
  const accepted = [];
  let totalChars = String(question || '').length;
  for (const row of [...(rows || [])].reverse()) {
    const content = String(row?.content || '').trim();
    const role = row?.role === 'assistant' ? 'assistant' : row?.role === 'user' ? 'user' : null;
    if (!role || !content || totalChars + content.length > MAX_CONTEXT_CHARS) continue;
    accepted.push({ role, content });
    totalChars += content.length;
    if (accepted.length >= MAX_CONTEXT_MESSAGES) break;
  }
  return accepted.reverse();
}

export async function ownedConversation(env, userId, conversationId) {
  const id = normalizeConversationId(conversationId);
  if (!id) return null;
  return env.DB.prepare(
    `SELECT id, title, created_at, updated_at, last_message_at
     FROM ai_conversations WHERE id = ? AND user_id = ? LIMIT 1`
  ).bind(id, userId).first();
}

export async function contextForConversation(env, userId, conversationId, question) {
  const conversation = await ownedConversation(env, userId, conversationId);
  if (!conversation) return { conversation: null, messages: [] };
  const rows = await env.DB.prepare(
    `SELECT role, content FROM (
       SELECT id, role, content FROM ai_messages
       WHERE conversation_id = ? AND user_id = ?
       ORDER BY id DESC LIMIT ?
     ) ORDER BY id ASC`
  ).bind(conversation.id, userId, MAX_CONTEXT_MESSAGES).all();
  return {
    conversation,
    messages: trimMessagesForContext(rows?.results || [], question)
  };
}

export async function persistConversationExchange(env, details) {
  const now = details.createdAt;
  const conversationId = normalizeConversationId(details.conversationId) || crypto.randomUUID();
  const title = conversationTitleForQuestion(details.question);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO ai_conversations
        (id, user_id, title, created_at, updated_at, last_message_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(conversationId, details.userId, title, now, now, now),
    env.DB.prepare(
      `INSERT OR IGNORE INTO ai_messages
        (conversation_id, user_id, role, content, client_request_id, provider_request_id,
         model, input_tokens, output_tokens, billed_credits_micros, billing_status, created_at)
       VALUES (?, ?, 'user', ?, ?, NULL, NULL, 0, 0, 0, NULL, ?)`
    ).bind(conversationId, details.userId, details.question, details.clientRequestId, now),
    env.DB.prepare(
      `INSERT OR IGNORE INTO ai_messages
        (conversation_id, user_id, role, content, client_request_id, provider_request_id,
         model, input_tokens, output_tokens, billed_credits_micros, billing_status, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      conversationId,
      details.userId,
      details.answer,
      details.clientRequestId,
      details.providerRequestId || null,
      details.model || null,
      details.inputTokens || 0,
      details.outputTokens || 0,
      details.billedCreditsMicros || 0,
      details.billingStatus || null,
      now
    ),
    env.DB.prepare(
      `UPDATE ai_conversations SET updated_at = ?, last_message_at = ?
       WHERE id = ? AND user_id = ?`
    ).bind(now, now, conversationId, details.userId)
  ]);
  return { id: conversationId, title: details.conversationTitle || title, updatedAt: now };
}

export async function listConversations(env, userId) {
  const result = await env.DB.prepare(
    `SELECT c.id, c.title, c.created_at, c.updated_at, c.last_message_at,
            COUNT(m.id) AS message_count
     FROM ai_conversations c
     LEFT JOIN ai_messages m ON m.conversation_id = c.id AND m.user_id = c.user_id
     WHERE c.user_id = ?
     GROUP BY c.id
     ORDER BY c.updated_at DESC
     LIMIT 100`
  ).bind(userId).all();
  return (result?.results || []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    messageCount: Number(entry.message_count || 0),
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    lastMessageAt: entry.last_message_at
  }));
}

export async function conversationSnapshot(env, userId, conversationId) {
  const conversation = await ownedConversation(env, userId, conversationId);
  if (!conversation) return null;
  const result = await env.DB.prepare(
    `SELECT role, content, input_tokens, output_tokens, billed_credits_micros,
            billing_status, created_at
     FROM ai_messages
     WHERE conversation_id = ? AND user_id = ?
     ORDER BY id ASC LIMIT 200`
  ).bind(conversation.id, userId).all();
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: (result?.results || []).map((entry) => ({
      role: entry.role,
      content: entry.content,
      createdAt: entry.created_at,
      billing: entry.role === 'assistant' ? {
        status: entry.billing_status || 'saved',
        billedCredits: creditsFromMicros(entry.billed_credits_micros),
        inputTokens: Number(entry.input_tokens || 0),
        outputTokens: Number(entry.output_tokens || 0),
        note: entry.billing_status === 'billed' ? undefined : 'No Credits charged'
      } : null
    }))
  };
}
