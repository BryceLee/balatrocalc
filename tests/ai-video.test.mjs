import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const base = 'https://balatrocalc.test';
const email = 'admin@example.test';
let calls = [], transport;
const context = vm.createContext({ Response, Request, URL, Headers, TextEncoder, TextDecoder, Uint8Array, AbortSignal, crypto: globalThis.crypto, atob, btoa,
  fetch: async (...args) => { calls.push(args); return transport(...args); }
});
const modules = new Map();
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  const mod = new vm.SourceTextModule(readFileSync(path, 'utf8'), { context }); modules.set(path, mod);
  await mod.link(specifier => load(resolve(dirname(path), specifier)));
  await mod.evaluate(); return mod;
}
const middleware = (await load(resolve(root, 'functions/_middleware.js'))).namespace;
const shared = (await load(resolve(root, 'functions/api/admin/video/_shared.js'))).namespace;
const config = (await load(resolve(root, 'functions/api/admin/video/config.js'))).namespace;
const jobs = (await load(resolve(root, 'functions/api/admin/video/jobs.js'))).namespace;
const detail = (await load(resolve(root, 'functions/api/admin/video/jobs/[id].js'))).namespace;
const refresh = (await load(resolve(root, 'functions/api/admin/video/jobs/[id]/refresh.js'))).namespace;
const media = (await load(resolve(root, 'functions/api/admin/video/jobs/[id]/media.js'))).namespace;
const reconcile = (await load(resolve(root, 'functions/api/admin/video/jobs/[id]/reconcile.js'))).namespace;

function fixture() {
  calls = []; transport = () => { throw new Error('Unexpected network'); };
  const db = new DatabaseSync(':memory:'); db.exec(readFileSync(resolve(root, 'docs/ai-video-d1.sql'), 'utf8'));
  const DB = { prepare(sql) { return { bind(...args) { return {
    async first() { return db.prepare(sql).get(...args) || null; },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() { return { meta: { changes: db.prepare(sql).run(...args).changes } }; }
  }; }, async first() { return db.prepare(sql).get() || null; } }; } };
  const files = new Map();
  const bucket = {
    async put(key, bytes) { files.set(key, new Uint8Array(bytes)); },
    async head(key) { return files.has(key) ? { size: files.get(key).length } : null; },
    async get(key, options) { const bytes = files.get(key); if (!bytes) return null; const range = options?.range; return { body: range ? bytes.slice(range.offset, range.offset + range.length) : bytes }; },
    async delete(key) { files.delete(key); }
  };
  return { db, files, env: { DB, AI_VIDEO_BUCKET: bucket, AI_VIDEO_ENABLED: 'true', AI_VIDEO_302_API_KEY: 'test-key-only', ADMIN_ALLOWED_EMAILS: `${email},other@example.test`, ADMIN_PASS: 'test-password-only' } };
}
function jpeg(width = 600, height = 800) {
  const bytes = new Uint8Array(128); bytes.set([255,216,255,192,0,17,8,height>>8,height&255,width>>8,width&255,3,1,17,0,2,17,0,3,17,0]); bytes.set([255,217],126);
  return `data:image/jpeg;base64,${btoa(String.fromCharCode(...bytes))}`;
}
const payload = () => ({ photo: jpeg(), scene: 'dance', duration: 6, resolution: '480P', aspectRatio: '9:16', direction: '', consent: true, idempotencyKey: crypto.randomUUID() });
function request(path, method = 'GET', body, headers = {}) {
  return new Request(`${base}/api/admin/video/${path}`, { method,
    headers: { Authorization: `Basic ${btoa(`${email}:test-password-only`)}`, ...(method !== 'GET' ? { Origin: base, 'Content-Type': 'application/json', 'X-AI-Video': '1' } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function invoke(handler, env, req, params = {}) {
  const data = {};
  return middleware.onRequest({ request: req, env, data, next: () => handler({ request: req, env, data, params }) });
}
const create = async (f, body = payload()) => {
  const res = await invoke(jobs.onRequestPost, f.env, request('jobs', 'POST', body));
  return { res, body: await res.json() };
};
const queuedProvider = () => new Response(JSON.stringify({ output: { task_id: 'provider-task-1', task_status: 'PENDING' } }));

test('admin page and every API path require a permitted admin identity; no caching', async () => {
  const f = fixture();
  for (const path of ['/admin/ai-video/', '/admin/ai-video/studio.js', '/api/admin/video/config', '/api/admin/video/jobs/abc/media', '/%61dmin/ai-video/', '/%2561dmin/ai-video/', '/%61pi/admin/video/config', '/public%2f..%2fadmin/ai-video/']) {
    for (const auth of ['', `Basic ${btoa('visitor@example.test:test-password-only')}`, `Basic ${btoa(`${email}:wrong-password`)}`]) {
      const res = await middleware.onRequest({ request: new Request(base + path, { headers: { Authorization: auth } }), env: f.env, data: {}, next: () => { throw new Error('Access bypass'); } });
      assert.equal(res.status, 401); assert.match(res.headers.get('Cache-Control'), /no-store/);
    }
  }
  const res = await invoke(config.onRequestGet, f.env, request('config'));
  assert.equal((await res.json()).ready, true); assert.match(res.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal(calls.length, 0);
});
test('CSRF and direct handlers fail closed, missing setup never calls provider', async () => {
  const f = fixture();
  const direct = await jobs.onRequestPost({ request: request('jobs', 'POST', payload()), env: f.env, data: {} }); assert.equal(direct.status, 401);
  for (const headers of [{ Origin: 'https://evil.test' }, { 'X-AI-Video': '' }]) {
    assert.equal((await invoke(jobs.onRequestPost, f.env, request('jobs', 'POST', payload(), headers))).status, 403);
  }
  delete f.env.AI_VIDEO_302_API_KEY;
  assert.equal((await create(f)).res.status, 503);
  const res = await invoke(config.onRequestGet, f.env, request('config')); assert.equal((await res.json()).ready, false);
  assert.equal(calls.length, 0);
});
test('malformed image/settings/consent and oversized/chunked bodies fail before spending', async () => {
  const f = fixture();
  for (const change of [{ photo: 'data:image/jpeg;base64,aGVsbG8=' }, { photo: jpeg(30, 30) }, { duration: 60 }, { resolution: '1080P' }, { consent: false }, { direction: '<'.repeat(601) }]) {
    assert.equal((await create(f, { ...payload(), ...change })).res.status, 400);
  }
  const oversized = await invoke(jobs.onRequestPost, f.env, request('jobs', 'POST', { ...payload(), direction: 'a'.repeat(3 * 1024 * 1024) })); assert.equal(oversized.status, 413);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM ai_video_jobs').get().n, 0); assert.equal(calls.length, 0);
});
test('single-photo request, stored identity, persisted lock, idempotency and concurrent submit protection', async () => {
  const f = fixture(); const body = payload();
  transport = async (url, options) => {
    const stored = f.db.prepare('SELECT status FROM ai_video_jobs').get(); assert.equal(stored.status, 'submitting');
    assert.equal(options.redirect, 'manual');
    const input = JSON.parse(options.body);
    assert.equal(input.model, 'wan3.0-video'); assert.equal(input.input.media.length, 1); assert.equal(input.parameters.ratio, '9:16'); assert.equal(input.parameters.audio, true);
    return queuedProvider();
  };
  const { res, body: result } = await create(f, body); assert.equal(res.status, 202); assert.equal(result.job.status, 'queued');
  assert.equal(f.files.size, 1); assert.equal(f.db.prepare('SELECT owner FROM ai_video_jobs').get().owner, email);
  assert.equal((await create(f, body)).body.job.id, result.job.id); assert.equal(calls.length, 1);
  assert.equal((await create(f)).res.status, 409); assert.equal(calls.length, 1);
  assert.doesNotMatch(JSON.stringify(result), /test-key|provider-task|data:image/);
});
test('race between two new submissions creates exactly one paid request', async () => {
  const f = fixture(); transport = queuedProvider;
  const responses = await Promise.all([create(f), create(f)]);
  assert.deepEqual(responses.map(r => r.res.status).sort(), [202, 409]); assert.equal(calls.length, 1);
});
test('failed private upload never submits a paid job', async () => {
  const f = fixture(); f.env.AI_VIDEO_BUCKET.put = async () => { throw new Error('R2 failure'); };
  const { body } = await create(f); assert.equal(body.job.status, 'failed'); assert.equal(calls.length, 0);
});
test('reconciling stale preparation prevents its original request from later submitting', async () => {
  const f = fixture();
  f.env.AI_VIDEO_BUCKET.put = async () => {
    f.db.prepare("UPDATE ai_video_jobs SET status='failed',error='verified not created'").run();
  };
  const { body } = await create(f); assert.equal(body.job.status, 'failed'); assert.equal(calls.length, 0);
});
test('redirect, lost connection and invalid success stay uncertain and block another charge', async () => {
  for (const behavior of [() => new Response(null, { status: 302, headers: { Location: 'https://evil.test/' } }), () => { throw new Error('timeout'); }, () => new Response('{"output":{}}'), () => new Response('unreadable')]) {
    const f = fixture(); transport = behavior;
    const { body } = await create(f); assert.equal(body.job.status, 'uncertain');
    assert.equal((await create(f)).res.status, 409); assert.equal(calls.length, 1);
  }
});
test('explicit provider rejection is failed; provider 500 stays uncertain; raw errors stay private', async () => {
  for (const code of [400, 401, 402, 429, 500]) {
    const f = fixture(); transport = () => new Response(JSON.stringify({ message: 'SECRET PROMPT https://private.test', code: 'Failure' }), { status: code });
    const { body } = await create(f); assert.equal(body.job.status, code < 500 ? 'failed' : 'uncertain');
    assert.doesNotMatch(JSON.stringify(body), /SECRET|private\.test/);
  }
});
test('poll -> save private output -> full/Range/download, ownership and deletion', async () => {
  const f = fixture(); transport = queuedProvider;
  const { body } = await create(f); const id = body.job.id;
  const mp4 = new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0]);
  transport = url => url.includes('/tasks/')
    ? new Response(JSON.stringify({ output: { task_status: 'SUCCEEDED', video_url: 'https://file.302.ai/result.mp4' } }))
    : new Response(mp4, { headers: { 'Content-Type': 'video/mp4' } });
  const completed = await invoke(refresh.onRequestPost, f.env, request(`jobs/${id}/refresh`, 'POST'), { id });
  assert.equal((await completed.json()).job.status, 'completed'); assert.equal(f.files.size, 2);
  for (const [range, code, length] of [['', 200, 16], ['bytes=4-7', 206, 4], ['bytes=-4', 206, 4], ['bytes=100-', 416, 0], ['bytes=0-1,3-4', 416, 0]]) {
    const res = await invoke(media.onRequestGet, f.env, request(`jobs/${id}/media?download=1`, 'GET', undefined, range ? { Range: range } : {}), { id });
    assert.equal(res.status, code); assert.equal((await res.arrayBuffer()).byteLength, length);
    assert.match(res.headers.get('Cache-Control'), /no-store/);
    if (code !== 416) assert.match(res.headers.get('Content-Disposition'), /attachment/);
  }
  const forbidden = await invoke(media.onRequestGet, f.env, request(`jobs/${id}/media`, 'GET', undefined, { Authorization: `Basic ${btoa('other@example.test:test-password-only')}` }), { id }); assert.equal(forbidden.status, 404);
  const removed = await invoke(detail.onRequestDelete, f.env, request(`jobs/${id}`, 'DELETE'), { id }); assert.equal(removed.status, 200); assert.equal(f.files.size, 0);
  assert.equal((await invoke(detail.onRequestGet, f.env, request(`jobs/${id}`), { id })).status, 404);
});
test('untrusted output hosts / redirect / non-MP4 are never exposed or resubmitted', async () => {
  for (const mode of ['host', 'redirect', 'mime', 'bytes']) {
    const f = fixture(); transport = queuedProvider; const { body } = await create(f); const id = body.job.id;
    transport = url => url.includes('/tasks/')
      ? new Response(JSON.stringify({ output: { task_status: 'SUCCEEDED', video_url: mode === 'host' ? 'http://127.0.0.1/secret' : 'https://file.302.ai/result.mp4' } }))
      : mode === 'redirect' ? new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/' } }) : new Response('not mp4', { headers: { 'Content-Type': mode === 'mime' ? 'text/html' : 'video/mp4' } });
    const result = await invoke(refresh.onRequestPost, f.env, request(`jobs/${id}/refresh`, 'POST'), { id });
    const data = await result.json(); assert.notEqual(data.job.status, 'completed'); assert.equal(data.job.videoURL, null);
    assert.equal(calls.filter(([, options]) => options?.method === 'POST').length, 1);
  }
});
test('recover ambiguous task by querying existing ID, or explicitly confirming no task', async () => {
  const f = fixture(); transport = () => { throw new Error('connection'); };
  const { body } = await create(f); const id = body.job.id;
  assert.equal((await invoke(reconcile.onRequestPost, f.env, request(`jobs/${id}/reconcile`, 'POST', {}), { id })).status, 400);
  transport = () => new Response(JSON.stringify({ output: { task_status: 'RUNNING' } }));
  const attach = await invoke(reconcile.onRequestPost, f.env, request(`jobs/${id}/reconcile`, 'POST', { providerId: 'existing-123' }), { id });
  assert.equal((await attach.json()).job.status, 'queued');
  assert.equal(calls.filter(([, options]) => options?.method === 'POST').length, 1);
  const unconfirmed = fixture(); transport = () => { throw new Error('connection'); };
  const pending = await create(unconfirmed); const pendingId = pending.body.job.id;
  const released = await invoke(reconcile.onRequestPost, unconfirmed.env, request(`jobs/${pendingId}/reconcile`, 'POST', { confirmedNotCreated: true }), { id: pendingId });
  assert.equal((await released.json()).job.status, 'failed'); assert.equal(calls.length, 1);
});
test('daily cap is server enforced and disabled switch stops paid submission', async () => {
  const f = fixture(); transport = () => new Response('{}', { status: 400 });
  for (let n = 0; n < 5; n++) assert.equal((await create(f)).body.job.status, 'failed');
  assert.equal((await create(f)).res.status, 429); assert.equal(calls.length, 5);
  f.env.AI_VIDEO_ENABLED = 'false'; assert.equal((await create(f)).res.status, 503); assert.equal(calls.length, 5);
});
