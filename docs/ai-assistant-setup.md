# Balatro AI Advisor setup

The assistant uses Google Identity Services, Cloudflare Pages Functions, D1,
PayPal one-time checkout, and a server-side 302.AI API key. AI Credits are a
separate prepaid wallet and do not change Seed Pro membership.

## 1. Create the D1 tables

Apply `docs/ai-assistant-d1.sql` to the same D1 database bound to Pages as
`DB`. Apply it to preview first, then production.

## 2. Configure Google sign-in

The browser only receives the public OAuth Client ID. The downloaded Google
Client Secret is not needed by this implementation and must not be committed.

Public variable:

```text
GOOGLE_LOGIN_CLIENT_ID=286347292359-g93pq2e1d7msio01rgt01ojed37es37v.apps.googleusercontent.com
```

Keep these authorized JavaScript origins in Google Cloud Console:

```text
https://balatrocalc.com
https://www.balatrocalc.com
```

For local sign-in testing, temporarily add the exact local origin used by the
Pages development server, for example `http://127.0.0.1:8788`.

## 3. Create a restricted 302.AI key

Create a dedicated key for this feature. Disable key-management and custom-model
permissions, disable provider log retention when possible, and set both a daily
cost limit and a total cost limit. Do not reuse an account-wide unrestricted key.

Store the value as an encrypted Cloudflare Pages secret named:

```text
AI302_API_KEY
```

Never put its value in HTML, browser JavaScript, Git, a screenshot, or chat.

Configure the allowlisted model as a normal Pages variable:

```text
AI302_MODEL=gpt-4o-mini
```

The server ignores any model name sent by a browser. It reads the exact 302.AI
request cost after each successful response and converts that cost into Credits.

Optionally add a random secret used only to hash rate-limit IP data:

```text
AI_IP_HASH_SALT=<random secret>
```

Private preview access defaults to the test account below:

```text
AI_ALLOWED_EMAILS=bryceleezx@gmail.com
```

Use a comma-separated list to add preview testers. Set the production variable
to `*` only when the feature is ready for public release. The Google-authenticated
email is checked again on every protected AI request.

## 4. PayPal

Reuse the site's existing server-side PayPal credentials and environment flag.
The AI checkout only accepts these server-defined packages:

- 30 Credits for $3.50
- 100 Credits for $10.90

PayPal amounts, account ownership, capture state, and package IDs are rechecked
on the server before an idempotent wallet credit is written.

## 5. Billing behavior

- 10 Credits represent $1 of user wallet value.
- The internal charge is the exact 302.AI USD cost multiplied by 1.5, then
  converted to Credits.
- Usage accumulates at high precision and the wallet debit rounds upward to the
  next 0.1 Credit cumulatively, rather than rounding every tiny request again.
- Failed provider calls and missing cost records are not charged.
- The wallet cannot go negative. If a final answer costs more than the remaining
  balance, the remaining balance is used and the small unpaid remainder is
  waived; another request then requires a top-up.

The customer-facing page explains that usage depends on model, token count, and
conversation context, without publishing the internal multiplier.

## 6. Release checks

1. Run `npm test`.
2. Test Google sign-in on the preview origin.
3. Complete one PayPal sandbox purchase for each package and retry the capture
   URL to confirm Credits are added only once.
4. Send one short and one long AI question; compare the stored 302 request IDs
   and costs with the 302 dashboard.
5. Confirm the 302 key and Google Client Secret never appear in built assets or
   browser network responses.
