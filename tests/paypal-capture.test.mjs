import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const captureSource = readFileSync(new URL('../functions/api/paypal/capture.js', import.meta.url), 'utf8');

const defaultOrder = {
  email: 'buyer@example.com',
  plan: 'seed-lifetime',
  feature_key: 'seed',
  checkout_source: 'seed_analyzer_paywall',
  checkout_source_meta: null,
  payer_email: null,
  payer_name: null,
  payer_id: null,
};

function makeDatabase(order = defaultOrder, existingPayment = null) {
  const state = { inserts: [], updates: [] };
  return {
    state,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes('FROM orders')) return order;
              if (sql.includes('FROM memberships')) return existingPayment;
              return null;
            },
            async run() {
              if (sql.startsWith('UPDATE orders')) state.updates.push(args);
              if (sql.includes('INSERT OR IGNORE INTO memberships')) state.inserts.push(args);
              return { success: true };
            },
          };
        },
      };
    },
  };
}

async function loadCaptureHandler(paypalPayload, { status = 200, database } = {}) {
  const db = database || makeDatabase();
  const fetchCalls = [];
  const context = vm.createContext({
    Response,
    fetch: async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(JSON.stringify(paypalPayload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const utils = new vm.SyntheticModule([
    'jsonResponse',
    'errorResponse',
    'normalizeEmail',
    'planConfig',
    'getPaypalAccessToken',
    'paypalApiBase',
    'nowIso',
    'extractPaypalPayerProfile',
  ], function initialize() {
    const jsonResponse = (data, responseStatus = 200) => new Response(JSON.stringify(data), {
      status: responseStatus,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setExport('jsonResponse', jsonResponse);
    this.setExport('errorResponse', (message, responseStatus = 400, extra = {}) => (
      jsonResponse({ error: message, ...extra }, responseStatus)
    ));
    this.setExport('normalizeEmail', (value) => String(value || '').trim().toLowerCase());
    this.setExport('planConfig', (plan) => plan === 'seed-lifetime'
      ? { feature: 'seed', period: 'lifetime', amount: 100, days: null }
      : null);
    this.setExport('getPaypalAccessToken', async () => 'access-token');
    this.setExport('paypalApiBase', () => 'https://api-m.sandbox.paypal.com');
    this.setExport('nowIso', () => '2026-07-17T00:00:00.000Z');
    this.setExport('extractPaypalPayerProfile', (payload) => ({
      payerEmail: payload?.payer?.email_address || null,
      payerName: null,
      payerId: payload?.payer?.payer_id || null,
    }));
  }, { context });

  const captureModule = new vm.SourceTextModule(captureSource, { context });
  await captureModule.link((specifier) => {
    assert.equal(specifier, '../_utils.js');
    return utils;
  });
  await captureModule.evaluate();

  return {
    handler: captureModule.namespace.onRequestPost,
    db,
    fetchCalls,
  };
}

function paypalOrder(capture) {
  return {
    id: 'ORDER-1',
    status: 'COMPLETED',
    payer: {
      email_address: 'payer@example.com',
      payer_id: 'PAYER-1',
    },
    purchase_units: [{
      custom_id: 'buyer@example.com',
      payments: { captures: [capture] },
    }],
  };
}

async function runHandler(paypalPayload) {
  const loaded = await loadCaptureHandler(paypalPayload);
  const response = await loaded.handler({
    request: { json: async () => ({ orderId: 'ORDER-1' }) },
    env: { DB: loaded.db },
  });
  return { ...loaded, response, body: await response.json() };
}

const pending = await runHandler(paypalOrder({
  id: 'CAPTURE-PENDING',
  status: 'PENDING',
  amount: { currency_code: 'USD', value: '100.00' },
}));
assert.equal(pending.response.status, 200);
assert.equal(pending.body.active, false);
assert.equal(pending.body.status, 'PENDING');
assert.equal(pending.db.state.inserts.length, 0);
assert.equal(pending.db.state.updates[0][0], 'PENDING');

const mismatch = await runHandler(paypalOrder({
  id: 'CAPTURE-WRONG-AMOUNT',
  status: 'COMPLETED',
  amount: { currency_code: 'USD', value: '99.00' },
}));
assert.equal(mismatch.response.status, 409);
assert.equal(mismatch.db.state.inserts.length, 0);

const missingOrderIdentityPayload = paypalOrder({
  id: 'CAPTURE-MISSING-IDENTITY',
  status: 'COMPLETED',
  amount: { currency_code: 'USD', value: '100.00' },
});
delete missingOrderIdentityPayload.purchase_units[0].custom_id;
const missingOrderIdentity = await runHandler(missingOrderIdentityPayload);
assert.equal(missingOrderIdentity.response.status, 409);
assert.equal(missingOrderIdentity.db.state.inserts.length, 0);

const completed = await runHandler(paypalOrder({
  id: 'CAPTURE-COMPLETED',
  status: 'COMPLETED',
  create_time: '2026-07-17T01:00:00.000Z',
  amount: { currency_code: 'USD', value: '100.00' },
}));
assert.equal(completed.response.status, 200);
assert.equal(completed.body.active, true);
assert.equal(completed.db.state.inserts.length, 1);
assert.equal(completed.fetchCalls[0].options.headers.Prefer, 'return=representation');
assert.equal(completed.fetchCalls[0].options.headers['PayPal-Request-Id'], 'capture-ORDER-1');

console.log('PayPal capture validation tests passed');
