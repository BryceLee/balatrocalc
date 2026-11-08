import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const catalogSource = main.slice(main.indexOf('const jokerCatalogCache'), main.indexOf('\nredrawCards();', main.indexOf('const jokerCatalogCache')));

test('search reuses previews while counters, editions and translations stay current', () => {
  const context = vm.createContext({});
  vm.runInContext(`
    var jokerTexts = Array.from({length: 16}, (_, i) => Array.from({length: 10}, (_, j) => ['Joker '+i+','+j, 'template']));
    var jokerValue = 0, searchVal = '', jmodifiers = {}, jcardsDiv = {innerHTML:''}, renders = 0;
    function renderJokerDescription(i, j) { renders++; return '<b>Chips '+jokerValue+'</b>'; }
    function jokerString() { return JSON.stringify(jmodifiers); }
    ${catalogSource}
    jredrawCards();
  `, context);
  assert.equal(context.renders, 150);
  vm.runInContext(`searchVal = 'chips'; jredrawCards(); searchVal = 'Joker 0,0'; jredrawCards();`, context);
  assert.equal(context.renders, 150, 'typing should not rerender all 150 descriptions');
  assert.match(context.jcardsDiv.innerHTML, /Joker 0,0/);
  assert.doesNotMatch(context.jcardsDiv.innerHTML, /Joker 0,1/);
  vm.runInContext(`jokerValue = 5; searchVal = 'chips 5'; jredrawCards();`, context);
  assert.match(context.jcardsDiv.innerHTML, /Chips 5/);
  assert.doesNotMatch(context.jcardsDiv.innerHTML, /Chips 0/);
  vm.runInContext(`jmodifiers.foil = true; jredrawCards();`, context);
  assert.match(context.jcardsDiv.innerHTML, /foil/);
  vm.runInContext(`jokerTexts[0][0] = ['本地化小丑', 'new template']; searchVal = '本地化'; jredrawCards();`, context);
  assert.match(context.jcardsDiv.innerHTML, /本地化小丑/);
  assert.doesNotMatch(context.jcardsDiv.innerHTML, /Joker 0,0/);
});

test('touch and reduced-motion backgrounds stay static; desktop animation can resume', () => {
  const source = readFileSync(new URL('../balatro-background.js', import.meta.url), 'utf8');
  const context = vm.createContext({ document: { hidden: false, readyState: 'loading', addEventListener() {} }, window: { addEventListener() {} } });
  vm.runInContext(`${source}\nthis.BalatroBG = BalatroBG;`, context);
  const bg = Object.create(context.BalatroBG.prototype);
  let started = 0, stopped = 0, rendered = 0;
  bg.prefersStaticBackground = { matches: true };
  bg.startRender = () => started++;
  bg.stopRender = () => stopped++;
  bg.render = () => rendered++;
  bg.updateAnimationState();
  assert.equal(started, 0);
  assert.equal(stopped, 1);
  assert.equal(rendered, 1);
  bg.prefersStaticBackground.matches = false;
  bg.updateAnimationState();
  assert.equal(started, 1);
  context.document.hidden = true;
  bg.updateAnimationState();
  assert.equal(stopped, 2);
});
