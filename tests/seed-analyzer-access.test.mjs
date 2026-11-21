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

// Free quota: 3 to start, then 1 per UTC day.
assert.match(accessScript, /const FREE_INITIAL_RUNS = 3;/);
assert.match(accessScript, /const FREE_DAILY_RUNS = 1;/);
assert.doesNotMatch(accessScript, /FREE_DAILY_LIMIT|FREE_TOTAL_LIMIT/);

// Funnel tracking: plan_selected only on real clicks, pay_clicked before email validation.
assert.match(accessScript, /input\.checked && event\.isTrusted/);
assert.match(accessScript, /track\('pay_clicked'[\s\S]*?if \(!validateEmail\(email\)\)/);
const eventsApi = fs.readFileSync(path.join(root, 'functions/api/events.js'), 'utf8');
assert.match(eventsApi, /'pay_clicked'/);

// Prices: charge amounts and every paywall must agree.
const utilsSrc = fs.readFileSync(path.join(root, 'functions/api/_utils.js'), 'utf8');
assert.match(utilsSrc, /yearly: \{ amount: 49, days: 365 \}/);
assert.match(utilsSrc, /lifetime: \{ amount: 100, days: null \}/);
const paywallPages = ['balatro-seed-analyzer.html', 'balatro-seeds.html',
  ...fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, 'balatro-seeds.html'))).map((d) => `${d}/balatro-seeds.html`)];
for (const page of paywallPages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.match(html, />\$49 \/ 365 days</, `${page} yearly price`);
  assert.match(html, />\$100 one-time</, `${page} lifetime price`);
  assert.doesNotMatch(html, /Limited-time offer|\$39|\$88/, `${page} has no leftover sale copy`);
  assert.match(html, /data-member-renew/, `${page} renew entry hidden for lifetime members`);
}

// Remove-ads: $3 one-time product, sandboxed ad frame without top navigation.
assert.match(utilsSrc, /noads: \{\s*lifetime: \{ amount: 3, days: null \}/);
const adSlot = fs.readFileSync(path.join(root, 'ad-slot.js'), 'utf8');
assert.match(adSlot, /const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';/);
assert.doesNotMatch(adSlot, /allow-top-navigation|allow-same-origin/);
assert.match(adSlot, /isActive\(features\.noads, 'noads'\) \|\| isActive\(features\.seed, 'seed'\)/);
assert.match(eventsApi, /'remove_ads_clicked'/);
assert.match(eventsApi, /'ad_exposure'/);
assert.match(eventsApi, /'ad_viewed'/);
assert.match(adSlot, /const HOLDOUT_SHARE = 0\.2;/);

// Ads are off in the US and when the country is unknown.
assert.match(adSlot, /const NO_AD_COUNTRIES = new Set\(\['US'\]\);/);
assert.match(adSlot, /const geoOff = !country \|\| NO_AD_COUNTRIES\.has\(country\);/);
const middlewareSrc = fs.readFileSync(path.join(root, 'functions/_middleware.js'), 'utf8');
const countryTagSrc = middlewareSrc.match(/export function countryTag\(request\) \{[\s\S]*?\n\}/)[0].replace('export ', '');
const countryTag = new Function(`${countryTagSrc}; return countryTag;`)();
const fakeRequest = (country, header) => ({ cf: country ? { country } : undefined, headers: { get: () => header || null } });
assert.equal(countryTag(fakeRequest('US')), '<script>window.bcCountry="US";</script>');
assert.equal(countryTag(fakeRequest(null, 'de')), '<script>window.bcCountry="DE";</script>');
assert.equal(countryTag(fakeRequest('</script><script>alert(1)')), '<script>window.bcCountry="";</script>');

console.log('seed analyzer access checks passed');
