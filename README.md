# DEEN Commerce — Cross-Platform E-commerce Monorepo

**Bangladesh's first denim brand — DEEN** — built as a modern omni-channel e-commerce suite: a **React Native (Expo SDK 57) mobile app**, a **Fastify WooCommerce-gateway API**, and a **Next.js 14 web storefront order desk**.

[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Store Backend**: [https://deencommerce.com](https://deencommerce.com)  
📱 **React Native (Expo SDK 57)** mobile app · ⚡ **Fastify + WooCommerce** Gateway API · 🖥️ **Next.js 14** web order desk.

> Built for handoff between autonomous coding agents. See [AGENTS.md](./AGENTS.md) for workspace rules, [docs/TECH_STACK.md](./docs/TECH_STACK.md) for the single authoritative version matrix, and the [docs/](./docs/README.md) directory for full architectural documentation.

---

### 🔥 Highlights & Capabilities

- 📦 **Monorepo Architecture**: Clean separation between `apps/mobile`, `apps/api`, and `apps/web`.
- 🌍 **Offline-First Mobile App**: Bundles 826-product catalog snapshot for instant initial load without blocking network requests.
- ⚡ **Secure Gateway Tier**: Fastify proxy shields WooCommerce API keys, provides circuit breaking, in-memory caching, and multi-origin failover.
- 🚚 **Pathao Logistics Tracking**: Real-time integration with Pathao Courier consignment tracking (`ptc_consignment_id`).
- 🗺️ **Full 64 Bangladesh Districts**: Native dropdowns & state code mappings (`BD-13` Dhaka, `BD-10` Chattogram, etc.) across both mobile and web checkout.
- 💰 **Comprehensive Payment Options**: Cash on Delivery (COD), bKash, Nagad, and Card payments.
- 🌓 **Dynamic Theme Engine**: System-inherited and user-selectable Light & Dark modes with `#F4F6FC` crisp dark-mode typography.
- 👑 **3-Way User Operating Modes**: Instant role switcher on Mobile (`Admin Mode`, `Registered Customer`, `Guest Shopper`).

---

## 📚 Centralized Documentation Hub

All architectural specifications, security audits, and operations guides live in the [`docs/`](./docs/README.md) directory:

| Document | Purpose |
| :--- | :--- |
| **[Authoritative Tech Stack](./docs/TECH_STACK.md)** | **Single source of truth** for all framework, SDK, runtime, and dependency versions across the monorepo. |
| **[System Architecture](./docs/SYSTEM_ARCHITECTURE.md)** | Technical deep-dive: 3-tier architecture, request lifecycles, offline resilience, and authentication. |
| **[System Review & Audit](./docs/REVIEW.md)** | Comprehensive 2026 system review, security vulnerability audit (SEC-1–8, REM-1–7), and scorecard. |
| **[SaaS Blueprint](./docs/BLUEPRINT.md)** | SaaS production-grade blueprint, reliability goals, conversion features, and multi-tenant roadmap. |
| **[Go-Live Plan](./docs/GO_LIVE_PLAN.md)** | Prioritized launch plan (P0/P1/P2), production hardening checklist, and environment variables. |
| **[Gateway Failover Setup](./docs/GATEWAY_FAILOVER_SETUP.md)** | Multi-origin gateway failover, keep-alive probing, and deployment runbook. |
| **[Webhook Integration](./docs/WEBHOOK_SETUP.md)** | Real-time WooCommerce webhook synchronization and auto-provisioning. |
| **[Backend Resilience Spec](./docs/BACKEND_RESILIENCE_AND_WP_CONTROL.md)** | R&D specification for shared multi-gateway state and WordPress control-plane. |
| **[EAS Build Guide](./docs/EAS_BUILD_GUIDE.md)** | React Native / Expo EAS build runbook, React 19 icon resolution, and troubleshooting. |
| **[Jeans Fit Charts](./docs/JEANS_FIT_CHARTS.md)** | Jeans category fit detection, brand measurement specs, and `SizeGuideModal` integration. |
| **[Session Log](./docs/SESSION_LOG.md)** | Chronological record of user instructions, architectural decisions, and commit history. |

---

## 🗂️ Workspace Layout

```
Cross_Ecom_Apps/
├── apps/
│   ├── mobile/                 # React Native / Expo SDK 55 Mobile App
│   │   ├── app/                # Expo Router file-based navigation
│   │   ├── src/                # Components, Contexts, Theme, Types, Services
│   │   ├── eas.json            # EAS Build profiles (Preview APK, Production)
│   │   └── README.md           # Mobile app documentation
│   │
│   ├── api/                    # Fastify REST Gateway (Node.js / TypeScript)
│   │   ├── src/                # Fastify server, WooCommerce proxy, routes, webhooks
│   │   ├── Dockerfile          # Production Docker container
│   │   └── README.md           # API gateway documentation
│   │
│   └── web/                    # Next.js 14 Web Storefront
│       ├── app/                # App Router pages (shop, product, cart, checkout, orders)
│       ├── components/         # Web UI components & design system
│       ├── lib/                # API client, 64 districts & cart context
│       └── README.md           # Web storefront documentation
│
├── docs/                       # Complete project documentation hub
├── AGENTS.md                   # Operational rules (WooCommerce, Pathao, districts)
├── render.yaml                 # Render Blueprint for Docker deployment
├── vercel.json                 # Vercel configuration for Next.js web app
├── package.json                # Workspace root scripts & typechecks
└── tsconfig.json               # Root TypeScript configuration
```

---

## ⚡ Quickstart

### 1. Install Dependencies
```bash
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../mobile && npm install
cd ../..
```

### 2. Run Typecheck Across All Workspaces
```bash
npm run typecheck:all
```

### 3. Run Applications Locally

#### Fastify Gateway API (Port `8807`)
```bash
cd apps/api
npm run dev
```

#### Next.js 14 Web Storefront (Port `3000`)
```bash
cd apps/web
npm run dev
```

#### Expo Mobile App
```bash
cd apps/mobile
npx expo start
```

---

## 📡 Gateway API Key Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/health` | Gateway & WooCommerce upstream status | Public |
| `GET` | `/v1/deen/products` | Cached WooCommerce product catalog | Keyed (`x-api-key`) |
| `GET` | `/v1/deen/store-info` | Live WordPress / WooCommerce store details | Keyed |
| `GET` | `/v1/deen/coupon?code=` | Live WooCommerce coupon validation | Keyed |
| `GET` | `/v1/deen/cashback?subtotal=` | Dynamic cashback calculation | Keyed |
| `POST` | `/v1/deen/order` | Place real WooCommerce order | Keyed |
| `GET` | `/v1/deen/orders` | Scoped customer order history | Bearer Token / Key |
| `POST` | `/v1/auth/login` | WordPress customer authentication | Keyed |
| `POST` | `/v1/auth/guest` | Anonymous guest session creation | Keyed |
| `POST` | `/v1/deen/webhook/woo` | Real-time WooCommerce cache invalidation | HMAC SHA-256 |
| `POST` | `/v1/deen/webhook/woo/register` | Webhook auto-provisioner | Keyed |

---

## 📄 License

MIT License. Copyright (c) 2026 DEEN Commerce.