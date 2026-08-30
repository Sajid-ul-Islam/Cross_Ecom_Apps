# DEEN Commerce — Documentation Hub

Welcome to the centralized documentation directory for the DEEN Commerce ecosystem.

---

## 📚 Documentation Index

| Document | Purpose & Scope |
| :--- | :--- |
| **[TECH_STACK.md](./TECH_STACK.md)** | **Single authoritative version matrix** for all frameworks (Expo SDK 57, Fastify 4.x, Next.js 14) and tooling. |
| **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** | Technical deep-dive: 3-tier architecture, request lifecycles, offline resilience, authentication, and image sizing. |
| **[REVIEW.md](./REVIEW.md)** | Comprehensive 2026 system review, security vulnerability audit (SEC-1–8, REM-1–7), and scorecard. |
| **[BLUEPRINT.md](./BLUEPRINT.md)** | SaaS production-grade blueprint, reliability goals, conversion features, and multi-tenant roadmap. |
| **[GO_LIVE_PLAN.md](./GO_LIVE_PLAN.md)** | Prioritized launch plan (P0/P1/P2), production hardening checklist, and environment variables guide. |
| **[GATEWAY_FAILOVER_SETUP.md](./GATEWAY_FAILOVER_SETUP.md)** | Multi-origin gateway failover, keep-alive probing, and deployment runbook. |
| **[WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md)** | Real-time WooCommerce webhook synchronization, HMAC-SHA256 signature verification, and auto-provisioning. |
| **[BACKEND_RESILIENCE_AND_WP_CONTROL.md](./BACKEND_RESILIENCE_AND_WP_CONTROL.md)** | R&D specification for shared multi-gateway state and WordPress control-plane administration. |
| **[EAS_BUILD_GUIDE.md](./EAS_BUILD_GUIDE.md)** | React Native / Expo EAS build runbook, React 19 icon resolution, and build quota troubleshooting. |
| **[JEANS_FIT_CHARTS.md](./JEANS_FIT_CHARTS.md)** | Jeans category fit detection, brand measurement specs, and `SizeGuideModal` integration. |
| **[SESSION_LOG.md](./SESSION_LOG.md)** | Full chronological record of user instructions, architectural decisions, and commit history. |

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

---

## 🚀 Quick Navigation

- **Mobile App**: [apps/mobile/README.md](../apps/mobile/README.md)
- **Gateway API**: [apps/api/README.md](../apps/api/README.md)
- **Web Storefront**: [apps/web/README.md](../apps/web/README.md)
- **Root Repository Guide**: [README.md](../README.md)
- **Operational Rules**: [AGENTS.md](../AGENTS.md)
