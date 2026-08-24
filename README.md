# DEEN Commerce — Cross-Platform E-commerce Monorepo

**Bangladesh's first denim brand — DEEN** — built as a modern e-commerce suite: a **React Native (Expo SDK 55) mobile app**, a **Fastify WooCommerce-gateway API**, and a **Next.js 14 web storefront order desk**. Designed to be handed between autonomous coding agents (see [docs/BLUEPRINT.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/BLUEPRINT.md) and [docs/REVIEW.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/REVIEW.md)).

[![Fastify](https://img.shields.io/badge/Fastify-8A3936?style=for-the-badge&logo=Fastify&logoColor=white)](https://www.fastify.io/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-000000?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

**Store Backend**: [deencommerce.com](https://deencommerce.com)  
📱 **React Native (Expo)** mobile app · ⚡ **Fastify + WooCommerce** Gateway API · 🖥️ **Next.js 14** web order desk.  

> Built for handoff between autonomous coding agents. See [AGENTS.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/AGENTS.md) for workspace rules and the [docs/](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/README.md) directory for full architectural documentation.

---

### 🔥 Why This Repo Shines

- 📦 **Monorepo** with Vite, EAS, Docker, Render & Vercel deployment pipelines  
- 🌍 **Offline-first** React Native app with 826 products bundled locally  
- 🧠 Integrates with real **WooCommerce REST API**, **Pathao Logistics**, and **bKash/Nagad/COD** payment flows  
- 🔄 **Multi-Gateway Failover & Keep-Alive**: App-side automated failover across gateway origins on 5xx or timeouts  
- 🖼️ **Responsive Image Sizing**: Sourced directly from WordPress image sizes (`thumb`, `single`, `full`)  
- ⚡ **Real-Time Webhooks**: Topic-aware cache invalidation with HMAC-SHA256 signature verification  
- 🧑‍💼 Powers three distinct user modes: **Admin**, **Registered Customer**, and **Guest**  

---

## 📚 Centralized Documentation

All detailed architectural guides, runbooks, and specifications are organized in the [`docs/`](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/README.md) folder:

| Document | Purpose |
| :--- | :--- |
| **[System Architecture](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/SYSTEM_ARCHITECTURE.md)** | Technical deep-dive: 3-tier architecture, request lifecycles, offline resilience, and authentication. |
| **[System Review & Audit](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/REVIEW.md)** | Comprehensive 2026 system review, security vulnerability audit (SEC-1–8, REM-1–7), and scorecard. |
| **[SaaS Blueprint](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/BLUEPRINT.md)** | SaaS production-grade blueprint, reliability goals, conversion features, and multi-tenant roadmap. |
| **[Go-Live Plan](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/GO_LIVE_PLAN.md)** | Prioritized launch plan (P0/P1/P2), production hardening checklist, and environment variables. |
| **[Gateway Failover Setup](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/GATEWAY_FAILOVER_SETUP.md)** | Multi-origin gateway failover, keep-alive probing, and deployment runbook. |
| **[Webhook Integration](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/WEBHOOK_SETUP.md)** | Real-time WooCommerce webhook synchronization and auto-provisioning. |
| **[Backend Resilience Spec](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/BACKEND_RESILIENCE_AND_WP_CONTROL.md)** | R&D specification for shared multi-gateway state and WordPress control-plane. |
| **[EAS Build Guide](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/EAS_BUILD_GUIDE.md)** | React Native / Expo EAS build runbook, React 19 icon resolution, and troubleshooting. |
| **[Jeans Fit Charts](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/JEANS_FIT_CHARTS.md)** | Jeans category fit detection, brand measurement specs, and `SizeGuideModal` integration. |
| **[Session Log](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/SESSION_LOG.md)** | Chronological record of user instructions, architectural decisions, and commit history. |

---

## Repo Layout

```
Cross_Ecom_Apps/
├── apps/
│   ├── mobile/                 # Expo SDK 55 app (com.deencommerce.app)
│   │   ├── app/                # Expo Router file-based navigation ((tabs), checkout, etc.)
│   │   ├── src/
│   │   │   ├── components/     # Modals, vector icons, cards, banners
│   │   │   ├── context/        # Theme, Store, Cart, Order, Wishlist, Notifications
│   │   │   ├── data/           # catalog.snapshot.json (826 products), districts
│   │   │   ├── services/       # gateway.ts (Render REST client with failover)
│   │   │   ├── theme/          # Light/Dark color tokens (#F4F6FC typography)
│   │   │   └── types/          # TypeScript domain contracts
│   │   ├── eas.json            # EAS Build profiles
│   │   └── app.json            # Expo config (gatewayUrl, gatewayUrls, scheme)
│   │
│   ├── api/                    # Fastify REST Gateway (Node.js / TS)
│   │   ├── src/
│   │   │   ├── index.ts        # Server bootstrap (CORS, rate limit, schemas)
│   │   │   ├── routes.ts       # All /v1/* endpoints (auth, orders, coupons, webhooks)
│   │   │   ├── woo.ts          # WooCommerce REST proxy + circuit breaker & caching
│   │   │   ├── seed.ts         # Offline-first product seed catalog
│   │   │   └── config.ts       # Env loading & multi-tenant store registry
│   │   ├── Dockerfile          # node:20-alpine container
│   │   └── package.json
│   │
│   └── web/                    # Next.js 14 web storefront
│       ├── app/                # Pages: shop, product, cart, checkout, orders
│       ├── components/         # ProductCard, Header, Footer
│       ├── lib/                # api.ts, districts.ts, cart.tsx
│       └── next.config.mjs
│
├── docs/                       # Complete project documentation hub
├── AGENTS.md                   # Operational rules (Woo, Pathao, districts)
├── render.yaml                 # Render Blueprint → apps/api Docker deploy
├── vercel.json                 # Vercel zero-config for apps/web
├── package.json                # Workspace root (scripts & typechecks)
└── tsconfig.json               # Root TS config
```

---

## Quickstart

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
```bash
# Gateway API (port 8807 or 3001)
cd apps/api && npm run dev

# Web Storefront (port 3000)
cd apps/web && npm run dev

# Mobile Expo App
cd apps/mobile && npx expo start
```

---

## Gateway API Key Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/health` | Gateway & WooCommerce upstream status | Public |
| `GET` | `/v1/deen/products` | Cached WooCommerce product catalog | Keyed (`x-api-key`) |
| `GET` | `/v1/deen/store-info`| Live WordPress / WooCommerce store details | Keyed |
| `GET` | `/v1/deen/coupon?code=` | Live WooCommerce coupon validation | Keyed |
| `GET` | `/v1/deen/cashback?subtotal=` | Dynamic cashback calculation | Keyed |
| `POST` | `/v1/deen/order` | Place real WooCommerce order | Keyed |
| `GET` | `/v1/deen/orders` | Scoped customer order history | Bearer Token |
| `POST` | `/v1/auth/login` | WordPress customer authentication | Keyed |
| `POST` | `/v1/auth/guest` | Anonymous guest session creation | Keyed |
| `POST` | `/v1/deen/webhook/woo` | Real-time WooCommerce cache invalidation | HMAC SHA-256 |
| `POST` | `/v1/deen/webhook/woo/register` | Webhook auto-provisioner | Keyed |

---

## License

MIT License. Copyright (c) 2026 DEEN Commerce.