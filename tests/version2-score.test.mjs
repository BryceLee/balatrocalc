import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the engine shipped to users, including state normalization, card
// selection, retriggers, joker copies, and Decimal score accumulation.
// Version 2 is vendored as a bundle; follow the HTML import after asset renames.
const moduleRoot = new URL('../balatrolator-module/', import.meta.url);
const html = readFileSync(new URL('index.html', moduleRoot), 'utf8');
const asset = html.match(/import\(['"](.\/assets\/[^'"]+\.js)['"]\)/)?.[1];
assert.ok(asset, 'Version 2 must import a calculator bundle');
const source = readFileSync(new URL(asset, moduleRoot), 'utf8');
const start = source.indexOf('function ge(');
const end = source.indexOf('var jn=await new CSSStyleSheet()');
assert.ok(start >= 0 && end > start, 'Update engine boundaries if the vendored bundle is rebuilt');
const engine = vm.createContext({});
vm.runInContext(source.slice(start, end), engine);
const calculate = vm.runInContext('(input) => Tn(We(input))', engine);

const card = (rank = '7', extra = {}) => ({ rank, suit: 'Hearts', played: true, ...extra });
const joker = (name) => ({ name });
function scores(cards, jokers) {
  return Object.fromEntries(calculate({ cards, jokers }).results.map(({ luck, score }) => [luck, score]));
}
const allModes = (score) => ({ none: score, average: score, all: score });

for (const [rank, expected] of [['7', '12'], ['Jack', '15'], ['Ace', '16'], ['King', '30'], ['Queen', '30']]) {
  test(`Triboulet: ${rank} high card`, () => {
    assert.deepEqual(scores([card(rank)], [joker('Triboulet')]), allModes(expected));
  });
}

test('Triboulet: mixed full house preserves Mult from scoring number cards', () => {
  const suits = ['Spades', 'Hearts', 'Clubs', 'Hearts', 'Diamonds'];
  const cards = ['King', 'King', 'King', '7', '7'].map((rank, index) => card(rank, { suit: suits[index] }));
  assert.deepEqual(scores(cards, [joker('Triboulet')]), allModes('2688'));
});

test('Triboulet: Stone Kings do not receive a rank bonus', () => {
  assert.deepEqual(scores([card('King', { enhancement: 'Stone' })], [joker('Triboulet')]), allModes('55'));
});

test('Triboulet: debuffed cards preserve the base hand score', () => {
  assert.deepEqual(scores([card('7', { debuffed: true })], [joker('Triboulet')]), allModes('5'));
});

test('Triboulet: Blueprint copies the King bonus', () => {
  assert.deepEqual(scores([card('King')], [joker('Blueprint'), joker('Triboulet')]), allModes('60'));
});

test('Triboulet: copied and retriggered number cards retain their score', () => {
  assert.deepEqual(scores([card('7', { seal: 'Red' })], [joker('Blueprint'), joker('Triboulet')]), allModes('19'));
});

test('Bloodstone: Heart scores use x1.5 on success and x1.25 on average', () => {
  assert.deepEqual(scores([card()], [joker('Bloodstone')]), { none: '12', average: '15', all: '18' });
});

test('Bloodstone: Oops! All 6s guarantees x1.5 in every luck mode', () => {
  assert.deepEqual(scores([card()], [joker('Bloodstone'), joker('Oops! All 6s')]), allModes('18'));
});

test('Bloodstone: non-Hearts receive no bonus', () => {
  assert.deepEqual(scores([card('7', { suit: 'Clubs' })], [joker('Bloodstone')]), allModes('12'));
});

test('Bloodstone: Wild cards qualify for the Heart bonus', () => {
  assert.deepEqual(scores([card('7', { suit: 'Clubs', enhancement: 'Wild' })], [joker('Bloodstone')]), {
    none: '12', average: '15', all: '18',
  });
});

test('Bloodstone: Smeared Joker makes Diamonds qualify', () => {
  assert.deepEqual(scores([card('7', { suit: 'Diamonds' })], [joker('Bloodstone'), joker('Smeared Joker')]), {
    none: '12', average: '15', all: '18',
  });
});

test('Bloodstone: Red Seal repeats the correct factor', () => {
  // Red Seal repeats the card's 7 chips too: (5 + 7 + 7) * Mult.
  assert.deepEqual(scores([card('7', { seal: 'Red' })], [joker('Bloodstone')]), {
    none: '19', average: '29.6875', all: '42.75',
  });
});

test('Bloodstone: Blueprint copies the correct factor', () => {
  assert.deepEqual(scores([card()], [joker('Blueprint'), joker('Bloodstone')]), {
    none: '12', average: '18.75', all: '27',
  });
});

test('Bloodstone and Triboulet combine without zeroing a number card', () => {
  assert.deepEqual(scores([card()], [joker('Triboulet'), joker('Bloodstone')]), {
    none: '12', average: '15', all: '18',
  });
});
