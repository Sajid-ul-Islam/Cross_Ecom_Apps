# BRIEFING — 2026-09-18T22:12:00Z

## Mission
Comprehensive read-only investigation of Requirement R4 (Hero Video Aspect Ratio Scaling across Web and Mobile) and Requirement R6 (Automated E2E Order Placement Verification).

## 🔒 My Identity
- Archetype: explorer
- Roles: Hero Video & Order Verification Survey Specialist, Teamwork explorer
- Working directory: /home/bearded/Public/Cross_Ecom_Apps/.agents/teamwork_preview_explorer_survey_3
- Original parent: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Milestone: Survey Phase (Requirements R4 & R6)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT write or modify application code
- Output survey report at survey_video_orders.md and handoff at handoff.md
- Update progress.md with timestamps

## Current Parent
- Conversation ID: 3d7286ce-a8a5-47f7-88b7-5a4f5e23173e
- Updated: 2026-09-18T22:12:00Z

## Investigation State
- **Explored paths**:
  - `apps/web/components/HeroSlider.tsx` & `apps/web/app/page.tsx`
  - `apps/mobile/src/components/MotionHero.tsx` & `apps/mobile/app/(tabs)/index.tsx`
  - `apps/api/src/routes.ts` (`POST /v1/deen/orders`, `normalizeState`, shipping routes, consignment routes)
  - `apps/api/src/woo.ts` (`getShippingFees`, `DEFAULT_SLIDES`, `fetchWooHeroBanner`)
  - `apps/mobile/src/data/districts.ts` & `apps/web/lib/districts.ts`
  - `apps/mobile/app/checkout.tsx`, `apps/mobile/src/context/OrderContext.tsx`
  - `apps/web/app/checkout/page.tsx`, `apps/web/app/order-success/page.tsx`
  - `apps/api/src/pricing.test.ts`, `idempotency.test.ts`, `ai.test.ts`, `package.json`
- **Key findings**:
  - R4: Web video is 1920x840 (16:7 / 2.2857:1). Web CSS forces `21/9` on desktop (clamped to 480px) and `16/9` on mobile. With `object-fit: cover`, wide desktop viewports cut off 23%–43% of height, and mobile web cuts off 28.5% of width.
  - R4: Mobile video is 1080x1080 (1:1 square). `MotionHero.tsx` hardcodes 16:9 container height (`SCREEN_WIDTH * 9 / 16`) with `contentFit="cover"`, cutting off 43.8% of the square video.
  - R6: Gateway `POST /v1/deen/orders` validates 11-digit phone, address length, normalizes all 64 BD districts to `BD-XX`, calculates zone shipping (৳50, ৳90, ৳0, ৳120), handles COD (`processing`, `set_paid: false`) and prepaid (`on-hold`, `set_paid: true`), and supports Pathao consignment attachment (`POST /v1/deen/orders/:orderId/consignment`).
  - R6 Parity Discrepancy: `apps/mobile/app/checkout.tsx` line 228 hardcoded `postcode: "1200"` instead of `getDistrictPostcode(...)`.
  - R6 Testing: Full test matrix defined for `apps/api/src/orders.test.ts` runnable via `npm test` (`tsx --test`) using Fastify `app.inject()`.
- **Unexplored areas**: None. Full survey complete.

## Key Decisions Made
- Fully documented R4 aspect ratio mathematics and cropping percentages across viewports.
- Fully mapped R6 order placement, district selection, shipping charges, and Pathao logistics lifecycle.
- Created concrete test blueprint for programmatic E2E verification in `apps/api/src/orders.test.ts`.

## Artifact Index
- `survey_video_orders.md` — Detailed survey report on R4 & R6
- `handoff.md` — 5-component handoff report
- `progress.md` — Liveness heartbeat and progress tracker
- `DISPATCH.md` — Incoming task dispatch record
