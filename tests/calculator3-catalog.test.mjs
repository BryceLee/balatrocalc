import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Calculator3 = require('../calculator3-model.js');
const Calculator3Panel = require('../calculator3.js');

const cardsSource = readFileSync(new URL('../cards.js', import.meta.url), 'utf8');
const context = {
  console: {
    log() {},
    error() {},
  },
  hands: [
    'High Card',
    'Pair',
    'Two Pair',
    'Three of a Kind',
    'Straight',
    'Flush',
    'Full House',
    'Four of a Kind',
    'Straight Flush',
    'Five of a Kind',
    'Flush House',
    'Flush Five',
  ].map((name) => ({ name })),
};
vm.createContext(context);
vm.runInContext(`${cardsSource}
globalThis.__calculator3Cards = { jokerTexts, jokerPrice, jokerRarity, renderJokerDescription };
`, context);

const catalog = Calculator3Panel.buildJokerCatalog({
  ...context.__calculator3Cards,
  engineCatalog: Calculator3.JOKER_CATALOG,
});
const coverage = Calculator3Panel.buildCoverageSummary(catalog);
const byName = new Map(catalog.map((joker) => [joker.name, joker]));

assert.equal(catalog.length, 150);
assert.equal(coverage.total, 150);
assert.equal(coverage.exact, 44);
assert.equal(coverage.heuristic, 1);
assert.equal(coverage.stateful, 105);

assert.equal(byName.get('Joker').modelStatus, 'exact');
assert.equal(byName.get('The Duo').engineId, 'duo');
assert.equal(byName.get('Walkie Talkie').engineId, 'walkieTalkie');
assert.equal(byName.get('Arrowhead').modelStatus, 'exact');
assert.equal(byName.get('Onyx Agate').modelStatus, 'exact');
assert.equal(byName.get('Smiley Face').modelStatus, 'exact');
assert.equal(byName.get('Stuntman').modelStatus, 'exact');
assert.equal(byName.get('Banner').modelStatus, 'exact');
assert.equal(byName.get('Mystic Summit').modelStatus, 'exact');
assert.equal(byName.get('Raised Fist').modelStatus, 'exact');
assert.equal(byName.get('Seeing Double').modelStatus, 'exact');
assert.equal(byName.get('Flower Pot').modelStatus, 'exact');
assert.equal(byName.get('Photograph').modelStatus, 'exact');
assert.equal(byName.get('Shoot the Moon').modelStatus, 'exact');
assert.equal(byName.get('Blackboard').modelStatus, 'exact');
assert.equal(byName.get('Baron').modelStatus, 'exact');
assert.equal(byName.get('Baseball Card').modelStatus, 'exact');
assert.equal(byName.get('Triboulet').modelStatus, 'exact');
assert.equal(byName.get('Blueprint').effectKind, 'copy');
assert.equal(byName.get('Blueprint').modelStatus, 'stateful');
assert.equal(byName.get('Card Sharp').modelStatus, 'stateful');
assert.equal(byName.get('Gros Michel').operation.type, 'addMult');

const pairExplanation = Calculator3Panel.explainSelection([
  byName.get('Joker'),
  byName.get('The Duo'),
], { handType: 'Pair', chips: 10, mult: 2 });
assert.equal(pairExplanation.score.mult, 12);
assert.equal(pairExplanation.scorePreview, 120);
assert.deepEqual(pairExplanation.engineCoverage, { exact: 2, total: 2 });

const engineExplanation = Calculator3Panel.explainSelection([
  byName.get('Baron'),
  byName.get('Shoot the Moon'),
  byName.get('Blackboard'),
  byName.get('Raised Fist'),
  byName.get('Baseball Card'),
], {
  scoreEngine: Calculator3,
  playedCards: [
    { rank: 'A', suit: 'hearts' },
    { rank: 'A', suit: 'spades' },
    { rank: '8', suit: 'clubs' },
    { rank: '5', suit: 'diamonds' },
    { rank: '3', suit: 'hearts' },
  ],
  heldCards: [
    { rank: 'K', suit: 'spades' },
    { rank: 'Q', suit: 'clubs' },
    { rank: '2', suit: 'clubs' },
  ],
  remainingDiscards: 0,
});
assert.equal(engineExplanation.engineCoverage.exact, 5);
assert.equal(engineExplanation.steps.length, 5);
assert.ok(engineExplanation.scorePreview > 1000);
assert.ok(engineExplanation.steps.some((step) => step.note.includes('Baron')));

assert.equal(
  Calculator3Panel.escapeHtml('<b>Joker & Chips</b>'),
  '&lt;b&gt;Joker &amp; Chips&lt;/b&gt;'
);

console.log('calculator3 catalog tests passed');
