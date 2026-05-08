import { jsonResponse, errorResponse, normalizeEmail, nowIso } from './_utils.js';

const ALLOWED_EVENTS = new Set([
  'paid_session_started',
  'session_heartbeat',
  'seed_analyze_started',
  'seed_analyze_allowed_free',
  'seed_analyze_allowed_paid',
  'free_limit_reached',
  'paywall_viewed',
  'paywall_closed',
  'plan_selected',
  'checkout_started',
  'checkout_create_failed',
  'payment_cancelled',
  'payment_success',
  'subscription_check_started',
  'subscription_check_success',
  'subscription_check_failed',
  'premium_library_unlocked',
  'seed_copied',
  'seed_library_analyze_clicked'
]);

const SUBSCRIPTION_STATUSES = new Set(['free', 'paid', 'unknown']);

function trimField(value, maxLength) {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return SUBSCRIPTION_STATUSES.has(status) ? status : 'unknown';
}

function serializeProperties(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const safe = {};
  for (const [key, rawValue] of Object.entries(value).slice(0, 40)) {
    const safeKey = trimField(key, 80);
    if (!safeKey) continue;
    if (rawValue === null || rawValue === undefined) {
      safe[safeKey] = null;
    } else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      safe[safeKey] = rawValue;
    } else {
      safe[safeKey] = trimField(rawValue, 500);
    }
  }

  const json = JSON.stringify(safe);
  if (json.length <= 4000) {
    return json;
  }

  return JSON.stringify({
    truncated: true,
    keys: Object.keys(safe).slice(0, 40)
  });
}

function normalizeEvent(raw, request, createdAt) {
  const eventName = trimField(raw?.eventName || raw?.event_name || raw?.name, 80);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return null;
  }

  const anonymousId = trimField(raw?.anonymousId || raw?.anonymous_id, 120);
  const sessionId = trimField(raw?.sessionId || raw?.session_id, 120);
  if (!anonymousId || !sessionId) {
    return null;
  }

  const email = normalizeEmail(raw?.email || '');
  const userAgent = trimField(request.headers.get('user-agent'), 500);

  return {
    anonymousId,
    sessionId,
    email: email || null,
    featureKey: trimField(raw?.featureKey || raw?.feature_key || 'seed', 80) || 'seed',
    subscriptionStatus: normalizeStatus(raw?.subscriptionStatus || raw?.subscription_status),
    eventName,
    propertiesJson: serializeProperties(raw?.properties),
    path: trimField(raw?.path, 500),
    referrer: trimField(raw?.referrer, 500),
    userAgent,
    createdAt
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return errorResponse('Missing database binding', 500);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse('Invalid JSON');
  }

  const rawEvents = Array.isArray(body?.events) ? body.events : [body];
  const createdAt = nowIso();
  const events = rawEvents
    .slice(0, 20)
    .map((entry) => normalizeEvent(entry, request, createdAt))
    .filter(Boolean);

  if (!events.length) {
    return errorResponse('No valid events');
  }

  const statement = env.DB.prepare(
    `INSERT INTO analytics_events
      (anonymous_id, session_id, email, feature_key, subscription_status, event_name,
       properties_json, path, referrer, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  await env.DB.batch(events.map((event) => statement.bind(
    event.anonymousId,
    event.sessionId,
    event.email,
    event.featureKey,
    event.subscriptionStatus,
    event.eventName,
    event.propertiesJson,
    event.path,
    event.referrer,
    event.userAgent,
    event.createdAt
  )));

  return jsonResponse({ ok: true, inserted: events.length });
}
