---
name: monorepo-verification
description: >-
  Use this skill whenever verifying the DEEN Commerce monorepo before committing,
  deploying, or merging changes. Ensures full type safety across API, Web, and Mobile,
  runs automated unit tests, and verifies Web-Mobile UI and logistics parity.
---

# DEEN Commerce Monorepo Verification & Parity Runbook

This skill defines the canonical verification checklist for the DEEN Commerce monorepo (`Cross_Ecom_Apps`). It guarantees zero regressions across the Fastify API Gateway (`apps/api`), Next.js 15 Web Frontend (`apps/web`), and Expo React Native App (`apps/mobile`).

---

## 1. Quick Verification Command

Run the unified verification script from the repository root:

```bash
node .agents/skills/monorepo-verification/scripts/verify-all.cjs
```

This runs all 3 package typechecks and the gateway unit test suite.

---

## 2. Granular Step-by-Step Procedure

### Step 1: Type Safety Verification (0 Errors Required)
Every package must compile cleanly:

```bash
# 1. Fastify API Gateway
npm run typecheck:api

# 2. Next.js 15 Web Storefront
npm run typecheck:web

# 3. Expo / React Native App
npm run typecheck:mobile

# Or run all simultaneously:
npm run typecheck:all
```

### Step 2: Automated Unit & Integration Tests
Ensure all 115+ unit test cases pass:

```bash
npm test
```
This tests:
- Pricing engine, Cashback tiers, and BOGO rules (`pricing.test.ts`)
- Multilingual AI Chatbot logic and order intents (`chatbot.test.ts`)
- Social OAuth token verification & CSRF checks (`socialAuth.test.ts`)
- Bangladeshi phone number validation (`01XXXXXXXXX`)

### Step 3: Web ⇄ Mobile Parity Verification Checklist
Whenever modifying checkout, navigation, or product browsing, verify:
- [ ] **5 Standard Navigation Tabs**:
  - `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]`
  - *(Note: Orders is intentionally accessed via Profile and Order Success, NOT the main tab bar).*
- [ ] **64 Bangladesh Districts**: Dropdown/modal selection includes all 64 official district codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).
- [ ] **Delivery Charges**:
  - Dhaka: `৳50`
  - Outside Dhaka: `৳90`
  - Store Pickup: `৳0`
- [ ] **Pathao Logistics Tracking**:
  - Direct tracking link `https://merchant.pathao.com/tracking?consignment_id={consignment_id}` displayed on Order Confirmation, My Orders, and Profile when a real consignment ID is present.
  - "Preparing Dispatch" rendered when consignment is pending.
- [ ] **Dark & Light Mode Contrast**:
  - AMOLED True Black (`#000000`) paired with high-contrast text (`#FFFFFF`, `#A3A3A3`), meeting WCAG 2.2 AA (≥ 4.5:1).
  - Use `useTheme()` dynamic tokens; never use static `Colors.*` tokens in stylesheets.
- [ ] **Touch Targets**:
  - Interactive icons and buttons must satisfy $\ge 44 \times 44\text{ dp}$ hit area.

### Step 4: Payments & Security Rules
- [ ] **Prepaid / COD Handlers**:
  - For COD: `payment_method_title: "Cash on Delivery (COD)"`, `set_paid: false`.
  - For Prepaid: Verify with SSLCommerz / bKash gateway verification endpoints before fulfilling.
- [ ] **No Fallbacks on Failure**:
  - Failed checkouts must return HTTP 502 with no synthetic order receipt.
  - Shopping cart items must remain preserved intact upon failed checkout.
