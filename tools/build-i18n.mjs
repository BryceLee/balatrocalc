import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = 'https://balatrocalc.com';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function replaceBetween(html, startMarker, endMarker, replacementInner) {
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Markers not found: ${startMarker} ... ${endMarker}`);
  }
  const before = html.slice(0, startIndex + startMarker.length);
  const after = html.slice(endIndex);
  return `${before}\n${replacementInner}\n${after}`;
}

function ensureBase(html, baseHref) {
  const baseTagRegex = /<base href="[^"]*"\s*>/i;
  if (baseTagRegex.test(html)) {
    return html.replace(baseTagRegex, `<base href="${baseHref}">`);
  }
  // Insert base right after <title>…</title> to keep it early in <head>.
  const titleCloseRegex = /<\/title>/i;
  if (!titleCloseRegex.test(html)) throw new Error('No </title> found to insert <base>');
  return html.replace(titleCloseRegex, `</title>\n    <base href="${baseHref}">`);
}

function renderLangOptions(languages, selectedCode) {
  return languages
    .map((lang) => {
      const selected = lang.code === selectedCode ? ' selected' : '';
      return `          <option value="${lang.code}"${selected}>${lang.label}</option>`;
    })
    .join('\n');
}

function setHtmlLang(html, htmlLang, dir) {
  return html.replace(/<html\s+lang="[^"]*"\s+dir="[^"]*">/i, `<html lang="${htmlLang}" dir="${dir}">`);
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
}

function setMetaDescription(html, description) {
  return html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${description}">`);
}

function setCanonical(html, canonicalHref) {
  return html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonicalHref}">`);
}

function setOgUrl(html, url) {
  return html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
}

function prefixLanguageLinks(html, code) {
  if (code === 'en') return html;
  const prefix = `/${code}`;
  // Keep root-only pages (support/apk/debug) at root
  html = html
    .replaceAll('href="/#', `href="${prefix}/#`)
    .replaceAll('href="/balatro-seeds.html"', `href="${prefix}/balatro-seeds.html"`)
    .replaceAll('href="/about/"', `href="${prefix}/about/"`)
    .replaceAll('href="/privacy-policy/"', `href="${prefix}/privacy-policy/"`)
    .replaceAll('href="/terms/"', `href="${prefix}/terms/"`)
    .replaceAll('href="/"', `href="${prefix}/"`);
  return html;
}

function languageUrl(code, pathname) {
  if (code === 'en') return `${SITE_ORIGIN}${pathname}`;
  if (pathname === '/') return `${SITE_ORIGIN}/${code}/`;
  return `${SITE_ORIGIN}/${code}${pathname}`;
}

async function loadLocale(code) {
  const localePath = path.join('i18n', 'locales', `${code}.json`);
  if (!(await fileExists(localePath))) return {};
  return JSON.parse(await readText(localePath));
}

async function loadSeoBlock(code, fallbackSeoBlock) {
  const seoPath = path.join('i18n', 'seo', `${code}.html`);
  if (await fileExists(seoPath)) return (await readText(seoPath)).trim();
  return fallbackSeoBlock;
}

async function localizeIndex({ baseHtml, languages, lang }) {
  const locale = await loadLocale(lang.code);
  const optionsInner = renderLangOptions(languages, lang.code);
  let html = baseHtml;

  // Extract base SEO block for fallback (English)
  const seoStart = '<!-- I18N_SEO_BLOCK_START -->';
  const seoEnd = '<!-- I18N_SEO_BLOCK_END -->';
  const seoStartIndex = html.indexOf(seoStart);
  const seoEndIndex = html.indexOf(seoEnd);
  if (seoStartIndex === -1 || seoEndIndex === -1) throw new Error('SEO block markers missing in index.html');
  const fallbackSeoBlock = html
    .slice(seoStartIndex + seoStart.length, seoEndIndex)
    .trim();

  const seoBlock = await loadSeoBlock(lang.code, fallbackSeoBlock);
  html = replaceBetween(html, seoStart, seoEnd, seoBlock);

  const optStart = '<!-- I18N_LANG_OPTIONS_START -->';
  const optEnd = '<!-- I18N_LANG_OPTIONS_END -->';
  html = replaceBetween(html, optStart, optEnd, optionsInner);

  html = setHtmlLang(html, lang.htmlLang, lang.dir);
  html = setTitle(html, locale.index?.title || 'Balatro Calculator - Calculate Hand Scores & Optimize Jokers');
  html = setMetaDescription(html, locale.index?.description || 'Calculate the score of any Balatro hand');

  const canonical = languageUrl(lang.code, '/');
  html = setCanonical(html, canonical);
  html = setOgUrl(html, canonical);

  // Make root assets work from /<lang>/... both on HTTP and file://
  html = ensureBase(html, '../');
  html = prefixLanguageLinks(html, lang.code);
  return html;
}

async function localizeSeeds({ baseHtml, languages, lang }) {
  const locale = await loadLocale(lang.code);
  const optionsInner = renderLangOptions(languages, lang.code);
  let html = baseHtml;

  const optStart = '<!-- I18N_LANG_OPTIONS_START -->';
  const optEnd = '<!-- I18N_LANG_OPTIONS_END -->';
  html = replaceBetween(html, optStart, optEnd, optionsInner);

  html = setHtmlLang(html, lang.htmlLang, lang.dir);
  html = setTitle(html, locale.seeds?.title || 'Balatro Seeds - balatrocalc');
  html = setMetaDescription(html, locale.seeds?.description || 'Balatro seeds collection and generator');

  const canonical = languageUrl(lang.code, '/balatro-seeds.html');
  html = setCanonical(html, canonical);
  html = ensureBase(html, '../');
  html = prefixLanguageLinks(html, lang.code);
  return html;
}

async function localizeLegal({ baseHtml, languages, lang, pagePath }) {
  const optionsInner = renderLangOptions(languages, lang.code);
  let html = baseHtml;

  const optStart = '<!-- I18N_LANG_OPTIONS_START -->';
  const optEnd = '<!-- I18N_LANG_OPTIONS_END -->';
  html = replaceBetween(html, optStart, optEnd, optionsInner);

  html = setHtmlLang(html, lang.htmlLang, lang.dir);
  html = setCanonical(html, languageUrl(lang.code, pagePath));
  html = ensureBase(html, '../../');
  html = prefixLanguageLinks(html, lang.code);
  return html;
}

function buildSitemapXml(languages) {
  const lastmod = todayISO();

  const homeAlternates = languages
    .map((lang) => {
      const href = lang.code === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${lang.code}/`;
      return `    <xhtml:link rel="alternate" hreflang="${lang.htmlLang}" href="${href}"/>`;
    })
    .join('\n');

  const urls = [];

  urls.push(`
  <url>
    <loc>${SITE_ORIGIN}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${homeAlternates}
  </url>`.trim());

  const rootPages = ['/balatro-seeds.html', '/about/', '/privacy-policy/', '/terms/'];
  for (const pathname of rootPages) {
    urls.push(`
  <url>
    <loc>${SITE_ORIGIN}${pathname}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${pathname === '/balatro-seeds.html' ? 'weekly' : 'yearly'}</changefreq>
    <priority>${pathname === '/balatro-seeds.html' ? '0.8' : '0.3'}</priority>
  </url>`.trim());
  }

  for (const lang of languages) {
    if (lang.code === 'en') continue;
    const langHome = `${SITE_ORIGIN}/${lang.code}/`;
    urls.push(`
  <url>
    <loc>${langHome}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`.trim());
    for (const pathname of rootPages) {
      const loc = pathname === '/' ? langHome : `${SITE_ORIGIN}/${lang.code}${pathname}`;
      urls.push(`
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${pathname === '/balatro-seeds.html' ? 'weekly' : 'yearly'}</changefreq>
    <priority>${pathname === '/balatro-seeds.html' ? '0.7' : '0.3'}</priority>
  </url>`.trim());
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

async function main() {
  const write = process.argv.includes('--write');
  const languages = JSON.parse(await readText(path.join('i18n', 'languages.json')));

  const baseIndex = await readText('index.html');
  const baseSeeds = await readText('balatro-seeds.html');
  const baseAbout = await readText(path.join('about', 'index.html'));
  const basePrivacy = await readText(path.join('privacy-policy', 'index.html'));
  const baseTerms = await readText(path.join('terms', 'index.html'));

  const outputs = [];

  for (const lang of languages) {
    if (lang.code === 'en') continue;
    const localizedIndex = await localizeIndex({ baseHtml: baseIndex, languages, lang });
    const localizedSeeds = await localizeSeeds({ baseHtml: baseSeeds, languages, lang });
    const localizedAbout = await localizeLegal({ baseHtml: baseAbout, languages, lang, pagePath: '/about/' });
    const localizedPrivacy = await localizeLegal({ baseHtml: basePrivacy, languages, lang, pagePath: '/privacy-policy/' });
    const localizedTerms = await localizeLegal({ baseHtml: baseTerms, languages, lang, pagePath: '/terms/' });

    outputs.push([path.join(lang.code, 'index.html'), localizedIndex]);
    outputs.push([path.join(lang.code, 'balatro-seeds.html'), localizedSeeds]);
    outputs.push([path.join(lang.code, 'about', 'index.html'), localizedAbout]);
    outputs.push([path.join(lang.code, 'privacy-policy', 'index.html'), localizedPrivacy]);
    outputs.push([path.join(lang.code, 'terms', 'index.html'), localizedTerms]);
  }

  const sitemap = buildSitemapXml(languages);
  outputs.push(['sitemap.xml', sitemap]);

  if (!write) {
    console.log(`Planned outputs: ${outputs.length} files`);
    console.log(`Run: node tools/build-i18n.mjs --write`);
    return;
  }

  for (const [outPath, content] of outputs) {
    await ensureDirForFile(outPath);
    await fs.writeFile(outPath, content, 'utf8');
  }

  console.log(`Wrote ${outputs.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
