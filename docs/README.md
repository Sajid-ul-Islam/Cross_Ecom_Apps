# DEEN Commerce — Documentation Hub

Welcome to the centralized documentation directory for the DEEN Commerce ecosystem.

---

## 📚 Documentation Index

| Document | Purpose & Scope |
| :--- | :--- |
| **[SYSTEM_ARCHITECTURE.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/SYSTEM_ARCHITECTURE.md)** | Technical deep-dive: 3-tier architecture, request lifecycles, offline resilience, authentication, and image sizing. |
| **[REVIEW.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/REVIEW.md)** | Comprehensive 2026 system review, security vulnerability audit (SEC-1–8, REM-1–7), and scorecard. |
| **[BLUEPRINT.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/BLUEPRINT.md)** | SaaS production-grade blueprint, reliability goals, conversion features, and multi-tenant roadmap. |
| **[GO_LIVE_PLAN.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/GO_LIVE_PLAN.md)** | Prioritized launch plan (P0/P1/P2), production hardening checklist, and environment variables guide. |
| **[GATEWAY_FAILOVER_SETUP.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/GATEWAY_FAILOVER_SETUP.md)** | Multi-origin gateway failover, keep-alive probing, and deployment runbook. |
| **[WEBHOOK_SETUP.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/WEBHOOK_SETUP.md)** | Real-time WooCommerce webhook synchronization, HMAC-SHA256 signature verification, and auto-provisioning. |
| **[BACKEND_RESILIENCE_AND_WP_CONTROL.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/BACKEND_RESILIENCE_AND_WP_CONTROL.md)** | R&D specification for shared multi-gateway state and WordPress control-plane administration. |
| **[EAS_BUILD_GUIDE.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/EAS_BUILD_GUIDE.md)** | React Native / Expo EAS build runbook, React 19 icon resolution, and build quota troubleshooting. |
| **[JEANS_FIT_CHARTS.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/JEANS_FIT_CHARTS.md)** | Jeans category fit detection, brand measurement specs, and `SizeGuideModal` integration. |
| **[SESSION_LOG.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/SESSION_LOG.md)** | Full chronological record of user instructions, architectural decisions, and commit history. |

---

## 🏗️ Architecture at a Glance

```text
  ┌─────────────────────────────────────────────────────────────┐
  │              WordPress / WooCommerce Backend                │
  │                  https://deencommerce.com                   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ REST API (v3) + Webhooks
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 Fastify Gateway (apps/api)                  │
  │      - Multi-origin failover & keep-alive probes            │
  │      - Circuit breaker, retry pool, and cache invalidation  │
  │      - Disk-persisted authentication & guest sessions       │
  └──────────────┬───────────────────────────────┬──────────────┘
                 │                               │
                 ▼                               ▼
  ┌─────────────────────────────┐ ┌─────────────────────────────┐
  │  Expo Mobile (apps/mobile)  │ │   Next.js 14 (apps/web)     │
  │ - Offline-first catalog     │ │ - Full SSR/CSR Storefront   │
  │ - Real Woo #204xxx orders   │ │ - 64 BD Districts + Pathao  │
  │ - Dynamic themes & tokens   │ │ - Responsive Design System  │
  └─────────────────────────────┘ └─────────────────────────────┘
```
