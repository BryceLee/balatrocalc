const ACTION = 'feedback';
const MAX_BODY_BYTES = 16 * 1024;
const WEBHOOK_URL = /^https:\/\/open\.(?:feishu\.cn|larksuite\.com)\/open-apis\/bot\/v2\/hook\/[a-z0-9_-]+$/i;

function reply(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

async function readSubmission(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

async function verify(token, secret, hostname) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
    redirect: 'error',
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok) throw new Error('Siteverify request failed');
  const result = await response.json();
  return result?.success === true && result.action === ACTION && result.hostname === hostname;
}

async function sendToFeishu(webhook, signingSecret, email, message) {
  const payload = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: 'BalatroCalc 网站反馈',
          content: [
            [{ tag: 'text', text: `邮箱：${email}` }],
            [{ tag: 'text', text: `反馈：\n${message}` }]
          ]
        }
      }
    }
  };

  if (signingSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(`${timestamp}\n${signingSecret}`),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new Uint8Array());
    payload.timestamp = timestamp;
    payload.sign = btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'error',
    signal: AbortSignal.timeout(6000)
  });
  const result = response.ok ? await response.json() : null;
  if (result?.code !== 0) {
    console.warn('Feedback webhook rejected', { status: response.status, code: Number.isInteger(result?.code) ? result.code : null });
    return false;
  }
  return true;
}

export async function onRequest({ request, env }) {
  const { method } = request;
  if (method !== 'GET' && method !== 'POST') {
    return reply({ error: 'method' }, 405, { Allow: 'GET, POST' });
  }

  const webhook = env.FEEDBACK_FEISHU_WEBHOOK_URL?.trim();
  const siteKey = env.FEEDBACK_TURNSTILE_SITE_KEY?.trim();
  const secret = env.FEEDBACK_TURNSTILE_SECRET?.trim();
  if (!siteKey || !secret || !WEBHOOK_URL.test(webhook || '')) {
    return reply({ error: 'unavailable' }, 503);
  }
  if (method === 'GET') return reply({ siteKey });

  const url = new URL(request.url);
  if (request.headers.get('Origin') !== url.origin) return reply({ error: 'origin' }, 403);
  const contentType = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return reply({ error: 'format' }, 415);
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) return reply({ error: 'invalid' }, 413);

  const body = await readSubmission(request);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const token = body?.token;
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !message || message.length > 2000) {
    return reply({ error: 'invalid' }, 400);
  }
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    return reply({ error: 'verification' }, 403);
  }

  try {
    if (!await verify(token, secret, url.hostname)) return reply({ error: 'verification' }, 403);
  } catch {
    return reply({ error: 'unavailable' }, 503);
  }

  try {
    if (await sendToFeishu(webhook, env.FEEDBACK_FEISHU_SIGNING_SECRET?.trim(), email, message)) {
      return reply({ ok: true });
    }
  } catch {
    console.warn('Feedback webhook request failed');
  }
  return reply({ error: 'delivery' }, 502);
}
