import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const context = vm.createContext({ Response, Request, URL, Headers, JSON, Date, Math, Promise, Object, String, Number, Array, Set });
const modules = new Map();
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  const mod = new vm.SourceTextModule(readFileSync(path, 'utf8'), { context });
  modules.set(path, mod);
  await mod.link((specifier) => load(resolve(dirname(path), specifier)));
  await mod.evaluate();
  return mod;
}
const events = (await load(resolve(root, 'functions/api/events.js'))).namespace;
const behavior = (await load(resolve(root, 'functions/api/admin/behavior.js'))).namespace;

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(resolve(root, 'docs/analytics-events-d1.sql'), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...next) => stmt(sql, next),
    async first() { return db.prepare(sql).get(...args) || null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() { db.prepare(sql).run(...args); return {}; }
  });
  const DB = {
    prepare: (sql) => stmt(sql),
    async batch(list) { for (const s of list) await s.run(); }
  };
  return { db, env: { DB } };
}

function post(env, body, ua = 'Mozilla/5.0 (Macintosh) Safari/605') {
  return events.onRequestPost({
    env,
    request: new Request('https://balatrocalc.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ua, 'CF-IPCountry': 'US' },
      body: JSON.stringify(body)
    })
  });
}

const ev = (eventName, anonymousId, path, properties = {}) => ({
  eventName, anonymousId, sessionId: `s-${anonymousId}`, path, properties
});

test('featureFromPath groups language variants into one product area', () => {
  assert.equal(events.featureFromPath('/'), 'calculator');
  assert.equal(events.featureFromPath('/cn/'), 'calculator');
  assert.equal(events.featureFromPath('/de/index.html'), 'calculator');
  assert.equal(events.featureFromPath('/balatro-save-editor'), 'save-editor');
  assert.equal(events.featureFromPath('/cn/balatro-seeds.html'), 'seeds');
  assert.equal(events.featureFromPath('/blog/balatro-deck/'), 'blog');
  assert.equal(events.featureFromPath('/pt-br/privacy-policy/'), 'info');
});

test('ingestion stores feature and country, rejects unknown events and bots', async () => {
  const { db, env } = fixture();
  let res = await post(env, { events: [ev('page_view', 'a', '/cn/balatro-save-editor.html', { new_user: true }), ev('evil_event', 'a', '/')] });
  assert.equal((await res.json()).inserted, 1);
  const row = db.prepare('SELECT feature_key, properties_json FROM analytics_events').get();
  assert.equal(row.feature_key, 'save-editor');
  assert.equal(JSON.parse(row.properties_json).country, 'US');

  res = await post(env, { events: [ev('page_view', 'b', '/')] }, 'Googlebot/2.1');
  assert.equal((await res.json()).inserted, 0);

  // Seed paywall events keep their explicit feature key.
  await post(env, { eventName: 'paywall_viewed', anonymousId: 'a', sessionId: 's', featureKey: 'seed', path: '/balatro-seed-analyzer' });
  assert.equal(db.prepare("SELECT feature_key FROM analytics_events WHERE event_name = 'paywall_viewed'").get().feature_key, 'seed');
});

test('behavior report aggregates users, repeat usage, engagement and actions', async () => {
  const { db, env } = fixture();
  const insert = db.prepare(`INSERT INTO analytics_events
    (anonymous_id, session_id, feature_key, subscription_status, event_name, properties_json, path, created_at)
    VALUES (?, ?, ?, 'free', ?, ?, ?, ?)`);
  const today = new Date();
  const day = (offset) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset, 12)).toISOString();

  insert.run('u1', 's1', 'save-editor', 'page_view', JSON.stringify({ new_user: true, entry: true, ref_host: 'google.com', pv: 'p1' }), '/balatro-save-editor', day(1));
  insert.run('u1', 's2', 'save-editor', 'page_view', JSON.stringify({ entry: true, pv: 'p2' }), '/balatro-save-editor', day(0));
  insert.run('u1', 's2', 'save-editor', 'page_engagement', JSON.stringify({ pv: 'p2', engaged_ms: 30000 }), '/balatro-save-editor', day(0));
  insert.run('u1', 's2', 'save-editor', 'page_engagement', JSON.stringify({ pv: 'p2', engaged_ms: 90000 }), '/balatro-save-editor', day(0));
  insert.run('u1', 's2', 'save-editor', 'save_downloaded', '{}', '/balatro-save-editor', day(0));
  insert.run('u2', 's3', 'calculator', 'page_view', JSON.stringify({ new_user: true, entry: true, pv: 'p3' }), '/', day(0));

  const res = await behavior.onRequestGet({ env, request: new Request('https://balatrocalc.test/api/admin/behavior?granularity=day') });
  const data = await res.json();
  assert.equal(data.summary.users, 2);
  assert.equal(data.summary.newUsers, 2);
  assert.equal(data.summary.returningUsers, 1);
  const save = data.features.find((row) => row.feature === 'save-editor');
  assert.equal(save.repeatUsers, 1);
  assert.equal(save.repeatRate, 100);
  assert.equal(save.avgEngagedSeconds, 90);
  assert.deepEqual(data.actions.map((row) => row.event_name), ['save_downloaded']);
  assert.equal(data.sources.find((row) => row.source === 'google.com').sessions, 1);
  assert.equal(data.trend.length, 2);

  for (const granularity of ['month', 'quarter', 'year']) {
    const r = await behavior.onRequestGet({ env, request: new Request(`https://balatrocalc.test/api/admin/behavior?granularity=${granularity}`) });
    assert.equal((await r.json()).summary.users, 2, granularity);
  }
});

test('rangeStart aligns to period boundaries', () => {
  const now = new Date('2026-11-07T10:00:00Z');
  assert.equal(behavior.rangeStart('day', now), '2026-10-09T00:00:00.000Z');
  assert.equal(behavior.rangeStart('month', now), '2025-12-01T00:00:00.000Z');
  assert.equal(behavior.rangeStart('quarter', now), '2025-01-01T00:00:00.000Z');
  assert.equal(behavior.rangeStart('year', now), '2024-01-01T00:00:00.000Z');
});
