import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../functions/api/ai/_conversations.js', import.meta.url), 'utf8');
const context = vm.createContext({ crypto: globalThis.crypto });
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('Unexpected conversation helper import'); });
await module.evaluate();

const validId = '019ff69e-67da-4ac2-a23f-cd2b0e147b63';
assert.equal(module.namespace.normalizeConversationId(validId.toUpperCase()), validId);
assert.equal(module.namespace.normalizeConversationId('not-a-conversation'), null);
assert.equal(module.namespace.conversationTitleForQuestion('  Blueprint   and Photograph?  '), 'Blueprint and Photograph?');
assert.equal(module.namespace.conversationTitleForQuestion('x'.repeat(100)).length, 72);

const rows = Array.from({ length: 14 }, (_, index) => ({
  role: index % 2 ? 'assistant' : 'user',
  content: `message-${index}`
}));
const trimmed = module.namespace.trimMessagesForContext(rows, 'new question');
assert.equal(trimmed.length, 10);
assert.equal(trimmed[0].content, 'message-4');
assert.equal(trimmed[9].content, 'message-13');

function statement(sql, args) {
  return { sql, args };
}
const db = {
  batches: [],
  prepare(sql) {
    return { bind: (...args) => statement(sql, args) };
  },
  async batch(statements) {
    this.batches.push(statements);
  }
};
const saved = await module.namespace.persistConversationExchange({ DB: db }, {
  userId: 7,
  question: 'How should I order Blueprint and Photograph?',
  answer: 'Place Blueprint immediately to the left of Photograph.',
  clientRequestId: '11111111-1111-4111-8111-111111111111',
  providerRequestId: 'provider-1',
  model: 'gpt-4o-mini',
  inputTokens: 100,
  outputTokens: 50,
  billedCreditsMicros: 100_000,
  billingStatus: 'billed',
  createdAt: '2026-08-19T00:00:00.000Z'
});
assert.match(saved.id, /^[0-9a-f-]{36}$/);
assert.equal(db.batches[0].length, 4);
assert.match(db.batches[0][1].sql, /'user'/);
assert.match(db.batches[0][2].sql, /'assistant'/);
assert.equal(db.batches[0][2].args[8], 100_000);

const dynamicRoute = readFileSync(new URL('../functions/api/ai/conversations/[id].js', import.meta.url), 'utf8');
assert.match(dynamicRoute, /onRequestGet/);
assert.match(dynamicRoute, /onRequestDelete/);
assert.match(dynamicRoute, /DELETE FROM ai_messages/);
assert.match(dynamicRoute, /DELETE FROM ai_conversations/);

console.log('AI saved conversation tests passed');
