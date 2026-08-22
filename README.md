# DEEN Commerce — Cross-Platform E-commerce Monorepo

[![Fastify](https://img.shields.io/badge/Fastify-8A3936?style=for-the-badge&logo=Fastify&logoColor=white)](https://www.fastify.io/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-000000?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

**Bangladesh's first denim brand — [DEEN](https://deencommerce.com)** — built as a modern full-stack e-commerce suite:  
📱 **React Native (Expo)** mobile app · ⚡ **Fastify + WooCommerce** Gateway API · 🖥️ **Next.js 14** web order desk.  

> Built for handoff between autonomous coding agents. See [`AGENTS.md`](./AGENTS.md) for operational rules and [`BLUEPRINT.md`](./BLUEPRINT.md) for the full architecture.

---

### 🔥 Why This Repo Shines

- 📦 **Monorepo** with Vite, EAS, Docker, Render & Vercel deployment pipelines  
- 🌍 **Offline-first** React Native app with 826 products bundled locally  
- 🧠 Integrates with real **WooCommerce REST API**, **Pathao Logistics**, and **bKash/Nagad** payment flows  
- 🧑‍💼 Powers three distinct user modes: **Admin**, **Registered Customer**, and **Guest**  
- 🧪 Includes **demo test accounts** ready to use out-the-box  

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
| `GET` | `/v1/auth/demo-accounts` | — | List demo test credentials |
| `POST` | `/v1/auth/login` | — | Authenticate customer, VIP, or admin |
| `POST` | `/v1/auth/guest` | — | Mint a real anonymous guest session |
| `POST` | `/v1/deen/bugs` | — | Crash & bug report sink |

### Order Creation Details

- Order number format: `DC-{seq}` (e.g. `DC-1042`)
- Pathao consignment ID: `PT-{orderNumber}-{suffix}` → tracking at `https://merchant.pathao.com/tracking?consignment_id=...`
- Must include `city`, `state` (BD-XX district code), `postcode`, `country: "BD"` in `billing` & `shipping`
- Delivery fees: **৳50** Dhaka standard, **৳90** outside Dhaka, **৳0** store pickup
- COD: `set_paid: false`, `payment_method_title: "Cash on Delivery (COD)"`

---

## 🔑 Demo Test Accounts & Credentials

| Role | Username / Email | BD Phone | Key Details |
| :--- | :--- | :--- | :--- |
| 👤 **Regular Customer** | `customer` / `tanvir@deen.com` | `01712-345678` | Tanvir Ahmed — 1,250 DEEN Coins |
| ⭐ **VIP Gold Shopper** | `vip` / `vip@deen.com` | `01899-776655` | Sajid-ul Islam — 4,800 Coins (Gold) |
| 👑 **Store Admin** | `admin` / `admin@deen.com` | `01711-223344` | BI dashboard, broadcast console |
| ⚡ **Guest Mode** | `guest` | `01911-000000` | Anonymous fast checkout |

> **Live site contact:** WhatsApp `01952-700500`, IVR `09617-700500`
> **Outlets:** Mirpur, Wari, Cumilla, Sylhet

---

## 🎛️ 3-Way User Operating Modes

Toggle via `UserModeBar.tsx` on Home & Profile:

1. **👑 Admin Panel Mode** — Live BI sparklines, revenue KPIs, broadcast marketing console
2. **👤 Registered User Mode** — Saved addresses, order history, VIP coins, size profile
3. **⚡ Guest User Mode** — Anonymous fast checkout (real random session, no shared creds)

---

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