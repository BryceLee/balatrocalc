import assert from 'node:assert/strict';
import Calculator3 from '../calculator3-model.js';

function card(rank, suit = 'hearts') {
  return { rank, suit };
}

function modCard(rank, suit, enhancement = 'none', edition = 'none') {
  return { rank, suit, enhancement, edition };
}

function stateCard(rank, suit, state = {}) {
  return { rank, suit, ...state };
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

const ruleModifierAnalysis = Calculator3.analyzePlayedCards([
  card('K', 'hearts'),
  card('J', 'diamonds'),
  card('9', 'hearts'),
  card('7', 'diamonds'),
  card('2', 'spades')
], { fourFingers: true, shortcut: true, smearedJoker: true });
assert.equal(ruleModifierAnalysis.handType, 'straightFlush');
assert.equal(ruleModifierAnalysis.scoringIndexes.size, 4);

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
assert.deepEqual(unsupported.unsupportedJokers, []);
assert.equal(unsupported.warnings.length, 0);
assert.ok(unsupported.steps.some((step) => step.label.includes('Blueprint: no compatible target')));

const copyRetriggerScore = Calculator3.score({
  handType: 'pair',
  playedCards: [
    card('K', 'hearts'),
    card('K', 'spades'),
    card('Q', 'clubs')
  ],
  jokers: ['hangingChad', 'blueprint', 'sockAndBuskin', 'photograph', 'smileyFace']
});
assert.equal(copyRetriggerScore.chips, 90);
assert.equal(copyRetriggerScore.mult, 104);
assert.equal(copyRetriggerScore.score, 9360);
assert.ok(copyRetriggerScore.steps.some((step) => step.phase === 'copy' && step.label.includes('Blueprint copies Sock and Buskin')));
assert.ok(copyRetriggerScore.steps.some((step) => step.phase === 'retrigger' && step.label.includes('Hanging Chad')));
assert.ok(copyRetriggerScore.steps.some((step) => step.label.includes('Photograph')));
assert.ok(copyRetriggerScore.steps.some((step) => step.label.includes('Smiley Face: 8 matching')));

const brainstormRetriggerScore = Calculator3.score({
  handType: 'pair',
  playedCards: [
    card('K', 'hearts'),
    card('K', 'spades'),
    card('Q', 'clubs')
  ],
  jokers: ['sockAndBuskin', 'brainstorm', 'smileyFace']
});
assert.equal(brainstormRetriggerScore.chips, 70);
assert.equal(brainstormRetriggerScore.mult, 32);
assert.ok(brainstormRetriggerScore.steps.some((step) => step.label.includes('Brainstorm copies Sock and Buskin')));

const duskFinalHandScore = Calculator3.score({
  handType: 'pair',
  playedCards: [
    card('K', 'hearts'),
    card('K', 'spades')
  ],
  jokers: ['dusk', 'smileyFace'],
  finalHand: true
});
assert.equal(duskFinalHandScore.chips, 50);
assert.equal(duskFinalHandScore.mult, 22);
assert.ok(duskFinalHandScore.steps.some((step) => step.phase === 'retrigger' && step.label.includes('Dusk')));

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

const handRuleScore = Calculator3.score({
  playedCards: [
    stateCard('K', 'hearts', { enhancement: 'mult' }),
    stateCard('J', 'diamonds', { edition: 'foil', seal: 'red' }),
    card('9', 'hearts'),
    card('7', 'diamonds'),
    card('2', 'spades')
  ],
  jokers: ['fourFingers', 'shortcut', 'smearedJoker', 'photograph', 'smileyFace']
});
assert.equal(handRuleScore.handType, 'straightFlush');
assert.equal(handRuleScore.scoringCards.length, 4);
assert.equal(handRuleScore.chips, 246);
assert.equal(handRuleScore.mult, 39);
assert.equal(handRuleScore.score, 9594);
assert.ok(handRuleScore.steps.some((step) => step.phase === 'rule' && step.label.includes('Four Fingers')));
assert.ok(handRuleScore.steps.some((step) => step.phase === 'rule' && step.label.includes('Shortcut')));
assert.ok(handRuleScore.steps.some((step) => step.phase === 'rule' && step.label.includes('Smeared Joker')));
assert.ok(handRuleScore.steps.some((step) => step.label.includes('Red Seal retriggers')));

const plasmaScore = Calculator3.score({
  playedCards: [
    card('A', 'hearts'),
    card('A', 'spades')
  ],
  jokers: ['joker'],
  rules: { plasmaDeck: true }
});
assert.equal(plasmaScore.handType, 'pair');
assert.equal(plasmaScore.chips, 19);
assert.equal(plasmaScore.mult, 19);
assert.equal(plasmaScore.score, 361);
assert.ok(plasmaScore.steps.some((step) => step.phase === 'deck' && step.label.includes('Plasma Deck')));

const flintScore = Calculator3.score({
  playedCards: [
    card('A', 'hearts'),
    card('A', 'spades')
  ],
  jokers: ['jolly'],
  rules: { bossBlind: 'flint' }
});
assert.equal(flintScore.handType, 'pair');
assert.equal(flintScore.chips, 27);
assert.equal(flintScore.mult, 9);
assert.equal(flintScore.score, 243);
assert.ok(flintScore.steps.some((step) => step.phase === 'rule' && step.label.includes('The Flint')));

const bossDebuffScore = Calculator3.score({
  playedCards: [
    card('K', 'clubs'),
    card('K', 'spades'),
    card('8', 'clubs'),
    card('5', 'diamonds'),
    card('3', 'hearts')
  ],
  heldCards: [
    card('Q', 'clubs')
  ],
  jokers: ['smileyFace', 'baron'],
  rules: { bossBlind: 'club' }
});
assert.equal(bossDebuffScore.handType, 'pair');
assert.equal(bossDebuffScore.chips, 20);
assert.equal(bossDebuffScore.mult, 7);
assert.equal(bossDebuffScore.score, 140);
assert.ok(bossDebuffScore.steps.some((step) => step.phase === 'rule' && step.label.includes('The Club')));
assert.ok(bossDebuffScore.steps.some((step) => step.phase === 'status' && step.label.includes('King of Clubs')));
assert.ok(bossDebuffScore.steps.some((step) => step.phase === 'status' && step.label.includes('Queen of Clubs')));

const heldCardStateScore = Calculator3.score({
  playedCards: [
    card('A', 'hearts'),
    card('A', 'spades'),
    card('8', 'clubs'),
    card('5', 'diamonds'),
    card('3', 'hearts')
  ],
  heldCards: [
    card('K', 'spades'),
    card('Q', 'clubs'),
    card('2', 'clubs')
  ],
  jokers: [
    'raisedFist',
    'shootTheMoon',
    'blackboard',
    'baron',
    { id: 'baseballCard', rarity: 'Rare' },
    { id: 'mysticSummit', rarity: 'Common' },
    { id: 'banner', rarity: 'Common' },
    { id: 'onyxAgate', rarity: 'Uncommon' }
  ],
  remainingDiscards: 0
});
assert.equal(heldCardStateScore.handType, 'pair');
assert.equal(heldCardStateScore.chips, 32);
assert.equal(heldCardStateScore.mult, 143.25);
assert.equal(heldCardStateScore.score, 4584);
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Raised Fist')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Shoot the Moon')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Blackboard')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Baron')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Baseball Card')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Mystic Summit')));
assert.ok(heldCardStateScore.steps.some((step) => step.label.includes('Banner: condition not met')));

const bannerScore = Calculator3.score({
  playedCards: [card('K', 'hearts')],
  jokers: ['banner'],
  remainingDiscards: 3
});
assert.equal(bannerScore.chips, 105);
assert.equal(bannerScore.mult, 1);

const runtimeStateScore = Calculator3.score({
  playedCards: [
    card('A', 'hearts'),
    card('A', 'spades'),
    card('8', 'clubs'),
    card('5', 'diamonds'),
    card('3', 'hearts')
  ],
  jokers: [
    'blueJoker',
    'bull',
    'bootstraps',
    'supernova',
    'redCard',
    'fortuneTeller',
    'rideTheBus',
    'runner',
    'squareJoker',
    'erosion',
    'flashCard',
    'greenJoker',
    'loyaltyCard'
  ],
  remainingDeckCards: 40,
  dollars: 18,
  currentHandTimesPlayed: 4,
  jokerValues: {
    redCard: 2,
    fortuneTeller: 6,
    rideTheBus: 5,
    runner: 3,
    squareJoker: 3,
    erosion: 4,
    flashCard: 3,
    greenJoker: -2,
    loyaltyCard: 0
  }
});
assert.equal(runtimeStateScore.chips, 205);
assert.equal(runtimeStateScore.mult, 196);
assert.equal(runtimeStateScore.score, 40180);
assert.ok(runtimeStateScore.steps.some((step) => step.label.includes('Blue Joker')));
assert.ok(runtimeStateScore.steps.some((step) => step.label.includes('Bootstraps')));
assert.ok(runtimeStateScore.steps.some((step) => step.label.includes('Loyalty Card')));

const unreadyLoyaltyScore = Calculator3.score({
  playedCards: [card('K', 'hearts')],
  jokers: ['loyaltyCard']
});
assert.equal(unreadyLoyaltyScore.mult, 1);
assert.ok(unreadyLoyaltyScore.steps.some((step) => step.label.includes('condition not met')));

const wildFlushAnalysis = Calculator3.analyzePlayedCards([
  stateCard('A', 'spades'),
  stateCard('K', 'spades'),
  stateCard('Q', 'spades'),
  stateCard('J', 'spades'),
  stateCard('2', 'hearts', { enhancement: 'wild' })
]);
assert.equal(wildFlushAnalysis.handType, 'flush');

const redSealAndHeldSteelScore = Calculator3.score({
  handType: 'highCard',
  playedCards: [
    stateCard('A', 'spades', { enhancement: 'mult', seal: 'red' })
  ],
  heldCards: [
    stateCard('K', 'hearts', { enhancement: 'steel', seal: 'red' })
  ],
  jokers: []
});
assert.equal(redSealAndHeldSteelScore.chips, 27);
assert.equal(redSealAndHeldSteelScore.mult, 20.25);
assert.equal(redSealAndHeldSteelScore.score, 546);
assert.ok(redSealAndHeldSteelScore.steps.some((step) => step.phase === 'seal' && step.label.includes('Red Seal retriggers this scoring card')));
assert.ok(redSealAndHeldSteelScore.steps.some((step) => step.phase === 'held' && step.label.includes('Steel Card')));

const debuffedCardScore = Calculator3.score({
  handType: 'highCard',
  playedCards: [
    stateCard('A', 'spades', { enhancement: 'mult', seal: 'red', debuffed: true })
  ],
  heldCards: [
    stateCard('K', 'spades', { debuffed: true })
  ],
  jokers: ['baron', 'arrowhead']
});
assert.equal(debuffedCardScore.chips, 5);
assert.equal(debuffedCardScore.mult, 1);
assert.ok(debuffedCardScore.steps.some((step) => step.phase === 'status' && step.label.includes('Debuffed card')));
assert.ok(debuffedCardScore.steps.some((step) => step.label.includes('Baron: condition not met')));
assert.ok(debuffedCardScore.steps.some((step) => step.label.includes('Arrowhead: condition not met')));

console.log('calculator3-model tests passed');
