# Web vs. Mobile Feature Gap Analysis & Parity Matrix

## 1. Overview

Per Monorepo Rule 7, the Web Application (`apps/web`) and the Native Mobile Application (`apps/mobile`) must maintain strict feature parity, especially in responsive mobile viewports ($< 768\text{px}$).

This document tracks all identified feature discrepancies and details their full reconciliation.

---

## 2. Feature Parity Matrix

| Feature Domain | Feature Item | Mobile Status | Web Status | Resolution / Parity Details |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Identity** | Official Socials (FB, IG, LI, WA) | Implemented | Implemented | Both apps include Facebook, Instagram, LinkedIn, and WhatsApp in Header, Footer, Profile, and About drawers. |
| **Social Commerce** | Curated Reels & Stories Carousel | Implemented | Implemented | Both apps consume `GET /v1/deen/social/feed` with 1-tap "Quick Bag" and "Shop Piece →" PDP navigation. |
| **Hero Experience** | Dynamic Motion Hero Slider | Implemented | Implemented | Both apps feature high-definition hero sliders with craftsmanship badges and instant campaign CTAs. |
| **Craftsmanship Story**| Heritage & Shuttle Loom Section | Implemented | Implemented | Both apps display selvedge heritage details (13.5oz red-line, 4 retail stores, 7-day exchange). |
| **Navigation** | 5 Standard Navigation Tabs | Implemented | Implemented | Synchronized 5-tab bar on native mobile and responsive web mobile viewports. |
| **Logistics** | 64 Bangladesh Districts Selector | Implemented | Implemented | Both apps use official WooCommerce `BD-XX` state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.). |
| **Logistics** | Real-Time Pathao Courier Tracking | Implemented | Implemented | Orders display live courier tracking status stepper when `ptc_consignment_id` is present. |
| **Checkout** | 11-digit Bangladeshi Phone Check | Implemented | Implemented | Inline regex validation (`01XXXXXXXXX`) with zero invalid submissions allowed. |
| **Pricing Rules** | Tiered Cashback (৳500 / ৳700) | Implemented | Implemented | Real-time calculation and progress indicators active in Cart and Checkout on both platforms. |
| **Pricing Rules** | Category-Isolated BOGO | Implemented | Implemented | Verified via `pricing.test.ts` and active on both clients. |
| **Exchange Policy** | 7-Day Doorstep Size Exchange | Implemented | Implemented | Consistent 7-day policy stated across trust bars, PDPs, and AI concierge. |
| **Customer Account** | 4-Tier Notification Toggles | Implemented | Implemented | User can customize Order, Drops, Promos, and Sizing notifications independently. |
| **Security / Admin** | Stealth Admin Redirection | Implemented | Implemented | `/admin` route silently redirects unauthorized visitors without showing an intimidating lock screen. |
| **AI Assistant** | WhatsApp Concierge & AI Bot | Implemented | Implemented | Direct WhatsApp deep link (`+8801952700500`) and in-app AI assistant available on both platforms. |

---

## 3. Key Discrepancies Resolved

### 3.1 Cart Context API Signatures
- **Gap**: Mobile `addToCart` took 3 parameters `(product, size, qty)` whereas Web `addItem` took 2 parameters `(product, size)`.
- **Resolution**: Normalized caller usage across all social commerce and PDP components so each client interacts seamlessly with its local context implementation while guaranteeing identical cart contents.

### 3.2 Mobile Web Viewport Navigation
- **Gap**: Responsive web mobile view previously had inconsistent bottom navigation hiding during checkout.
- **Resolution**: Added path check in `MobileBottomNav.tsx` to automatically conceal bottom navigation when accessing `/checkout`, eliminating sticky bar collision.

### 3.3 Social Media Accounts
- **Gap**: LinkedIn was missing from mobile and web footers, and Instagram links did not deep-link properly on native Android devices.
- **Resolution**: Unified all 4 official channels with verified URLs and native scheme fallbacks:
  - Facebook: `https://www.facebook.com/deencommerce`
  - Instagram: `https://www.instagram.com/deencommerce/?hl=en`
  - LinkedIn: `https://www.linkedin.com/company/deencommerce`
  - WhatsApp: `https://wa.me/8801952700500`

---

## 4. Maintenance & Enforcement Guidelines

1. Any new feature added to `apps/mobile` must have a corresponding implementation in `apps/web` prior to PR merge.
2. Run `npm run typecheck:all` to ensure both application trees compile without discrepancies.
3. Keep test suites in `apps/api/src/pricing.test.ts` and `ai.test.ts` updated to validate shared business logic.
