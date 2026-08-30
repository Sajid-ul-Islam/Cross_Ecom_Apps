# DEEN Commerce — Cross-Platform E-commerce Monorepo

**DEEN** — Bangladesh's artisanal selvedge denim & contemporary apparel brand — engineered as an ultra-reliable, high-concurrency omni-channel e-commerce system:
- 📱 **Mobile Application**: React Native (Expo SDK 55 / React 19) for iOS & Android.
- ⚡ **API Gateway**: Fastify REST proxy with WooCommerce auto-sync, 2-phase idempotency, in-memory caching, and multi-origin failover.
- 🖥️ **Web Storefront & Mobile Web**: Next.js 14 App Router e-commerce experience with 100% mobile feature parity.

[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_55-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Production Storefront**: [https://deencommerce.com](https://deencommerce.com)  
**Authoritative Tech Stack Matrix**: [`docs/TECH_STACK.md`](./docs/TECH_STACK.md)  
**Developer & Agent Guidelines**: [`AGENTS.md`](./AGENTS.md)

---

## 🌟 Key Architecture & Capabilities

### 1. High-Traffic Gateway & WooCommerce Protection (`apps/api`)
- **Stateless HMAC-SHA256 Multi-Instance Auth**: Tokens (`gst.<payload>.<sig>`, `usr.<payload>.<sig>`) are signed with shared secret, enabling instant $\mathcal{O}(1)$ verification across cluster gateway replicas without database bottlenecks.
- **In-Flight Single-Flight Order Idempotency**: `_inFlightOrders` promise joining and 5-minute memory-bounded idempotency eliminate race-condition duplicate orders under heavy network jitter or client double-clicks.
- **Two-Phase Write Failover**: Safe failover for idempotent reads (`GET /catalog`) vs. strict upstream reconciliation (`findWooOrderByKey`) before retrying mutating writes (`POST /orders`).
- **Webhook Delivery Resilience**: Topic-aware cache invalidation with HMAC-SHA256 signature verification and 10-minute delivery ID deduplication.
- **Microsecond Catalog Caching**: 5-minute in-memory catalog cache with single-flight warming protects WordPress from flash-sale load spikes.
- **Multi-Tier Rate Limiting**: Dedicated rate limits for Auth (10 req/min/IP), Order Placement (6 req/min/IP), and Catalog browsing (120 req/min/IP).

### 2. Social Authentication & Real WooCommerce Customer Accounts
- **Google & Facebook Authentication**: 1-tap social login on Web and Mobile.
- **Zero WordPress PHP Changes**: The Fastify Gateway verifies Google OIDC and Facebook Graph tokens and provisions/links WooCommerce customer records (`/wp-json/wc/v3/customers`) directly via REST API.
- **Non-Guest Order Placement**: Authenticated sessions automatically attach `customer_id` into WooCommerce orders, building real customer lifetime purchase history.

### 3. Bangladeshi Fulfillment & Logistics
- **Full 64 Bangladesh Districts**: Dropdown selection with official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, `BD-58` Sylhet, etc.).
- **Dynamic Delivery Charges**: ৳50 Dhaka Standard, ৳110 Dhaka Express, ৳90 Outside Dhaka, ৳0 Store Pickup.
- **Real-Time Pathao Courier Tracking**: Live multi-step delivery status timeline (`PathaoTrackingModal`) resolved directly from `ptc_consignment_id`.
- **7-Day Doorstep Guarantee**: In-app Return & Size Exchange submission flow (`POST /v1/deen/returns`).

### 4. 100% Web & Mobile Feature Parity (`apps/web` ⇄ `apps/mobile`)
- **5-Tab Navigation**: Unified `[ 🏠 Home ] [ 🗂️ Categories ] [ 🛒 Cart (live badge) ] [ 📦 Orders ] [ 👤 Profile ]`.
- **Garment Measurement Specs**: Interactive Size Guide modal (Inches & CM) for Jeans, Trousers, Shirts, Polos, and Panjabis.
- **Denim Care Handbook**: Artisanal Japanese raw selvedge 3-step care guide (Initial Cold Soak, Break-In & Honeycomb Fading, Wool Wash Preservation).
- **Physical Outlet Stock Finder**: Live inventory availability for Mirpur 12 Flagship, Wari, Cumilla, and Sylhet with Google Maps links.
- **Direct WhatsApp Concierge**: Instant 1-tap chat (`https://wa.me/8801952700500`) with prefilled product inquiry.
- **Promotional Campaigns & BOGO**: Instant Cashback tiers (৳500 / ৳700) and BOGO 50% discount on lowest-priced denim.

---

## 🗂️ Monorepo Workspace Structure

```
Cross_Ecom_Apps/
├── apps/
│   ├── api/                    # Fastify 4.28 Gateway (Node.js / TypeScript)
│   │   ├── src/                # Server, routes, woo proxy, auth, pricing, webhooks
│   │   ├── src/pricing.test.ts # Unit tests for BOGO, Cashback, phone validation
│   │   ├── src/idempotency.test.ts # Integration tests for idempotency & session tokens
│   │   ├── Dockerfile          # Production container configuration
│   │   └── README.md           # API Gateway documentation
│   │
│   ├── mobile/                 # React Native / Expo SDK 55 Mobile App
│   │   ├── app/                # Expo Router file-based screens (tabs, product, checkout)
│   │   ├── src/                # Components, contexts, theme system, types, gateway service
│   │   ├── eas.json            # EAS Build configuration (Android APK, iOS)
│   │   └── README.md           # Mobile app documentation
│   │
│   └── web/                    # Next.js 14 Web Storefront (App Router)
│       ├── app/                # Next.js pages (shop, product, cart, checkout, orders, profile)
│       ├── components/         # Shared web components (SizeGuide, DenimCare, Outlets, Tracking)
│       ├── lib/                # API client, cart store, 64 districts data
│       └── README.md           # Web storefront documentation
│
├── docs/                       # Monorepo technical documentation
│   ├── TECH_STACK.md           # Authoritative framework & version matrix
│   ├── SYSTEM_ARCHITECTURE.md  # End-to-end data flow & infrastructure diagrams
│   ├── TODO_ROADMAP.md         # Production scorecard & implementation roadmap
│   ├── GATEWAY_FAILOVER_SETUP.md # Multi-origin failover runbook
│   ├── WEBHOOK_SETUP.md        # WooCommerce webhook HMAC-SHA256 guide
│   ├── EAS_BUILD_GUIDE.md      # Mobile build & APK generation runbook
│   ├── JEANS_FIT_CHARTS.md     # Measurement tables & sizing specifications
│   ├── BACKEND_RESILIENCE_AND_WP_CONTROL.md # Upstream resilience specifications
│   └── GO_LIVE_PLAN.md         # Production launch checklist
│
├── AGENTS.md                   # Operational guidelines & domain boundaries
├── package.json                # Monorepo scripts & dependencies
└── tsconfig.json               # Root TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Sajid-ul-Islam/Cross_Ecom_Apps.git
cd Cross_Ecom_Apps

# Install all workspace dependencies
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../mobile && npm install
cd ../..
```

### 3. Verification & Automated Tests
```bash
# Run monorepo unit & integration tests (23/23 passing)
npm test

# Run strict TypeScript typechecks across all 3 applications
npm run typecheck:all
```

### 4. Running Locally

#### Fastify API Gateway (`apps/api`):
```bash
cd apps/api
npm run dev
# Gateway runs on http://localhost:8787 (or http://localhost:3001)
```

#### Next.js Web Storefront (`apps/web`):
```bash
cd apps/web
npm run dev
# Web storefront runs on http://localhost:3000
```

#### React Native Mobile App (`apps/mobile`):
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go or press 'a' for Android emulator
```

---

## 🧪 Automated Test Suite

| Test Suite | File | Tests Passing | Key Assertions |
| :--- | :--- | :---: | :--- |
| **Idempotency & Reconciliation** | `apps/api/src/idempotency.test.ts` | 12 | Single-flight deduplication, timeout reconciliation, offline sync idempotency, stateless HMAC tokens, social auth customer linking |
| **Pricing & Business Rules** | `apps/api/src/pricing.test.ts` | 11 | Cashback tiers (৳500 / ৳700), BOGO 50% lowest item discount, 11-digit BD phone parsing, promo campaigns |
| **Total Automated Tests** | — | **23 / 23** | **100% Pass Rate** |

---

## 🌐 Production Deployment

- **Fastify Gateway (`apps/api`)**: Deployed as Docker container on [Render](https://render.com) (`https://cross-ecom-apps-4b4n.onrender.com`).
- **Web Storefront (`apps/web`)**: Deployed on [Vercel](https://vercel.com).
- **Mobile Application (`apps/mobile`)**: Built via Expo Application Services (`eas build -p android --profile preview`).

---

## 📜 License & Ownership
Copyright © 2026 DEEN Commerce. All rights reserved.
