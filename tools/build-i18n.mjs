import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = 'https://balatrocalc.com';
const IGNORE_HTML_PATHS = ['i18n/seo/'];
const SITEMAP_EXCLUDE_PATHS = new Set([
  'apk.html',
  'balatro-code-dbd.html',
  'balatro-deck.html',
  'debug.html',
  'paywall-test.html',
]);
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'admin', 'blueprint', 'blueprint-dist']);
const FALLBACK_INDEX_NOTICE = {
  it: {
    heading: 'Aggiornamento della pagina in italiano',
    body1: 'Il calcolatore resta disponibile in questa sezione linguistica.',
    body2: 'La guida dettagliata e i testi informativi sono ancora in traduzione. Per ora la versione inglese resta il riferimento piu completo.',
  },
  'pt-br': {
    heading: 'Atualizacao da pagina em portugues (BR)',
    body1: 'A calculadora continua disponivel nesta secao de idioma.',
    body2: 'O guia detalhado e os textos informativos ainda estao sendo traduzidos. Por enquanto, a versao em ingles continua sendo a referencia mais completa.',
  },
  'pt-pt': {
    heading: 'Atualizacao da pagina em portugues (PT)',
    body1: 'A calculadora continua disponivel nesta secao de idioma.',
    body2: 'O guia detalhado e os textos informativos ainda estao a ser traduzidos. Para ja, a versao em ingles continua a ser a referencia mais completa.',
  },
  uk: {
    heading: 'Оновлення української сторінки',
    body1: 'Калькулятор залишається доступним у цьому мовному розділі.',
    body2: 'Детальний гайд і довідкові тексти ще перекладаються. Поки що найповніша версія доступна англійською мовою.',
  },
  pl: {
    heading: 'Aktualizacja strony po polsku',
    body1: 'Kalkulator pozostaje dostepny w tej sekcji jezykowej.',
    body2: 'Szczegolowy poradnik i teksty informacyjne sa jeszcze tlumaczone. Na razie najbardziej kompletna pozostaje wersja angielska.',
  },
  nl: {
    heading: 'Update van de Nederlandstalige pagina',
    body1: 'De calculator blijft beschikbaar in deze taalversie.',
    body2: 'De uitgebreide gids en informatieve teksten worden nog vertaald. Voorlopig blijft de Engelstalige versie de volledigste referentie.',
  },
  sv: {
    heading: 'Uppdatering av den svenska sidan',
    body1: 'Kalkylatorn finns fortfarande tillganglig i den har spraksektionen.',
    body2: 'Den detaljerade guiden och informationstexterna oversatts fortfarande. Tills vidare ar den engelska versionen den mest kompletta referensen.',
  },
  no: {
    heading: 'Oppdatering av den norske siden',
    body1: 'Kalkulatoren er fortsatt tilgjengelig i denne sprakseksjonen.',
    body2: 'Den detaljerte guiden og informasjonstekstene oversettes fortsatt. Inntil videre er den engelske versjonen den mest komplette referansen.',
  },
  da: {
    heading: 'Opdatering af den danske side',
    body1: 'Beregneren er fortsat tilgaengelig i denne sprogsektion.',
    body2: 'Den detaljerede guide og informationsteksterne bliver stadig oversat. Indtil videre er den engelske version den mest komplette reference.',
  },
  fi: {
    heading: 'Suomenkielisen sivun paivitys',
    body1: 'Laskuri on edelleen kaytettavissa talla kielisivulla.',
    body2: 'Yksityiskohtaista opasta ja tietoteksteja kaannetaan edelleen. Toistaiseksi englanninkielinen versio on kattavin lahde.',
  },
  tr: {
    heading: 'Turkce sayfa guncellemesi',
    body1: 'Hesaplayici bu dil bolumunde kullanilmaya devam ediyor.',
    body2: 'Ayrintili rehber ve bilgilendirici metinler halen cevriliyor. Simdilik en kapsamli referans Ingilizce surumdur.',
  },
  ar: {
    heading: 'تحديث الصفحة العربية',
    body1: 'لا تزال الحاسبة متاحة في هذا القسم اللغوي.',
    body2: 'الدليل التفصيلي والنصوص التوضيحية ما زالت قيد الترجمة. حاليا تبقى النسخة الانجليزية هي المرجع الاكثر اكتمالا.',
  },
  he: {
    heading: 'עדכון העמוד בעברית',
    body1: 'המחשבון עדיין זמין בחלק השפתי הזה.',
    body2: 'המדריך המפורט וטקסטי ההסבר עדיין בתהליך תרגום. כרגע הגרסה באנגלית היא המקור המלא ביותר.',
  },
  hi: {
    heading: 'हिंदी पेज अपडेट',
    body1: 'यह कैलकुलेटर इस भाषा सेक्शन में उपलब्ध रहेगा।',
    body2: 'विस्तृत गाइड और जानकारी वाले टेक्स्ट अभी अनुवाद में हैं। फिलहाल English version सबसे पूरा reference है।',
  },
  id: {
    heading: 'Pembaruan halaman Bahasa Indonesia',
    body1: 'Kalkulator tetap tersedia di bagian bahasa ini.',
    body2: 'Panduan rinci dan teks informatif masih dalam proses terjemahan. Untuk saat ini, versi bahasa Inggris masih menjadi referensi yang paling lengkap.',
  },
  vi: {
    heading: 'Cap nhat trang tieng Viet',
    body1: 'Cong cu tinh van tiep tuc hoat dong trong phan ngon ngu nay.',
    body2: 'Huong dan chi tiet va cac noi dung giai thich van dang duoc dich. Hien tai, phien ban tieng Anh van la tai lieu day du nhat.',
  },
  th: {
    heading: 'อัปเดตหน้าภาษาไทย',
    body1: 'เครื่องคำนวณยังใช้งานได้ในส่วนภาษานี้',
    body2: 'คู่มือแบบละเอียดและข้อความอธิบายยังอยู่ระหว่างการแปล ตอนนี้เวอร์ชันภาษาอังกฤษยังเป็นข้อมูลอ้างอิงที่ครบที่สุด',
  },
  ms: {
    heading: 'Kemas kini halaman Bahasa Melayu',
    body1: 'Kalkulator masih tersedia dalam bahagian bahasa ini.',
    body2: 'Panduan terperinci dan teks penerangan masih sedang diterjemahkan. Buat masa ini, versi bahasa Inggeris masih menjadi rujukan yang paling lengkap.',
  },
  tl: {
    heading: 'Update ng pahinang Filipino',
    body1: 'Mananatiling available ang calculator sa seksyong ito ng wika.',
    body2: 'Isinasalin pa ang detalyadong guide at mga paliwanag. Sa ngayon, ang English version pa rin ang pinakakumpletong reference.',
  },
  ro: {
    heading: 'Actualizare pentru pagina in romana',
    body1: 'Calculatorul ramane disponibil in aceasta sectiune de limba.',
    body2: 'Ghidul detaliat si textele informative sunt inca in curs de traducere. Deocamdata, versiunea in engleza ramane referinta cea mai completa.',
  },
  hu: {
    heading: 'A magyar oldal frissitese',
    body1: 'A kalkulator tovabbra is elerheto ebben a nyelvi reszben.',
    body2: 'A reszletes utmutato es a tajekoztato szovegek forditasa meg folyamatban van. Jelenleg az angol verzio a legteljesebb hivatkozasi alap.',
  },
  cs: {
    heading: 'Aktualizace ceske stranky',
    body1: 'Kalkulacka zustava dostupna v teto jazykove sekci.',
    body2: 'Podrobny pruvodce a informacni texty se stale prekladaji. Zatim zustava anglicka verze nejuplnejsim zdrojem.',
  },
  el: {
    heading: 'Ενημερωση της ελληνικης σελιδας',
    body1: 'Ο υπολογιστης παραμενει διαθεσιμος σε αυτη τη γλωσσικη ενοτητα.',
    body2: 'Ο αναλυτικος οδηγος και τα κειμενα πληροφοριων εξακολουθουν να μεταφραζονται. Προς το παρον, η αγγλικη εκδοση παραμενει η πιο πληρης αναφορα.',
  },
};

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
  return html.replace(
    /<meta name="description"[\s\S]*?content="[^"]*"[\s\S]*?>/i,
    `<meta name="description" content="${description}">`,
  );
}

function setCanonical(html, canonicalHref) {
  return html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonicalHref}">`);
}

function setHreflangs(html, links) {
  const start = '<!-- I18N_HREFLANG_START -->';
  const end = '<!-- I18N_HREFLANG_END -->';
  const inner = links.join('\n');
  if (html.includes(start) && html.includes(end)) {
    return replaceBetween(html, start, end, inner);
  }
  return html.replace(
    /<link rel="canonical" href="[^"]*">/i,
    (match) => `${match}\n  ${start}\n${inner}\n  ${end}`,
  );
}

function setOgUrl(html, url) {
  return html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${url}">`);
}

function prefixLanguageLinks(
  html,
  code,
  {
    localizedHome = true,
    localizedHomeAnchors = true,
    localizedSeeds = false,
    localizedLegal = false,
  } = {},
) {
  if (code === 'en') return html;
  const prefix = `/${code}`;
  if (localizedHomeAnchors) {
    html = html.replaceAll('href="/#', `href="${prefix}/#`);
  }
  if (localizedHome) {
    html = html.replaceAll('href="/"', `href="${prefix}/"`);
  }
  if (localizedSeeds) {
    html = html.replaceAll('href="/balatro-seeds#', `href="${prefix}/balatro-seeds#`);
    html = html.replaceAll('href="/balatro-seeds"', `href="${prefix}/balatro-seeds"`);
  }
  if (localizedLegal) {
    html = html
      .replaceAll('href="/about/"', `href="${prefix}/about/"`)
      .replaceAll('href="/privacy-policy/"', `href="${prefix}/privacy-policy/"`)
      .replaceAll('href="/terms/"', `href="${prefix}/terms/"`);
  }
  return html;
}

function languageUrl(code, pathname) {
  if (code === 'en') return `${SITE_ORIGIN}${pathname}`;
  if (pathname === '/') return `${SITE_ORIGIN}/${code}/`;
  return `${SITE_ORIGIN}/${code}${pathname}`;
}

function buildIndexHreflangLinks(localizedIndexCodes, languages) {
  const indexedLangs = languages.filter((lang) => localizedIndexCodes.has(lang.code));
  const links = indexedLangs.map((lang) => {
    const href = languageUrl(lang.code, '/');
    return `  <link rel="alternate" hreflang="${lang.htmlLang}" href="${href}">`;
  });
  links.push(`  <link rel="alternate" hreflang="x-default" href="${languageUrl('en', '/')}">`);
  return links;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function shouldIgnoreHtmlPath(relPath) {
  return IGNORE_HTML_PATHS.some((prefix) => relPath.startsWith(prefix));
}

async function collectHtmlFiles(dir, relDir = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const entryRel = relDir ? path.join(relDir, entry.name) : entry.name;

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (shouldIgnoreHtmlPath(`${toPosixPath(entryRel)}/`)) continue;
      files.push(...(await collectHtmlFiles(entryPath, entryRel)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.html')) continue;
    const relPosix = toPosixPath(entryRel);
    if (shouldIgnoreHtmlPath(relPosix)) continue;
    files.push(relPosix);
  }

  return files;
}

function htmlPathToUrlPath(relPath) {
  if (relPath === 'index.html') return '/';
  if (relPath.endsWith('/index.html')) {
    return `/${relPath.slice(0, -'index.html'.length)}`;
  }
  if (relPath.endsWith('.html')) {
    return `/${relPath.slice(0, -'.html'.length)}`;
  }
  return `/${relPath}`;
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

function setMetaRobots(html, content) {
  const meta = `<meta name="robots" content="${content}">`;
  if (/<meta name="robots" content="[^"]*">/i.test(html)) {
    return html.replace(/<meta name="robots" content="[^"]*">/i, meta);
  }
  return html.replace(/<meta charset="[^"]*">\s*/i, (match) => `${match}  ${meta}\n`);
}

function buildFallbackIndexNotice(code) {
  const copy = FALLBACK_INDEX_NOTICE[code];
  if (!copy) {
    return `
<div id="seoContent" class="contentPageWrapBelow">
  <div class="contentCard">
    <h2 class="contentTitle">Translation update</h2>
    <p class="contentLead">This language section stays online while we finish the translated guide content.</p>
    <p>The calculator still works normally here, but the English pages remain the most complete reference for now.</p>
  </div>
</div>`.trim();
  }

  return `
<div id="seoContent" class="contentPageWrapBelow">
  <div class="contentCard">
    <h2 class="contentTitle">${copy.heading}</h2>
    <p class="contentLead">${copy.body1}</p>
    <p>${copy.body2}</p>
  </div>
</div>`.trim();
}

async function collectLocalizedIndexCodes(languages) {
  const localizedCodes = new Set(['en']);

  for (const lang of languages) {
    if (lang.code === 'en') continue;
    if (await fileExists(path.join('i18n', 'seo', `${lang.code}.html`))) {
      localizedCodes.add(lang.code);
    }
  }

  return localizedCodes;
}

function shouldIncludeInSitemap(relPath, localizedIndexCodes) {
  if (SITEMAP_EXCLUDE_PATHS.has(relPath)) return false;

  const parts = relPath.split('/');
  const first = parts[0];
  const hasLangPrefix =
    parts.length > 1 &&
    first !== 'about' &&
    first !== 'admin' &&
    first !== 'blog' &&
    first !== 'privacy-policy' &&
    first !== 'terms';

  if (!hasLangPrefix) return true;

  if (parts.length === 2 && parts[1] === 'index.html') {
    return localizedIndexCodes.has(first);
  }

  return false;
}

async function localizeIndex({ baseHtml, languages, lang, localizedIndexCodes }) {
  const locale = await loadLocale(lang.code);
  const optionsInner = renderLangOptions(languages, lang.code);
  const hasLocalizedIndexCopy = localizedIndexCodes.has(lang.code);
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

  const seoBlock = hasLocalizedIndexCopy
    ? await loadSeoBlock(lang.code, fallbackSeoBlock)
    : buildFallbackIndexNotice(lang.code);
  html = replaceBetween(html, seoStart, seoEnd, seoBlock);

  const optStart = '<!-- I18N_LANG_OPTIONS_START -->';
  const optEnd = '<!-- I18N_LANG_OPTIONS_END -->';
  html = replaceBetween(html, optStart, optEnd, optionsInner);

  html = setHtmlLang(html, lang.htmlLang, lang.dir);
  const defaultTitle = hasLocalizedIndexCopy
    ? 'Balatro Calculator - Calculate Hand Scores & Optimize Jokers'
    : `Balatro Calculator - ${lang.label}`;
  const defaultDescription = hasLocalizedIndexCopy
    ? 'Calculate the score of any Balatro hand'
    : 'Localized calculator access while the translated guide is still being prepared.';

  html = setTitle(html, locale.index?.title || defaultTitle);
  html = setMetaDescription(html, locale.index?.description || defaultDescription);

  const canonical = languageUrl(lang.code, '/');
  html = setCanonical(html, canonical);
  if (hasLocalizedIndexCopy) {
    html = setHreflangs(html, buildIndexHreflangLinks(localizedIndexCodes, languages));
  }
  html = setOgUrl(html, canonical);
  html = setMetaRobots(html, hasLocalizedIndexCopy ? 'index, follow' : 'noindex, follow');

  // Make root assets work from /<lang>/... both on HTTP and file://
  html = ensureBase(html, '../');
  html = prefixLanguageLinks(html, lang.code, {
    localizedHome: true,
    localizedHomeAnchors: true,
    localizedSeeds: true,
    localizedLegal: true,
  });
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

  const canonical = languageUrl(lang.code, '/balatro-seeds');
  html = setCanonical(html, canonical);
  html = setOgUrl(html, canonical);
  html = setMetaRobots(html, 'noindex, follow');
  html = ensureBase(html, '../');
  html = prefixLanguageLinks(html, lang.code, {
    localizedHome: true,
    localizedHomeAnchors: true,
    localizedSeeds: true,
    localizedLegal: true,
  });
  return html;
}

async function localizeLegal({ baseHtml, languages, lang, pagePath }) {
  const optionsInner = renderLangOptions(languages, lang.code);
  let html = baseHtml;

  const optStart = '<!-- I18N_LANG_OPTIONS_START -->';
  const optEnd = '<!-- I18N_LANG_OPTIONS_END -->';
  html = replaceBetween(html, optStart, optEnd, optionsInner);

  html = setHtmlLang(html, lang.htmlLang, lang.dir);
  const canonical = languageUrl(lang.code, pagePath);
  html = setCanonical(html, canonical);
  html = setOgUrl(html, canonical);
  html = setMetaRobots(html, 'noindex, follow');
  html = ensureBase(html, '../../');
  html = prefixLanguageLinks(html, lang.code, {
    localizedHome: true,
    localizedHomeAnchors: true,
    localizedSeeds: true,
    localizedLegal: true,
  });
  return html;
}

async function buildSitemapXmlFromFiles(localizedIndexCodes) {
  const lastmod = todayISO();
  const htmlFiles = await collectHtmlFiles('.');
  const urlPaths = htmlFiles
    .filter((relPath) => shouldIncludeInSitemap(relPath, localizedIndexCodes))
    .map(htmlPathToUrlPath);
  const uniquePaths = Array.from(new Set(urlPaths)).sort();
  const urls = uniquePaths.map((pathname) => {
    return `
  <url>
    <loc>${SITE_ORIGIN}${pathname}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`.trim();
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

async function main() {
  const write = process.argv.includes('--write');
  const languages = JSON.parse(await readText(path.join('i18n', 'languages.json')));
  const localizedIndexCodes = await collectLocalizedIndexCodes(languages);

  const baseIndex = await readText('index.html');
  const baseSeeds = await readText('balatro-seeds.html');
  const baseAbout = await readText(path.join('about', 'index.html'));
  const basePrivacy = await readText(path.join('privacy-policy', 'index.html'));
  const baseTerms = await readText(path.join('terms', 'index.html'));

  const outputs = [];

  for (const lang of languages) {
    if (lang.code === 'en') continue;
    const localizedIndex = await localizeIndex({ baseHtml: baseIndex, languages, lang, localizedIndexCodes });
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

  const sitemap = await buildSitemapXmlFromFiles(localizedIndexCodes);
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
