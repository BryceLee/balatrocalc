import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, '..');
const html = fs.readFileSync(path.join(root, 'balatro-max-hand-size.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'max-hand-size.js'), 'utf8');
const languageHandler = fs.readFileSync(path.join(root, 'languageHandler.js'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
const blog = fs.readFileSync(path.join(root, 'blog', 'index.html'), 'utf8');
const handLevels = fs.readFileSync(path.join(root, 'balatro-hand-levels.html'), 'utf8');
const jokers = fs.readFileSync(path.join(root, 'balatro-jokers.html'), 'utf8');
const socialPng = fs.statSync(path.join(root, 'assets', 'balatro-max-hand-size-guide.png'));

assert.match(html, /<title>Balatro Max Hand Size: Default, Maximum &amp; Every Increase<\/title>/);
assert.match(html, /<h1>Balatro Max Hand Size<\/h1>/);
assert.match(html, /<link rel="canonical" href="https:\/\/balatrocalc\.com\/balatro-max-hand-size">/);
assert.match(html, /Balatro's default hand size is <strong>8 cards<\/strong>/);
assert.match(html, /no single hard maximum/);
assert.match(html, /Verified against Balatro game source 1\.0\.1o/);
assert.match(html, /max\(0, current size \+ modifier\)/);
assert.match(html, /No upper clamp follows this calculation\./);

const methodRows = [...html.matchAll(/<tr data-method-row data-method-type="(increase|decrease)">/g)];
assert.equal(methodRows.length, 12, 'the guide should index all 12 normal-run hand-size methods');
assert.equal(methodRows.filter((match) => match[1] === 'increase').length, 7);
assert.equal(methodRows.filter((match) => match[1] === 'decrease').length, 5);

for (const method of ['Painted Deck', 'Juggler', 'Troubadour', 'Turtle Bean', 'Paint Brush', 'Palette', 'Juggle Tag', 'Merry Andy', 'Stuntman', 'Ouija', 'Ectoplasm', 'The Manacle']) {
  assert.match(html, new RegExp(`<strong>${method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/strong>`));
}

assert.match(html, /<option value="8">Normal deck · 8 cards<\/option>/);
assert.match(html, /<option value="10">Painted Deck · 10 cards<\/option>/);
assert.equal((html.match(/data-flat-modifier=/g) || []).length, 4);
assert.equal((html.match(/data-per-copy=/g) || []).length, 5);
assert.match(script, /const ectoplasmPenalty = -\(ectoplasmUses \* \(ectoplasmUses \+ 1\) \/ 2\);/);
assert.match(script, /const effectiveTotal = Math\.max\(0, rawTotal\);/);
assert.match(script, /if \(palette\.checked\) paintBrush\.checked = true;/);
new vm.Script(script, { filename: 'max-hand-size.js' });

const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.equal(jsonLdBlocks.length, 3);
for (const block of jsonLdBlocks) JSON.parse(block[1]);

assert.ok(socialPng.size > 100_000, 'social preview should be a rendered 1200x630 PNG');
assert.match(html, /assets\/balatro-max-hand-size-guide\.png/);
assert.match(languageHandler, /'\/balatro-max-hand-size'/);
assert.match(languageHandler, /'\/balatro-max-hand-size\.html'/);
assert.match(sitemap, /<loc>https:\/\/balatrocalc\.com\/balatro-max-hand-size<\/loc>/);
assert.match(redirects, /\/balatro-max-hand-size\.html \/balatro-max-hand-size 301/);
assert.match(blog, /href="\/balatro-max-hand-size"/);
assert.match(handLevels, /href="\/balatro-max-hand-size"/);
assert.match(jokers, /href="\/balatro-max-hand-size"/);

console.log('max hand size page checks passed');
