# Project: DEEN Commerce Web & Mobile Enhancements

## Architecture
DEEN Commerce is a multi-platform e-commerce ecosystem consisting of:
- `apps/api`: Fastify Gateway Server connected to WooCommerce with in-memory caching, rate-limiting, and AI shopping engine.
- `apps/mobile`: Expo / React Native Application (iOS/Android) sharing theme tokens, district mappings, and WooCommerce API contracts.
- `apps/web`: Next.js 14 Web Application maintaining 100% feature and visual parity with the mobile app.

## Feature Inventory
Every requirement (R1–R6) from `ORIGINAL_REQUEST.md` and the Phase 0 Survey is mapped to a milestone below:
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Web Category-Wise Catalog & Metadata (R1) | Group catalog by category when ALL, render authentic cover photos, titles, descriptions; add POLO & DEEN_COLLECTION to `lib/categories.ts` | M1 | survey_catalog_brand.md |
| 2 | Mobile Category-Wise Catalog & Poetic Descriptions (R1) | Render poetic descriptions in shop/category screens; render categorized sections when ALL | M1 | survey_catalog_brand.md |
| 3 | AI Shopping Assistant Web Chat Route & Markdown (R2) | Implement `apps/web/app/chat/page.tsx` parity route; parse markdown tokens (bold, bullets) in `AiConciergeDrawer.tsx` | M2 | survey_assistant_kpi.md |
| 4 | AI Shopping Assistant Mobile Markdown Formatting (R2) | Parse and style markdown tokens (bold, bullets) in `AiConciergeModal.tsx` | M2 | survey_assistant_kpi.md |
| 5 | Customer Profile Analytics KPI Dashboard Web (R3) | Implement `CustomerAnalyticsKPIs.tsx` on web profile (Total Spend ৳, Items, Orders, Returns) | M3 | survey_assistant_kpi.md |
| 6 | Customer Profile Analytics KPI Dashboard Mobile (R3) | Implement `CustomerAnalyticsKPIs.tsx` on mobile profile with WCAG 2.2 AA contrast | M3 | survey_assistant_kpi.md |
| 7 | Hero Video Aspect Ratio Scaling Web (R4) | Align CSS aspect-ratio with 16:7 (1920x840) banner video; eliminate 480px crop cap and lateral clipping | M4 | survey_video_orders.md |
| 8 | Hero Video Aspect Ratio Scaling Mobile (R4) | Align `MotionHero.tsx` container height to 1:1 square video ratio (1080x1080); eliminate 43.8% vertical crop | M4 | survey_video_orders.md |
| 9 | Brand Asset Dark Mode Inversion Fix Web (R5) | Replace `filter: invert(1)` in `SideNavDrawer.tsx` with `/logo_white.png` to preserve `#EB6508` brand orange | M5 | survey_catalog_brand.md |
| 10 | Brand Asset Favicon & Visual Parity Web (R5) | Replace broken remote 404 WordPress icons in `layout.tsx` with crisp local assets (`/icon.png`, `/favicon.ico`) | M5 | survey_catalog_brand.md |
| 11 | Checkout Postcode District Parity Mobile (R6) | Use `getDistrictPostcode(district.code)` in `apps/mobile/app/checkout.tsx:228` instead of `"1200"` | M6 | survey_video_orders.md |
| 12 | Automated End-to-End Order Placement Test Suite (R6) | Create `apps/api/src/orders.test.ts` testing COD & prepaid, all 64 districts, shipping zones, Pathao tracking | M6 | survey_video_orders.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Category-Wise Product Presentation & Authentic Photography | Features 1, 2 (R1) in Web & Mobile catalog | None | PLANNED |
| M2 | Live Production DEEN AI Shopping Assistant | Features 3, 4 (R2) in Web & Mobile chat | None | PLANNED |
| M3 | Customer Profile Analytics KPI Dashboard | Features 5, 6 (R3) in Web & Mobile profile | None | PLANNED |
| M4 | Responsive Hero Video Aspect Ratio Scaling | Features 7, 8 (R4) in Web & Mobile hero banners | None | PLANNED |
| M5 | Brand Asset Verification & Parity | Features 9, 10 (R5) in Web brand assets & side drawer | None | PLANNED |
| M6 | Final Verification & 100% E2E Test Suite Pass | Features 11, 12 (R6), E2E order placement test suite, monorepo typecheck & test pass | M1-M5 | PLANNED |

## Interface Contracts
### Web & Mobile ↔ API Catalog & AI Assistant
- `GET /v1/deen/catalog`: Returns `Product[]` with `category`, `price`, `images`, `stock_status`.
- `POST /v1/deen/ai/chat`: Schema `{ message: string; history?: any[]; phone?: string }` -> returns `{ reply: string; products?: Product[]; intent?: string }`.
- Markdown tokens in `reply`: `**bold**` rendered as emphasized text, `~~strikethrough~~` as del, `\n- ` as bullet lists.

### Customer Profile KPI Contract
- Computed from `OrderResult[]`:
  - `totalSpend`: $\sum \text{order.total}$ for non-cancelled orders.
  - `totalItems`: $\sum \text{line.qty}$ across all orders.
  - `completedOrders`: count where `order.status` in `['completed', 'delivered']`.
  - `returnExchangeCount`: count of active/processed returns from `ReturnContext` / `GET /v1/deen/returns`.

### Checkout & Orders Contract
- `POST /v1/deen/orders`:
  - Body: `{ customer: { name, phone, address, district: { code, name, city }, postcode }, items, paymentMethod: 'cod'|'bkash'|'sslcommerz'|'card', area: 'dhaka_standard'|'outside_standard'|'store_pickup'|'dhaka_express' }`.
  - Response: `{ id: number, orderId: number, status: string, total: number, pathaoTrackingUrl?: string }`.

## Code Layout
### Milestone 1 (R1)
- `apps/web/lib/categories.ts`: Add `POLO` and `DEEN_COLLECTION` entries, replace Unsplash fallbacks.
- `apps/web/components/ShopClient.tsx`: Add category-wise section grouping for `ALL` view.
- `apps/mobile/src/data/categories.ts`: Replace Unsplash fallback with authentic cover.
- `apps/mobile/app/(tabs)/shop.tsx`: Render category-wise sections when `selectedCategory === 'ALL'`.
- `apps/mobile/app/category/[slug].tsx`: Render `categoryInfo.description`.

### Milestone 2 (R2)
- `apps/web/app/chat/page.tsx`: Create dedicated chat page.
- `apps/web/components/AiConciergeDrawer.tsx`: Implement markdown token parser.
- `apps/mobile/src/components/AiConciergeModal.tsx`: Implement formatted text rendering.

### Milestone 3 (R3)
- `apps/web/components/CustomerAnalyticsKPIs.tsx`: Create KPI card grid with WCAG AA tokens.
- `apps/web/app/profile/page.tsx`: Integrate `CustomerAnalyticsKPIs`.
- `apps/mobile/src/components/profile/CustomerAnalyticsKPIs.tsx`: Create mobile KPI card grid.
- `apps/mobile/src/components/profile/AccountHeader.tsx`: Integrate KPI card grid.

### Milestone 4 (R4)
- `apps/web/components/HeroSlider.tsx`: Fix aspect ratio to 16:7 (`aspect-ratio: 16 / 7`), remove `max-height: 480px` constraint, eliminate edge crop.
- `apps/mobile/src/components/MotionHero.tsx`: Set height to `SCREEN_WIDTH` (1:1) to match `Home_1x11.mp4` square aspect ratio.

### Milestone 5 (R5)
- `apps/web/components/SideNavDrawer.tsx`: Fix dark mode logo inversion using `/logo_white.png`.
- `apps/web/app/layout.tsx`: Update favicon/icon URLs to local public assets.

### Milestone 6 (R6 & E2E)
- `apps/mobile/app/checkout.tsx`: Fix postcode lookup using `getDistrictPostcode(district.code)`.
- `apps/api/src/orders.test.ts`: Automated test suite for orders and checkout pipeline.
- `apps/api/package.json`: Include `src/orders.test.ts` in `"test"` script.
