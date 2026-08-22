# DEEN Commerce — Cross-Platform E-commerce Monorepo

**Bangladesh's first denim brand — DEEN** — built as a modern e-commerce suite: a **React Native (Expo SDK 55) mobile app**, a **Fastify WooCommerce-gateway API**, and a **Next.js 14 web storefront order desk**. Designed to be handed between autonomous coding agents (see [BLUEPRINT.md](./BLUEPRINT.md)).

---

## Table of Contents

- [Repo Layout](#repo-layout)
- [What Is Where](#what-is-where)
- [Quickstart](#quickstart)
- [Gateway API Endpoints](#gateway-api-endpoints)
- [Demo Test Accounts](#-demo-test-accounts)
- [3-Way User Modes](#️-3-way-user-operating-modes)
- [Deployment](#deployment)
- [Conventions for Agents](#-conventions-for-agents)
- [Roadmap](#️-future-milestones)

---

## Repo Layout

```
Cross_Ecom_Apps/
├── apps/
│   ├── mobile/                 # Expo SDK 55 app (com.deencommerce.app)
│   │   ├── app/                # Expo Router file-based navigation
│   │   │   ├── (tabs)/         # Home, Shop, Bag, Orders, Profile
│   │   │   ├── category/[slug] # Editorial category landings
│   │   │   ├── product/[id]    # Product detail, size chart, bundle builder
│   │   │   ├── checkout.tsx    # COD / bKash / Nagad / VIP coins / slots
│   │   │   └── _layout.tsx     # Root: 8 context providers + crash handler
│   │   ├── src/
│   │   │   ├── components/     # 12+ modal components, icons, cards
│   │   │   ├── context/        # Theme, Profile, Cart, Order, Wishlist, etc.
│   │   │   ├── data/           # catalog.snapshot.json (826 products), categories
│   │   │   ├── services/       # gateway.ts (Render REST client)
│   │   │   ├── theme/          # Light/Dark color tokens
│   │   │   └── types/          # TypeScript domain contracts
│   │   ├── eas.json            # Build profiles
│   │   └── app.json            # Expo config (gatewayUrl, app scheme)
│   │
│   ├── api/                    # Fastify REST Gateway (Node.js / TS)
│   │   ├── src/
│   │   │   ├── index.ts        # Server bootstrap (PORT from env)
│   │   │   ├── routes.ts       # All /v1/* endpoints
│   │   │   ├── woo.ts          # WooCommerce REST proxy + 5-min caching
│   │   │   ├── seed.ts         # Offline-first product/seed catalog (25 items)
│   │   │   └── config.ts       # Env loading (WOO_SITE, keys, GATEWAY_API_KEY)
│   │   ├── Dockerfile          # node:20-alpine, CMD npm start
│   │   └── package.json
│   │
│   └── web/                    # Next.js 14 web storefront (BazarBox order desk)
│       ├── app/                # Pages: shop, product, cart, checkout, orders
│       ├── components/         # ProductCard, Header, Footer
│       ├── lib/                # api.ts, districts.ts, cart.tsx
│       └── next.config.mjs
│
├── .github/workflows/keepalive.yml   # Pings gateway every 10 min (free-tier)
├── render.yaml                       # Render Blueprint → apps/api Docker deploy
├── vercel.json                       # Vercel zero-config for apps/web
├── AGENTS.md                         # Operational rules (Woo, Pathao, districts)
├── BLUEPRINT.md                      # Full engineering blueprint & agent spec
├── docs/MERGE_LOG.md                 # Branch merge history
├── package.json                      # Workspace root (Vite tooling)
└── tsconfig.json                     # Root TS config (extends)
```

---

## What Is Where

| Concern | Where | Notes |
| :--- | :--- | :--- |
| **Mobile app** | `apps/mobile/` | Expo SDK 55, React Native 0.83, React 19.2. Offline-first catalog (826 products bundled). |
| **Gateway API** | `apps/api/` | Fastify, Node 20. Holds WooCommerce keys server-side. Live on Render. |
| **Web storefront** | `apps/web/` | Next.js 14. BazarBox — Dhaka order desk with same-day delivery. |
| **Agent rules** | `AGENTS.md` | Order placement, Pathao tracking, district states, dark mode. |
| **Architecture** | `BLUEPRINT.md` | Full blueprint for autonomous agents. |

The **root** `package.json` is a Vite-based workspace root for the web storefront (`src/` contains the Next.js 14 BazarBox desk — legacy scaffold, the active web app lives in `apps/web/`).

---

## Quickstart

### Mobile App

```bash
cd apps/mobile
npm install
npm run typecheck    # strict TS check
npm start            # Expo dev server
# eas build -p android --profile production-apk   # APK build
```

### Gateway API (local)

```bash
cd apps/api
npm install
# Optional: create .env with WOO_SITE, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
npm run dev          # local server on :8787 (seed mode without keys)
```

**Health:** `http://localhost:8787/v1/health` → reports `mode: "seed"` or `"live"`.

### Web Storefront

```bash
cd apps/web
npm install
npm run dev          # Next.js on :3000
```

---

## Gateway API Endpoints

Live gateway: `https://cross-ecom-apps.onrender.com/`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/health` | — | Gateway status + WooCommerce connection state |
| `GET` | `/v1/deen/products` | — | Catalog (filter, search, sort) |
| `GET` | `/v1/deen/products/:id` | — | Product detail + live WooCommerce variations |
| `GET` | `/v1/deen/categories` | — | Category list with counts |
| `GET` | `/v1/deen/stats` | Admin | Store analytics, sales, KPIs |
| `GET` | `/v1/deen/snapshot` | — | Full catalog JSON for offline bundling |
| `GET` | `/v1/deen/districts` | — | All 64 Bangladesh districts with BD-XX codes |
| `POST` | `/v1/deen/orders` | — | Create order (Pathao consignment auto-generated) |
| `GET` | `/v1/deen/orders` | — | Orders by phone or order number |
| `POST` | `/v1/deen/broadcasts` | Admin | Dispatch marketing push broadcast |
| `GET` | `/v1/deen/broadcasts` | — | List past broadcasts |
| `POST` | `/v1/deen/returns` | — | Submit return/exchange ticket with photos |
| `GET` | `/v1/deen/returns` | — | Retrieve return tickets by phone/order |
| `GET` | `/v1/auth/demo-accounts` | — | REMOVED (no demo users) |
| `POST` | `/v1/auth/login` | — | Real WordPress login (username+password) → token + role |
| `GET` | `/v1/auth/me` | Bearer token | Resume authenticated session |
| `POST` | `/v1/auth/guest` | — | Mint a real anonymous guest session |
| `POST` | `/v1/deen/bugs` | — | Crash & bug report sink |

### Order Creation Details

- Order number format: `DC-{seq}` (e.g. `DC-1042`)
- Pathao consignment ID: `PT-{orderNumber}-{suffix}` → tracking at `https://merchant.pathao.com/tracking?consignment_id=...`
- Must include `city`, `state` (BD-XX district code), `postcode`, `country: "BD"` in `billing` & `shipping`, plus `email` and `last_name`
- Delivery fees: **৳50** Dhaka standard, **৳90** outside Dhaka, **৳0** store pickup
- COD: `set_paid: false`, `payment_method_title: "Cash on delivery"` (matches the website exactly), `created_via: "checkout"`, Woo metas `_shipping_phone_2` / `is_vat_exempt` / `wt_pklist_order_language` / `_gtm_server_side_order_sent`

---

## 🔑 Authentication (real, no demos)

Every login is a **real WordPress user** on `deencommerce.com`:

- `POST /v1/auth/login { username, password }` → gateway does a cookie-exchange against `wp-login.php` and reads the user from `wp/v2/users/me`.
  - WP `administrator` / `shop_manager` role (or username `admin`) → **admin** (BI dashboard, broadcasts).
  - Otherwise → **customer**.
- Token is stored on device; `GET /v1/auth/me` resumes the session.
- Guest checkout remains available (anonymous `POST /v1/auth/guest` session).
- **Out-of-stock products are hidden from customers** everywhere: `/v1/deen/products` filters them by default (`?includeOOS=1` opt-in for admin), and the bundled offline snapshot is OOS-free.

> **Live site contact:** WhatsApp `01952-700500`, IVR `09617-700500`
> **Outlets:** Mirpur, Wari, Cumilla, Sylhet

---

## 🎛️ User Modes

- **👑 Admin** — unlocked only by logging in as a WordPress admin; sees live BI dashboard + broadcast console on Home.
- **👤 Customer** — signed in with a real WordPress account; saved addresses, order history, profile.
- **⚡ Guest** — anonymous fast checkout (real random session, no shared creds).

## Deployment

### Gateway API (Render)

Pushes to `Sajid-ul-Islam/Cross_Ecom_Apps` auto-deploy via `render.yaml` Blueprint:
- **Root Dir:** `apps/api`
- **Runtime:** Docker (node:20-alpine)
- **Health check:** `/v1/health`
- **Env vars (set in Render dashboard):** `WOO_SITE`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`
- **Keepalive:** GitHub Actions pings `/v1/health` every 10 min (free-tier sleep fix)

### Web Storefront (Vercel)

`vercel.json` provides zero-config deploy for `apps/web`.

### Mobile App (EAS)

```bash
cd apps/mobile
eas build --platform android --profile production-apk  # installable APK
eas build --platform android --profile preview          # internal distribution
```

---

## 🛡️ Conventions for Agents

- **Never commit** WooCommerce secret keys or `.env` files
- **Keep BI behind `isAdmin`** — `/v1/deen/stats` is admin-only
- **Offline-first** — `fetchProducts` returns the bundled snapshot, refreshes in background
- **Strict typecheck** before merging:
  - Mobile: `cd apps/mobile && npm run typecheck`
  - Gateway: `cd apps/api && npm run typecheck`
- **Build artifacts gitignored:** `*.apk`, `*.aab`, `*.ipa`, `.expo/`, `dist/`

See [AGENTS.md](./AGENTS.md) for operational rules and [BLUEPRINT.md](./BLUEPRINT.md) for the full engineering spec.

---

## 🔮 Future Milestones

- Connect production Expo Push Notification server (`expo-server-sdk`)
- Connect live bKash / Nagad merchant gateway callback tokens
- Persistent database archival for bug & crash tickets
- In-store QR/barcode scanner for pickup verification

---

<p align="center">
  <sub>Crafted with passion for DEEN Commerce • Dhaka, Bangladesh</sub>
</p>

### Project Links

- **Mobile app README:** [apps/mobile/README.md](./apps/mobile/README.md)
- **Web storefront README:** [apps/web/README.md](./apps/web/README.md)
- **Engineering Blueprint:** [BLUEPRINT.md](./BLUEPRINT.md)
- **Agent Operational Rules:** [AGENTS.md](./AGENTS.md)