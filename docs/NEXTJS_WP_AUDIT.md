# Next.js + WordPress REST API — Full Engineering Audit & Action Plan

> **Status Tracker & Execution Roadmap**
> **Current Phase:** Phase 1 — Comprehensive Architecture & Security Audit (Complete)
> **Next Phase:** Phase 2 — Implementation & Step-by-Step Remediation (Awaiting Approval)

---

## Audit Specification & Objectives

You are a **Senior Next.js Architect, Web Security Engineer, Performance Engineer, and Code Reviewer**.

Perform a **deep engineering audit** of this existing Next.js application.

The application uses **Next.js as the frontend/application layer and WordPress REST API as the backend/data source** (via the Fastify API Gateway layer).

Do NOT assume the existing architecture is correct. Your job is to inspect the actual codebase, identify architectural problems, security risks, performance issues, unnecessary complexity, and opportunities to use Next.js correctly.

---

## 1. Understand the Existing Architecture

Identify:
- Next.js version: **14.2.35 (App Router)**
- React version: **18.3.1**
- App Router vs Pages Router: **100% App Router (`apps/web/app/`)**
- TypeScript: **TypeScript 5.4.5, strict mode enabled**
- Rendering strategy: **Hybrid — Server Components layout & metadata + Client Component interactives**
- Gateway & WP Integration: **Centralized Fastify 4.28 Gateway (`apps/api`) proxying WooCommerce REST API with in-memory caching & HMAC session tokens**

```text
Browser / Client (Desktop & Mobile)
   ↓
Next.js 14 Web Frontend (`apps/web`)
   ├── Server Components (Root Layout, Metadata, Static Shells)
   ├── Client Components (ProductCard, SizeGuide, Checkout, Wishlist, Notifications)
   ├── Local Cart & Profile Store (`localStorage` + Context)
   └── API Client (`apps/web/lib/api.ts`)
          ↓ (HTTPS / REST)
Fastify API Gateway (`apps/api`)
   ├── In-Memory Catalog Cache (5-min TTL, single-flight stampede protection)
   ├── Stateless HMAC-SHA256 Token Verification (`usr.*`, `gst.*`)
   ├── Rate Limiting (Auth: 10/min, Orders: 6/min, Catalog: 120/min)
   └── 2-Phase Order Idempotency & Reconciliation
          ↓ (HTTPS / Basic Auth & REST API)
WordPress / WooCommerce (`https://deencommerce.com/wp-json/wc/v3`)
   ├── Products, Variations, Stock
   ├── Customers & Orders
   └── Pathao Courier Consignments
```

---

## Execution & Task Tracking Matrix

| Phase | Task ID | Domain / Area | Action Item | Status | Commit / PR |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **0** | **AUDIT-00** | Monorepo Doc | Save Audit Specification & Execution Tracker in `docs/` | ✅ Done | Initial |
| **0** | **AUDIT-01** | Full Audit | Perform comprehensive 24-section audit across `apps/web`, `apps/api`, and `apps/mobile` | ✅ Done | `docs/NEXTJS_WP_AUDIT_REPORT.md` |
| **1** | **SEC-01** | Web / Security | Migrate token/profile storage from raw `localStorage` to HttpOnly SameSite cookies / secure session management | ✅ Done | `app/api/auth/session/route.ts` |
| **1** | **SEC-02** | Gateway / Auth | Add CSP, security headers & frame-ancestors to Next.js `next.config.mjs` and Gateway | ✅ Done | `next.config.mjs` |
| **1** | **SEC-03** | API / IDOR | Audit order lookup scoping to ensure customers cannot inspect arbitrary orders by guessing IDs | ✅ Done | Verified in `routes.ts` |
| **2** | **ARCH-01** | Next.js Architecture | Refactor PDP (`app/product/[id]/page.tsx`) to Server Component data fetching with streaming Suspense | ✅ Done | `product/[id]/page.tsx` |
| **2** | **ARCH-02** | Next.js Architecture | Implement Server Actions / Route Handlers for checkout mutation to shield gateway tokens | ✅ Done | `app/api/checkout/route.ts` |
| **3** | **PERF-01** | Web / Media | Replace raw `<img>` tags with optimized `next/image` with remote patterns for WordPress CDN | ✅ Done | `ProductDetailClient.tsx` |
| **3** | **PERF-02** | Caching | Integrate Next.js `unstable_cache` & tag revalidation (`revalidateTag("catalog")`) with Fastify webhook invalidation | ✅ Done | `api/revalidate/route.ts` & `lib/api.ts` |
| **4** | **CLEAN-01**| Code Cleanliness | Centralize typed API models and Zod schema runtime validation for WooCommerce payloads | ⏳ Queued | Next Step |
| **4** | **PARITY-01**| Web ⇄ Mobile Parity | Ensure all Web updates maintain 100% design and functional parity with `apps/mobile` | ✅ Done | Verified & Monorepo typechecked |

---

*(This document is updated and committed to Git after every completed implementation step).*
