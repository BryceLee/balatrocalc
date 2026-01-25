export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function errorResponse(message, status = 400, extra = {}) {
  return jsonResponse({ error: message, ...extra }, status);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function nowIso() {
  return new Date().toISOString();
}

export function addDaysIso(days) {
  const time = Date.now() + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString();
}

export function planConfig(plan) {
  switch (plan) {
    case 'monthly':
      return { amount: 5, days: 30, label: 'monthly' };
    case 'yearly':
      return { amount: 39, days: 365, label: 'yearly' };
    case 'lifetime':
      return { amount: 100, days: null, label: 'lifetime' };
    default:
      return null;
  }
}

export function paypalApiBase(env) {
  return env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export async function getPaypalAccessToken(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error('Missing PayPal credentials');
  }
  const auth = btoa(`${clientId}:${secret}`);
  const res = await fetch(`${paypalApiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error('PayPal auth failed');
  }
  return data.access_token;
}

export function getReturnUrls(request, plan) {
  const origin = new URL(request.url).origin;
  return {
    returnUrl: `${origin}/balatro-seed-analyzer.html?paypal=success&plan=${plan}`,
    cancelUrl: `${origin}/balatro-seed-analyzer.html?paypal=cancel&plan=${plan}`
  };
}

export async function verifyPaypalWebhook(request, env, body) {
  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const certUrl = request.headers.get('paypal-cert-url');
  const authAlgo = request.headers.get('paypal-auth-algo');
  const transmissionSig = request.headers.get('paypal-transmission-sig');
  const webhookId = env.PAYPAL_WEBHOOK_ID;

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
    return false;
  }

  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: body
    })
  });
  const data = await res.json();
  return res.ok && data.verification_status === 'SUCCESS';
}
