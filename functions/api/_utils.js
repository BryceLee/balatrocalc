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

const CHECKOUT_SOURCES = new Set([
  'seed_library_paywall',
  'seed_analyzer_paywall',
  'admin_manual',
  'unknown'
]);

export function nowIso() {
  return new Date().toISOString();
}

export function addDaysIso(days, from) {
  if (days === null || days === undefined) return null;
  let baseTime = Date.now();
  if (from) {
    const fromTime = typeof from === 'number' ? from : new Date(from).getTime();
    if (!Number.isNaN(fromTime)) {
      baseTime = fromTime;
    }
  }
  const time = baseTime + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString();
}

function toValidTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function maxIso(...values) {
  let best = null;
  let bestTime = null;
  for (const value of values) {
    const time = toValidTime(value);
    if (time === null) continue;
    if (bestTime === null || time > bestTime) {
      best = value;
      bestTime = time;
    }
  }
  return best;
}

export function planConfig(plan) {
  if (!plan) return null;
  const parts = String(plan).split('-');
  if (parts.length !== 2) return null;
  const [feature, period] = parts;
  const pricing = {
    seed: {
      monthly: { amount: 5, days: 30 },
      yearly: { amount: 49, days: 365 },
      lifetime: { amount: 100, days: null }
    }
  };
  const featurePricing = pricing[feature];
  if (!featurePricing || !featurePricing[period]) return null;
  const entry = featurePricing[period];
  return {
    feature,
    period,
    amount: entry.amount,
    days: entry.days,
    label: plan
  };
}

export function deriveSubscriptionAccessExpiresAt(plan, { nextBillingTime = null, lastPaymentTime = null } = {}) {
  const config = planConfig(plan);
  if (!config || config.days === null) return null;
  const paidThroughFromLastPayment = lastPaymentTime
    ? addDaysIso(config.days, lastPaymentTime)
    : null;
  return maxIso(nextBillingTime, paidThroughFromLastPayment);
}

export function normalizeCheckoutSource(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  return CHECKOUT_SOURCES.has(normalized) ? normalized : 'unknown';
}

export function serializeCheckoutSourceMeta(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let raw = null;
  if (typeof value === 'string') {
    raw = value.trim();
  } else {
    try {
      raw = JSON.stringify(value);
    } catch {
      raw = null;
    }
  }

  if (!raw) return null;
  return raw.length > 2000 ? raw.slice(0, 2000) : raw;
}

function inferCheckoutSourceFromPath(value) {
  if (!value || typeof value !== 'string') return 'unknown';

  try {
    const parsed = new URL(value, 'https://balatrocalc.local');
    const pathname = parsed.pathname.toLowerCase();
    if (pathname === '/balatro-seeds' || pathname.endsWith('/balatro-seeds.html')) {
      return 'seed_library_paywall';
    }
    if (pathname === '/balatro-seed-analyzer' || pathname.endsWith('/balatro-seed-analyzer.html')) {
      return 'seed_analyzer_paywall';
    }
  } catch {
    return 'unknown';
  }

  return 'unknown';
}

export function getCheckoutContext(body) {
  const inferredSource = inferCheckoutSourceFromPath(body?.returnPath);
  return {
    checkoutSource: normalizeCheckoutSource(body?.checkoutSource || body?.source || inferredSource),
    checkoutSourceMeta: serializeCheckoutSourceMeta(body?.checkoutSourceMeta ?? body?.sourceMeta ?? null)
  };
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

export async function getPaypalSubscriptionDetails(env, subscriptionId) {
  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalApiBase(env)}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'PayPal subscription lookup failed');
  }
  return data;
}

function normalizeReturnPath(value) {
  const fallback = '/balatro-seed-analyzer';
  if (!value || typeof value !== 'string') return fallback;

  try {
    const parsed = new URL(value, 'https://balatrocalc.local');
    if (parsed.origin !== 'https://balatrocalc.local') return fallback;
    if (!parsed.pathname.startsWith('/')) return fallback;
    if (parsed.pathname.startsWith('//')) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getReturnUrls(request, plan, returnPath) {
  const origin = new URL(request.url).origin;
  const safePath = normalizeReturnPath(returnPath);
  const buildUrl = (paypalState) => {
    const target = new URL(safePath, origin);
    target.searchParams.set('paypal', paypalState);
    target.searchParams.set('plan', plan);
    return target.toString();
  };

  return {
    returnUrl: buildUrl('success'),
    cancelUrl: buildUrl('cancel')
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
