# DEEN Commerce — System Roadmap & Implementation Checklist

**Repository**: `Cross_Ecom_Apps`  
**Authoritative Tech Stack Reference**: [`docs/TECH_STACK.md`](./TECH_STACK.md)  
**Verification Baseline**: `npm run typecheck:all` (0 errors) · `npm test` (23/23 passing)

---

## 📊 Status Matrix Overview

| Area | Grade (Review2) | Status | Key Deliverable |
| :--- | :---: | :---: | :--- |
| **Order Idempotency & Failover** | `9.8 / 10` | 🟢 **DONE** | Single-flight lock, 2-phase write reconciliation, upstream Woo key check |
| **Social Auth (Google & Facebook)** | `9.8 / 10` | 🟢 **DONE** | Token verification, WooCommerce customer auto-linking, non-guest orders |
| **Session & Auth Architecture** | `9.7 / 10` | 🟢 **DONE** | Stateless HMAC-SHA256 tokens (`gst.*`, `usr.*`), cluster & restart ready |
| **Webhook Delivery Resilience** | `9.6 / 10` | 🟢 **DONE** | Topic-aware invalidation, signature check, 10-min delivery deduplication |
| **Observability & Request Tracing** | `9.5 / 10` | 🟢 **DONE** | `X-Request-ID` correlation propagation, latency & masked PII audit logs |
| **Offline-First Mobile Experience** | `9.7 / 10` | 🟢 **DONE** | Bundled snapshot, 3-failure hysteresis, persistent offline sync key |
| **Payment Verification Engine** | `8.8 / 10` | 🟡 **IN PROGRESS** | Callback deduplication done; upstream IPN query validation next |
| **Automated Test Coverage** | `9.5 / 10` | 🟢 **DONE** | 23 automated unit/integration tests (`pricing.test.ts`, `idempotency.test.ts`) |
| **End-to-End Test Suite** | `—` | ⚪ **PLANNED** | Full staging flow tests (Mobile/Web → Fastify → WooCommerce) |

---

## 🔴 P0 — Core Commerce Hardening & Security

### 1. Order Idempotency & Upstream Reconciliation
- [x] **In-Flight Single-Flight Lock**: `_inFlightOrders` Map joins concurrent duplicate requests to the same Promise, eliminating race-condition double orders.
- [x] **5-Minute In-Memory Window**: `_orderIdempotencyStore` remembers created orders for 5 minutes with automatic memory bounding.
- [x] **WooCommerce Metadata Key Tagging**: Orders carry `_idempotency_key` and `_natural_idempotency_key` in WooCommerce `meta_data`.
- [x] **Upstream Reconciliation Lookups**: `findWooOrderByKey()` checks WooCommerce orders across gateway restarts and cold starts.
- [x] **Offline Order Key Persistence**: `idempotencyKey` is retained inside offline local orders and passed in `syncOfflineOrders()`.
- [x] **Two-Phase Write Failover**: Fast failover for pure reads (`GET`) vs. `reconcileOrder` verification before retrying mutating writes (`POST /orders`).

### 2. Social Authentication (Google & Facebook) & Real WooCommerce Customers
- [x] **Zero WordPress PHP Core Modification**: Social verification handled entirely by Fastify Gateway (`POST /v1/auth/google`, `POST /v1/auth/facebook`).
- [x] **WooCommerce Customer Auto-Linker (`findOrCreateWooCustomer`)**: Looks up existing WooCommerce customers by email or provisions a new customer via WC REST API (`POST /wp-json/wc/v3/customers`) with social metadata.
- [x] **Real Customer Order Attachment (`customer_id`)**: Authenticated social sessions pass `customer_id` into `pushWooOrder()`, ensuring orders are linked to customer accounts rather than anonymous guests (`customer_id = 0`).
- [x] **Cross-Platform UI Parity**: Unified "Continue with Google" / "Continue with Facebook" action buttons across Mobile Modal (`LoginModal.tsx`) and Web App (`ProfilePage`).

### 3. Stateless Multi-Instance Session Storage
- [x] **HMAC-SHA256 Signed Tokens**: Replaced random UUIDs with `gst.<payload>.<sig>` and `usr.<payload>.<sig>`.
- [x] **Zero Database Dependencies for Scale**: Any gateway replica (Gateway A, Gateway B) validates tokens in $\mathcal{O}(1)$ time with shared secret.
- [x] **Expiration & Tamper Resistance**: Verified timestamp expiry (`exp`) and constant-time cryptographic comparison (`timingSafeEqual`).
- [x] **Backward Compatibility**: Graceful fallback to local in-memory/disk session stores for legacy tokens.

### 4. Webhook Delivery Idempotency
- [x] **HMAC-SHA256 Signature Verification**: Validates WooCommerce webhook authenticity against `req.rawBody`.
- [x] **Topic-Aware Invalidation**: Selectively clears only the affected cache slice (`product.*`, `variation.*`, `category.*`, `order.*`).
- [x] **Delivery ID Deduplication Store**: Tracks `X-WC-Webhook-Delivery-ID` in a 10-minute sliding window to immediately acknowledge retried webhooks with `{ ok: true, duplicate: true }`.

### 4. Production Secrets & Security
- [x] **Private Secrets Isolation**: WooCommerce consumer keys and webhook secrets isolated in backend environment (`apps/api/.env`).
- [x] **Role-Based Access Control (RBAC)**: Admin routes (`/stats`, `/bugs`, `/broadcasts`, `/admin/analytics`, `/admin/customers`) strictly gated by verified `admin` role.
- [x] **IDOR Protection**: Order and return queries strictly scoped to authenticated user/guest session phone.

---

## 🟠 P1 — Observability & Integration Testing

### 5. Structured Observability & Correlation IDs
- [x] **Request ID Propagation**: `onRequest` hook generates or forwards `X-Request-ID` across response headers.
- [x] **Structured Request Logging**: `onResponse` logs method, URL, status code, latency (ms), client IP, and request ID.
- [x] **PII Minimization**: Customer phone numbers and identifiers are masked (`maskPhone()`) in all audit and server logs.

### 6. Automated Unit & Integration Tests
- [x] **Pricing & Discount Tests**: Fixed/percentage cashback tiers, Selvedge Denim BOGO rules, coupon validation (`apps/api/src/pricing.test.ts`).
- [x] **Idempotency & Failover Tests**: Concurrent double-clicks, secondary gateway reconciliation, offline sync deduplication (`apps/api/src/idempotency.test.ts`).
- [x] **Session Token Tests**: Multi-instance token verification, tampering rejection, expiration handling.

---

## 🟡 P2 — What to Implement Next (Actionable Queue)

1. [ ] **Upstream Payment IPN Verification (`POST /v1/deen/payments/callback`)**:
   - Query SSLCommerz / bKash merchant validation API directly to confirm settlement before marking orders `processing` in WooCommerce.
2. [ ] **End-to-End Automated Test Pipeline (`npm run test:e2e`)**:
   - Multi-hop flow test simulating customer order placement $\to$ Fastify gateway $\to$ WooCommerce order creation $\to$ Pathao parcel allocation.
3. [ ] **Automated CI/CD Verification Workflow**:
   - GitHub Actions workflow running `npm run typecheck:all` and `npm test` on every push/PR.
