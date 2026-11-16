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

## Website feedback

The `/feedback/` page sends the visitor's reply email and feedback to a private Feishu or Lark group through the Pages Function at `/api/feedback`.

1. Add a custom bot to the receiving group and store its webhook in the Pages project as the encrypted `FEEDBACK_FEISHU_WEBHOOK_URL` secret. If you enable signature verification on the bot, also set the encrypted `FEEDBACK_FEISHU_SIGNING_SECRET` secret.
2. Create a free Managed Turnstile widget for `balatrocalc.com`. In the same Pages environment, set `FEEDBACK_TURNSTILE_SITE_KEY` to its public site key and store its secret as the encrypted `FEEDBACK_TURNSTILE_SECRET`.
3. Deploy and submit a test from `/feedback/`. Confirm the success notice and check that the message and reply email both appear in the receiving group. For a preview deployment, use a widget configured for the preview hostname and a test group's webhook.

[Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets) · [Turnstile dashboard setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/) · [Feishu custom bot setup](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)


balatro-seed-finder？
googd or fun balatro seeds飙升
2
balatro seed searcher飙升
5
balatro seed analyzer+190%
balatro joker order calculator

# balatro 学习对象
https://github.com/EFHIII/balatro-calculator
https://github.com/miaklwalker/Blueprint

https://github.com/SpectralPack/Immolate
https://github.com/SpectralPack/TheSoul
https://github.com/izanagi1995/balatro-seed-finder
https://github.com/SpectralPack/
#？
https://github.com/blake502/balatro-mobile-maker

https://balatrolator.com/
https://balatrowiki.org/  攻略玩家
