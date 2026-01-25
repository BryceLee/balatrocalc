# Seed Analyzer Monetization Plan

## Scope
- Gate only the Analyze Seed action on `balatro-seed-analyzer.html`.
- Future premium features reuse the same featureKey system.

## Pricing and limits
- Free: 3 uses per device per day, reset at 00:00 UTC.
- Subscriptions: monthly USD 5, yearly USD 39, lifetime USD 100.
- Subscription grants unlimited uses for all premium features.
- Monthly/yearly are auto-renew subscriptions (30/365 days per cycle).

## UX copy
- "Today remaining: X/3"
- "Resets daily at 00:00 UTC"
- "Subscribe for unlimited access"

## FeatureKey model
- Example featureKey: `seed_analyzer`.
- Free limits and future features are controlled via a shared config.

## Frontend enforcement (accepted to be bypassed)
- Local storage keys:
  - `bc_device_id`
  - `bc_usage_daily`
  - `bc_paid_email`
  - `bc_paid_until`
  - `bc_paid_plan`
- `bc_usage_daily` shape:
  - `{ [featureKey]: { date: "YYYY-MM-DD", used: number } }`
- Analyze click flow:
  1) If paid on this device, allow.
  2) Else check date and used < free limit, then increment and allow.
  3) Else block and show paywall.

## Subscription check (email only)
- User enters email (no verification).
- Frontend calls `GET /api/subscription?email=...`.
- If active, store paid fields locally to unlock unlimited use on this device.

## Cloudflare backend
- D1 tables (core):
  - `payments`: id, email, plan, amount, currency, provider, txn_id, status, created_at, expires_at
  - optional `orders`: id, email, order_id, status, created_at
  - optional `subscriptions`: id, email, plan, provider, subscription_id, status, last_payment_at, next_billing_at
- Worker API:
  - `POST /api/paypal/create-order` (lifetime only)
  - `POST /api/paypal/capture` (lifetime only)
  - `POST /api/paypal/create-subscription` (monthly/yearly)
  - `POST /api/paypal/subscription-activate` (confirm approval)
  - `POST /api/paypal/webhook` (orders + subscriptions)
  - `GET /api/subscription?email=...`
- Admin page (Basic Auth):
  - `GET /admin`
  - `POST /api/admin/payment` (manual USDT)
  - `GET /api/admin/search?email=...`
  - `POST /api/admin/revoke`

## PayPal flow
- Use order -> capture for one-time payments (lifetime).
- Use PayPal Subscriptions API for monthly/yearly auto-renew.
- Webhook verifies signature and updates payment/subscription status.
- `expires_at` rules:
  - monthly: now + 30 days
  - yearly: now + 365 days
  - lifetime: null
  - auto-renew: update `expires_at` on each successful subscription payment

## Admin flow
- Basic Auth credentials stored as environment variables.
- Manual USDT add: email, plan, amount, txn_id, status=paid.

## Ops and risk controls
- Rate limit subscription checks and PayPal endpoints (Cloudflare rate limit rules).
- Log webhook failures and rejected signatures for debugging.
- D1 backups on a schedule (export or manual snapshot).
- Rotate Basic Auth credentials periodically.

## Extensibility
- Add new featureKey in frontend config.
- Reuse the same quota UI and local storage logic.
- Subscriptions already cover all features.

## Implementation steps
1) Add quota UI + localStorage gating in `balatro-seed-analyzer.html`.
2) Create D1 schema and Worker API endpoints.
3) Integrate PayPal subscriptions + lifetime order/capture + webhook.
4) Add admin page with Basic Auth for manual actions.
5) Wire email-based subscription check on the frontend.

## Notes
- D1 schema draft: `docs/seed-analyzer-d1.sql`.
