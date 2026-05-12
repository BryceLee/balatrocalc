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
assert.ok(coverage.exact >= 37);
assert.ok(coverage.heuristic >= 5);
assert.ok(coverage.stateful >= 60);

assert.equal(byName.get('Joker').modelStatus, 'exact');
assert.equal(byName.get('The Duo').engineId, 'duo');
assert.equal(byName.get('Walkie Talkie').engineId, 'walkieTalkie');
assert.equal(byName.get('Arrowhead').modelStatus, 'exact');
assert.equal(byName.get('Onyx Agate').modelStatus, 'exact');
assert.equal(byName.get('Smiley Face').modelStatus, 'exact');
assert.equal(byName.get('Stuntman').modelStatus, 'exact');
assert.equal(byName.get('Seeing Double').modelStatus, 'exact');
assert.equal(byName.get('Flower Pot').modelStatus, 'exact');
assert.equal(byName.get('Photograph').modelStatus, 'exact');
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

assert.equal(
  Calculator3Panel.escapeHtml('<b>Joker & Chips</b>'),
  '&lt;b&gt;Joker &amp; Chips&lt;/b&gt;'
);

console.log('calculator3 catalog tests passed');
