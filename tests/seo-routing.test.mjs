import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(read('functions/api/_middleware.js')).toString('base64')}`);

test('sitemap URLs point directly to indexable pages with matching canonical URLs', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length > 30);
  assert.equal(new Set(urls).size, urls.length);
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, 'https://balatrocalc.com');
    const name = url.pathname === '/' ? 'index.html'
      : url.pathname.endsWith('/') ? `${url.pathname.slice(1)}index.html`
      : `${url.pathname.slice(1)}.html`;
    assert.ok(existsSync(resolve(root, name)), `${value} must serve a page directly`);
    const html = read(name);
    assert.doesNotMatch(html, /<meta\b[^>]*content="[^\"]*noindex/i, value);
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], value);
    assert.doesNotMatch(html, /http-equiv="refresh"/i, value);
  }
});

test('PayPal write endpoints reject crawler GET/HEAD without invoking payment handlers', async () => {
  for (const method of ['GET', 'HEAD']) {
    const response = await onRequest({
      request: new Request('https://balatrocalc.com/api/paypal/subscription-activate', { method }),
      next() { throw new Error('Payment handler must not run'); }
    });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'POST');
    assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
    if (method === 'HEAD') assert.equal(await response.text(), '');
  }
});

test('API fallbacks cannot expose an indexable homepage under an API URL', async () => {
  const response = await onRequest({
    request: new Request('https://balatrocalc.com/api/missing'),
    next: async () => new Response('<html>Homepage</html>', { headers: { 'Content-Type': 'text/html' } })
  });
  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});

test('valid API responses retain their status, body, cookies and payment behavior', async () => {
  for (const [path, method] of [['/api/subscription', 'GET'], ['/api/paypal/capture', 'POST']]) {
    const response = await onRequest({
      request: new Request(`https://balatrocalc.com${path}`, { method }),
      next: async () => new Response('{"ok":true}', {
        status: 201, headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'test=value; HttpOnly' }
      })
    });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('Set-Cookie'), 'test=value; HttpOnly');
    assert.deepEqual(await response.json(), { ok: true });
    assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  }
});
