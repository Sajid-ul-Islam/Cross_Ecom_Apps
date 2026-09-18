# Orchestration Plan — DEEN Commerce Web & Mobile Enhancements

## Mission Overview
Deliver and verify all 6 requirements specified in `ORIGINAL_REQUEST.md` for DEEN Commerce (`apps/api`, `apps/web`, `apps/mobile`), ensuring strict adherence to `AGENTS.md`, monorepo guidelines, WCAG 2.2 AA accessibility, zero TypeScript compilation errors (`npm run typecheck:all`), and 100% automated test passing (`npm test`).

## Requirements Breakdown
- **R1: Category-Wise Product Presentation & Authentic Photography**:
  - Web & Mobile catalog presentation grouped by category.
  - Authentic cover photography, titles, and poetic descriptions per category.
  - Category navigation filtering verified across platforms.
- **R2: Live Production DEEN AI Shopping Assistant**:
  - Connect AI shopping concierge to live gateway catalog, store policies, exchange rules, showroom addresses.
  - Real-time context-aware answers rather than canned demo placeholders.
  - Web and mobile chat interfaces verified.
- **R3: Customer Profile Analytics KPI Dashboard**:
  - Executive analytics KPI summary on customer profile (web & mobile).
  - Metrics: Total Spend (৳), Total Items Bought, Total Orders, Return/Exchange status.
  - Dynamic computation from authenticated/saved customer orders.
- **R4: Responsive Hero Video Aspect Ratio Scaling**:
  - Desktop web, mobile web, and native mobile hero video container/player.
  - Preserve native aspect ratio with zero cropped edges or awkward letterboxing across all viewports (<768px, tablet, desktop).
- **R5: Brand Asset Verification & Parity**:
  - Official brand logos in light and dark mode, crisp rendering, correct aspect ratios.
  - Exact visual and structural parity across web and mobile.
- **R6: Automated End-to-End Order Placement Verification**:
  - Programmatic end-to-end verification covering Cash on Delivery and prepaid, 64-district delivery selection, zone-based shipping fees.

## Orchestration Phases
### Phase 0: Parallel Exploration Survey (3 Explorers)
- Explorer 1: Catalog grouping, categories, photography, brand assets (R1 & R5) in `apps/web`, `apps/mobile`, `apps/api`.
- Explorer 2: AI Shopping Assistant (`apps/api` concierge routes, web chat, mobile chat) & Customer Profile Analytics (R2 & R3).
- Explorer 3: Hero video scaling (web & mobile) & Order placement flow & tests (R4 & R6).

### Phase 1: PROJECT.md & TEST_INFRA.md Synthesis
- Synthesize findings into authoritative `PROJECT.md` and `TEST_INFRA.md`.
- Formulate milestone boundaries, module contracts, and verification criteria.

### Phase 2: Dual-Track Execution
- **Track 1 (Implementation Track)**: Implement R1, R2, R3, R4, R5 across specialist workers, followed by Reviewer, Challenger, and Auditor gates.
- **Track 2 (E2E Testing Track)**: Build comprehensive opaque-box E2E test harness covering Tiers 1-4, publishing `TEST_READY.md`.

### Phase 3: Final Integration & Adversarial Verification
- Run full test suite, resolve any regressions, pass 100% E2E tests (R6).
- Run Challenger & Forensic Auditor for full integrity verification.

### Phase 4: Final Reporting
- Present complete verification summary to Sentinel.
