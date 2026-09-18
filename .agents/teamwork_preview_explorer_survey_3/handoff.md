# Handoff Report — Explorer 3 (Hero Video & Order Verification Survey Specialist)

**Working Directory**: `/home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_3`  
**Date**: 2026-09-19 (UTC: 2026-09-18T22:10:00Z)  
**Parent Task ID**: `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`  
**Handoff Type**: Hard (Investigation complete)

---

## 1. Observation

### R4 (Responsive Hero Video Aspect Ratio Scaling):
1. **Video Asset Probing via `ffprobe`**:
   - `Denim-Web-Banner_1920x840pxl.mp4`:
     - Dimensions: `width=1920`, `height=840` -> Aspect ratio: 16:7 (2.2857:1)
     - Codec: `codec_name=hevc`, duration: 24.57s
   - `END-OF-THE-SESSION-2_1920x8401.mp4`:
     - Dimensions: `width=1920`, `height=840` -> Aspect ratio: 16:7 (2.2857:1)
     - Codec: `codec_name=hevc`, duration: 10.17s
   - `Home_1x11.mp4`:
     - Dimensions: `width=1080`, `height=1080` -> Aspect ratio: 1:1 (Square)
     - Codec: `codec_name=hevc`, duration: 24.57s
   - `END-OF-THE-SESSION-2_-1x11-1.mp4`:
     - Dimensions: `width=1080`, `height=1080` -> Aspect ratio: 1:1 (Square)
     - Codec: `codec_name=hevc`, duration: 10.17s
   - `End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg` (desktop poster): 1920x840 (16:7).
   - `End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp` (mobile poster): 1080x1350 (4:5).

2. **Web Implementation (`apps/web/components/HeroSlider.tsx`)**:
   - Lines 75–80: `<video style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>`
   - Lines 186–196:
     ```css
     @media (min-width: 769px) {
       .hero-slider-clean {
         aspect-ratio: 21 / 9;
         min-height: 280px;
         max-height: 480px;
       }
     }
     ```
   - Lines 198–212:
     ```css
     @media (max-width: 768px) {
       .hero-slider-clean {
         aspect-ratio: 16 / 9;
         min-height: 190px;
         max-height: 280px;
         margin-bottom: 18px;
       }
     }
     ```

3. **Native Mobile Implementation (`apps/mobile/src/components/MotionHero.tsx`)**:
   - Line 15: `const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16)); // 16:9 cinematic edge-to-edge ratio`
   - Lines 31, 40:
     - `videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Home_1x11.mp4"`
     - `videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_-1x11-1.mp4"`
   - Lines 88–95:
     ```tsx
     <VideoView
       style={StyleSheet.absoluteFill}
       player={player}
       nativeControls={false}
       contentFit="cover"
     />
     ```

### R6 (Automated End-to-End Order Placement Verification):
1. **District Definitions & Parity**:
   - `apps/mobile/src/data/districts.ts` lines 6–71 & `apps/web/lib/districts.ts` lines 6–71 define identical 64 Bangladesh districts (`BD-01` to `BD-64`) with postal codes.
   - `apps/web/app/checkout/page.tsx` line 434: `postcode: getDistrictPostcode(isGift ? giftDistrict.code : district.code)`.
   - `apps/mobile/app/checkout.tsx` line 228: `postcode: "1200"` (discrepancy: hardcoded instead of looking up `getDistrictPostcode`).

2. **Shipping Fees & Normalization in Gateway (`apps/api/src/routes.ts`)**:
   - Line 359: `normalizeState(input?: string): string` normalizes district codes and district names to official `BD-XX` codes (e.g. "Dhaka" -> "BD-13", "Chattogram" -> "BD-10").
   - Lines 2205–2212:
     - Area `"dhaka_standard"`: ৳50
     - Area `"outside"` / `"outside_standard"`: ৳90
     - Area `"store_pickup"` / `"pickup"`: ৳0
     - Area `"dhaka_express"`: ৳50 + ৳70 = ৳120
   - Lines 2229–2234, 2292–2295:
     - Payment `"cod"`: `paymentTitle: "Cash on delivery"`, `paymentStatus: "Pending (Cash on Delivery)"`, WooCommerce `set_paid: false`, `status: "processing"`.
     - Payment `"bkash"` / `"sslcommerz"` / `"card"`: `paymentStatus: "Awaiting Payment"`, WooCommerce `set_paid: true`, `status: "on-hold"`.
   - Line 2601: `POST /v1/deen/orders/:orderId/consignment` updates order status to `"dispatched"`, attaches `pathaoConsignmentId`, `pathaoTrackingUrl`, and sets `courier: "Pathao Courier"`.
   - Line 2680: `GET /v1/deen/pathao/track/:consignmentId` returns tracking data and merchant link.

3. **Current Test Runner & Baseline**:
   - `package.json` line 14: `"test": "npm run --prefix apps/api test"`
   - `apps/api/package.json` line 11: `"test": "tsx --test src/pricing.test.ts src/idempotency.test.ts src/ai/ai.test.ts"`
   - `npm test`: Runs 55 tests, 0 failures, duration 332ms.
   - `npm run typecheck:all`: Passes all 3 projects (`api`, `web`, `mobile`) with 0 errors.

---

## 2. Logic Chain

1. **R4 Web Desktop Cropping Logic**:
   - Native video resolution is 1920x840 (16:7 / 2.2857:1).
   - The desktop CSS enforces `aspect-ratio: 21 / 9` (2.3333:1) and `max-height: 480px`.
   - On screens $\ge 1280\text{px}$ wide, the 480px max-height cap clamps the container height.
   - At 1440px wide, container is 1440x480 (3.0:1). Video height at 1440px width is 630px. With `object-fit: cover`, $630 - 480 = 150\text{px}$ (23.8%) of vertical frame is cropped.
   - At 1920px wide, container is 1920x480 (4.0:1). Video height is 840px. With `object-fit: cover`, $840 - 480 = 360\text{px}$ (42.8%) of vertical frame is cropped.

2. **R4 Web Mobile Cropping Logic**:
   - The web app currently serves the 1920x840 widescreen video across all viewports.
   - On mobile (<768px), CSS enforces `aspect-ratio: 16 / 9` (1.7778:1).
   - Because 16:9 is taller/narrower than 16:7, filling the 16:9 container height with `object-fit: cover` causes the video width to overflow by $(2.2857 / 1.7778) - 1 \approx 28.5\%$.
   - On a 390px mobile viewport, the video renders at 501.5px wide, chopping off 111.5px (56px left, 56px right) of lateral content.

3. **R4 Native Mobile Cropping Logic**:
   - `MotionHero.tsx` renders `Home_1x11.mp4`, which is 1080x1080 (1:1).
   - Container height is hardcoded to 16:9 (`SCREEN_WIDTH * (9 / 16)`).
   - On a 390px screen, container height is 219px.
   - With `contentFit="cover"`, the square video scales to $390 \times 390\text{px}$.
   - $390 - 219 = 171\text{px}$ (43.8%) of the square video is cropped off vertically (85.5px top, 85.5px bottom).

4. **R6 Order Verification Logic**:
   - All components for complete order placement, district validation, shipping zones, and Pathao logistics exist in `apps/api/src/routes.ts`.
   - `registerDeenRoutes(app)` accepts a Fastify instance, allowing Fastify's `app.inject()` to execute simulated HTTP requests end-to-end without opening TCP network sockets or depending on external internet access (seed/mock fallback mode).
   - An automated test suite `apps/api/src/orders.test.ts` can execute inside `npm test`, validating input validation (400/422), district code mapping across all 64 districts, shipping fee calculation (৳50, ৳90, ৳0, ৳120), payment states (COD `processing` / prepaid `on-hold`), single-flight locking, and Pathao tracking attachment.

---

## 3. Caveats

- **Network Mode & Live WooCommerce**: In development/testing without active WooCommerce API credentials, `wooHealthy()` returns false, triggering the in-memory fallback store and seed catalog. All order creation and tracking pathways are fully executable in this mode.
- **HEVC Browser Playback**: The video assets use HEVC (H.265). While supported on iOS, macOS, modern Android, and newer Windows browsers, Chrome on older Linux/Windows environments without hardware HEVC decoding relies on the poster image or H.264 fallbacks. The poster image dimensions must also match the container aspect ratio.

---

## 4. Conclusion

- **Requirement R4 Root Cause Identified**:
  - Web: Mismatch between 16:7 video asset and `21/9` / `16/9` container CSS, exacerbated by `max-height: 480px` on desktop and `object-fit: cover`.
  - Mobile: Mismatch between 1:1 square video asset and hardcoded 16:9 `HERO_HEIGHT` in `MotionHero.tsx`, with `contentFit="cover"`.
  - Fix: Standardize container aspect ratios to match media assets (16:7 widescreen on desktop, or dynamic matching slide aspect ratio) and use `object-fit: contain` fallback or aspect-ratio locked containers to guarantee 0px edge-cropping.
- **Requirement R6 Blueprint Established**:
  - Parity bug found: `apps/mobile/app/checkout.tsx` line 228 hardcodes `postcode: "1200"` instead of `getDistrictPostcode(district.code)`.
  - Automated E2E verification test suite can be constructed in `apps/api/src/orders.test.ts` using Fastify injection and Node's test runner (`tsx --test`), testing all 64 districts, zone fees, COD vs prepaid states, and Pathao consignment dispatch.

---

## 5. Verification Method

To independently verify these findings:
1. **Probe Media Specs**:
   ```bash
   ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name -of default=noprint_wrappers=1 "https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4"
   ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name -of default=noprint_wrappers=1 "https://deencommerce.com/wp-content/uploads/2026/09/Home_1x11.mp4"
   ```
   *Expected output*: `width=1920 height=840` for web; `width=1080 height=1080` for mobile.

2. **Inspect Code Locations**:
   - View `apps/web/components/HeroSlider.tsx` lines 186–213 (CSS aspect-ratios) and line 78 (`object-fit: cover`).
   - View `apps/mobile/src/components/MotionHero.tsx` line 15 (`HERO_HEIGHT`), lines 31/40 (1x1 URLs), line 93 (`contentFit="cover"`).
   - View `apps/mobile/app/checkout.tsx` line 228 (`postcode: "1200"`).
   - View `apps/api/src/routes.ts` line 359 (`normalizeState`), lines 2133–2440 (`POST /v1/deen/orders`).

3. **Run Monorepo Typecheck & Tests**:
   ```bash
   npm run typecheck:all
   npm test
   ```
   *Expected output*: 0 TypeScript errors across all 3 apps, 55 passing tests in `apps/api`.

---
