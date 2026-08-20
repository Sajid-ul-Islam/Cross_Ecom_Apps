# Cross_Ecom_Apps — DEEN Commerce

Monorepo for the **DEEN** Bangladesh denim store: a React Native (Expo) **customer
app** + a Fastify **gateway** that proxies WooCommerce (keys stay server-side, never
in the app bundle).

```
apps/
  mobile/   Expo SDK 51 app (com.deencommerce.app) — customer storefront + admin BI view
  api/      Fastify gateway — holds WooConsumer keys, exposes /v1/deen/* DEEN endpoints
```

## Architecture
- Mobile talks ONLY to the gateway over HTTPS (`extra.gatewayUrl` in app.json).
- Gateway holds WooCommerce keys in env (`apps/api/.env`, gitignored). Never in mobile.
- Gateway serves a **bundled catalog snapshot** so the app opens instantly offline, then
  refreshes from Woo in the background.

## Live status (2026-08-20)
- Gateway deployed on **Render**: https://cross-ecom-apps.onrender.com  (Docker, free tier)
- Store: `deencommerce.com` (826 products, read-only Woo key)
- Mobile `gatewayUrl` → `https://cross-ecom-apps.onrender.com`
- GitHub Actions keepalive pings the gateway every 10 min (free-tier sleep workaround).

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

## Roles
- **Customer** (default): shopping storefront only. NEVER sees sales/BI data.
- **Admin**: login via Profile → "LOGIN AS ADMIN" (username `admin`). Reveals the
  Store Insights / BI dashboard on Home (sales, KPIs, category stock, top deals).
  Real admin auth/credentials to be added later.

## Gateway endpoints
- `GET /v1/health` — honest live/seed status
- `GET /v1/deen/products?category=&q=&sort=` — catalog (filter/search/sort)
- `GET /v1/deen/products/:id` — product + real Woo variations (per-size stock)
- `GET /v1/deen/categories` — category counts
- `GET /v1/deen/stats` — ADMIN store analytics (sales series, KPIs, top sellers)
- `GET /v1/deen/snapshot` — full catalog JSON (used to bundle offline catalog)
- `POST /v1/deen/orders` — create order (live Woo push if RW key; else gateway-side)

## TODO (remaining)
- [ ] Add real admin auth (credentials/backend) — currently username `admin` unlocks BI.
- [ ] Redeploy gateway so `/v1/deen/snapshot` is live on Render (route added, push to redeploy).
- [ ] Push notifications (Expo push) — profile has toggles, not yet wired.
- [ ] Set GitHub repo secret `RENDER_GATEWAY_URL` for the keepalive workflow.
- [ ] Version bump to 1.0.1 for clean OTA/update path.
- [ ] Rebuild production APK after the offline-first + role-gating changes in this session.
