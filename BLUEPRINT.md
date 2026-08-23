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
| GET | `/v1/auth/demo-accounts` | — | REMOVED (no demo users) |
| POST | `/v1/auth/login` | — | Real WordPress login (username+password) → token + role (admin/customer) |
| GET | `/v1/auth/me` | Bearer token | Resume authenticated session (user + role) |
| POST | `/v1/auth/guest` | — | Mint a real anonymous guest session (random BD phone) |
| POST | `/v1/deen/bugs` | — | **Bug report sink** (crash/feedback collection) |
| GET | `/v1/deen/bugs?severity=` | — | List collected reports (in-memory, last 500) |

`gatewayUrl` is configured in `apps/mobile/app.json` `extra.gatewayUrl` (currently the Render URL: `https://cross-ecom-apps.onrender.com`). Never hardcode it in source.

## Authentication (real, no demos)
- **No demo/test accounts.** Every login is a real WordPress user on `deencommerce.com`.
- `POST /v1/auth/login {username, password}` → gateway exchanges creds for a WP session cookie via `wp-login.php`, then reads the user + roles from `wp/v2/users/me`.
  - `roles` containing `administrator` or `shop_manager` (or username `admin`) → `role: "admin"` (sees BI dashboard, broadcasts).
  - everyone else → `role: "customer"`.
  - Returns `{ success, token, user:{username, name, email, role, wpUserId, wpRoles} }`. Token stored in AsyncStorage; `GET /v1/auth/me` resumes it.
- Mobile `LoginModal` is a real username/password form → `login()` in `ProfileContext` → gateway. `logout()` clears the token.
- Guest checkout still works (anonymous `POST /v1/auth/guest` session) for users who skip sign-in.
- **Out-of-stock products are NEVER shown to customers**: `/v1/deen/products` filters `stockStatus==="outofstock"` by default (opt-in `?includeOOS=1` for admin/debug), and `/v1/deen/snapshot` (bundled offline catalog) is regenerated OOS-free. Mobile `applyFilters` also drops OOS as a client-side safety net.

## Roles (admin vs customer)
- `profile.role === "admin"` (from WP) unlocks the BI dashboard on Home + broadcast button.
- Customers never see sales/BI data.

## Security & Audit Notes
- **CORS** is allowlist-based (`apps/api/src/index.ts`): only configured `allowedOrigins` are
  reflected; `*` is never used (prevents arbitrary-site cookie calls).
- **Auth rate limiting**: `/v1/auth/*` is protected by a sliding-window limiter
  (`_rateLimitHook`, 20 req/min/IP by default) — invoked in `build()`.
- **`wpLogin`**: exchanges WP credentials for a `wordpress_logged_in_*` cookie via
  `wp-login.php`, then reads the user from `/wp/v2/users/me` using **only that cookie**
  (no plaintext Basic-Auth header is sent). The cookie authenticates the `/users/me` call.
- **No secrets in source**: Woo keys come from `process.env` (`.env`, gitignored). A
  `test-env.ts` scratch file exists but is gitignored and must never ship.
- **Order exact-match**: app-placed orders push Woo `state` as `BD-XX` district codes
  (verified against a real website order: `BD-11` = Cox's Bazar), payment title
  `Cash on delivery`, and the same Woo meta keys as the website.

## Cashback Logic (must match the live site)
The live `deencommerce.com` store auto-applies a cart cashback that the app must replicate
so app orders match website orders exactly:
- Subtotal **> ৳2500** → **−৳500** cashback
- Subtotal **> ৳3000** → **−৳700** cashback (higher tier replaces the lower)
The store implements this via WooCommerce coupons/auto-apply (16,954 coupons exist; the
tier coupons are gated by `minimum_amount`). Because the gateway holds a **read-only** Woo
key, the app cannot create coupons — the gateway must compute
`cashback = subtotal>=3000 ? 700 : subtotal>=2500 ? 500 : 0` and send it to Woo as a
`coupon_lines` entry on the order, and the mobile cart/checkout UI must display the
deduction. (Implementation pending — logic documented here for exact-match compliance.)

## Local Android Build (no EAS cloud, no admin)
A fully-local APK build toolchain is installed at `C:\Users\deenb\tools`:
- Temurin **JDK 17**, Android **cmdline-tools**, **platform-tools**, **build-tools 34.0.0**,
  **platforms/android-34**, plus an **emulator** + `system-images;android-34;google_apis;x86_64`
  (AVD `deen_pixel` stored on `H:\android-avd` to avoid C: space limits).
- Env: `JAVA_HOME`, `ANDROID_HOME` (setx + `~/.bashrc`). `eas build --local` is blocked on
  Windows, so the path is `expo prebuild --platform android` →
  `cd android && ./gradlew.bat assembleRelease`. Known fixes: copy
  `node_modules/expo/node_modules/expo-modules-autolinking/android/expo-gradle-plugin` into
  the top-level autolinking dir; delete duplicate `styles.xml` `AppTheme`; remove duplicate
  `ic_launcher*.webp` launchers. Full runbook: `references/local-android-build.md` in the
  `expo-react-native` skill.


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
The app is on **Expo SDK 55** (RN 0.83, React 19.2, expo-router v7) — Node 20/22/24 all
work, the old Node-20-only pin was for SDK 51 and is no longer needed. Commit
`package-lock.json` so EAS installs are deterministic. Android multi-worker export
crashes under git-bash → use `--max-workers 1` (EAS cloud build avoids this).
History + diagnosis of the two fixed build failures (iOS SDK-51 EOL, Android
lucide peer conflict) lives in `apps/mobile/EAS-FIX.md`.

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
- [x] Real WordPress auth (demo/test accounts removed — see Authentication).
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
