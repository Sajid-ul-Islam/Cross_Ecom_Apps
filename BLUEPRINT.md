# DEEN Commerce — Engineering Blueprint (for agents)

Monorepo for **DEEN** (দেশের প্রথম ডেনিম ব্র্যান্ড — Bangladesh's first denim brand), a
React Native (Expo SDK 55) **customer storefront** + a Fastify **gateway** that proxies
WooCommerce. Built to be handed between autonomous coding agents — read this first.

## TL;DR for an incoming agent
- **Mobile app talks ONLY to the gateway over HTTPS** (`https://cross-ecom-apps.onrender.com`). WooCommerce keys live server-side.
- The catalog is **bundled into the app** (`apps/mobile/src/data/catalog.snapshot.json`, 826 products) so it opens instantly offline; the gateway refreshes it in the background.
- **3-Way User Operating Modes**: `admin` (BI & push broadcasts), `registered` (customer profile, VIP coins, address book), and `guest` (instant anonymous checkout).
- **Customers never see sales/BI data** unless in Admin mode (`profile.role === "admin"`).
- **Brand Colors**: Light theme is Japanese parchment `#F7F6F0` + indigo `#2A3680`; Dark theme is Midnight slate `#0D111A` + indigo `#5B6EE1`.
- **Zero-Dependency In-House Icons**: Replaced `lucide-react-native` with an in-house hand-drawn SVG set (`apps/mobile/src/components/Icons.tsx`) for 100% React 19 compatibility.

## Repo layout
```
apps/
  mobile/            Expo SDK 55 app (package com.deencommerce.app)
    app/(tabs)/      home (index), shop, bag, orders, profile
    app/category/[slug]  dedicated collection landing with craft banner & filtering
    app/product/[id] product detail (real Woo variations / size chart / bundle builder)
    app/checkout     COD / bKash / Nagad / VIP coins redemption / slots
    app/_layout.tsx  Root — 8 context providers + global crash reporter (ErrorUtils)
    src/
      components/    UserModeBar, LoginModal, AdminBroadcastModal, ReturnExchangeModal,
                     SizeGuideModal, WishlistModal, DailyRewardsModal, GiftCardModal,
                     CourierTrackingModal, StoreStockModal, ProductReviewsModal,
                     DenimCareGuideModal, CompleteTheLook, Header, ProductCard, Charts, Icons
      context/       ThemeContext, ProfileContext, CartContext, OrderContext,
                     WishlistContext, RewardsContext, ReturnContext, NotificationContext
      services/      gateway.ts (Render REST API client), catalog.ts, api.ts (demo fallbacks)
      theme/         colors.ts (LightColors, DarkColors, ThemeColors)
      types/         index.ts (Product, Order, UserProfile, DemoAccount, ReturnExchangeRequest, etc.)
      data/          catalog.snapshot.json (826 live products), categories.ts
      assets/        icon.png, splash.png, adaptive-icon.png, logo.png
    eas.json         preview (internal APK) + production + production-apk profiles
  api/               Fastify gateway
    src/index.ts     server bootstrap (PORT from env)
    src/routes.ts    /v1/deen/* & /v1/auth/* endpoints
    src/woo.ts       WooCommerce client (read-only key OK), 5-min catalog cache
    src/seed.ts      seed catalog (fallback when Woo unreachable)
    src/config.ts    env loading (WOO_SITE, WOO_CONSUMER_KEY/SECRET, GATEWAY_API_KEY)
    .env             gitignored — holds Woo keys (NEVER commit)
    Dockerfile       node:20-alpine, CMD npm start
.github/workflows/keepalive.yml   pings gateway /v1/health every 10 min (free-tier sleep fix)
render.yaml          Render Blueprint — deploys apps/api as Docker Web Service
README.md            Human overview & user guide
BLUEPRINT.md         This engineering document
```

## Context Provider Hierarchy (`apps/mobile/app/_layout.tsx`)
```
SafeAreaProvider
  └─ ThemeProvider              # System OS theme sync + manual light/dark override
       └─ ProfileProvider       # Admin, Registered & Guest mode + demo credentials
            └─ NotificationProvider  # Broadcast push & in-app message inbox
                 └─ WishlistProvider  # Saved items & price-drop watcher
                      └─ RewardsProvider   # VIP loyalty coins, streaks & vouchers
                           └─ ReturnProvider    # Customer size exchanges & returns
                                └─ CartProvider      # Shopping bag + 10% outfit bundling
                                     └─ OrderProvider     # Order placement & parcel tracking
                                          └─ RootNavigator (Expo Router Tabs & Stack)
```

## Gateway API (`apps/api`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/health` | — | `{status, mode:live|seed, woo:connected|down}` |
| GET | `/v1/deen/products?category=&q=&sort=` | — | Catalog (filter/search/sort) |
| GET | `/v1/deen/products/:id` | — | Product + real Woo variations |
| GET | `/v1/deen/categories` | — | Category counts |
| GET | `/v1/deen/stats` | — | **ADMIN** store analytics (sales series, KPIs, top sellers) |
| GET | `/v1/deen/snapshot` | — | Full catalog JSON (for bundling offline catalog) |
| POST | `/v1/deen/orders` | — | Create order (live Woo push if RW key; else gateway-side) |
| GET | `/v1/deen/orders?phone=` | — | List orders by phone or order number |
| POST | `/v1/deen/broadcasts` | — | **ADMIN** marketing push broadcast dispatcher |
| GET | `/v1/deen/broadcasts` | — | List past marketing push broadcasts |
| POST | `/v1/deen/returns` | — | Submit size exchange / return ticket with photos |
| GET | `/v1/deen/returns` | — | List return tickets by order or phone |
| GET | `/v1/auth/demo-accounts` | — | List pre-configured demo credentials |
| POST | `/v1/auth/login` | — | Authenticate customer, VIP, or admin |
| POST | `/v1/deen/bugs` | — | **Bug report sink** (crash/feedback collection) |
| GET | `/v1/deen/bugs?severity=` | — | List collected reports (in-memory, last 500) |

`gatewayUrl` is configured in `apps/mobile/app.json` `extra.gatewayUrl` (currently the Render URL: `https://cross-ecom-apps.onrender.com`). Never hardcode it in source.

## Demo Test Credentials
- **👤 Regular Customer**: `customer` / `deen1234` · Phone: `01712-345678` (Tanvir Ahmed)
- **⭐ VIP Gold Shopper**: `vip` / `deen1234` · Phone: `01899-776655` (Sajid-ul Islam)
- **👑 Store Admin & Merchant**: `admin` / `admin123` · Phone: `01711-223344` (DEEN Admin)
- **⚡ Guest Mode**: `guest` / *(No pass)* · Phone: `01911-000000` (Anonymous Guest)

## Roles & 3-Way Mode Switcher
- `UserProfile.role` is derived from active mode: `admin` vs `customer` (registered vs guest).
- `UserModeBar.tsx` rendered at the top of the **Home feed** and **Profile screen** enables instant 1-tap switching:
  - `👑 Admin Panel`: Displays live BI analytics sparklines, revenue KPIs, and broadcast marketing button.
  - `👤 Registered User`: Displays personalized feed, saved address book, VIP points, and size profile.
  - `⚡ Guest User`: Simulates first-time visitor with instant fast checkout.

## Bug Collection System
- Mobile: global `ErrorUtils` handler in `app/_layout.tsx` forwards uncaught JS errors to `POST /v1/deen/bugs` (severity `crash`/`high`). Never blocks the UI.
- Mobile: Profile → **REPORT A PROBLEM** button sends a `low`-severity manual report.
- Gateway: stores reports in-memory (bounded 500), `GET /v1/deen/bugs` to inspect.
- To view collected bugs: `GET https://cross-ecom-apps.onrender.com/v1/deen/bugs`.

## Deploy & Build
### Gateway (Render, from repo)
1. Push to `Sajid-ul-Islam/Cross_Ecom_Apps`. Render Blueprint (`render.yaml`) auto-deploys `apps/api` as a Docker Web Service (Root Dir `apps/api`, health `/v1/health`).
2. Render dashboard → Environment (Secret): `WOO_SITE`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`. `GATEWAY_API_KEY` optional. `PORT` injected by Render.
3. Free tier sleeps after 15 min idle → GitHub Actions keepalive pings every 10 min.

### Mobile (EAS)
```bash
cd apps/mobile
eas build --platform android --profile production-apk   # installable APK
eas build --platform android --profile preview          # internal/distribution
```

## Regenerating the Bundled Catalog
To refresh the offline snapshot with latest WooCommerce changes:
```bash
curl https://cross-ecom-apps.onrender.com/v1/deen/snapshot -o apps/mobile/src/data/catalog.snapshot.json
```

## Completed Work & Future Milestones

### Completed (✅)
- [x] Upgraded mobile app to **Expo SDK 55** (React Native 0.83, React 19.2).
- [x] Replaced incompatible third-party icon packages with zero-dependency SVG icon system.
- [x] Multi-tier theme engine: automatic OS dark/light inheritance + manual switcher.
- [x] 3-Way user mode switcher (Admin Panel Mode ↔ Registered User ↔ Guest Mode).
- [x] Demo test accounts & interactive credential sign-in modal.
- [x] In-app notification center & Admin marketing push broadcast console.
- [x] Customer size exchanges & returns portal with multi-photo uploads and live tracking.
- [x] Dedicated category landing pages with craft highlights and filter chips.
- [x] Size guide modal (Inch/CM toggle) and pinch-to-zoom image lightbox.
- [x] Wishlist & automated price drop notifications with bulk checkout.
- [x] "Complete the Look" 3-piece outfit bundle builder with 10% discount.
- [x] DEEN VIP Club loyalty rewards & instant checkout coin redemption.
- [x] Daily mystery check-in scratch cards with streak multipliers.
- [x] Digital E-Gift Card Studio with WhatsApp sharing.
- [x] Simulated live courier GPS parcel tracking with 1-tap rider phone calls.
- [x] Physical outlet stock availability checker for Banani and Mirpur outlets.
- [x] Master tailor styling concierge via WhatsApp.
- [x] Verified customer photo reviews and fit profiler.
- [x] Artisanal raw denim care and fading handbook.

### Future Milestones (🔮)
- [ ] Connect production Expo Push notification server (`expo-server-sdk`).
- [ ] Connect live bKash / Nagad merchant gateway callback tokens.
- [ ] Implement persistent database archival for bug and crash tickets.
- [ ] In-store QR/barcode reader for rapid outlet pickup scanning.

## Conventions for Agents
- Never commit WooCommerce secret keys or `.env` files.
- Keep sales/BI behind `isAdmin`. Customers must not request `/v1/deen/stats`.
- `fetchProducts` is offline-first (returns bundled snapshot, refreshes in background).
- Strict typecheck verification:
  - Mobile: `cd apps/mobile && npm run typecheck`
  - Gateway API: `cd apps/api && npm run typecheck`
- Commit with clear descriptive messages; APKs are gitignored (`*.apk`, `*.aab`, `*.ipa`).
\n### Recent Completed Work\n- Fetched real site contact data (WhatsApp, IVR) and integrated into AboutModal.\n- Extracted correct Outlets and delivery charges.\n- Guest session logic finalized.
