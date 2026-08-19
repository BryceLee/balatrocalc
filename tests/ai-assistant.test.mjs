import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sharedSource = readFileSync(new URL('../functions/api/ai/_shared.js', import.meta.url), 'utf8');
const chatSource = readFileSync(new URL('../functions/api/ai/chat.js', import.meta.url), 'utf8');
const jokerKnowledgeSource = readFileSync(new URL('../functions/api/ai/_joker-knowledge.generated.js', import.meta.url), 'utf8');
const jokerGroundingSource = readFileSync(new URL('../functions/api/ai/_joker-grounding.js', import.meta.url), 'utf8');
const conversationsSource = readFileSync(new URL('../functions/api/ai/_conversations.js', import.meta.url), 'utf8');

const context = vm.createContext({
  Response,
  URL,
  TextEncoder,
  TextDecoder,
  crypto: globalThis.crypto,
  atob,
  btoa,
  fetch: async () => { throw new Error('Unexpected network request'); },
  setTimeout,
  console
});

const utils = new vm.SyntheticModule([
  'jsonResponse',
  'errorResponse',
  'normalizeEmail',
  'nowIso'
], function initialize() {
  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
  this.setExport('jsonResponse', jsonResponse);
  this.setExport('errorResponse', (message, status = 400, extra = {}) => jsonResponse({ error: message, ...extra }, status));
  this.setExport('normalizeEmail', (value) => String(value || '').trim().toLowerCase());
  this.setExport('nowIso', () => '2026-08-15T00:00:00.000Z');
}, { context });

const shared = new vm.SourceTextModule(sharedSource, { context });
await shared.link((specifier) => {
  assert.equal(specifier, '../_utils.js');
  return utils;
});
await shared.evaluate();

const jokerKnowledge = new vm.SourceTextModule(jokerKnowledgeSource, { context });
await jokerKnowledge.link(() => { throw new Error('Unexpected generated knowledge import'); });
await jokerKnowledge.evaluate();

const jokerGrounding = new vm.SourceTextModule(jokerGroundingSource, { context });
await jokerGrounding.link((specifier) => {
  assert.equal(specifier, './_joker-knowledge.generated.js');
  return jokerKnowledge;
});
await jokerGrounding.evaluate();

const conversations = new vm.SourceTextModule(conversationsSource, { context });
await conversations.link(() => { throw new Error('Unexpected conversations import'); });
await conversations.evaluate();

const chat = new vm.SourceTextModule(chatSource, { context });
await chat.link((specifier) => {
  if (specifier === '../_utils.js') return utils;
  if (specifier === './_shared.js') return shared;
  if (specifier === './_joker-grounding.js') return jokerGrounding;
  if (specifier === './_conversations.js') return conversations;
  throw new Error(`Unexpected module: ${specifier}`);
});
await chat.evaluate();

assert.equal(shared.namespace.AI_COST_MULTIPLIER, 1.5);
assert.equal(shared.namespace.AI_CREDITS_PER_USD, 10);
assert.equal(shared.namespace.AI_PREVIEW_EMAIL, 'bryceleezx@gmail.com');
assert.equal(shared.namespace.isAiEmailAllowed({}, 'BryceLeeZX@gmail.com'), true);
assert.equal(shared.namespace.isAiEmailAllowed({}, 'another@example.com'), true);
assert.equal(shared.namespace.isAiEmailAllowed({ AI_ALLOWED_EMAILS: 'bryceleezx@gmail.com' }, 'another@example.com'), true);
assert.equal(shared.namespace.isAiEmailAllowed({ AI_ACCESS_MODE: 'private', AI_ALLOWED_EMAILS: 'bryceleezx@gmail.com' }, 'another@example.com'), false);
assert.equal(shared.namespace.isAiEmailAllowed({ AI_ACCESS_MODE: 'private', AI_ALLOWED_EMAILS: 'bryceleezx@gmail.com' }, 'BRYCELEEzx@gmail.com'), true);
assert.equal(shared.namespace.isAiEmailAllowed({ AI_ALLOWED_EMAILS: '*' }, 'another@example.com'), true);
assert.equal(shared.namespace.AI_PACKAGES.starter.amount, '3.50');
assert.equal(shared.namespace.AI_PACKAGES.starter.credits, 30);
assert.equal(shared.namespace.AI_PACKAGES.refill.amount, '10.90');
assert.equal(shared.namespace.AI_PACKAGES.refill.credits, 100);

assert.equal(chat.namespace.exactCreditsNanosForCost(1), 15_000_000_000);
assert.equal(chat.namespace.exactCreditsNanosForCost(0.0034), 51_000_000);
assert.equal(chat.namespace.billedCreditsMicrosForExact(43_000_000), 100_000);
assert.equal(chat.namespace.billedCreditsMicrosForExact(87_000_000), 100_000);
assert.equal(chat.namespace.billedCreditsMicrosForExact(130_000_000), 200_000);

const groundedJokers = jokerGrounding.namespace.findMentionedJokers([
  { role: 'user', content: 'I have Blueprint, Photograph, and Hanging Chad. What order should I use?' }
]);
assert.deepEqual(Array.from(groundedJokers, (entry) => entry.name).sort(), ['Blueprint', 'Hanging Chad', 'Photograph']);
const groundedPrompt = jokerGrounding.namespace.jokerGroundingForMessages([
  { role: 'user', content: 'I have Blueprint, Photograph, and Hanging Chad. What order should I use?' }
]);
assert.match(groundedPrompt, /Copies ability of Joker to the right/);
assert.match(groundedPrompt, /Retrigger first played card used in scoring 2 additional times/);
assert.match(groundedPrompt, /First played face card gives X2 Mult when scored/);
assert.match(groundedPrompt, /\(2 x 2\)\^3 = X64/);
assert.equal(jokerGrounding.namespace.findMentionedJokers([{ role: 'user', content: 'How do Jokers work?' }]).length, 0);
assert.equal(jokerGrounding.namespace.findMentionedJokers([{ role: 'user', content: '蓝图和照片如何摆放？' }]).length, 2);

const page = readFileSync(new URL('../balatro-ai-assistant.html', import.meta.url), 'utf8');
const client = readFileSync(new URL('../ai-assistant.js', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../docs/ai-assistant-d1.sql', import.meta.url), 'utf8');
const setup = readFileSync(new URL('../docs/ai-assistant-setup.md', import.meta.url), 'utf8');
const background = readFileSync(new URL('../balatro-background.js', import.meta.url), 'utf8');
assert.match(page, /30 Credits/);
assert.match(page, /\$3\.50/);
assert.match(page, /100 Credits/);
assert.match(page, /\$10\.90/);
assert.match(page, /No subscription/i);
assert.match(page, /Google account/i);
assert.match(page, /<meta name="robots" content="index, follow">/);
assert.match(page, /non-refundable/i);
assert.match(page, /smaller 30-Credit pack first/i);
assert.match(page, /id="aiPurchaseConsent"/);
assert.match(page, /id="aiHistoryPanel"/);
assert.match(page, /Your saved conversations/);
assert.match(client, /\/api\/ai\/auth\/google/);
assert.match(client, /\/api\/ai\/chat/);
assert.match(client, /\/api\/ai\/conversations/);
assert.match(client, /acceptedTerms/);
assert.doesNotMatch(client, /sessionStorage/);
assert.doesNotMatch(`${page}\n${client}`, /client_secret/i);
assert.doesNotMatch(`${page}\n${client}`, /AI302_API_KEY/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_wallets/);
assert.match(schema, /CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_user_client_request/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_purchase_consents/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_payment_adjustments/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_conversations/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_messages/);
assert.match(setup, /encrypted Cloudflare Pages secret/);
assert.doesNotMatch(background, /ai-preview-nav\.js/);

const previewPages = [
  'index.html',
  'balatro-builds.html',
  'balatro-hand-levels.html',
  'balatro-high-card-build.html',
  'balatro-jokers.html',
  'balatro-max-hand-size.html',
  'balatro-mod-manager.html',
  'balatro-save-editor.html',
  'balatro-save-locations.html',
  'balatro-seed-analyzer.html',
  'balatro-seeds.html',
  'support.html',
  'how-to-install-balatro-mods.html',
  'balatro-ai-assistant.html'
];
for (const file of previewPages) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const links = html.match(/<a\b[^>]*href="\/balatro-ai-assistant"[^>]*>/g) || [];
  assert.ok(links.length > 0, `${file} should contain the public AI Advisor link`);
  for (const link of links) {
    assert.doesNotMatch(link, /data-ai-preview-nav/);
    assert.doesNotMatch(link, /\shidden(?:\s|>)/);
  }
}

console.log('AI assistant pricing, rounding, and integration tests passed');
