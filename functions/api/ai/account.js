import { jsonResponse } from '../_utils.js';
import { getAccountSnapshot, requireAiSession } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const { session, response } = await requireAiSession(env, request);
  if (response) return response;
  const account = await getAccountSnapshot(env, session.user_id);
  const result = jsonResponse({
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture
    },
    account
  });
  result.headers.set('Cache-Control', 'no-store');
  return result;
}
