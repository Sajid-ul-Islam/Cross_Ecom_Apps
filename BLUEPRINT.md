# DEEN Commerce — Engineering Blueprint (for agents)

Monorepo for **DEEN** (দেশের প্রথম ডেনিম ব্র্যান্ড — Bangladesh's first denim brand), a
React Native (Expo) **customer storefront** + a Fastify **gateway** that proxies
WooCommerce. Built to be handed between autonomous coding agents — read this first.

## TL;DR for an incoming agent
- Mobile app talks ONLY to the gateway over HTTPS. WooCommerce keys live server-side.
- The catalog is **bundled into the app** (`apps/mobile/src/data/catalog.snapshot.json`,
  826 products) so it opens instantly offline; the gateway refreshes it in the background.
- **Customers never see sales/BI data.** That's admin-only, unlocked by `username === "admin"`.
- Gateway is deployed on Render (free tier) at `https://cross-ecom-apps.onrender.com`.
- Brand accent is **orange `#E06020`** (DEEN logo: orange triangle + black "DEEN").

## Repo layout
```
apps/
  mobile/            Expo SDK 55 app (package com.deencommerce.app)
    app/(tabs)/      home(index), shop, bag, orders, profile
    app/product/[id] product detail (real Woo variations / per-size stock)
    app/checkout     COD / bKash / Nagad
    app/_layout.tsx  Root — providers + global crash reporter (ErrorUtils)
    src/
      services/gateway.ts  HTTP client: fetchProducts (offline-first), fetchStats (admin),
                           createOrder, getOrders, reportBug
      services/catalog.ts  lazy loader for bundled snapshot
      services/api.ts      local fallback catalog + DEFAULT_PROFILE
      context/             Cart / Order / Profile (role derived from username)
      components/          Header (logo), ProductCard (memoized), Charts (admin BI), Banner,
                           Icons (in-house SVG set on react-native-svg — replaced
                           lucide-react-native, whose React <=18 peer broke installs on SDK 55)
      types/index.ts       Product, Stats, Order, UserProfile(+role), CartItem(+variationId)
      data/catalog.snapshot.json  826 live products (regenerate via gateway /v1/deen/snapshot)
      assets/              icon.png, splash.png, adaptive-icon.png (orange plates), logo.png (real)
    eas.json              preview (internal APK) + production + production-apk profiles
  api/                Fastify gateway
    src/index.ts      server bootstrap (PORT from env)
    src/routes.ts     /v1/deen/* endpoints (products, product, categories, stats, snapshot,
                      orders, bugs)
    src/woo.ts        WooCommerce client (read-only key OK), 5-min catalog cache
    src/seed.ts       seed catalog (fallback when Woo unreachable)
    src/config.ts     env loading (WOO_SITE, WOO_CONSUMER_KEY/SECRET, GATEWAY_API_KEY)
    .env              gitignored — holds Woo keys (NEVER commit)
    Dockerfile        node:20-alpine, CMD npm start
.github/workflows/keepalive.yml   pings gateway /v1/health every 10 min (free-tier sleep fix)
render.yaml          Render Blueprint — deploys apps/api as Docker Web Service
README.md            human overview
BLUEPRINT.md         this file
```

## Gateway API (`apps/api`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/health` | — | `{status, mode:live|seed, woo:connected|down}` |
| GET | `/v1/deen/products?category=&q=&sort=` | — | catalog (filter/search/sort) |
| GET | `/v1/deen/products/:id` | — | product + real Woo variations |
| GET | `/v1/deen/categories` | — | category counts |
| GET | `/v1/deen/stats` | — | **ADMIN** store analytics (sales series, KPIs, top sellers) |
| GET | `/v1/deen/snapshot` | — | full catalog JSON (for bundling offline catalog) |
| POST | `/v1/deen/orders` | — | create order (live Woo push if RW key; else gateway-side) |
| GET | `/v1/deen/orders?phone=` | — | list orders by phone |
| POST | `/v1/deen/bugs` | — | **bug report sink** (crash/feedback collection) |
| GET | `/v1/deen/bugs?severity=` | — | list collected reports (in-memory, last 500) |

`gatewayUrl` is configured in `apps/mobile/app.json` `extra.gatewayUrl` (currently the
Render URL). Never hardcode it in source.

## Roles & views
- `UserProfile.role` is derived: `username.trim().toLowerCase() === "admin"` → admin.
- Profile screen has **LOGIN AS ADMIN** / **LOG OUT** (no real auth yet — plug in later).
- Home: customers see shopping UI (featured/offers); admins additionally see the BI
  dashboard (sales sparkline, KPIs, category stock donut, top deals).

## Bug collection system (for ongoing dev)
- Mobile: global `ErrorUtils` handler in `app/_layout.tsx` forwards uncaught JS errors
  to `POST /v1/deen/bugs` (severity `crash`/`high`). Never blocks the UI.
- Mobile: Profile → **REPORT A PROBLEM** button sends a `low`-severity manual report.
- Gateway: stores reports in-memory (bounded 500), `GET /v1/deen/bugs` to inspect.
- NOTE: in-memory store resets on deploy — for persistence later, swap to a file/DB.
- To view collected bugs: `GET https://cross-ecom-apps.onrender.com/v1/deen/bugs`.

## Deploy
### Gateway (Render, from repo)
1. Push to `Sajid-ul-Islam/Cross_Ecom_Apps`. Render Blueprint (`render.yaml`) auto-deploys
   `apps/api` as a Docker Web Service (Root Dir `apps/api`, health `/v1/health`).
2. Render dashboard → Environment (Secret): `WOO_SITE`, `WOO_CONSUMER_KEY`,
   `WOO_CONSUMER_SECRET`. `GATEWAY_API_KEY` optional. `PORT` injected by Render.
3. Free tier sleeps after 15 min idle → GitHub Actions keepalive pings every 10 min.
   Needs repo secret `RENDER_GATEWAY_URL` set in GitHub. For always-on, Starter $7/mo.

### Mobile (EAS)
```
cd apps/mobile
eas build --platform android --profile production-apk   # installable APK
eas build --platform android --profile preview          # internal/distribution
```
The app is on **Expo SDK 55** (RN 0.83, React 19.2, expo-router v7) — Node 20/22/24 all
work, the old Node-20-only pin was for SDK 51 and is no longer needed. Commit
`package-lock.json` so EAS installs are deterministic. Android multi-worker export
crashes under git-bash → use `--max-workers 1` (EAS cloud build avoids this).
History + diagnosis of the two fixed build failures (iOS SDK-51 EOL, Android
lucide peer conflict) lives in `apps/mobile/EAS-FIX.md`.

## Regenerating the bundled catalog
The snapshot can go stale. To refresh:
```
curl https://cross-ecom-apps.onrender.com/v1/deen/snapshot -o apps/mobile/src/data/catalog.snapshot.json
```
(or boot gateway locally and hit the same endpoint). Then rebuild the APK.

## Known limitations / TODO
- [ ] Real admin auth (credentials/backend) — currently `username==="admin"` unlocks BI.
- [ ] Bug reports are in-memory on the gateway (lost on restart) — persist to file/DB.
- [ ] Push notifications (Expo push) — profile has toggles, not wired.
- [ ] Read-only Woo key: order POST returns 201 but Woo push 401 (needs RW key).
- [ ] Gateway free-tier cold start adds ~first-request latency (mitigated by keepalive).

## Conventions for agents
- Never put Woo keys or `.env` in git. Never hardcode `gatewayUrl` in source.
- Keep sales/BI behind `isAdmin`. Customers must not request `/v1/deen/stats`.
- `fetchProducts` is offline-first (returns bundled data, refreshes in background).
- Mobile typecheck: `cd apps/mobile && npm run typecheck`. Gateway: `cd apps/api && npx tsc --noEmit`.
- Commit with clear messages; APKs are gitignored (`*.apk`, `*.aab`, `*.ipa`).
