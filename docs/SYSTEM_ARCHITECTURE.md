# System Architecture & Technical Deep Dive — DEEN Commerce

> Grounded in `apps/mobile/src/services/gateway.ts`, `apps/api/src/`, and `apps/web/`.
> Core Rule: **"REST API → WooCommerce → WordPress is the single source of truth."**

---

## 1. High-Level Architecture Overview

DEEN Commerce is structured into three distinct layers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                           │
│                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────┐   │
│   │    Expo Mobile App (APK)     │    │    Next.js 14 Web App      │   │
│   │         apps/mobile          │    │          apps/web          │   │
│   │ - Offline-first catalog      │    │ - Full SSR/CSR Storefront  │   │
│   │ - Multi-gateway failover     │    │ - Responsive Desktop/Mobile│   │
│   │ - Real Woo order numbering   │    │ - Real-time Cart & Checkout│   │
│   │ - Dynamic themes & tokens    │    │ - 64 BD Districts + Pathao │   │
│   └──────────────┬───────────────┘    └──────────────┬─────────────┘   │
└──────────────────┼───────────────────────────────────┼─────────────────┘
                   │ HTTPS (Bearer Token + x-api-key)  │
                   ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTIFY GATEWAY CLUSTER                         │
│                               apps/api                                 │
│                                                                        │
│   - Isolates WooCommerce secrets (ck_... / cs_...) from clients        │
│   - Circuit breaker, timeout (10s), retry pool on upstream calls       │
│   - Topic-aware Webhook receiver & cache invalidation (HMAC-SHA256)    │
│   - Persistent session storage (auth_sessions.json / guest_sessions)   │
│   - Per-API-key rate limiting, schema validation (AJV), error handling │
│   - Multi-tenant configuration support (STORES registry)               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS REST (WooCommerce v3 / WP v2)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    WORDPRESS / WOOCOMMERCE STORE                       │
│                       https://deencommerce.com                         │
│                                                                        │
│   - Authoritative catalog, variations, categories, inventory           │
│   - Live WordPress pages (/wp/v2/pages) & store metadata               │
│   - Coupon validation, discount rules & order processing               │
└────────────────────────────────────────────────────────────────────────┘
```

The client applications are **thin clients**. They never invent products, prices, promo gifts, or static images. Every piece of data is sourced from WooCommerce and WordPress via the Fastify Gateway.

---

## 2. Request Lifecycle & Gateway Communication

Every network call in the mobile app travels through a centralized function: `request<T>()` in [gateway.ts](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/apps/mobile/src/services/gateway.ts).

### Client Request Pipeline
1. **Multi-Origin Failover (`GATEWAY_URLS`)**: The client reads gateway URLs from `app.json` (`extra.gatewayUrl` + `extra.gatewayUrls`). If the active origin returns an HTTP 5xx error (e.g., suspended Render instance) or experiences a network timeout, `request()` automatically fails over to the backup origin.
2. **Background Keep-Alive Probes**: At launch, `startGatewayKeepAlive()` pings every configured gateway origin in the background, dynamically setting the preferred origin to the healthiest instance.
3. **Identity Header (`x-api-key`)**: Injected into all requests to identify the application.
4. **Resilient Timeouts**: Requests use hard cutoffs (default 8s; checkout orders 10s; background telemetry 5s).
5. **Connection Hysteresis**: Prevents UI flicker by requiring 3 consecutive failed requests before flipping to offline mode. Background requests (telemetry, push token sync) are marked `silent` so they never trigger offline banners.

### Gateway Processing Pipeline
1. **Pre-Handler Authentication & Rate Limiting**: `index.ts` verifies `x-api-key` and checks rate limits (20 req/min for auth routes).
2. **AJV Schema Validation**: Incoming payloads (orders, auth, returns, bug reports) are validated against strict JSON schemas before reaching handlers.
3. **Upstream Circuit Breaker (`wooFetch` in `woo.ts`)**: Upstream calls to WooCommerce are guarded with exponential retries and circuit breaking. If WooCommerce becomes unresponsive, the gateway returns cached data or fails fast rather than hanging incoming connections.

---

## 3. Authentication & Session Architecture

The gateway provisions three secure identity modes:

```text
               ┌───────────────────────────────┐
               │    Client Authentication      │
               └──────────────┬────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ WordPress Login │  │  Guest Checkout │  │ In-App Register │
│ (wp-login.php)  │  │  (randomUUID)   │  │   (BD Phone)    │
│ Bearer wp_<uuid>│  │ Bearer gst_<uuid│  │ Bearer reg_<uuid│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### A. WordPress Registered Customer (`POST /v1/auth/login`)
- Authenticates against WordPress (`wp-login.php` + `wp/v2/users/me`).
- Admin role is derived from authentic WordPress capabilities (`administrator` / `shop_manager`).
- Client receives a Bearer token stored in `AsyncStorage` and sent via `Authorization: Bearer <token>`.
- Passwords are never stored on the gateway or client.

### B. Anonymous Guest Session (`POST /v1/auth/guest`)
- Generates an ephemeral UUID token and guest record for frictionless checkout.
- Order history lookups are scoped strictly to the session's verified phone number, preventing IDOR vulnerabilities.

### C. In-App Registration (`POST /v1/auth/register`)
- Validates Bangladeshi phone numbers via `/^01[3-9]\d{8}$/`.
- Returning phone numbers are recognized seamlessly, returning authenticated tokens.

### Session Disk Persistence
Authentication sessions (`auth_sessions.json`) and guest sessions (`guest_sessions.json`) are persisted to disk with self-pruning TTLs. Gateway deployments and restarts do not invalidate customer login states.

---

## 4. Order Creation & Offline Resilience

Money and sales are protected through end-to-end resilience in `createOrder()`:

```text
Customer Taps "Place Order"
         │
         ▼
Clean Payload (Strip promo tags, normalize BD-XX state & phone)
         │
         ▼
POST /v1/deen/orders (10s timeout)
         │
         ├─────────────────────────────────┐
         ▼ (Success)                       ▼ (Network / Gateway Error)
Push to WooCommerce Real Order     Create Local Offline Order
Receive Woo #204xxx               Save to deen_gateway_orders_v1
Display Order Success             Display Confirmation & Queue
Cache in Local Storage                     │
                                           ▼ (Connection Back Online)
                                   OrderContext Auto-Reconciliation
                                   Re-submits Order to WooCommerce
```

1. **Payload Normalization**: Phone number sanitized, district mapped to official WooCommerce state code (`BD-13` Dhaka, `BD-10` Chattogram, etc.), and delivery charge applied (৳50 Dhaka, ৳90 Outside, ৳0 Pickup).
2. **Real WooCommerce Order Creation**: Gateway calls `pushWooOrder()`, returning the authentic WooCommerce order number (`#wooNumber`).
3. **Dual Order Representation**:
   - Primary: WooCommerce Order Number (`#204639`) shown to customer.
   - Secondary: Gateway Reference (`DC-123`) for debugging trace.
4. **Offline Order Queueing**: If connection drops during checkout, the app creates a localized offline order record (`offline-<timestamp>`). When connection is restored, `OrderContext` automatically reconciles and submits the queued order to WooCommerce.

---

## 5. WooCommerce Image Sizing Architecture

To ensure fast load times and clean UI proportions, product images are requested directly in pre-scaled WordPress dimensions:
- **`thumb`** (`woocommerce_thumbnail`): Used in product cards and grids (optimized file size and fixed aspect ratio).
- **`single`** (`woocommerce_single`): Used in the Product Detail Page gallery (crisp presentation).
- **`full`** (`src`): Used in the full-screen zoom lightbox modal.

---

## 6. Multi-Tenant SaaS Scaffolding

The gateway is built from the ground up to support multi-tenancy:
- **Configuration Registry (`config.ts`)**: Supports multi-store definitions via `STORES` environment variable JSON array.
- **Tenant Isolation**: Stores are looked up by `x-api-key` or custom subdomains.
- **White-Labeling**: Mobile application config (`app.json`) allows pointing new app builds at specific store instances with distinct brand palettes.
