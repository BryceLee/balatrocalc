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
assert.equal(coverage.exact, 65);
assert.equal(coverage.heuristic, 1);
assert.equal(coverage.stateful, 84);

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
assert.equal(byName.get('Loyalty Card').modelStatus, 'exact');
assert.equal(byName.get('Supernova').modelStatus, 'exact');
assert.equal(byName.get('Fortune Teller').modelStatus, 'exact');
assert.equal(byName.get('Ride the Bus').modelStatus, 'exact');
assert.equal(byName.get('Runner').modelStatus, 'exact');
assert.equal(byName.get('Blue Joker').modelStatus, 'exact');
assert.equal(byName.get('Green Joker').modelStatus, 'exact');
assert.equal(byName.get('Red Card').modelStatus, 'exact');
assert.equal(byName.get('Square Joker').modelStatus, 'exact');
assert.equal(byName.get('Erosion').modelStatus, 'exact');
assert.equal(byName.get('Bull').modelStatus, 'exact');
assert.equal(byName.get('Flash Card').modelStatus, 'exact');
assert.equal(byName.get('Bootstraps').modelStatus, 'exact');
assert.equal(byName.get('Blueprint').effectKind, 'copy');
assert.equal(byName.get('Blueprint').modelStatus, 'exact');
assert.equal(byName.get('Brainstorm').modelStatus, 'exact');
assert.equal(byName.get('Hanging Chad').modelStatus, 'exact');
assert.equal(byName.get('Sock and Buskin').modelStatus, 'exact');
assert.equal(byName.get('Dusk').modelStatus, 'exact');
assert.equal(byName.get('Four Fingers').modelStatus, 'exact');
assert.equal(byName.get('Shortcut').modelStatus, 'exact');
assert.equal(byName.get('Smeared Joker').modelStatus, 'exact');
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

const runtimeExplanation = Calculator3Panel.explainSelection([
  byName.get('Blue Joker'),
  byName.get('Bull'),
  byName.get('Bootstraps'),
  byName.get('Supernova'),
  byName.get('Red Card'),
], {
  scoreEngine: Calculator3,
  playedCards: [
    { rank: 'A', suit: 'hearts' },
    { rank: 'A', suit: 'spades' },
    { rank: '8', suit: 'clubs' },
    { rank: '5', suit: 'diamonds' },
    { rank: '3', suit: 'hearts' },
  ],
  remainingDeckCards: 40,
  dollars: 18,
  currentHandTimesPlayed: 4,
  jokerValues: {
    redCard: 2,
  },
});
assert.equal(runtimeExplanation.engineCoverage.exact, 5);
assert.equal(runtimeExplanation.score.chips, 148);
assert.equal(runtimeExplanation.score.mult, 18);
assert.equal(runtimeExplanation.scorePreview, 2664);
assert.ok(runtimeExplanation.steps.some((step) => step.note.includes('Bootstraps')));
assert.equal(runtimeExplanation.impactSummary.scoreDeltaFromBase, 2644);
assert.deepEqual(
  runtimeExplanation.impactSummary.phaseSummaries.map((phase) => [phase.key, phase.scoreDelta]),
  [['hand', 20], ['card', 44], ['joker', 2600]]
);
assert.deepEqual(
  runtimeExplanation.impactSummary.topContributors.slice(0, 2).map((item) => item.scoreDelta),
  [888, 888]
);
assert.ok(runtimeExplanation.impactSummary.topContributors.some((item) => item.label.includes('Blue Joker')));
assert.equal(runtimeExplanation.jokerContribution.length, 5);
assert.deepEqual(
  runtimeExplanation.jokerContribution.map((row) => [row.name, row.scoreWithout, row.scoreDelta]),
  [
    ['Blue Joker', 1224, 1440],
    ['Bull', 2016, 648],
    ['Bootstraps', 1776, 888],
    ['Supernova', 2072, 592],
    ['Red Card', 1776, 888],
  ]
);
assert.ok(runtimeExplanation.jokerContribution.every((row) => row.note === 'current score gained'));

const copyRetriggerExplanation = Calculator3Panel.explainSelection([
  byName.get('Hanging Chad'),
  byName.get('Blueprint'),
  byName.get('Sock and Buskin'),
  byName.get('Photograph'),
  byName.get('Smiley Face'),
], {
  scoreEngine: Calculator3,
  handTypeKey: 'pair',
  playedCards: [
    { rank: 'K', suit: 'hearts' },
    { rank: 'K', suit: 'spades' },
    { rank: 'Q', suit: 'clubs' },
  ],
});
assert.equal(copyRetriggerExplanation.engineCoverage.exact, 5);
assert.equal(copyRetriggerExplanation.score.chips, 90);
assert.equal(copyRetriggerExplanation.score.mult, 104);
assert.ok(copyRetriggerExplanation.phaseGroups.some((group) => group.key === 'copy'));
assert.ok(copyRetriggerExplanation.phaseGroups.some((group) => group.key === 'retrigger'));
assert.ok(copyRetriggerExplanation.phaseGroups.some((group) => group.steps.some((step) => step.label.includes('Blueprint copies Sock and Buskin'))));
assert.equal(copyRetriggerExplanation.jokerOrderComparison.length, 4);
assert.deepEqual(
  copyRetriggerExplanation.jokerOrderComparison.map((row) => [row.index, row.pairName, row.scoreAfterSwap, row.scoreDelta, row.note]),
  [
    [0, 'Hanging Chad / Blueprint', 15120, 5760, 'swap improves score'],
    [1, 'Blueprint / Sock and Buskin', 37940, 28580, 'swap improves score'],
    [2, 'Sock and Buskin / Photograph', 37940, 28580, 'swap improves score'],
    [3, 'Photograph / Smiley Face', 120960, 111600, 'swap improves score'],
  ]
);

const ruleModifierExplanation = Calculator3Panel.explainSelection([
  byName.get('Four Fingers'),
  byName.get('Shortcut'),
  byName.get('Smeared Joker'),
  byName.get('Photograph'),
  byName.get('Smiley Face'),
], {
  scoreEngine: Calculator3,
  playedCards: [
    { rank: 'K', suit: 'hearts', enhancement: 'mult' },
    { rank: 'J', suit: 'diamonds', edition: 'foil', seal: 'red' },
    { rank: '9', suit: 'hearts' },
    { rank: '7', suit: 'diamonds' },
    { rank: '2', suit: 'spades' },
  ],
});
assert.equal(ruleModifierExplanation.engineCoverage.exact, 5);
assert.equal(ruleModifierExplanation.engineResult.handType, 'straightFlush');
assert.equal(ruleModifierExplanation.engineResult.scoringCards.length, 4);
assert.equal(ruleModifierExplanation.score.chips, 246);
assert.equal(ruleModifierExplanation.score.mult, 39);
assert.equal(ruleModifierExplanation.scorePreview, 9594);
assert.ok(ruleModifierExplanation.phaseGroups.some((group) => group.key === 'rule' && group.steps.some((step) => step.label.includes('Four Fingers'))));
assert.ok(ruleModifierExplanation.phaseGroups.some((group) => group.key === 'seal'));

const plasmaExplanation = Calculator3Panel.explainSelection([
  byName.get('Joker'),
], {
  scoreEngine: Calculator3,
  playedCards: [
    { rank: 'A', suit: 'hearts' },
    { rank: 'A', suit: 'spades' },
  ],
  rules: { plasmaDeck: true },
});
assert.equal(plasmaExplanation.score.chips, 19);
assert.equal(plasmaExplanation.score.mult, 19);
assert.equal(plasmaExplanation.scorePreview, 361);
assert.ok(plasmaExplanation.phaseGroups.some((group) => group.key === 'deck' && group.steps.some((step) => step.label.includes('Plasma Deck'))));

assert.equal(Calculator3Panel.calculateBlindTarget(1, 'small'), 300);
assert.equal(Calculator3Panel.calculateBlindTarget(2, 'big'), 1200);
assert.equal(Calculator3Panel.calculateBlindTarget(8, 'boss'), 100000);
assert.equal(Calculator3Panel.calculateBlindTarget(12, 'boss'), 100000);
assert.deepEqual(
  Calculator3Panel.buildScoreOutcome(9594, 2, 'boss'),
  {
    ante: 2,
    blindType: 'boss',
    target: 1600,
    score: 9594,
    margin: 7994,
    clears: true,
    ratio: 5.99625,
    summary: 'Clears by 7,994',
  }
);
assert.equal(Calculator3Panel.buildScoreOutcome(140, 1, 'small').summary, 'Needs 160 more');
assert.equal(Calculator3Panel.buildImpactSummary({ steps: [] }).finalScore, 0);

const bossBlindExplanation = Calculator3Panel.explainSelection([
  byName.get('Smiley Face'),
  byName.get('Baron'),
], {
  scoreEngine: Calculator3,
  playedCards: [
    { rank: 'K', suit: 'clubs' },
    { rank: 'K', suit: 'spades' },
    { rank: '8', suit: 'clubs' },
    { rank: '5', suit: 'diamonds' },
    { rank: '3', suit: 'hearts' },
  ],
  heldCards: [
    { rank: 'Q', suit: 'clubs' },
  ],
  rules: { bossBlind: 'club' },
});
assert.equal(bossBlindExplanation.engineResult.handType, 'pair');
assert.equal(bossBlindExplanation.score.chips, 20);
assert.equal(bossBlindExplanation.score.mult, 7);
assert.equal(bossBlindExplanation.scorePreview, 140);
assert.ok(bossBlindExplanation.phaseGroups.some((group) => group.key === 'rule' && group.steps.some((step) => step.label.includes('The Club'))));
assert.ok(bossBlindExplanation.phaseGroups.some((group) => group.key === 'status' && group.steps.some((step) => step.label.includes('King of Clubs'))));

const leveledStraightExplanation = Calculator3Panel.explainSelection([
  byName.get('Crazy Joker'),
], {
  scoreEngine: Calculator3,
  level: 3,
  playedCards: [
    { rank: 'A', suit: 'hearts' },
    { rank: 'K', suit: 'spades' },
    { rank: 'Q', suit: 'clubs' },
    { rank: 'J', suit: 'diamonds' },
    { rank: '10', suit: 'hearts' },
  ],
});
assert.equal(leveledStraightExplanation.engineResult.handType, 'straight');
assert.equal(leveledStraightExplanation.engineResult.level, 3);
assert.equal(leveledStraightExplanation.score.chips, 141);
assert.equal(leveledStraightExplanation.score.mult, 22);
assert.equal(leveledStraightExplanation.scorePreview, 3102);
assert.ok(leveledStraightExplanation.steps[0].applies);

const modifierExplanation = Calculator3Panel.explainSelection([], {
  scoreEngine: Calculator3,
  handTypeKey: 'pair',
  playedCards: [
    { rank: 'A', suit: 'hearts', enhancement: 'mult' },
    { rank: 'A', suit: 'spades', edition: 'foil' },
    { rank: '8', suit: 'clubs', enhancement: 'stone' },
  ],
});
assert.equal(modifierExplanation.score.chips, 132);
assert.equal(modifierExplanation.score.mult, 6);
assert.equal(modifierExplanation.scorePreview, 792);
assert.deepEqual(
  modifierExplanation.phaseGroups.map((group) => group.key),
  ['hand', 'card', 'enhancement', 'edition']
);
assert.ok(modifierExplanation.phaseGroups.some((group) => group.label === 'Card enhancements'));
assert.ok(modifierExplanation.phaseGroups.some((group) => group.steps.some((step) => step.label.includes('Foil'))));

const stateMatrixExplanation = Calculator3Panel.explainSelection([], {
  scoreEngine: Calculator3,
  handTypeKey: 'highCard',
  playedCards: [
    { rank: 'A', suit: 'spades', enhancement: 'mult', seal: 'red' },
  ],
  heldCards: [
    { rank: 'K', suit: 'hearts', enhancement: 'steel', seal: 'red' },
  ],
});
assert.equal(stateMatrixExplanation.score.chips, 27);
assert.equal(stateMatrixExplanation.score.mult, 20.25);
assert.deepEqual(
  stateMatrixExplanation.phaseGroups.map((group) => group.key),
  ['hand', 'card', 'enhancement', 'held', 'seal']
);
assert.ok(stateMatrixExplanation.phaseGroups.some((group) => group.label === 'Held card effects'));
assert.ok(stateMatrixExplanation.phaseGroups.some((group) => group.label === 'Seals'));

assert.equal(
  Calculator3Panel.escapeHtml('<b>Joker & Chips</b>'),
  '&lt;b&gt;Joker &amp; Chips&lt;/b&gt;'
);

console.log('calculator3 catalog tests passed');
