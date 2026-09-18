# Comprehensive Survey Report: Hero Video Scaling (R4) & Order Placement Verification (R6)

**Agent**: Explorer 3 (Hero Video & Order Verification Survey Specialist)  
**Date**: 2026-09-19 (UTC: 2026-09-18T22:05:00Z)  
**Scope**: 
1. Requirement R4: Responsive Hero Video Aspect Ratio Scaling across Web and Mobile
2. Requirement R6: Automated End-to-End Order Placement Verification Pipeline

---

## Executive Summary

This survey provides a complete technical analysis of the existing codebase for Requirements R4 and R6 across `apps/web`, `apps/mobile`, and `apps/api`.

- **Requirement R4 Core Finding**: Significant aspect-ratio and container mismatches exist on both platforms. On Web, the hero video container enforces `aspect-ratio: 21 / 9` on desktop (with an aggressive `max-height: 480px` clamp) and `aspect-ratio: 16 / 9` on mobile, while the actual video asset served is **1920x840 (16:7 / 2.2857:1)**. With `object-fit: cover`, wide desktop viewports suffer up to **42.8% vertical cropping**, while mobile viewports suffer up to **28.5% horizontal edge-clipping**. On Native Mobile (`MotionHero.tsx`), the container height is hardcoded to a **16:9 ratio (`SCREEN_WIDTH * 9 / 16`)**, while the mobile video asset (`Home_1x11.mp4`) is **1080x1080 (1:1 square)**. Combined with `contentFit="cover"`, this causes **43.8% vertical cropping** (85px cropped at top and bottom).
- **Requirement R6 Core Finding**: The order pipeline is robustly implemented in `apps/api/src/routes.ts` (`POST /v1/deen/orders`), supporting COD and prepaid gateways, single-flight locking, deduplication, district code normalization across all 64 BD districts (`normalizeState`), and zone-based shipping fees (৳50 Dhaka, ৳90 Outside, ৳0 Store Pickup). A minor parity discrepancy exists where `apps/mobile/app/checkout.tsx` hardcodes `postcode: "1200"` instead of looking up `getDistrictPostcode(code)`. Programmatic verification can be added to the automated test suite (`npm test`) using Node's native test runner (`tsx --test`) to test the complete order lifecycle, 64-district mapping, payment statuses, and Pathao consignment attachment with zero external network dependencies.

---

## Part 1: Requirement R4 (Responsive Hero Video Aspect Ratio Scaling)

### 1.1 Video Assets & Native Media Specifications

Using `ffprobe` on the live video and image assets referenced in `apps/web` and `apps/mobile`:

| Asset Type | URL | Resolution | Native Ratio | Codec | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Web Video 1** | `https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4` | **1920 x 840** | **16:7 (2.2857:1)** | HEVC (H.265) | 24.57s |
| **Desktop Web Video 2** | `https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_1920x8401.mp4` | **1920 x 840** | **16:7 (2.2857:1)** | HEVC (H.265) | 10.17s |
| **Mobile Native Video 1** | `https://deencommerce.com/wp-content/uploads/2026/09/Home_1x11.mp4` | **1080 x 1080** | **1:1 (Square)** | HEVC (H.265) | 24.57s |
| **Mobile Native Video 2** | `https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_-1x11-1.mp4` | **1080 x 1080** | **1:1 (Square)** | HEVC (H.265) | 10.17s |
| **Desktop Poster Image** | `.../End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg` | **1920 x 840** | **16:7 (2.2857:1)** | JPEG | N/A |
| **Mobile Poster Image** | `.../End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp` | **1080 x 1350** | **4:5 (0.8:1)** | WebP | N/A |

### 1.2 Web Hero Video Investigation (`apps/web/components/HeroSlider.tsx`)

#### Code & Styling Analysis
In `apps/web/components/HeroSlider.tsx`:
- **Video element styles** (lines 75–80):
  ```tsx
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  }}
  ```
- **Container styling via embedded `<style>`** (lines 178–213):
  ```css
  .hero-slider-clean {
    position: relative;
    width: 100%;
    overflow: hidden;
    background-color: #080c14;
    margin-bottom: 28px;
  }
  @media (min-width: 769px) {
    .hero-slider-clean {
      aspect-ratio: 21 / 9;
      min-height: 280px;
      max-height: 480px;
    }
  }
  @media (max-width: 768px) {
    .hero-slider-clean {
      aspect-ratio: 16 / 9;
      min-height: 190px;
      max-height: 280px;
      margin-bottom: 18px;
    }
  }
  ```

#### Viewport-by-Viewport Failure Analysis (Web)

1. **Desktop (>768px, e.g. 1440px / 1920px)**:
   - The native video aspect ratio is **16:7 ($1920/840 \approx 2.2857$)**.
   - The CSS declares `aspect-ratio: 21 / 9` ($2.3333$) with `max-height: 480px`.
   - On a 1440px desktop screen:
     - The computed height from `21/9` is $1440 / (21/9) = 617\text{px}$.
     - Because of `max-height: 480px`, the container is clamped to **480px**.
     - Effective container aspect ratio becomes $1440 / 480 = 3.0:1$.
     - At 1440px width, the 16:7 video requires a height of $1440 / 2.2857 = 630\text{px}$.
     - Since the container is only 480px tall and uses `object-fit: cover`, **$630 - 480 = 150\text{px}$ (23.8%)** of the video is cropped off vertically.
   - On a 1920px (Full HD) display:
     - The container is 1920px wide and clamped to 480px high ($4.0:1$ ratio).
     - The native video height at 1920px is 840px.
     - Cropped height: **$840 - 480 = 360\text{px}$ (42.8%)**!
     - Nearly half the video frame (branding, actor framing, collection details) is chopped off top and bottom.

2. **Mobile Web (<768px, e.g. 390px iPhone)**:
   - Web currently delivers the desktop 1920x840 video (`slide.videoUrl`) to mobile web browsers because `DEFAULT_BANNER_SLIDES` and `fetchHeroBanner()` only have a single `videoUrl` field pointing to `1920x840pxl.mp4`.
   - The mobile CSS forces `aspect-ratio: 16 / 9` ($1.7778:1$).
   - At 390px width, container height is $390 / (16/9) \approx 219.4\text{px}$.
   - To fill a 219.4px high container with `object-fit: cover`, a 2.2857:1 video must scale to a width of $219.4 \times 2.2857 = 501.5\text{px}$.
   - On a 390px viewport, **$501.5 - 390 = 111.5\text{px}$ (22.2%)** of the video width is cut off off-screen (approx. 56px truncated on each side).
   - Left and right brand typography and edge imagery are clipped.

3. **Tablet (768px Breakpoint)**:
   - At exactly 768px, `@media (max-width: 768px)` applies: `aspect-ratio: 16/9` with `max-height: 280px`.
   - At 768px width, 16:9 would be 432px, but it is capped at 280px ($2.74:1$ ratio).
   - The video at 768px has height $768 / 2.2857 = 336\text{px}$.
   - **$336 - 280 = 56\text{px}$ (16.7%)** is cropped vertically.

### 1.3 Native Mobile Hero Video Investigation (`apps/mobile/src/components/MotionHero.tsx`)

#### Code & Styling Analysis
In `apps/mobile/src/components/MotionHero.tsx`:
- **Hardcoded height** (lines 14–15):
  ```tsx
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16)); // 16:9 cinematic edge-to-edge ratio
  ```
- **Video slide component** (lines 88–96):
  ```tsx
  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
  ```
- **Static slide definition** (lines 27–45):
  ```tsx
  const SLIDES: HeroSlide[] = [
    {
      id: "denim_hero",
      videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Home_1x11.mp4",
      ...
    },
    {
      id: "sale_hero",
      videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_-1x11-1.mp4",
      ...
    }
  ];
  ```

#### Failure Analysis (Mobile)
- The video assets assigned in `SLIDES` (`Home_1x11.mp4` and `END-OF-THE-SESSION-2_-1x11-1.mp4`) are **1080x1080 (1:1 square)**.
- The container `HERO_HEIGHT` is hardcoded to **16:9 ($SCREEN\_WIDTH \times 0.5625$)**.
- On a 390px wide device, `HERO_HEIGHT` = 219px.
- The `<VideoView>` has `contentFit="cover"`.
- To cover the width (390px), the 1:1 video renders at $390 \times 390\text{px}$.
- The container height is only 219px, meaning **$390 - 219 = 171\text{px}$ (43.8%)** of the video frame is cropped out vertically (approx. 85.5px clipped at the top and 85.5px at the bottom)!
- Furthermore, `MotionHero.tsx` uses hardcoded local `SLIDES` rather than consuming dynamic hero banner data from the gateway API (`GET /v1/deen/catalog/hero-banner`).

---

## Part 2: Requirement R6 (Automated E2E Order Placement Verification)

### 2.1 Checkout & Order Placement Flows

#### 1. Web Checkout Flow (`apps/web/app/checkout/page.tsx`)
- Form collects: `name`, `phone`, `email`, `address`, `city`, `district` (from 64 districts), `selectedArea` (delivery option), `deliverySlot`, `payment` (`cod` | `bkash` | `card`), `trxId` (for bKash), `coupon`, and gift options (`isGift`, `giftName`, `giftPhone`, `giftAddress`, `giftDistrict`).
- Phone validation: Bangladeshi 11-digit regex `/^01[3-9]\d{8}$/` (stripping any `880` prefix).
- District & Postcode handling:
  - Selects from `BD_DISTRICTS` (64 districts with codes `BD-01` to `BD-64`).
  - Calls `getDistrictPostcode(district.code)` from `lib/districts.ts`.
  - Automatically switches `selectedArea` to `"outside"` if district code $\ne$ `"BD-13"`.
- Shipping fees:
  - Fetches live fees from `GET /v1/deen/shipping`:
    - `insideDhaka`: ৳50
    - `outsideDhaka`: ৳90
    - `express`: ৳120
    - `storePickup`: ৳0
- Submits order via `placeOrder()` (`POST /v1/deen/orders`) with payload:
  - `{ name, phone, email, address, city, district, state, postcode, area, payment, trxId, deliverySlot, deliveryNotes, coupon, isGuestOrder, items: [...] }`.
- Redirects to `/order-success` with query params: `id`, `number`, `total`, `wooId`, `delivery`, `payment`, `consignment`, `tracking`.

#### 2. Mobile Checkout Flow (`apps/mobile/app/checkout.tsx` & `OrderContext.tsx`)
- Managed via `OrderContext.tsx` providing `placeOrder()` and offline sync queue.
- Form fields: `name`, `phone`, `email`, `address`, `city`, `district` (from `BD_DISTRICTS`), `selectedArea`, `deliverySlot`, `payment` (`cod` | `bkash` | `card`), `trxId`, `coupon`, `isGift`.
- Phone validation: Bangladeshi 11-digit regex `/^01[3-9]\d{8}$/`.
- Submission via `placeOrder()`:
  - Calls `createOrder()` in `gateway.ts` (`POST /v1/deen/orders`).
- **Discrepancy Identified**:
  In `apps/mobile/app/checkout.tsx` line 228:
  ```ts
  postcode: "1200", // Hardcoded!
  ```
  `apps/mobile/src/data/districts.ts` exports `getDistrictPostcode(code: string)`, but `checkout.tsx` hardcoded `"1200"` instead of calling `getDistrictPostcode(district.code)`. In contrast, Web correctly passes `postcode: getDistrictPostcode(...)`.

### 2.2 Gateway Order Processing & Standards (`apps/api/src/routes.ts`)

Endpoint: `POST /v1/deen/orders` (lines 2133–2440)

1. **Validation**:
   - `name`: non-empty, string $\le 50$ chars, HTML tags stripped (lines 2136–2138, 2378).
   - `phone`: normalized to 11 digits starting with `01[3-9]...`. Returns 422 if invalid (lines 2139–2149).
   - `address`: minimum 8 characters. Returns 422 if $< 8$ chars (lines 2151–2153).
   - `items`: non-empty array (lines 2154–2156).
2. **Deduplication & Single-Flight Locking**:
   - Computes `naturalKey`: `${digits}:${address.trim().toLowerCase()}:${itemsKey}:${payment}:${rawCoupon}`.
   - Client idempotency key supported via `idempotency-key` / `x-idempotency-key` header or body.
   - Intercepts completed duplicate orders within 5-minute window (`_getDuplicateOrder()`) -> returns HTTP 200 with existing order (line 2167).
   - Single-flight locking (`_inFlightOrders`) joins concurrent executions to avoid duplicate upstream creation (lines 2174–2183).
3. **Zone-Based Shipping Fees Calculation** (lines 2205–2212):
   ```ts
   const delivery =
     area === "outside" || area === "outside_standard"
       ? shipFees.outsideDhaka // ৳90
       : area === "dhaka_express"
       ? shipFees.insideDhaka + config.expressSurcharge // ৳50 + ৳70 = ৳120
       : area === "store_pickup" || area === "pickup"
       ? 0 // ৳0
       : shipFees.insideDhaka; // ৳50
   ```
4. **64-District State Normalization** (`normalizeState`, line 359 & line 2238):
   - Canonical state table `BD_STATES` contains all 64 official Bangladesh districts (`BD-01` to `BD-64`).
   - `normalizeState()` normalizes either district code (`BD-XX`) or district name (case-insensitive) into the canonical WooCommerce state code (e.g. `"Dhaka"` or `"BD-13"` -> `"BD-13"`, `"Chattogram"` or `"BD-10"` -> `"BD-10"`).
   - Output billing and shipping state in WooCommerce is always `BD-XX`, country is always `"BD"`.
5. **Payment Modes & State Assignment**:
   - **Cash on Delivery (`payment: "cod"`)**:
     - `paymentTitle`: `"Cash on delivery"`
     - `paymentStatus`: `"Pending (Cash on Delivery)"`
     - WooCommerce order: `status: "processing"`, `set_paid: false`
     - Gateway status: `"received"`
   - **Prepaid (`payment: "bkash"`, `"sslcommerz"`, etc.)**:
     - `paymentTitle`: `"bKash"` / `"Pay Online (Cards / SSLCommerz)"`
     - `paymentStatus`: `"Awaiting Payment"`
     - `trxId`: captured in transaction metadata
     - WooCommerce order: `status: "on-hold"`, `set_paid: true`
     - Gateway status: `"received"`
6. **Pathao Logistics Tracking Pipeline**:
   - Pathao consignment IDs are NOT faked on order creation (`rawConsId` must be provided).
   - When present:
     - `pathaoConsignmentId`: set to consignment ID (e.g. `DD220826MDKMP9`).
     - `pathaoTrackingUrl`: `https://merchant.pathao.com/tracking?consignment_id=${pathaoConsignmentId}`.
     - `courier`: `"Pathao Courier"`.
   - Attaching consignment later: `POST /v1/deen/orders/:orderId/consignment` updates order to `status: "dispatched"` and attaches the consignment ID.
   - Order lookup: `GET /v1/deen/orders?number=DC-XXXX` enriches the response with cached or fresh live tracking info from Pathao API (`GET /v1/deen/pathao/track/:consignmentId`).
   - Order Success / Stepper screens:
     - If consignment present: displays Pathao Consignment ID and clickable tracking link.
     - If absent: displays "Preparing for Courier Dispatch" / "Preparing Dispatch".

---

## Part 3: Architecture for Automated E2E Order Placement Verification

### 3.1 Current Test Architecture
- Test Runner: Node.js native test runner (`tsx --test`) invoked via `npm test` (`npm run --prefix apps/api test`).
- Existing test suites:
  - `apps/api/src/pricing.test.ts` (55 tests: cashback tiers, BOGO discounts, phone normalization, BI KPIs, segmentation)
  - `apps/api/src/idempotency.test.ts` (concurrency deduplication, failover reconciliation, HMAC session tokens)
  - `apps/api/src/ai/ai.test.ts` (DEEN AI commerce concierge, RAG, product recommendation)
- Execution time: ~330 ms across 55 tests.

### 3.2 Programmatic Verification Construction Plan

To fulfill Acceptance Criteria ("End-to-end order placement test verifies successful order generation and state assignment"), a dedicated test suite (e.g. `apps/api/src/orders.test.ts`) can be integrated into `npm test`.

Because `registerDeenRoutes(app)` accepts any Fastify instance, tests can instantiate Fastify and execute requests via `app.inject()`:
```ts
import test, { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import Fastify, { FastifyInstance } from "fastify";
import { registerDeenRoutes, normalizeState, BD_STATES } from "./routes.js";
```

#### Test Matrix Specification for `orders.test.ts`:

1. **Validation & Error Envelope**:
   - `POST /v1/deen/orders` with empty body -> returns 400 with structured error `{ error: "VALIDATION", fields: ["name"] }`.
   - Invalid phone (`"012345"`, `"0212345678"`, `"12345678901"`) -> returns 422 with `{ error: "VALIDATION", fields: ["phone"] }`.
   - Valid phone with country code (`"+8801712345678"`, `"8801812345678"`) -> accepted and normalized to 11 digits (`"01712345678"`, `"01812345678"`).
   - Address $< 8$ chars -> returns 422 with `{ error: "VALIDATION", fields: ["address"] }`.
   - Empty items array -> returns 400 with `{ error: "VALIDATION", fields: ["items"] }`.

2. **64-District State Normalization (`normalizeState`)**:
   - Verifies that all 64 districts in `BD_STATES` (`BD-01` through `BD-64`) normalize to their canonical `BD-XX` code.
   - Tests lowercase names, uppercase codes, and mixed names (e.g. `"dhaka"` -> `"BD-13"`, `"chattogram"` -> `"BD-10"`, `"sylhet"` -> `"BD-60"`).
   - Verifies fallback for empty/undefined returns default `"BD-13"`.

3. **Zone-Based Shipping Calculations**:
   - Order with `area: "dhaka_standard"` -> delivery fee = ৳50.
   - Order with `area: "outside"` or `"outside_standard"` -> delivery fee = ৳90.
   - Order with `area: "store_pickup"` or `"pickup"` -> delivery fee = ৳0.
   - Order with `area: "dhaka_express"` -> delivery fee = ৳120 (৳50 + ৳70 surcharge).

4. **Payment Modes & Order State Assignment**:
   - **Cash on Delivery (`cod`)**:
     - Status: `"received"`
     - `paymentTitle`: `"Cash on delivery"`
     - `paymentStatus`: `"Pending (Cash on Delivery)"`
     - Upstream Woo payload asserts `status: "processing"`, `set_paid: false`.
   - **Prepaid (`bkash` with `trxId`)**:
     - Status: `"received"`
     - `paymentTitle`: `"bKash"`
     - `paymentStatus`: `"Awaiting Payment"`
     - `trxId` recorded correctly.
     - Upstream Woo payload asserts `status: "on-hold"`, `set_paid: true`.

5. **Pricing & Discounts in Order Placement**:
   - Verifies subtotal matches item unit prices $\times$ quantities.
   - Subtotal $\ge$ ৳2500 -> ৳500 cashback deducted.
   - Subtotal $\ge$ ৳3000 -> ৳700 cashback deducted.
   - Two jeans in cart -> cheapest is free (BOGO).
   - Total formula: `max(0, subtotal - cashback - bogo - coupon) + delivery`.

6. **Order Retrieval & Pathao Logistics Tracking**:
   - Order created initially has `pathaoConsignmentId: undefined`, `courier: "Home Delivery"` (or `"Store Pickup"`), status `"received"`.
   - Retrieve order via `GET /v1/deen/orders?number=${order.number}` -> returns order with public fields.
   - Attach Pathao consignment via `POST /v1/deen/orders/${order.id}/consignment` with `{ consignmentId: "DD220826MDKMP9" }`:
     - Order status transitions to `"dispatched"`.
     - `pathaoConsignmentId` = `"DD220826MDKMP9"`.
     - `pathaoTrackingUrl` = `"https://merchant.pathao.com/tracking?consignment_id=DD220826MDKMP9"`.
     - `courier` = `"Pathao Courier"`.
   - Querying tracking endpoint `GET /v1/deen/pathao/track/DD220826MDKMP9` -> returns valid tracking payload with `consignmentId` and `trackingUrl`.

7. **Idempotency & Duplicate Protection**:
   - Subsequent `POST /v1/deen/orders` with the same `idempotencyKey` within 5 minutes returns the identical order without creating a duplicate.

---

## Part 4: Recommendations & Implementation Plan

### 4.1 Requirement R4 Recommendations (Responsive Hero Video)

1. **Web Aspect Ratio Alignment (`apps/web/components/HeroSlider.tsx`)**:
   - Set container aspect ratio to match the native video ratio:
     - On desktop: use `aspect-ratio: 1920 / 840` (or `16 / 7`) instead of `21 / 9`.
     - Remove or increase the arbitrary `max-height: 480px` constraint (e.g. `max-height: calc(100vw * 840 / 1920)` or clamp gracefully) so that wide viewports do not truncate vertical content.
   - On mobile web (<768px):
     - If mobile displays the 1920x840 video: container aspect ratio must be `aspect-ratio: 1920 / 840` (or `16 / 7`) so the full widescreen banner is visible without cutting 22% of the sides.
     - Alternatively, support responsive video sources: if mobile serves `Home_1x11.mp4` (1:1 square), the mobile container aspect ratio should be `1 / 1`.
   - Apply `object-fit: contain` as a fallback or ensure container aspect ratio strictly matches video aspect ratio with `object-fit: cover` to guarantee **0px edge-clipping**.

2. **Native Mobile Aspect Ratio Alignment (`apps/mobile/src/components/MotionHero.tsx`)**:
   - `MotionHero.tsx` currently plays `Home_1x11.mp4` which is **1:1 (1080x1080)**.
   - Update container height:
     - If using square mobile video (`Home_1x11.mp4`): `const HERO_HEIGHT = SCREEN_WIDTH;` (1:1 aspect ratio) or dynamic height based on active slide's aspect ratio.
     - If using widescreen video (`1920x840`): `const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (840 / 1920));` (16:7 aspect ratio).
   - In `<VideoView>`, set `contentFit="contain"` (or `"cover"` when the container matches the media's native aspect ratio) so zero vertical or horizontal clipping occurs.
   - Connect `MotionHero.tsx` to dynamic API slides from `fetchHeroBanner()` or `useCatalogRefreshOnFocus` for web/mobile parity.

### 4.2 Requirement R6 Recommendations (Order Verification & Parity)

1. **Parity Fix in Mobile Checkout**:
   - In `apps/mobile/app/checkout.tsx` line 228:
     Replace `postcode: "1200"` with `postcode: getDistrictPostcode(isGift ? giftDistrict.code : district.code)`.
2. **Implement Automated E2E Order Placement Test Suite**:
   - Create `apps/api/src/orders.test.ts` implementing the full test matrix detailed in §3.2.
   - Update `apps/api/package.json` test script:
     `"test": "tsx --test src/pricing.test.ts src/idempotency.test.ts src/ai/ai.test.ts src/orders.test.ts"`
   - Verify that `npm test` passes all tests and `npm run typecheck:all` passes with 0 errors.

---
