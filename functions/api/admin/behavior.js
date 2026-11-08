import { jsonResponse } from '../_utils.js';

// Sitewide behavior report built from analytics_events (written by bc-analytics.js).
// GET /api/admin/behavior?granularity=day|month|quarter|year

const GRANULARITY = {
  day: { periods: 30, sql: "substr(created_at, 1, 10)" },
  month: { periods: 12, sql: "substr(created_at, 1, 7)" },
  quarter: {
    periods: 8,
    sql: "substr(created_at, 1, 4) || '-Q' || ((CAST(substr(created_at, 6, 2) AS INTEGER) + 2) / 3)"
  },
  year: { periods: 3, sql: "substr(created_at, 1, 4)" }
};

const PAGE_EVENTS = ['page_view', 'page_engagement', 'session_heartbeat'];

export function rangeStart(granularity, now = new Date()) {
  const { periods } = GRANULARITY[granularity];
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  let start;
  if (granularity === 'day') start = Date.UTC(y, m, now.getUTCDate() - (periods - 1));
  else if (granularity === 'month') start = Date.UTC(y, m - (periods - 1), 1);
  else if (granularity === 'quarter') start = Date.UTC(y, Math.floor(m / 3) * 3 - (periods - 1) * 3, 1);
  else start = Date.UTC(y - (periods - 1), 0, 1);
  return new Date(start).toISOString();
}

const prop = (key) => `json_extract(properties_json, '$.${key}')`;

async function all(env, sql, ...args) {
  const { results } = await env.DB.prepare(sql).bind(...args).all();
  return results || [];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const granularity = GRANULARITY[url.searchParams.get('granularity')] ? url.searchParams.get('granularity') : 'day';
  const period = GRANULARITY[granularity].sql;
  const since = rangeStart(granularity);
  const notPage = `event_name NOT IN (${PAGE_EVENTS.map(() => '?').join(', ')})`;

  const [trend, summary, frequency, features, engagement, actions, actionsByFeature, sources, landing, countries, devices, languages, paidByFeature] = await Promise.all([
    // Users / sessions / views per period.
    all(env, `
      SELECT ${period} AS period,
             COUNT(DISTINCT anonymous_id) AS users,
             COUNT(DISTINCT session_id) AS sessions,
             SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS page_views,
             COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND ${prop('new_user')} = 1 THEN anonymous_id END) AS new_users,
             COUNT(DISTINCT CASE WHEN subscription_status = 'paid' THEN COALESCE(NULLIF(email, ''), anonymous_id) END) AS paid_users
      FROM analytics_events
      WHERE created_at >= ?
      GROUP BY period
      ORDER BY period`, since),

    // Totals for the whole range.
    env.DB.prepare(`
      SELECT COUNT(DISTINCT anonymous_id) AS users,
             COUNT(DISTINCT session_id) AS sessions,
             SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS page_views,
             COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND ${prop('new_user')} = 1 THEN anonymous_id END) AS new_users
      FROM analytics_events
      WHERE created_at >= ?`).bind(since).first(),

    // How many distinct days each visitor came back: the core loyalty signal.
    all(env, `
      SELECT CASE WHEN days = 1 THEN '1' WHEN days <= 3 THEN '2-3' WHEN days <= 7 THEN '4-7'
                  WHEN days <= 30 THEN '8-30' ELSE '31+' END AS bucket,
             COUNT(*) AS users
      FROM (SELECT anonymous_id, COUNT(DISTINCT substr(created_at, 1, 10)) AS days
            FROM analytics_events WHERE created_at >= ? GROUP BY anonymous_id)
      GROUP BY bucket`, since),

    // Per product area: reach and repeat usage.
    all(env, `
      SELECT feature_key AS feature,
             COUNT(*) AS users,
             SUM(views) AS page_views,
             SUM(CASE WHEN days >= 2 THEN 1 ELSE 0 END) AS repeat_users
      FROM (SELECT feature_key, anonymous_id, COUNT(*) AS views,
                   COUNT(DISTINCT substr(created_at, 1, 10)) AS days
            FROM analytics_events
            WHERE event_name = 'page_view' AND created_at >= ?
            GROUP BY feature_key, anonymous_id)
      GROUP BY feature_key
      ORDER BY users DESC`, since),

    // Time on page: engagement events are cumulative, so take the max per page view.
    all(env, `
      SELECT feature_key AS feature,
             COUNT(*) AS measured_views,
             ROUND(AVG(engaged_ms) / 1000.0, 1) AS avg_engaged_seconds,
             ROUND(AVG(scroll_pct), 0) AS avg_scroll_pct,
             SUM(CASE WHEN engaged_ms >= 60000 THEN 1 ELSE 0 END) AS views_over_1min
      FROM (SELECT feature_key, ${prop('pv')} AS pv,
                   MAX(CAST(${prop('engaged_ms')} AS INTEGER)) AS engaged_ms,
                   MAX(CAST(${prop('scroll_pct')} AS INTEGER)) AS scroll_pct
            FROM analytics_events
            WHERE event_name = 'page_engagement' AND created_at >= ?
            GROUP BY feature_key, pv)
      GROUP BY feature_key`, since),

    // Every action (non page) event.
    all(env, `
      SELECT event_name, COUNT(*) AS total_events, COUNT(DISTINCT anonymous_id) AS unique_users
      FROM analytics_events
      WHERE created_at >= ? AND ${notPage}
      GROUP BY event_name
      ORDER BY unique_users DESC`, since, ...PAGE_EVENTS),

    all(env, `
      SELECT feature_key AS feature, event_name, COUNT(*) AS total_events, COUNT(DISTINCT anonymous_id) AS unique_users
      FROM analytics_events
      WHERE created_at >= ? AND ${notPage}
      GROUP BY feature_key, event_name
      ORDER BY unique_users DESC
      LIMIT 80`, since, ...PAGE_EVENTS),

    // Where sessions come from (first page view of a session only).
    all(env, `
      SELECT COALESCE(NULLIF(${prop('utm_source')}, ''), NULLIF(${prop('ref_host')}, ''), '(direct)') AS source,
             COUNT(*) AS sessions, COUNT(DISTINCT anonymous_id) AS users
      FROM analytics_events
      WHERE event_name = 'page_view' AND ${prop('entry')} = 1 AND created_at >= ?
      GROUP BY source ORDER BY sessions DESC LIMIT 25`, since),

    all(env, `
      SELECT path, COUNT(*) AS sessions, COUNT(DISTINCT anonymous_id) AS users
      FROM analytics_events
      WHERE event_name = 'page_view' AND ${prop('entry')} = 1 AND created_at >= ?
      GROUP BY path ORDER BY sessions DESC LIMIT 25`, since),

    all(env, `
      SELECT COALESCE(${prop('country')}, '??') AS country, COUNT(DISTINCT anonymous_id) AS users
      FROM analytics_events
      WHERE event_name = 'page_view' AND created_at >= ?
      GROUP BY country ORDER BY users DESC LIMIT 25`, since),

    all(env, `
      SELECT COALESCE(${prop('device')}, 'unknown') AS device, COUNT(DISTINCT anonymous_id) AS users
      FROM analytics_events
      WHERE event_name = 'page_view' AND created_at >= ?
      GROUP BY device ORDER BY users DESC`, since),

    all(env, `
      SELECT COALESCE(${prop('lang')}, 'en') AS lang, COUNT(DISTINCT anonymous_id) AS users
      FROM analytics_events
      WHERE event_name = 'page_view' AND created_at >= ?
      GROUP BY lang ORDER BY users DESC LIMIT 35`, since),

    // Which areas paying users actually spend time in.
    all(env, `
      SELECT feature_key AS feature, COUNT(DISTINCT COALESCE(NULLIF(email, ''), anonymous_id)) AS paid_users, COUNT(*) AS page_views
      FROM analytics_events
      WHERE event_name = 'page_view' AND subscription_status = 'paid' AND created_at >= ?
      GROUP BY feature_key ORDER BY paid_users DESC`, since)
  ]);

  const engagementByFeature = Object.fromEntries(engagement.map((row) => [row.feature, row]));
  const order = ['1', '2-3', '4-7', '8-30', '31+'];

  return jsonResponse({
    ok: true,
    granularity,
    since,
    timezone: 'UTC',
    summary: {
      users: summary?.users || 0,
      sessions: summary?.sessions || 0,
      pageViews: summary?.page_views || 0,
      newUsers: summary?.new_users || 0,
      returningUsers: frequency.filter((row) => row.bucket !== '1').reduce((sum, row) => sum + row.users, 0)
    },
    trend,
    frequency: order.map((bucket) => ({ bucket, users: frequency.find((row) => row.bucket === bucket)?.users || 0 })),
    features: features.map((row) => {
      const eng = engagementByFeature[row.feature] || {};
      return {
        feature: row.feature,
        users: row.users,
        pageViews: row.page_views,
        repeatUsers: row.repeat_users,
        repeatRate: row.users ? Math.round((row.repeat_users / row.users) * 100) : 0,
        avgEngagedSeconds: eng.avg_engaged_seconds || 0,
        avgScrollPct: eng.avg_scroll_pct || 0,
        viewsOver1Min: eng.views_over_1min || 0
      };
    }),
    actions,
    actionsByFeature,
    sources,
    landing,
    countries,
    devices,
    languages,
    paidByFeature
  });
}
