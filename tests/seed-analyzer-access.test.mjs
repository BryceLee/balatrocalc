import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, '..');
const accessScript = fs.readFileSync(path.join(root, 'seed-analyzer-access.js'), 'utf8');
const seedPage = fs.readFileSync(path.join(root, 'balatro-seeds.html'), 'utf8');

new vm.Script(accessScript, { filename: 'seed-analyzer-access.js' });

const expectedSources = [
  'seed-generator',
  'popular-seeds',
  'recommended-seeds',
  'featured-joker',
  'seed-spotlight',
  'community-seed-library',
  'seed-list'
];

for (const source of expectedSources) {
  assert.match(
    accessScript,
    new RegExp(`['"]${source}['"]`),
    `${source} should participate in seed-page redirect quota handling`
  );
}

assert.match(accessScript, /SEED_PAGE_ANALYSIS_SOURCES\.has\(source\) && Boolean\(sourceToken\)/);
assert.doesNotMatch(accessScript, /source === ['"]seed-generator['"]/);
assert.match(accessScript, /skipProgrammaticAnalyzeCountUntil = Date\.now\(\) \+ 5000/);
assert.match(seedPage, /function analyzeSeedFromGenerator\(\) \{[\s\S]*?analyzeSeed\(seed, 'seed-generator'\);/);

for (const source of expectedSources.filter((value) => value !== 'seed-list')) {
  assert.match(
    seedPage,
    new RegExp(`['"]${source}['"]`),
    `seed page should emit the ${source} analysis source`
  );
}

console.log('seed analyzer access checks passed');
