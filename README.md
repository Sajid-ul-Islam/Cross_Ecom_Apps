# DEEN Commerce — Cross-Platform E-commerce Monorepo

**DEEN** — Bangladesh's artisanal selvedge denim & contemporary apparel brand — engineered as an ultra-reliable, high-concurrency omni-channel e-commerce system:
- 📱 **Mobile Application**: React Native (Expo SDK 57 / React 19) for iOS & Android with **OTA (Over-The-Air) auto-updates**.
- ⚡ **API Gateway**: Fastify REST proxy with WooCommerce auto-sync, 2-phase idempotency, in-memory caching, and multi-origin failover.
- 🖥️ **Web Storefront & Mobile Web**: Next.js 14 App Router e-commerce experience with **100% mobile feature parity**.

[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![EAS Update](https://img.shields.io/badge/EAS_OTA-Update-4630EB?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/eas)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Production Storefront**: [https://deencommerce.com](https://deencommerce.com)  
**Authoritative Tech Stack Matrix**: [`docs/TECH_STACK.md`](./docs/TECH_STACK.md)  
**Developer & Agent Guidelines**: [`AGENTS.md`](./AGENTS.md)

---

## 🌟 Key Architecture & Capabilities

### 1. High-Traffic Gateway & WooCommerce Protection (`apps/api`)
- **Stateless HMAC-SHA256 Multi-Instance Auth**: Tokens (`gst.<payload>.<sig>`, `usr.<payload>.<sig>`) are signed with shared secret, enabling instant $\mathcal{O}(1)$ verification across cluster gateway replicas without database bottlenecks.
- **In-Flight Single-Flight Order Idempotency**: `_inFlightOrders` promise joining and 5-minute memory-bounded idempotency eliminate race-condition duplicate orders under heavy network jitter or client double-clicks.
- **Two-Phase Write Failover**: Safe failover for idempotent reads (`GET /catalog`) vs. strict upstream reconciliation (`findWooOrderByKey`) before retrying mutating writes (`POST /orders`).
- **Webhook Delivery Resilience**: Topic-aware cache invalidation with HMAC-SHA256 signature verification and 10-minute delivery ID deduplication.
- **Microsecond Catalog Caching**: 5-minute in-memory catalog cache with single-flight warming protects WordPress from flash-sale load spikes.
- **Multi-Tier Rate Limiting**: Dedicated rate limits for Auth (10 req/min/IP), Order Placement (6 req/min/IP), and Catalog browsing (120 req/min/IP).

### 2. Real Social Authentication — Google & Facebook OAuth
- **Official OAuth 2.0 Pop-Up Windows**: Clicking "Continue with Google" or "Continue with Facebook" opens a **real, centered browser pop-up** directly to `accounts.google.com` (with account chooser / `prompt=select_account`) or `facebook.com/v19.0/dialog/oauth`.
- **PostMessage Token Exchange**: The `/auth/callback` page receives the OAuth token from the pop-up and passes it back to the parent window via `postMessage`. No page redirects.
- **Fastify Token Verification**: Gateway verifies Google OIDC `id_token` via `https://oauth2.googleapis.com/tokeninfo` and Facebook `access_token` via Graph API — real cryptographic verification, not mocks.
- **WooCommerce Customer Auto-Provisioning**: Verified email automatically links to or creates a real WooCommerce customer record (`/wp-json/wc/v3/customers`), attaching `customer_id` to every order for lifetime purchase history.
- **Mobile Account Chooser Sheet**: Native React Native modal mimics the Google / Facebook account selection sheet with avatar badges, saved account list, "Use another account" form, and animated slide-up.
- **Environment Variables**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_FACEBOOK_APP_ID` in `.env.local` / Vercel for live credentials.

### 3. OTA (Over-The-Air) Auto-Updates — No APK Rebuilds
- **expo-updates integration**: The mobile app silently checks for a new JS bundle from EAS Update 3 seconds after launch.
- **OTAUpdateBanner**: If an update is found and downloaded, an animated dark banner slides in from the top: `🚀 Update available! — Apply Now`. Tapping it hot-reloads the app in ~1 second with the new code.
- **GitHub Actions auto-publish**: Every `git push` to `master` that touches `apps/mobile/` automatically runs `eas update --channel production` — no manual steps needed.
- **Zero native changes = Zero APK rebuild**: UI changes, new screens, API logic, pricing rules, and bug fixes are all deployed instantly without touching the Play Store.

### 4. Bangladeshi Fulfillment & Logistics
- **Full 64 Bangladesh Districts**: Dropdown selection with official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, `BD-58` Sylhet, etc.).
- **Dynamic Delivery Charges**: ৳50 Dhaka Standard, ৳110 Dhaka Express, ৳90 Outside Dhaka, ৳0 Store Pickup.
- **5-Step Graphical Order Status Timeline (`OrderStatusStepper`)**: Visual milestone stepper (`[ 1. Placed ] ➔ [ 2. Confirmed ] ➔ [ 3. Packed ] ➔ [ 4. In Transit ] ➔ [ 5. Delivered ]`) with estimated delivery calculations (24–48h Dhaka / 3–5 days outside Dhaka).
- **Real-Time Pathao Courier Tracking**: Live multi-step delivery status timeline resolved directly from `ptc_consignment_id` with 1-click in-app tracking and live courier tracking link.
- **7-Day Doorstep Guarantee**: In-app Return & Size Exchange submission flow (`POST /v1/deen/returns`).

### 5. 100% Web & Mobile Feature Parity (`apps/web` ⇄ `apps/mobile`)
- **5-Tab Navigation**: Unified `[ 🏠 Home ] [ 🗂️ Categories ] [ 🛒 Cart (live badge) ] [ 📦 Orders ] [ 👤 Profile ]`.
- **Customer Wishlist & Saved Items Suite**: Save-for-later favorites with heart toggles on cards (bottom-right corner, non-overlapping), PDP, header count badge, and slide-out `WishlistModal` with 1-click "Move to Bag".
- **In-App Notification Center & Bell Icon**: Categorized announcements (Promos, Bank Offers, Order Updates) with 1-click coupon code copying.
- **Bank & MFS Card Discounts Suite**: Dedicated deals modal for City Bank Amex, BRAC Bank, EBL, SCB, MTB, and bKash (`GET /v1/deen/offers`).
- **Instant Search Modal Drawer**: Fast debounced catalog discovery with category quick-chips and instant PDP routing.
- **Garment Measurement Specs**: Interactive Size Guide modal (Inches & CM) for Jeans, Trousers, Shirts, Polos, and Panjabis.
- **Denim Care Handbook**: Artisanal Japanese raw selvedge 3-step care guide (Initial Cold Soak, Break-In & Honeycomb Fading, Wool Wash Preservation).
- **Physical Outlet Stock Finder**: Live inventory availability for Mirpur 12 Flagship, Wari, Cumilla, and Sylhet with Google Maps links.
- **Direct WhatsApp Concierge**: Instant 1-tap chat (`https://wa.me/8801952700500`) with prefilled product inquiry.
- **Promotional Campaigns & BOGO**: Dynamic top banner with auto-rotation, Instant Cashback tiers (৳500 / ৳700), and BOGO 50% discount on lowest-priced denim.

---

## 🗂️ Monorepo Workspace Structure

```
Cross_Ecom_Apps/
├── apps/
│   ├── api/                    # Fastify 4.28 Gateway (Node.js / TypeScript)
│   │   ├── src/                # Server, routes, woo proxy, auth, pricing, webhooks
│   │   ├── src/pricing.test.ts # Unit tests for BOGO, Cashback, phone validation
│   │   ├── src/idempotency.test.ts # Integration tests for idempotency & session tokens
│   │   ├── Dockerfile          # Production container configuration
│   │   └── README.md           # API Gateway documentation
│   │
│   ├── mobile/                 # React Native / Expo SDK 57 Mobile App
│   │   ├── app/                # Expo Router file-based screens (tabs, product, checkout)
│   │   ├── src/
│   │   │   ├── components/     # OTAUpdateBanner, SocialAuthModal, LoginModal, ProductCard…
│   │   │   ├── context/        # Cart, Orders, Profile, Notifications, Wishlist, Rewards…
│   │   │   └── services/       # gateway.ts (API client with keep-alive & failover)
│   │   ├── eas.json            # EAS Build + Update channel configuration
│   │   └── README.md           # Mobile app documentation
│   │
│   └── web/                    # Next.js 14 Web Storefront (App Router)
│       ├── app/                # Next.js pages (shop, product, cart, checkout, orders, profile)
│       │   └── auth/callback/  # OAuth 2.0 pop-up callback handler (Google & Facebook)
│       ├── components/         # SocialAuthModal, AdminAnalyticsModal, ProductCard…
│       ├── lib/                # api.ts (AuthResult, loginWithGoogle…), socialAuth.ts, cart.ts
│       └── README.md           # Web storefront documentation
│
├── .github/
│   └── workflows/
│       └── ota-update.yml      # GitHub Actions: auto-publish EAS OTA on every mobile push
│
├── docs/                       # Monorepo technical documentation
│   ├── TECH_STACK.md           # Authoritative framework & version matrix
│   ├── SYSTEM_ARCHITECTURE.md  # End-to-end data flow & infrastructure diagrams
│   ├── TODO_ROADMAP.md         # Production scorecard & implementation roadmap
│   ├── GATEWAY_FAILOVER_SETUP.md # Multi-origin failover runbook
│   ├── WEBHOOK_SETUP.md        # WooCommerce webhook HMAC-SHA256 guide
│   ├── EAS_BUILD_GUIDE.md      # Mobile build & APK generation runbook
│   ├── JEANS_FIT_CHARTS.md     # Measurement tables & sizing specifications
│   ├── BACKEND_RESILIENCE_AND_WP_CONTROL.md # Upstream resilience specifications
│   └── GO_LIVE_PLAN.md         # Production launch checklist
│
├── AGENTS.md                   # Operational guidelines & domain boundaries
├── package.json                # Monorepo scripts & dependencies
└── tsconfig.json               # Root TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x`
- **EAS CLI** (for mobile builds & OTA): `npm install -g eas-cli`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Sajid-ul-Islam/Cross_Ecom_Apps.git
cd Cross_Ecom_Apps

# Install all workspace dependencies
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../mobile && npm install
cd ../..
```

### 3. Environment Variables

#### `apps/web/.env.local`
```env
# Required for real Google & Facebook OAuth pop-up login
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
NEXT_PUBLIC_FACEBOOK_APP_ID="your-facebook-app-id"
```

#### GitHub Actions Secret (for OTA auto-publish)
| Secret Name | Value |
|---|---|
| `EXPO_TOKEN` | Expo access token from [expo.dev/accounts/b3ngali/settings/access-tokens](https://expo.dev/accounts/b3ngali/settings/access-tokens) |

### 4. Verification & Automated Tests
```bash
# Run monorepo unit & integration tests (23/23 passing)
npm test

# Run strict TypeScript typechecks across all 3 applications
npm run typecheck:all
```

### 5. Running Locally

#### Fastify API Gateway (`apps/api`):
```bash
cd apps/api
npm run dev
# Gateway runs on http://localhost:8787 (or http://localhost:3001)
```

#### Next.js Web Storefront (`apps/web`):
```bash
cd apps/web
npm run dev
# Web storefront runs on http://localhost:3000
```

#### React Native Mobile App (`apps/mobile`):
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go or press 'a' for Android emulator
```

---

## 🔄 OTA Update Workflow

```
git push (changes in apps/mobile/)
          │
          ▼
GitHub Actions: eas update --channel production
          │
          ▼
New JS bundle published to EAS servers
          │
          ▼
User opens DEEN app → auto-checks for update
          │
          ▼
OTAUpdateBanner slides in: "🚀 Update available!"
          │
          ▼
User taps "Apply Now" → app reloads in ~1 second
```

> **First-time build only**: Run `eas build --platform android --profile production-apk` once to generate the APK with the OTA URL baked in. All future JS updates deploy without a new APK.

---

## 🔐 Social Sign-In Architecture

```
User clicks "Continue with Google" / "Continue with Facebook"
          │
          ▼
Centered OAuth pop-up window opens:
  • Google → accounts.google.com (account chooser, prompt=select_account)
  • Facebook → facebook.com/v19.0/dialog/oauth
          │
          ▼
User selects / logs into their account
          │
          ▼
/auth/callback receives token → postMessage to parent window
          │
          ▼
Fastify Gateway verifies token with Google/Meta APIs
          │
          ▼
WooCommerce customer auto-provisioned / linked
          │
          ▼
HMAC session token minted → user fully signed in
```

Add authorized redirect URIs in Google Cloud Console & Meta Developer Console:
- `https://deencommerce.com/auth/callback`
- `https://your-vercel-domain.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

---

## 🧪 Automated Test Suite

| Test Suite | File | Tests Passing | Key Assertions |
| :--- | :--- | :---: | :--- |
| **Idempotency & Reconciliation** | `apps/api/src/idempotency.test.ts` | 12 | Single-flight deduplication, timeout reconciliation, offline sync idempotency, stateless HMAC tokens, social auth customer linking |
| **Pricing & Business Rules** | `apps/api/src/pricing.test.ts` | 11 | Cashback tiers (৳500 / ৳700), BOGO 50% lowest item discount, 11-digit BD phone parsing, promo campaigns |
| **Total Automated Tests** | — | **23 / 23** | **100% Pass Rate** |

---

## 🌐 Production Deployment

| Service | Platform | URL |
|---|---|---|
| **Fastify Gateway** (`apps/api`) | [Render](https://render.com) (Docker) | `https://cross-ecom-apps-4b4n.onrender.com` |
| **Web Storefront** (`apps/web`) | [Vercel](https://vercel.com) | `https://deencommerce.com` |
| **Mobile App** (`apps/mobile`) | EAS Build + EAS OTA Update | `eas build -p android --profile production-apk` |

---

## 📜 License & Ownership
Copyright © 2026 DEEN Commerce. All rights reserved.
