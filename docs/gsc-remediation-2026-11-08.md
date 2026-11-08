# GSC audit and fixes — 2026-11-08

Read the authenticated Search Console property `sc-domain:balatrocalc.com`.

## Findings

Index report updated October 23: 33 indexed, 84 excluded.

| Reason | URLs | Assessment |
| --- | ---: | --- |
| noindex | 59 | Examples are unfinished translations (`/nl/`, `/sv/`, `/pl/`, `/da/about/`, etc.). Deliberate exclusions retained. |
| Redirect | 14 | Includes expected HTTP/www/HTML aliases, plus blog directory URLs incorrectly submitted without trailing slashes. |
| Alternate with canonical | 4 | Three calculator/seed query variants are expected. `/api/paypal/create-subscription` incorrectly serves the homepage on GET. |
| Crawled, not indexed | 5 | `/api/paypal/subscription-activate`, both deck-guide slash variants, `/da/seed-2F4TYFD8`, `/blog/`. |
| Discovered, not indexed | 2 | `/balatro-max-hand-size`, `/blog`. |

Web Vitals report updated November 6: desktop CLS 0.30 for a 23-URL group; mobile INP 317 ms for a 23-URL group. These groups may overlap. HTTPS report November 7: no problems. Breadcrumb report November 6: 3 valid, 0 invalid. Sitemap read November 3: success, 38 pages.

## Changes

- Blog canonical URLs, Open Graph/structured data, internal links and redirect destinations now use the trailing-slash directory URLs actually served by Pages. Flat `.html` assets retain extensionless URLs.
- API middleware returns JSON 404 instead of the static homepage fallback, rejects GET/HEAD on PayPal POST endpoints with 405, and adds `X-Robots-Tag: noindex, nofollow, noarchive` to API responses. Crawlers remain able to see this header; `/api/` is not blocked in robots.txt.
- Existing English seed guide moved from the Danish path to `/seed-2F4TYFD8`; old paths 301 to it; seed-hub links updated.
- Sitemap regenerated with 38 canonical pages. Generator uses newly generated robots metadata in the same pass and dates uncommitted changes correctly. `--sitemap-only --write` permits sitemap refresh without regenerating translated pages.
- Font preload plus `font-display: optional` prevents a late font swap. A slow first visit can keep its system fallback for that page view; cached/early fonts retain the pixel face. Public stylesheet URLs are versioned for this change.
- Joker search reuses rendered descriptions/previews, with invalidation for counter, edition and localized text changes. Touch/reduced-motion devices render the background once rather than running a continuous shader.
- Homepage now links directly to the max-hand-size builder. Contact and score-troubleshooting navigation expose Hand Levels consistently.
- Removed the invalid absolute-source `_redirects` entry; the existing hostname middleware continues the www redirect.

## Verification

- Full existing `npm test` suite passed; six new SEO/performance tests passed and are included in `npm test`.
- Pages Functions compile passed.
- Local Pages runtime: all 38 sitemap URLs return 200 without following redirects; PayPal GET examples return 405 + noindex; unknown API returns JSON 404 + noindex; legacy deck/seed URLs redirect to their canonical replacements.
- Controlled Chrome audit, third-party scripts excluded and font delayed 1.2 seconds: at 1365×768, baseline CLS 0.0263 with attributed font-related navigation/text movement; after fix no layout-shift entries were recorded. Baseline at the original desktop viewport was 0.0151. These are local load measurements, not the production 0.30 field score.
- Browser search for Blueprint yields one correct result. Preview cache test reduces description renders during subsequent searches from 150 per search to zero, while counter/edition/translation changes refresh correctly.
- Isolated full localization build: removing the German SEO translation immediately produces a noindex German homepage and excludes it from the sitemap in the same build.

## Limits and follow-up

The font issue is one reproduced CLS contributor; it does not explain the entire production 0.30. Auto-ad placement, stored version-2 state and iframe resizing remain potential field contributors that were not established by this controlled audit. No AdSense settings were changed. INP changes reduce known work but have not been validated on actual slow mobile hardware. Google indexing and field Web Vitals need recrawling and fresh real-user data; no indexing or field-score improvement is guaranteed by a successful deployment.

References: [Google indexing report](https://support.google.com/webmasters/answer/7440203), [Cloudflare page routing](https://developers.cloudflare.com/pages/configuration/serving-pages/), [CLS diagnosis](https://web.dev/articles/optimize-cls).
