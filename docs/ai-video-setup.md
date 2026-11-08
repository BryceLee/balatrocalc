# AI Video administrator preview

Entry: `/admin/` → **AI Video**, or `/admin/ai-video/` directly.
This is a private administrator module. It uses the existing Basic-auth email
allowlist and password (`ADMIN_ALLOWED_EMAILS` / `ADMIN_EMAIL`, `ADMIN_PASS`),
not the public AI Advisor Google account or its Credits wallet. There is no
public navigation entry. Every page, script, upload, job, photo and video route
is behind the administrator middleware and has private/no-store headers.
Records are scoped to the authenticated administrator email.

## Local preview

```sh
npm run video:db:local
npm run video:dev
```

Open `http://127.0.0.1:8791/admin/ai-video/`.
Local-only login: `admin@example.test` / `local-preview-only`.
The explicit `wrangler.video-local.jsonc` config initializes local D1; the dev
command supplies local D1/R2 bindings directly (Pages does not accept a custom
config filename). Do not use this configuration for deployment. Generation is disabled, no provider key is
included, and the public production Pages configuration is untouched.
You can inspect the interface, prepare photos, and check authorization locally.
The local compatibility date is pinned to 2026-10-08, the latest supported by
the installed Wrangler 4.147.0 runtime. Production compatibility settings are
not changed by this local configuration.

## Cloudflare Pages setup

1. Apply `docs/ai-video-d1.sql` to the site's preview and production D1 databases
   bound as `DB`, before deploying the feature. The new `ai_video_jobs` table
   is separate from membership, AI Advisor conversations, and credit ledgers.
2. Create a dedicated **private** BalatroCalc R2 bucket and bind it as
   `AI_VIDEO_BUCKET` separately in preview and production. Keep public R2
   access disabled. Do not bind AIVideoGG storage or databases to this site.
3. Configure a dedicated, restricted 302.AI secret `AI_VIDEO_302_API_KEY` with
   permission for `wan3.0-video` and provider-level budget limits. Do not reuse
   the AI Advisor text-model key or copy AIVideoGG credentials automatically.
4. Set `AI_VIDEO_ENABLED=true` only when ready to allow administrator-paid
   submissions. Missing configuration/schema disables the generate button
   and submission API. The switch blocks new submissions; existing jobs can
   still be queried and downloaded with the original provider key and storage.
5. Deploy through the site's existing Pages release flow. Verify anonymous
   requests to the page and APIs return 401; an allowed admin can prepare a
   photo and see readiness/history. Never log secrets, data URIs, signed output
   URLs, or raw provider error messages.

Binding setup: [Cloudflare Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/).

## Generation contract

The browser removes original image metadata by drawing onto a white canvas,
exports a JPEG with maximum side 1600 px, and sends at most 2 MB of image data.
The server bounds the request and validates JPEG framing/dimensions/settings
before any provider request. Images must have a shortest side of at least 240 px.

The server sends one `reference_image` as a data URI to the same 302.AI Wan 3.0
API family used by AIVideoGG. The prompt requests a recognizable jester
performing a dance or rap, with generated audio. Controls are 6/10 seconds,
480P/720P, and 9:16/16:9. These are starter prompts, not an approved visual
template or verified likeness/lip-sync result. Motion, costume, lyrics and
style references can be tuned later without changing the private job flow.

References: [302.AI Wan 3.0](https://doc.302.ai/507339575e0),
[Wan 3.0 media and settings contract](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference).

## Task lifecycle and charge protection

- The server records the job and locks one active task per admin **before**
  calling the provider. An idempotency key survives page reload in session
  storage. Reusing that key returns the original job, without another call.
- A global cap of five submission attempts per UTC day is checked atomically
  in D1, including concurrent requests. Failed input/private-storage preparation
  never reaches the provider. A failed attempt may still count toward the cap.
- Redirects, timeouts, malformed success responses and server errors become
  `uncertain`, rather than automatically retrying a possibly paid request.
- Refreshing progress only performs provider GET requests. A short D1 lease
  prevents overlapping polling/download work. Completed MP4 files are copied
  into private R2 before exposing an authenticated same-origin playback URL.
  Playback supports byte ranges and MP4 download. Files are not published in
  a gallery or sitemap. Closing the browser pauses polling; reopening resumes
  querying the saved task. Reopen within the provider's task/result lifetime;
  this base release has no scheduled background polling.
- If a submission remains `uncertain`, inspect the provider dashboard. Under
  **核实异常提交**, associate its existing task ID, or explicitly confirm no task
  was created to release the lock. A stale `preparing`/`submitting` record may
  be reconciled after five minutes. Neither action submits a new generation.
- Completed/failed records and their stored media can be deleted from history.
  Files are retained until administrator deletion; there is no automatic expiry
  job in this base release. Deleting locally does not erase provider-side data.
- There is no public purchase flow or video credit charge in this release.
  Each enabled submission directly incurs the configured provider's costs.

## Validation

```sh
npm run test:ai-video
npm test
npx wrangler pages functions build functions --outdir /tmp/balatrocalc-video-build
```

The dedicated suite uses in-memory SQLite and mocked provider/R2 operations to
verify auth, CSRF, ownership, input validation, idempotency, races, ambiguous
submissions, recovery, daily cap, result storage, Range/download, and deletion.
It does **not** constitute paid generation or visual acceptance. A real render
and its full playback review require a separately authorized budget.
