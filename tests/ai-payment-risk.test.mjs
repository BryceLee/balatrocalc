import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../functions/api/ai/_payment-risk.js', import.meta.url), 'utf8');
const context = vm.createContext({ console });
const utils = new vm.SyntheticModule(['nowIso'], function initialize() {
  this.setExport('nowIso', () => '2026-08-17T00:00:00.000Z');
}, { context });
const module = new vm.SourceTextModule(source, { context });
await module.link((specifier) => {
  assert.equal(specifier, '../_utils.js');
  return utils;
});
await module.evaluate();

const refunded = module.namespace.classifyAiPaymentEvent({
  id: 'WH-REFUND-1',
  event_type: 'PAYMENT.CAPTURE.REFUNDED',
  resource: {
    id: 'REFUND-1',
    amount: { value: '1.75' },
    supplementary_data: { related_ids: { capture_id: 'CAPTURE-1' } }
  }
});
assert.equal(refunded.action, 'debit');
assert.equal(refunded.captureId, 'CAPTURE-1');
assert.equal(refunded.amountCents, 175);
assert.equal(refunded.fullReversal, false);

const dispute = module.namespace.classifyAiPaymentEvent({
  id: 'WH-DISPUTE-1',
  event_type: 'CUSTOMER.DISPUTE.CREATED',
  resource: {
    dispute_id: 'PP-D-1',
    disputed_transactions: [{ seller_transaction_id: 'CAPTURE-1' }],
    dispute_amount: { value: '3.50' }
  }
});
assert.equal(dispute.kind, 'dispute_hold');
assert.equal(dispute.captureId, 'CAPTURE-1');
assert.equal(dispute.fullReversal, true);

const sellerWin = module.namespace.classifyAiPaymentEvent({
  id: 'WH-RESOLVE-1',
  event_type: 'CUSTOMER.DISPUTE.RESOLVED',
  resource: {
    dispute_id: 'PP-D-1',
    dispute_outcome: { outcome_code: 'RESOLVED_SELLER_FAVOR' }
  }
});
assert.equal(sellerWin.action, 'restore');

function createDb() {
  const state = {
    wallet: 30_000_000,
    topup: { user_id: 7, capture_id: 'CAPTURE-1', credits_micros: 30_000_000, gross_amount_cents: 350 },
    adjustments: []
  };
  return {
    state,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            sql,
            args,
            async first() {
              if (sql.includes('WHERE event_id = ? LIMIT 1')) {
                return state.adjustments.find((entry) => entry.event_id === args[0]) || null;
              }
              if (sql.includes('FROM ai_topups WHERE capture_id')) {
                return args[0] === state.topup.capture_id ? state.topup : null;
              }
              if (sql.includes('COALESCE(SUM(credits_delta_micros)')) {
                return {
                  net_delta_micros: state.adjustments
                    .filter((entry) => entry.capture_id === args[0] && entry.applied_at)
                    .reduce((sum, entry) => sum + entry.credits_delta_micros, 0)
                };
              }
              if (sql.includes('SUM(a.credits_delta_micros)')) {
                const entries = state.adjustments.filter((entry) => entry.provider_case_id === args[0] && entry.applied_at);
                if (!entries.length) return null;
                return {
                  user_id: entries[0].user_id,
                  capture_id: entries[0].capture_id,
                  net_delta_micros: entries.reduce((sum, entry) => sum + entry.credits_delta_micros, 0)
                };
              }
              return null;
            }
          };
        }
      };
    },
    async batch(statements) {
      for (const statement of statements) {
        const { sql, args } = statement;
        if (sql.includes('INSERT OR IGNORE INTO ai_payment_adjustments')) {
          if (!state.adjustments.some((entry) => entry.event_id === args[0])) {
            state.adjustments.push({
              event_id: args[0], provider_case_id: args[1], user_id: args[2], capture_id: args[3],
              kind: args[4], amount_cents: args[5], credits_delta_micros: args[6], created_at: args[7], applied_at: null
            });
          }
        } else if (sql.includes('UPDATE ai_wallets')) {
          const pending = state.adjustments.find((entry) => entry.event_id === args[3] && !entry.applied_at);
          if (pending) state.wallet += args[0];
        } else if (sql.includes('UPDATE ai_payment_adjustments SET applied_at')) {
          const pending = state.adjustments.find((entry) => entry.event_id === args[1] && !entry.applied_at);
          if (pending) pending.applied_at = args[0];
        }
      }
    }
  };
}

const db = createDb();
const refundEvent = {
  id: 'WH-REFUND-1', event_type: 'PAYMENT.CAPTURE.REFUNDED',
  resource: {
    id: 'REFUND-1', amount: { value: '1.75' },
    supplementary_data: { related_ids: { capture_id: 'CAPTURE-1' } }
  }
};
assert.equal(await module.namespace.handleAiPaymentRiskEvent({ DB: db }, refundEvent), true);
assert.equal(db.state.wallet, 15_000_000);
assert.equal(db.state.adjustments[0].credits_delta_micros, -15_000_000);
assert.equal(await module.namespace.handleAiPaymentRiskEvent({ DB: db }, refundEvent), true);
assert.equal(db.state.wallet, 15_000_000, 'duplicate webhook must not debit twice');

console.log('AI PayPal refund and dispute risk tests passed');
