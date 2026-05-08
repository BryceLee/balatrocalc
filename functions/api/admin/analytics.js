import { jsonResponse, normalizeEmail } from '../_utils.js';

const FUNNEL_EVENTS = [
  'paywall_viewed',
  'plan_selected',
  'checkout_started',
  'payment_success',
  'payment_cancelled'
];

const DROPOFF_EVENTS = [
  'paywall_closed',
  'payment_cancelled',
  'checkout_create_failed',
  'subscription_check_failed'
];

function getRangeDays(url) {
  const days = Number(url.searchParams.get('days') || 30);
  return [7, 30, 90].includes(days) ? days : 30;
}

function sinceIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function parseProperties(value) {
  if (!value) return {};
  try {
    return JSON.parse(value) || {};
  } catch {
    return {};
  }
}

async function groupedCounts(env, events, since) {
  const placeholders = events.map(() => '?').join(', ');
  const { results } = await env.DB.prepare(
    `SELECT event_name, COUNT(*) AS total_events,
            COUNT(DISTINCT anonymous_id) AS unique_users
     FROM analytics_events
     WHERE created_at >= ? AND event_name IN (${placeholders})
     GROUP BY event_name`
  ).bind(since, ...events).all();

  const byEvent = Object.fromEntries(events.map((eventName) => [
    eventName,
    { eventName, totalEvents: 0, uniqueUsers: 0 }
  ]));

  for (const row of results || []) {
    byEvent[row.event_name] = {
      eventName: row.event_name,
      totalEvents: row.total_events || 0,
      uniqueUsers: row.unique_users || 0
    };
  }

  return Object.values(byEvent);
}

async function averagePaidSessionSeconds(env, since) {
  const { results } = await env.DB.prepare(
    `SELECT session_id,
            MAX(CAST(json_extract(properties_json, '$.elapsedMs') AS INTEGER)) AS elapsed_ms
     FROM analytics_events
     WHERE created_at >= ?
       AND subscription_status = 'paid'
       AND event_name = 'session_heartbeat'
       AND properties_json IS NOT NULL
     GROUP BY session_id`
  ).bind(since).all();

  const values = (results || [])
    .map((row) => Number(row.elapsed_ms || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) return 0;
  const averageMs = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(averageMs / 1000);
}

async function userTimeline(env, email, since) {
  if (!email) return [];
  const { results } = await env.DB.prepare(
    `SELECT event_name, subscription_status, properties_json, path, referrer, created_at
     FROM analytics_events
     WHERE email = ? AND created_at >= ?
     ORDER BY created_at DESC
     LIMIT 100`
  ).bind(email, since).all();

  return (results || []).map((row) => ({
    eventName: row.event_name,
    subscriptionStatus: row.subscription_status,
    properties: parseProperties(row.properties_json),
    path: row.path,
    referrer: row.referrer,
    createdAt: row.created_at
  }));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const days = getRangeDays(url);
  const since = sinceIso(days);
  const email = normalizeEmail(url.searchParams.get('email') || '');

  const overview = await env.DB.prepare(
    `SELECT COUNT(*) AS total_events,
            COUNT(DISTINCT anonymous_id) AS active_anonymous_users,
            COUNT(DISTINCT CASE
              WHEN subscription_status = 'paid' AND email IS NOT NULL AND email != '' THEN email
            END) AS active_paid_emails
     FROM analytics_events
     WHERE created_at >= ?`
  ).bind(since).first();

  const paidUsage = await env.DB.prepare(
    `SELECT email,
            MAX(created_at) AS last_seen_at,
            COUNT(*) AS total_events,
            SUM(CASE WHEN event_name = 'seed_analyze_allowed_paid' THEN 1 ELSE 0 END) AS paid_analyze_count,
            SUM(CASE WHEN event_name = 'seed_copied' THEN 1 ELSE 0 END) AS seed_copied_count
     FROM analytics_events
     WHERE created_at >= ?
       AND subscription_status = 'paid'
       AND email IS NOT NULL
       AND email != ''
     GROUP BY email
     ORDER BY last_seen_at DESC
     LIMIT 50`
  ).bind(since).all();

  return jsonResponse({
    ok: true,
    days,
    since,
    overview: {
      totalEvents: overview?.total_events || 0,
      activeAnonymousUsers: overview?.active_anonymous_users || 0,
      activePaidEmails: overview?.active_paid_emails || 0,
      averagePaidSessionSeconds: await averagePaidSessionSeconds(env, since)
    },
    funnel: await groupedCounts(env, FUNNEL_EVENTS, since),
    dropoffs: await groupedCounts(env, DROPOFF_EVENTS, since),
    paidUsage: (paidUsage.results || []).map((row) => ({
      email: row.email,
      lastSeenAt: row.last_seen_at,
      totalEvents: row.total_events || 0,
      paidAnalyzeCount: row.paid_analyze_count || 0,
      seedCopiedCount: row.seed_copied_count || 0
    })),
    timeline: await userTimeline(env, email, since)
  });
}
