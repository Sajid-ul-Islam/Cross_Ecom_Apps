# DEEN Commerce — SaaS Production-Grade Blueprint

> Goal: Run the DEEN storefront as a high-performance retail business AND evolve the gateway into a reusable, multi-tenant commerce backend (true SaaS).
>
> **Core Rule (Source of Truth):** The app is a thin client over `gateway → WooCommerce → WordPress`. Every product, price, size, category cover image, and store policy MUST originate from WooCommerce/WordPress via the gateway. Never hardcode promo gifts or third-party AI-hosted images.

---

## 1. Reliability (Zero-Downtime Customer Experience)

- [x] **Gateway Health Probing**: `/health` and `/v1/health` return deep upstream status (`woo: ok | degraded | down`).
- [x] **Caching & Upstream Protection**: 5-minute catalog cache, variation cache, and cover cache protect against WooCommerce latency.
- [x] **Retry + Timeout + Circuit-Breaker**: Upstream `wooFetch` guarded with exponential backoff and circuit breaking.
- [x] **Multi-Gateway Client Failover**: Mobile app automatically fails over across `GATEWAY_URLS` upon network/5xx errors.
- [x] **Persistent Session Storage**: In-memory tokens and guest sessions are serialized to disk (`auth_sessions.json`, `guest_sessions.json`).
- [x] **Rotatable `GATEWAY_API_KEY`**: Client identity validation on all non-OPTIONS routes.
- [x] **CI Typecheck Guards**: Automated `npm run typecheck:all` validating `apps/api`, `apps/web`, and `apps/mobile`.

---

## 2. Conversion & Sales (Revenue & Retention)

- [x] **Frictionless Auth**: Guest checkout sessions with scoped order access, WordPress customer login, and in-app BD phone registration.
- [x] **Cart & Dynamic Pricing**: Live WooCommerce cashback calculations (`/v1/deen/cashback`), dynamic coupon code validation (`/v1/deen/coupon`), and quantity selection.
- [x] **Trust & Clarity**: Real WooCommerce order numbering (`#204xxx`), genuine product reviews modal, and dynamic store hotline/WhatsApp concierge buttons.
- [x] **Bangladeshi Fulfillment**: 64 Bangladesh districts dropdown with WooCommerce state codes (`BD-13` / `BD-10`), dynamic delivery charges (৳50 Dhaka, ৳90 Outside, ৳0 Pickup), and real Pathao consignment tracking.
- [ ] **Automated Payment Gateway**: Direct bKash / Nagad / SSLCommerz payment APIs (currently Cash on Delivery + manual TrxID).

---

## 3. Multi-Tenancy & SaaS Architecture

- [x] **Configuration Registry (`config.ts`)**: Configurable `STORES` array supporting multi-store credentials.
- [x] **Tenant Lookup**: Requests route to appropriate store configurations based on `x-api-key` or subdomain.
- [ ] **White-Label Builds**: Automated EAS builds for distinct retail brand themes and store slugs.
- [ ] **Tenant Usage Metering**: Billing and request telemetry per tenant.

---

## 4. Data, Security & Compliance

- [x] **Credential Isolation**: WooCommerce consumer keys remain strictly on the server; zero exposure in client bundles.
- [x] **IDOR Protection**: Order and return lookups strictly scoped to verified session tokens and phone numbers.
- [x] **Strict Input Validation**: AJV JSON schemas on all incoming requests; BD phone regex `/^01[3-9]\d{8}$/`; HTML stripping.
- [x] **Rate Limiting**: Sliding-window rate limiting on auth endpoints (20 req/min per IP).
- [x] **GDPR / Data Rights**: Endpoints for data export and account deletion (`/v1/auth/export-data`, `/v1/auth/delete-account`).

---

## 5. App Quality & Performance

- [x] **Optimized Image Sizing**: Sourced directly from WordPress dimensions (`thumb` for cards/grid, `single` for PDP gallery, `full` for zoom lightbox).
- [x] **Offline Resilience**: Bundled 826-product catalog snapshot with offline order queue and auto-reconciliation on reconnection.
- [x] **High-Contrast Dark Mode**: Polished color palette with crisp, legible typography (`#F4F6FC`, `#FFFFFF`).
- [x] **In-House Vector Icons**: 41 custom stroke SVG icons replacing third-party peer dependency conflicts.
