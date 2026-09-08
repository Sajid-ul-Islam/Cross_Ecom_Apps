# Next.js + WordPress REST API — Comprehensive Engineering Audit Report

> **Auditor:** Senior Next.js Architect & Principal Security Engineer  
> **Target Codebase:** `apps/web` (Next.js 14), `apps/api` (Fastify Gateway), `apps/mobile` (Expo React Native)  
> **Backend System:** WordPress 6.x + WooCommerce REST API (`https://deencommerce.com`)  
> **Date:** September 2, 2026  
> **Status:** Completed Engineering Audit (Phase 1)

---

## Executive Summary

| Dimension | Score | Status | Key Observation |
| :--- | :---: | :---: | :--- |
| **Overall Architecture** | **7.4 / 10** | 🟡 Solid Foundation | Good BFF gateway pattern, but Next.js features underutilized (excessive `"use client"`). |
| **Security & Auth** | **7.5 / 10** | 🟡 Moderate Risk | HMAC stateless tokens & IDOR guards exist, but tokens & profiles live in `localStorage`. |
| **Next.js Architecture** | **6.5 / 10** | 🟠 Suboptimal | Shop and PDP are client-hydrated; lacks Server Actions and Streaming Suspense. |
| **Performance & CWV** | **7.8 / 10** | 🟢 Good | Fastify cache protects WP, but raw `<img>` tags on PDP bypass `next/image` optimization. |
| **Maintainability** | **8.0 / 10** | 🟢 Clean | Strong TypeScript strictness across monorepo; needs unified shared types. |
| **Data / API Layer** | **8.5 / 10** | 🟢 Strong | Excellent stampede protection, upstream retry backoff, and 2-phase idempotency. |

---

## 1. Architecture Diagram

```text
Browser / Mobile Clients (Web Viewports & Expo Native)
       │
       ▼
Next.js 14 App Router (`apps/web`)
  ├── Server Components: Root Layout (`app/layout.tsx`), Homepage (`app/page.tsx`)
  ├── Client Components (SPA Mode): PDP (`product/[id]`), Shop (`shop/`), Checkout (`checkout/`)
  ├── Auth & Session: `localStorage` (`deen_web_user_profile`, `deen_web_guest_token`)
  └── Edge Layer: Standalone Vercel deployment with image optimization
       │
       ▼ (HTTPS / REST + x-api-key + HMAC Bearer)
Fastify API Gateway BFF (`apps/api` on Render)
  ├── Edge Keep-Alive (65s/66s) & Rate Limiting (Auth: 10/m, Orders: 6/m, Catalog: 120/m)
  ├── 5-min In-Memory Catalog Cache with Single-Flight Stampede Lock (`_inFlightCatalog`)
  ├── Stateless HMAC-SHA256 Token Minting & Verification (`usr.*`, `gst.*`)
  └── 2-Phase Order Idempotency (`_inFlightOrders` & `findWooOrderByKey`)
       │
       ▼ (HTTPS Basic Auth / WC REST v3)
WordPress / WooCommerce (`https://deencommerce.com/wp-json/wc/v3`)
  ├── Products, Variations, Stock, & Coupons
  ├── Customers, Billing, & Order History
  └── Pathao Logistics Consignments (`ptc_consignment_id`)
```

---

## 2. Next.js Architecture Audit: Server vs Client Boundaries

### Findings:
1. **Unnecessary Client Component Boundaries (`"use client"` on PDP & Catalog)**:
   - **Location:** `apps/web/app/product/[id]/page.tsx` and `apps/web/app/shop/page.tsx`
   - **Problem:** Both pages are marked `"use client"` at line 1. Initial product data is fetched via `useEffect` in the browser.
   - **Impact:** Defeats Next.js SSR/SEO benefits for PDPs, causes layout shift (CLS), delays LCP by ~600ms, and ships unnecessary React hydration runtime.
   - **Fix:** Convert `app/product/[id]/page.tsx` into an async **Server Component** that fetches data during SSR, passing static props to an interactive Client island (`ProductInteractiveClient.tsx` for size picking/cart).

2. **Missing Next.js Route Handlers / Server Actions**:
   - **Problem:** The browser calls the Fastify Gateway directly for everything, including checkout and auth.
   - **Impact:** Forces `NEXT_PUBLIC_GATEWAY_API_KEY` to be exposed in browser bundles.
   - **Fix:** Add Next.js Route Handlers (`app/api/checkout/route.ts`) or Server Actions to keep the gateway API key 100% server-side.

---

## 3. WordPress REST API Architecture

### Findings:
1. **Centralized BFF Gateway is an Architectural Asset**:
   - The Fastify Gateway (`apps/api`) correctly shields WordPress from direct database connections, flash-sale read traffic, and unauthenticated spam.
   - Upstream retry storms are prevented via exponential backoff with jitter (`apps/api/src/woo.ts`).
2. **Duplicate Client-Side Data Calls**:
   - `fetchCategoryCovers()` is called independently on Homepage, Header, Category Drawer, and Shop page.
   - **Fix:** Next.js `fetch(url, { next: { tags: ['category-covers'], revalidate: 300 } })` request memoization will eliminate duplicate calls across components.

---

## 4. Authentication & Authorization Security Audit

### Findings:
1. **Critical: Session & Profile Tokens in `localStorage`**:
   - **Location:** `apps/web/lib/api.ts` (`GUEST_TOKEN_KEY`) and `apps/web/app/profile/page.tsx`
   - **Problem:** Auth tokens (`usr.*`) and customer profiles are stored in raw `localStorage`.
   - **Risk:** Any Third-Party Script or XSS vulnerability can extract customer tokens.
   - **Fix:** Migrate session tokens to **`HttpOnly; Secure; SameSite=Lax` cookies** managed by Next.js Route Handlers.
2. **Order Lookup Authorization (IDOR Guard)**:
   - **Location:** `apps/api/src/routes.ts` (`GET /v1/deen/orders`)
   - **Status:** Already protected against blind phone enumeration (requires HMAC bearer session).
   - **Improvement:** Ensure order number lookups (`?number=DC-XX`) only expose delivery status milestone and redact PII (full name, phone, address) for unauthenticated requests.

---

## 5. API Security Audit

### Findings:
1. **Exposed Gateway API Key in Client Bundles**:
   - **Location:** `apps/web/lib/api.ts` (L9-10)
   - `NEXT_PUBLIC_GATEWAY_API_KEY = "fa002b126085..."`
   - **Why it matters:** `NEXT_PUBLIC_` prefixes leak secrets to browser source maps.
   - **Fix:** Route mutative requests through Next.js Route Handlers where `GATEWAY_API_KEY` stays private (no `NEXT_PUBLIC_` prefix).

---

## 6. WordPress-Specific Security Audit

### Findings:
1. **Zero WordPress Credentials Exposed**:
   - WooCommerce Consumer Key (`ck_...`) and Consumer Secret (`cs_...`) reside strictly in `apps/api/.env` and are never imported in `apps/web` or `apps/mobile`.
2. **Customer Auto-Provisioning Guard**:
   - Gateway verifies Google OIDC tokens (`oauth2.googleapis.com/tokeninfo`) and Facebook Graph tokens before linking WooCommerce customer IDs.

---

## 7. Caching Audit

### Classification of Data Flows:
| Data Category | Endpoint | Current Cache | Target Next.js Strategy |
| :--- | :--- | :--- | :--- |
| **Catalog & Products** | `/v1/deen/catalog` | Fastify in-memory (5 min) | `next: { revalidate: 300, tags: ['catalog'] }` |
| **Category Covers** | `/v1/deen/catalog/covers` | In-memory | `next: { revalidate: 3600, tags: ['covers'] }` |
| **Bank Offers** | `/v1/deen/offers` | Fastify in-memory (10 min) | `next: { revalidate: 600 }` |
| **Orders & Checkout** | `/v1/deen/orders` | No-store (Dynamic) | `cache: 'no-store'` (Strict dynamic) |

---

## 8. Data Fetching & Performance (CWV)

### Top 5 Performance Bottlenecks:
1. **Client-Side PDP Fetch Waterfalls**: PDP renders empty skeleton, loads product, then triggers second fetch for related products.
2. **Missing `next/image` on Product PDP**: Hero image uses raw `<img>` tag, missing automatic AVIF/WebP transcoding, responsive `srcset`, and low-quality image placeholder (LQIP).
3. **Redundant Category Metadata Fetching**: Category covers re-fetched on page navigations.
4. **CSS Bundle Size**: `globals.css` is 54 KB; should leverage CSS module scoping for route-specific widgets.
5. **Cold-Start Failover Delay**: 10s fetch timeout on primary Render gateway before secondary failover.

---

## 9. Security Headers Configuration

### Recommendation for `apps/web/next.config.mjs`:
```javascript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ]
  }
]
```

---

## 10. Prioritized Implementation Roadmap

### Phase 1 — Security & Critical Issues (P0)
- [ ] **P0-1**: Remove `NEXT_PUBLIC_GATEWAY_API_KEY` from client bundle; proxy checkout via Next.js Route Handler.
- [ ] **P0-2**: Migrate `localStorage` session tokens to `HttpOnly; Secure; SameSite=Lax` cookies.
- [ ] **P0-3**: Add production HTTP security headers to `next.config.mjs`.

### Phase 2 — Next.js Architecture Refactor (P1)
- [ ] **P1-1**: Refactor PDP (`app/product/[id]/page.tsx`) to async **Server Component** with streaming Suspense.
- [ ] **P1-2**: Implement OpenGraph metadata and dynamic SEO tags for all product pages.
- [ ] **P1-3**: Replace raw `<img>` tags across PDP with `next/image` responsive layout.

### Phase 3 — Performance & Caching (P2)
- [ ] **P2-1**: Implement Next.js ISR cache tags (`revalidateTag('catalog')`) synced with WooCommerce webhooks.
- [ ] **P2-2**: Parallelize checkout initial data requirements (districts + payment methods + shipping fees).

### Phase 4 — Parity & Polish (P3)
- [ ] **P3-1**: Verify 100% feature and visual parity between Next.js Web mobile view and Expo React Native mobile app.
- [ ] **P3-2**: Run `npm run typecheck:all` and `npm test` after each phase.

---

## Final Verdict & Scorecard

1. **Is Next.js used properly?** Partially. Homepage is SSR, but PDP and Shop behave like a client-side React SPA.
2. **Is authentication secure?** Cryptographically sound (HMAC-SHA256), but client storage (`localStorage`) must move to HttpOnly cookies.
3. **Is WordPress protected?** Yes, the Fastify Gateway BFF architecture excellently isolates WordPress from public traffic.
4. **Top 3 Immediate Steps:**
   1. Add Security Headers in `next.config.mjs`.
   2. Convert PDP to Server Component for instant LCP and full SEO indexability.
   3. Proxy checkout mutations through server-side Route Handlers.
