# Chronological Development & Architectural Decision Log

## 1. Overview

This document records the architectural decisions, design rationales, research outcomes, and implementation milestones completed during the **Brand Social, Navigation & Home Experience Enhancement** initiative.

---

## 2. Chronological Milestones & Implementation History

### Milestone 1: Official Brand Social Media Architecture
- **Decision**: Integrate all 4 official brand social channels (Facebook, Instagram, LinkedIn, WhatsApp) directly across Mobile (`Header`, `AboutModal`, `profile.tsx`, `index.tsx`) and Web (`Footer.tsx`, `profile/page.tsx`).
- **Rationale**: Elevates brand authority and customer trust. LinkedIn was added to support wholesale inquiries and corporate recruitment, while WhatsApp serves as the primary direct sales concierge in Bangladesh.
- **Implementation**:
  - Vector SVG icons created in `apps/mobile/src/components/Icons.tsx` and `apps/web/components/Footer.tsx`.
  - Added native app scheme deep-linking with graceful browser fallbacks.

### Milestone 2: Backend-Driven Social Content Proxy (`GET /v1/deen/social/feed`)
- **Decision**: Serve social reels and stories via a Fastify gateway proxy endpoint with in-memory caching (15-min TTL) and client-side fallback abstractions.
- **Rationale**: Eliminates fragile client-side web scraping (which violates Meta platform terms and risks IP bans). Establishes a clean backend contract that can be backed by Meta Graph API tokens in production.
- **Implementation**:
  - Endpoint `GET /v1/deen/social/feed` added to `apps/api/src/routes.ts`.
  - Service abstraction added to `apps/mobile/src/services/socialContent.ts` and `apps/web/lib/socialContent.ts`.

### Milestone 3: 1-Tap Social Commerce
- **Decision**: Allow users watching reels to either Quick Bag a tagged product or navigate directly to the PDP.
- **Rationale**: Significantly reduces friction from discovery to checkout, increasing conversion rates among mobile patrons.
- **Implementation**:
  - Modal viewer (`SocialReelModal.tsx` in mobile, `SocialReelsSection.tsx` in web) renders video/poster, likes, and a floating product card.
  - "Quick Bag" adds the item directly to `CartContext` with standard waist size 32.
  - "Shop Piece →" navigates to `/product/[id]`.

### Milestone 4: Motion Hero & Brand Craftsmanship Story
- **Decision**: Build interactive `MotionHero.tsx` and `BrandStorySection.tsx` highlighting DEEN's 13.5oz red-line shuttle-loom selvedge denim, 4 physical showrooms, and 7-day doorstep size swap policy.
- **Rationale**: Differentiates DEEN from fast-fashion commodity retailers by conveying authentic textile heritage.
- **Implementation**:
  - Animated slider with tactile badges and call-to-action triggers.
  - Craftsmanship story grid detailing fabric weight, weaving process, and showroom locations.

### Milestone 5: Navigation Architecture & Tab Restructuring
- **Decision**: Synchronize both Mobile and Web around the 5 standard customer tabs: `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart ]  [ 📦 Orders / 💬 Chat ]  [ 👤 Profile ]`.
- **Rationale**: Follows AGENTS.md Rule 7.2. Hiding the Orders tab had created customer confusion regarding previous order lookups and Pathao courier tracking.
- **Implementation**:
  - Restored Orders tab in mobile layout and web bottom bar.
  - Moved AI Concierge trigger to an accessible header sparkle icon on mobile and floating bubble on web.

### Milestone 6: Elimination of Customer "Restricted" Lock Screen
- **Decision**: Remove customer-facing lock screen at `/admin` and delete unused `UserModeBar.tsx`.
- **Rationale**: Customers should never be greeted with a "Restricted Access / Administrator Access Required" lock screen, which damages brand impression.
- **Implementation**:
  - `apps/mobile/app/admin.tsx` now silently redirects non-admin users to `/(tabs)/profile`.
  - Deleted legacy dead file `UserModeBar.tsx`.

### Milestone 7: Value-First Notification Permission Architecture
- **Decision**: Replace immediate startup permission dialogs with a contextual value-first modal (`NotificationOptInModal.tsx`).
- **Rationale**: Educating users on the 4 concrete benefits (Live Pathao dispatch, VIP drop restocks, Flash sale cashback, Waist size alerts) increases opt-in rates and complies with modern iOS/Android permission guidelines.
- **Implementation**:
  - `NotificationOptInModal.tsx` created with persistent dismiss state in `AsyncStorage`.
  - 4 independent notification category toggles added to `UserProfile` and `ThemeAndNotifications.tsx`.

### Milestone 8: Performance & Core Web Vitals Refinement
- **Decision**: Optimize marquee scrolling speeds, add reduced-motion fallbacks, and remove render-blocking Google Fonts imports.
- **Rationale**: Ensures smooth 60fps animations on mid-tier Android devices and eliminates layout shifts on web.
- **Implementation**:
  - Web marquee transition slowed to 60s with `@media (prefers-reduced-motion: reduce)`.
  - Migrated to `next/font/google` with `display: 'swap'`.

### Milestone 9: Monorepo Verification & Test Suite
- **Decision**: Verify complete type safety and unit test coverage across all 3 workspaces (`api`, `web`, `mobile`).
- **Outcome**:
  - `npm run typecheck:all`: 0 errors across API, Web, and Mobile.
  - `npm test`: 44/44 tests passing, covering AI Concierge RAG, Idempotency, Session tokens, Cashback tiers, BOGO rules, and phone number validation.
