import fs from 'node:fs/promises';
import path from 'node:path';

// Static markup stays accessible to crawlers and visitors without JavaScript.
// Run after generating localized pages. Excludes apps, admin and test fixtures.
const ignored = new Set(['.git', 'node_modules', 'blueprint', 'blueprint-dist', 'admin', 'tests', 'i18n', '.codex', '.agents']);
const disclaimer = 'BalatroCalc is an unofficial fan tool, not affiliated with or endorsed by LocalThunk or Playstack. Balatro and related game assets belong to their respective rights holders.';
const footer = `<footer class="siteTrustFooter" lang="en" aria-label="Site information">
  <nav aria-label="Site information links"><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy-policy/">Privacy Policy</a><a href="/terms/">Terms</a></nav>
  <p>${disclaimer}</p>
</footer>`;
let changed = 0;
async function walk(dir) {
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || ignored.has(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!file.endsWith('.html') || /(?:debug|test|apk)\.html$/.test(file)) continue;
    const source = await fs.readFile(file, 'utf8');
    if (!source.includes('id="topNav"') || !source.includes('</body>')) continue;
    let html = source;
    if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) {
      html = html.replace(/\s*<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
    }
    if (html.includes('id="footerLinks"')) {
      if (!/href="\/contact\/"/.test(html)) {
        html = html.replace('<div id="footerLinks">', '<div id="footerLinks">\n      <a href="/contact/" lang="en">Contact</a>');
      }
      if (!html.includes('id="credits"') && !html.includes('class="siteTrustNotice"')) {
        html = html.replace(/(<div id="footerLinks">[\s\S]*?<\/div>)/, `$1\n    <p class="siteTrustNotice" lang="en">${disclaimer}</p>`);
      }
    } else if (!html.includes('class="siteTrustFooter"')) {
      html = html.replace('</body>', `${footer}\n</body>`);
    }
    if (html !== source) { await fs.writeFile(file, html); changed++; }
  }
}
await walk('.');
console.log(`Updated ${changed} public HTML files.`);
