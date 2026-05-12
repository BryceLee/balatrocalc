import assert from 'node:assert/strict';
import Calculator3 from '../calculator3-model.js';

function card(rank, suit = 'hearts') {
  return { rank, suit };
}

function modCard(rank, suit, enhancement = 'none', edition = 'none') {
  return { rank, suit, enhancement, edition };
}

const pairAnalysis = Calculator3.analyzePlayedCards([
  card('A', 'hearts'),
  card('A', 'spades'),
  card('8', 'clubs'),
  card('5', 'diamonds'),
  card('3', 'hearts')
]);
assert.equal(pairAnalysis.handType, 'pair');
assert.equal(pairAnalysis.scoringIndexes.size, 2);

const straightFlushAnalysis = Calculator3.analyzePlayedCards([
  card('10', 'spades'),
  card('J', 'spades'),
  card('Q', 'spades'),
  card('K', 'spades'),
  card('A', 'spades')
]);
assert.equal(straightFlushAnalysis.handType, 'straightFlush');

const jollyScore = Calculator3.score({
  handType: 'pair',
  level: 1,
  playedCards: [card('A'), card('A', 'clubs'), card('8', 'spades'), card('5', 'diamonds'), card('3')],
  jokers: ['jolly']
});
assert.equal(jollyScore.handLabel, 'Pair');
assert.equal(jollyScore.mult, 10);
assert.equal(jollyScore.warnings.length, 0);

const addThenMultiply = Calculator3.score({
  handType: 'pair',
  playedCards: [card('A'), card('A', 'clubs')],
  jokers: ['joker', 'cavendish']
});
const multiplyThenAdd = Calculator3.score({
  handType: 'pair',
  playedCards: [card('A'), card('A', 'clubs')],
  jokers: ['cavendish', 'joker']
});
assert.equal(addThenMultiply.mult, 18);
assert.equal(multiplyThenAdd.mult, 10);
assert.ok(addThenMultiply.score > multiplyThenAdd.score);

const fibonacciScore = Calculator3.score({
  playedCards: [
    card('A', 'hearts'),
    card('2', 'clubs'),
    card('4', 'diamonds'),
    card('6', 'spades'),
    card('9', 'hearts')
  ],
  jokers: ['fibonacci']
});
assert.equal(fibonacciScore.handType, 'highCard');
assert.equal(fibonacciScore.mult, 9);

const unsupported = Calculator3.score({
  playedCards: [card('K')],
  jokers: ['blueprint']
});
assert.deepEqual(unsupported.unsupportedJokers, ['blueprint']);
assert.equal(unsupported.warnings.length, 1);

const enhancedScore = Calculator3.score({
  handType: 'pair',
  playedCards: [
    modCard('A', 'hearts', 'mult'),
    modCard('A', 'diamonds', 'none', 'foil'),
    modCard('8', 'spades', 'glass')
  ],
  jokers: []
});
assert.equal(enhancedScore.chips, 82);
assert.equal(enhancedScore.mult, 6);
assert.equal(enhancedScore.score, 492);
assert.ok(enhancedScore.steps.some((step) => step.phase === 'enhancement' && step.label.includes('Mult Card')));
assert.ok(enhancedScore.steps.some((step) => step.phase === 'edition' && step.label.includes('Foil')));

const stoneScore = Calculator3.score({
  playedCards: [
    modCard('K', 'spades', 'stone'),
    modCard('A', 'hearts')
  ],
  jokers: []
});
assert.equal(stoneScore.handType, 'highCard');
assert.equal(stoneScore.chips, 66);
assert.equal(stoneScore.mult, 1);
assert.ok(stoneScore.steps.some((step) => step.label.includes('Stone Card')));

const walkieTalkieScore = Calculator3.score({
  playedCards: [
    card('10', 'hearts'),
    card('10', 'clubs'),
    card('4', 'diamonds'),
    card('4', 'spades'),
    card('7', 'hearts')
  ],
  jokers: ['walkieTalkie']
});
assert.equal(walkieTalkieScore.handType, 'twoPair');
assert.equal(walkieTalkieScore.chips, 88);
assert.equal(walkieTalkieScore.mult, 18);
assert.ok(walkieTalkieScore.steps.some((step) => step.label.includes('Walkie Talkie')));

const suitAndFaceScore = Calculator3.score({
  playedCards: [
    card('K', 'spades'),
    card('Q', 'spades'),
    card('J', 'spades'),
    card('9', 'spades'),
    card('2', 'spades')
  ],
  jokers: ['arrowhead', 'smileyFace', 'stuntman']
});
assert.equal(suitAndFaceScore.handType, 'flush');
assert.equal(suitAndFaceScore.chips, 576);
assert.equal(suitAndFaceScore.mult, 19);

const xMultConditionScore = Calculator3.score({
  playedCards: [
    card('K', 'clubs'),
    card('Q', 'hearts'),
    card('J', 'diamonds'),
    card('10', 'spades'),
    card('9', 'clubs')
  ],
  jokers: ['photograph', 'seeingDouble', 'flowerPot', 'triboulet']
});
assert.equal(xMultConditionScore.handType, 'straight');
assert.equal(xMultConditionScore.chips, 79);
assert.equal(xMultConditionScore.mult, 192);
assert.equal(xMultConditionScore.score, 15168);

console.log('calculator3-model tests passed');
