import { jsonResponse } from '../_utils.js';
import { requireAiSession } from './_shared.js';
import { listConversations } from './_conversations.js';

export async function onRequestGet({ request, env }) {
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const result = jsonResponse({ conversations: await listConversations(env, session.user_id) });
  result.headers.set('Cache-Control', 'no-store');
  return result;
}
