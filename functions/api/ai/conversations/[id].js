import { jsonResponse, errorResponse } from '../../_utils.js';
import { assertSameOrigin, requireAiSession } from '../_shared.js';
import { conversationSnapshot, normalizeConversationId, ownedConversation } from '../_conversations.js';

export async function onRequestGet({ request, env, params }) {
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const id = normalizeConversationId(params.id);
  if (!id) return errorResponse('Invalid conversation identifier');
  const conversation = await conversationSnapshot(env, session.user_id, id);
  if (!conversation) return errorResponse('Conversation not found', 404);
  const result = jsonResponse({ conversation });
  result.headers.set('Cache-Control', 'no-store');
  return result;
}

export async function onRequestDelete({ request, env, params }) {
  if (!assertSameOrigin(request)) return errorResponse('Invalid request origin', 403);
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const id = normalizeConversationId(params.id);
  if (!id) return errorResponse('Invalid conversation identifier');
  const conversation = await ownedConversation(env, session.user_id, id);
  if (!conversation) return errorResponse('Conversation not found', 404);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM ai_messages WHERE conversation_id = ? AND user_id = ?').bind(id, session.user_id),
    env.DB.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').bind(id, session.user_id)
  ]);
  return jsonResponse({ deleted: true, id });
}
