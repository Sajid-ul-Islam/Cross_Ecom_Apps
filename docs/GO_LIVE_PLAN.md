# Go-Live Plan & Production Hardening Checklist — DEEN Commerce

> Authoritative operational plan and pre-launch checklist for bringing DEEN Commerce to real customers.

---

## 1. Launch Priorities (P0 / P1 / P2)

```text
┌─────────────────────────────────────────────────────────────┐
│ P0: BLOCKERS (Gateway Live + Real Orders + Secret Hygiene)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ P1: LAUNCH QUALITY (Payment Method UX + Distributable Build)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ P2: POST-LAUNCH (Per-Fit Measurement Specs + Admin Panel)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. P0 — Immediate Blockers

### P0-1. Gateway Deployment & Environment Configuration
- **Status**: Code ready with multi-origin failover.
- **Actions Required**:
  1. Ensure primary and secondary Render services are active (unsuspended).
  2. Verify environment variables in Render Dashboard:
     - `WOO_SITE=https://deencommerce.com` (Ensure `.com` domain, not `.bd`).
     - `WOO_CONSUMER_KEY` & `WOO_CONSUMER_SECRET` (Dedicated production keys).
     - `GATEWAY_API_KEY` (Strong random string matching mobile `app.json` `extra.gatewayApiKey`).
     - `WEBHOOK_SECRET` (Matching WooCommerce webhook secret).
     - `STORE_HOTLINE=01952700500`, `STORE_WHATSAPP=01952700500`.
  3. Validate health endpoint:
     ```bash
     curl -H "x-api-key: <GATEWAY_API_KEY>" https://cross-ecom-apps.onrender.com/v1/health
     # Expected response: {"ok": true, "woo": "ok", ...}
     ```

### P0-2. End-to-End WooCommerce Order Verification
- **Status**: Implemented and tested in development (`#wooNumber` returned and rendered).
- **Actions Required**:
  1. Place a test order through the mobile client (or web client) using Cash on Delivery (COD).
  2. Verify order appears in WordPress Admin (`WooCommerce → Orders`) with:
     - Correct product line items, quantities, and variations.
     - Accurate shipping lines (৳50 for Dhaka / ৳90 Outside Dhaka).
     - Correct state code (`BD-13` / `BD-10`).
     - Customer phone number and address.
  3. Verify client displays authentic WooCommerce order number (`#204xxx`) on order confirmation and order history screens.

### P0-3. Security & Secrets Hygiene
- [x] **Zero secrets in client bundle**: Mobile APK and Web bundles only contain client identity keys (`x-api-key`), never WooCommerce consumer secrets.
- [x] **`.env` gitignored**: Verified absent from repository tracking.
- [ ] **Rotate WooCommerce REST API Keys**:
  - Issue a **Read-only** key for any local offline testing.
  - Keep the **Read/Write** key strictly in Render environment variables.

---

## 3. P1 — Launch Quality & Customer Experience

### P1-1. Payment Workflow
- **Current Flow**:
  - **Cash on Delivery (COD)**: Fully automated with `Cash on Delivery (COD)` title, `set_paid: false`, and pending status.
  - **Manual bKash / Nagad**: Customer sends money to store hotline (`01952700500`) and submits TrxID.
- **Action**: Launch with COD + manual bKash/Nagad. Automated payment gateway (SSLCommerz / bKash Direct API) scheduled for P2.

### P1-2. Distributable App Build (EAS / APK)
- **Current Status**: EAS Free plan build quota reached; resets September 01, 2026.
- **Action**:
  - Wait for quota reset on Sep 01 or upgrade EAS build plan.
  - Execute build:
    ```bash
    cd apps/mobile
    npx eas build --platform android --profile preview    # Standalone APK
    npx eas build --platform android --profile production # Play Store AAB
    ```

### P1-3. Webhook Auto-Provisioning
- **Action**: Run one-time auto-provisioning curl after production deployment to register WooCommerce cache invalidation webhooks:
  ```bash
  curl -X POST https://cross-ecom-apps.onrender.com/v1/deen/webhook/woo/register
  ```

---

## 4. P2 — Post-Launch Enhancements

- **Jeans Per-Fit Sizing Tables**: Category-based fit routing is active in `SizeGuideModal.tsx`. Replace generic placeholder tables with official brand measurement specs once provided (see [docs/JEANS_FIT_CHARTS.md](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/docs/JEANS_FIT_CHARTS.md)).
- **Automated Payment Gateway Integration**: Integrate direct bKash / Nagad / SSLCommerz payment APIs.
- **Push Notification Broadcasts**: Dispatch marketing pushes from WordPress webhooks using stored Expo push tokens.
- **Multi-Tenant SaaS Deployment**: Provision secondary store clients via the gateway `STORES` registry.

---

## 5. Production Checklist

- [ ] **Activate Primary & Secondary Render Gateway Services**
- [ ] **Set `GATEWAY_API_KEY` in Render Environment**
- [ ] **Execute Webhook Registration (`/v1/deen/webhook/woo/register`)**
- [ ] **Verify End-to-End Live Order Reaches WP Admin**
- [ ] **Submit Signed Release Build via EAS (post Sep 01 or upgraded tier)**
