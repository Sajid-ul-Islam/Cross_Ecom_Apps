# Cross_Ecom_Apps — DEEN Commerce

Omnichannel build for **DEEN** (deencommerce.com), Bangladesh's first denim brand:
an **Expo Android customer app**, a **Next.js storefront with /admin**, and a
**Fastify middle API layer** that is the *only* path to WooCommerce — consumer keys
never touch a client.

```
apps/
  mobile/      Expo SDK 53 app (com.deencommerce.app) — customer app, Android first · iOS queued
  api/         Fastify gateway — holds Woo consumer keys, exposes /v1/deen/* endpoints
  web/         Next.js 15 storefront + guarded /admin route group
packages/
  contracts/   Zod DTOs shared by every surface (products · orders · coupons · sessions)
src/           this workspace — live blueprint console + in-browser gateway simulation
docs/          STATE.md · ADR/ · SESSIONS/ · MERGE_LOG.md (agent context suite)
```

## Architecture

- Every client (Android, web, /admin) talks **only** to the middle API layer over
  HTTPS. WooCommerce keys live in the gateway env (`apps/api/.env`, gitignored) —
  never in any app bundle.
- The gateway serves a **bundled catalog snapshot** so the app opens instantly,
  then refreshes from Woo in the background; signed webhooks
  (`woo.order`, stock, refunds) flow back through a verified queue.
- One shared contract package means a feature built for one surface is typed for
  all of them.

## Live status

- Gateway deployed on **Render**: https://cross-ecom-apps.onrender.com (Docker, free tier)
- Store: `deencommerce.com` (826 products, read-only Woo key)
- Mobile `gatewayUrl` → `https://cross-ecom-apps.onrender.com`
- GitHub Actions keepalive pings the gateway every 10 min (free-tier sleep workaround)
- **Session management shipped** — device registry, sliding token refresh,
  configurable lifetime (24h / 7d / 30d), revocation, security audit log,
  OTP brute-force lockout (5 misses → 45s cooldown)
- **Push + recommendations shipped** — FCM-style heads-up pushes (price drops,
  picks-for-you, new drops, promos) deep-linked to products; affinity-scoring
  recommendation engine shared by pushes, Home rail and product sheets
- **Blueprint console** — interactive build atlas at `#/blueprint`: topology,
  tooling, context strategy, timeline ledger, session handoffs, dev log

## Roles

- **Customer** (default): shopping storefront only. Never sees sales/BI data.
- **Admin**: guarded login on `/admin` (JWT, 8h expiry, live countdown with
  auto-signout) → orders dashboard, inventory, coupons, Store Insights / BI.

## Gateway endpoints

Catalog & commerce
- `GET /v1/health` — honest live/seed status
- `GET /v1/deen/products?category=&q=&sort=` — catalog (filter/search/sort)
- `GET /v1/deen/products/:id` — product + real Woo variations (per-size stock)
- `GET /v1/deen/categories` · `GET /v1/deen/stats` · `GET /v1/deen/snapshot`
- `POST /v1/deen/orders` — create order (live Woo push if RW key; else gateway-side)
- `POST /v1/deen/orders/cancel` — pre-confirmation cancel with restock
- `POST /v1/deen/coupons/validate` — SUMMER10 · DEEN100 · DENIM500 rules
- `POST /v1/deen/reviews` · `GET /v1/webhooks/woo.order` (HMAC-verified)

Auth & sessions
- `POST /v1/deen/auth/otp/send` — code delivered via SMS, never in the response
- `POST /v1/deen/auth/otp/verify` — brute-force locked after 5 misses
- `POST /v1/deen/auth/google|facebook` — links onto a phone-verified session
- `POST /v1/deen/auth/refresh` — sliding expiry · `GET /v1/deen/auth/devices`
- `POST /v1/deen/auth/devices/revoke` · `revoke-others` · `GET .../security-log`

## Session management

| concern            | implementation                                              |
| ------------------ | ----------------------------------------------------------- |
| storage            | JWT-shaped token in Expo SecureStore (sim: localStorage)    |
| lifetime           | user-configurable 24h / 7d / 30d, honored by issue + refresh |
| keep-alive         | 45s heartbeat validates the token and records activity       |
| expiry             | in-app "session expired" guard with one-tap re-auth          |
| devices            | registry per phone — list, revoke, sign-out-others           |
| abuse              | OTP lockout + masked security audit log (25 events)          |

## Deploy the gateway (Render, from this repo)

1. Push repo to GitHub (Sajid-ul-Islam/Cross_Ecom_Apps).
2. Render → New + → **Blueprint** → pick repo. `render.yaml` deploys `apps/api` as a
   Docker **Web Service** (Root Directory = `apps/api`).
3. Set env vars in Render dashboard (Secret): `WOO_SITE`, `WOO_CONSUMER_KEY`,
   `WOO_CONSUMER_SECRET`. `GATEWAY_API_KEY` optional. `PORT` injected by Render.
4. For always-on, upgrade free tier to Starter ($7/mo).

## Deploy the mobile app (EAS)

```
cd apps/mobile
eas build --platform android --profile production-apk   # installable APK
```
Latest production APK: https://expo.dev/artifacts/eas/1ZhLQQRqUR-FmhxdqTTnXmGNTYKMj53XglEueh9MoV4.apk

## Git

Single trunk: `main`. The feature branch `full-stack-project-blueprint-4a182`
was merged into `main` and deleted — see `docs/MERGE_LOG.md`. If a stale
`origin/full-stack-project-blueprint-4a182` ref lingers locally: `git fetch --prune`.

## Context protocol (for agents & humans)

Files are memory; chat is not. Every session boots from `AGENTS.md` →
`docs/STATE.md` → latest `docs/SESSIONS/*.md`, works one task, checkpoints every
~30 min, and writes a handoff. The blueprint's Sheet 05 (dev log) records every
batch: what shipped, what's next, current context, future scope.

## TODO (remaining)

- [x] Session management — device registry, refresh, revocation, lockout, audit log
- [x] Push notifications — heads-up pushes with deep links (sim layer; wire Expo
      push server keys for production)
- [x] Recommendations — affinity engine across pushes + in-app rails
- [x] Profile — completion ring, loyalty score, order history, dark/light theming
- [ ] Add real admin auth on the deployed gateway (OTP/session flow exists in sim)
- [ ] Redeploy gateway so `/v1/deen/snapshot` is live on Render (route added, push to redeploy)
- [ ] Set GitHub repo secret `RENDER_GATEWAY_URL` for the keepalive workflow
- [ ] Version bump to 1.0.1 for clean OTA/update path
- [ ] Rebuild production APK after the session/push/rec changes
- [ ] E2E — Playwright (web/admin) + Maestro (Android) critical paths
- [ ] Sentry across api · web · mobile with release-bound sourcemaps
