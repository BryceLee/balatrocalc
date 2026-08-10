import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, '..');
const html = fs.readFileSync(path.join(root, 'balatro-hand-levels.html'), 'utf8');
const homeHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'hand-levels.js'), 'utf8');
const scalingChartSvg = fs.readFileSync(path.join(root, 'assets', 'balatro-hand-level-scaling-chart.svg'), 'utf8');
const scalingChartPng = fs.statSync(path.join(root, 'assets', 'balatro-hand-level-scaling-chart.png'));
const languageHandler = fs.readFileSync(path.join(root, 'languageHandler.js'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');

const ignoredHtmlDirectories = new Set([
  '.git',
  'admin',
  'blueprint',
  'blueprint-dist',
  'node_modules'
]);

function collectHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (ignoredHtmlDirectories.has(entry.name)) return [];
      return collectHtmlFiles(path.join(directory, entry.name));
    }

    return entry.isFile() && entry.name.endsWith('.html')
      ? [path.join(directory, entry.name)]
      : [];
  });
}

const expectedHands = [
  ['Flush Five', 160, 16, 50, 3, true],
  ['Flush House', 140, 14, 40, 4, true],
  ['Five of a Kind', 120, 12, 35, 3, true],
  ['Straight Flush', 100, 8, 40, 4, false],
  ['Four of a Kind', 60, 7, 30, 3, false],
  ['Full House', 40, 4, 25, 2, false],
  ['Flush', 35, 4, 15, 2, false],
  ['Straight', 30, 4, 30, 3, false],
  ['Three of a Kind', 30, 3, 20, 2, false],
  ['Two Pair', 20, 2, 20, 1, false],
  ['Pair', 10, 2, 15, 1, false],
  ['High Card', 5, 1, 10, 1, false]
];

const rowMatches = [...html.matchAll(/<tr data-hand-row\s+([^>]+)>/g)];
assert.equal(rowMatches.length, 12, 'page should render all 12 hand rows in HTML');

function attribute(attributes, name) {
  const match = attributes.match(new RegExp(`data-${name}="([^"]+)"`));
  assert.ok(match, `missing data-${name}`);
  return match[1];
}

for (const [index, expected] of expectedHands.entries()) {
  const attributes = rowMatches[index][1];
  const [name, baseChips, baseMult, chipsGrowth, multGrowth, secret] = expected;
  assert.equal(attribute(attributes, 'hand-name'), name);
  assert.equal(Number(attribute(attributes, 'base-chips')), baseChips);
  assert.equal(Number(attribute(attributes, 'base-mult')), baseMult);
  assert.equal(Number(attribute(attributes, 'chips-growth')), chipsGrowth);
  assert.equal(Number(attribute(attributes, 'mult-growth')), multGrowth);
  assert.equal(attribute(attributes, 'secret') === 'true', secret);
}

const levelSequences = [...html.matchAll(/<details class="level-sequence[^>]*>([\s\S]*?)<\/details>/g)];
assert.equal(levelSequences.length, 12, 'page should include a Level 1-15 sequence for every hand');
for (const sequence of levelSequences) {
  assert.equal((sequence[1].match(/<b>L\d+<\/b>/g) || []).length, 15, 'every sequence should contain 15 levels');
}

const handAnchorIds = [...html.matchAll(/<details class="level-sequence[^>]*\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(handAnchorIds.length, 12, 'every hand sequence should expose a direct anchor');
assert.equal(new Set(handAnchorIds).size, 12, 'hand sequence anchors should be unique');
for (const id of handAnchorIds) {
  assert.match(html, new RegExp(`href="#${id}"`), `${id} should have a jump link`);
}

assert.match(html, /<link rel="canonical" href="https:\/\/balatrocalc\.com\/balatro-hand-levels">/);
assert.match(html, /Verified against Balatro game source 1\.0\.1o/);
assert.match(html, /No level cap in the game source\./);
assert.match(html, /<h2 id="scaling-heading">Balatro Hand Level Scaling Formula<\/h2>/);
assert.match(html, /<img src="assets\/balatro-hand-level-scaling-chart\.svg"/);
assert.match(html, /Level 15 and Level 50 are convenient chart presets, not maximums\./);
assert.match(html, /L15 and L50 are only convenient chart presets\./);
assert.match(scalingChartSvg, /<title id="title">Balatro hand level scaling chart<\/title>/);
assert.ok(scalingChartPng.size > 100_000, 'social preview PNG should be a real rendered chart');
assert.match(html, /<meta property="og:image" content="https:\/\/balatrocalc\.com\/assets\/balatro-hand-level-scaling-chart\.png">/);
assert.doesNotMatch(html, /id="handLevelInput"[^>]*\bmax=/);
assert.match(sitemap, /<loc>https:\/\/balatrocalc\.com\/balatro-hand-levels<\/loc>/);
assert.match(redirects, /\/balatro-hand-levels\.html \/balatro-hand-levels 301/);
assert.match(languageHandler, /'\/balatro-hand-levels'/);
assert.match(languageHandler, /'\/balatro-hand-levels\.html'/);

function navDestinations(documentHtml) {
  const nav = documentHtml.match(/<nav id="topNav"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'top navigation should exist');
  return [...nav[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map((match) => [match[1], match[2].trim()]);
}

const htmlFilesWithTopNav = collectHtmlFiles(root)
  .map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')])
  .filter(([, documentHtml]) => /<nav[^>]+id="topNav"/i.test(documentHtml));

assert.ok(htmlFilesWithTopNav.length > 100, 'site navigation coverage should include localized pages');
for (const [filePath, documentHtml] of htmlFilesWithTopNav) {
  const relativePath = path.relative(root, filePath);
  const destinations = navDestinations(documentHtml);
  const handLevelTabs = destinations.filter(([href]) => href === '/balatro-hand-levels');
  assert.equal(
    handLevelTabs.length,
    1,
    `${relativePath} should expose exactly one Hand Levels tab`
  );

  const calculatorIndex = destinations.findIndex(([, label]) => label === 'calculator');
  const handLevelsIndex = destinations.findIndex(([href]) => href === '/balatro-hand-levels');
  assert.equal(
    handLevelsIndex,
    calculatorIndex + 1,
    `${relativePath} should place Hand Levels after calculator`
  );
}

assert.deepEqual(
  navDestinations(html),
  navDestinations(homeHtml),
  'Hand Levels and homepage should expose the same navigation tabs'
);
assert.match(homeHtml, /href="\/" class="nav-link nav-link--active">calculator<\/a>/);
assert.match(html, /href="\/balatro-hand-levels" class="nav-link nav-link--active">hand levels<\/a>/);
assert.match(html, /<select id="langSelect"[^>]*aria-label="Language">/);
assert.match(html, /<script src="languageHandler\.js"><\/script>/);

new vm.Script(script, { filename: 'hand-levels.js' });

const straightLevel10 = {
  chips: 30 + (10 - 1) * 30,
  mult: 4 + (10 - 1) * 3
};
assert.deepEqual(straightLevel10, { chips: 300, mult: 31 });

console.log('hand levels page checks passed');
