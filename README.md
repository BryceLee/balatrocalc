# Balatro Calculator

[Go to site](https://efhiii.github.io/balatro-calculator/)

This tool lets you input a [Balatro](https://www.playbalatro.com/) hand with a specific scenario of jokers, hand upgrades, and drawn cards, and calculates what the highest scoring play is while showing you both what the play is and what it scores.

You can also use this tool to try and conceive of your "perfect hand" to see what it would score.

Currently, a couple of the jokers may not work correctly, but most of them do.

font used: https://managore.itch.io/m6x11

## i18n (32 languages)

This repo serves static HTML per language under `/<lang>/...` (SEO-friendly, easy static hosting).

- Language list: `i18n/languages.json`
- Embedded SEO content (below calculator): `i18n/seo/*.html`
- Generator: `tools/build-i18n.mjs`

Regenerate localized pages + `sitemap.xml`:

```bash
node tools/build-i18n.mjs --write
```
