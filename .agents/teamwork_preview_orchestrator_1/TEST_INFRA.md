# E2E Test Infra: DEEN Commerce Web & Mobile Enhancements

## Test Philosophy
- Opaque-box, requirement-driven derived directly from `ORIGINAL_REQUEST.md` and user acceptance criteria.
- Zero dependency on internal implementation private variables.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Scenarios.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Workload) |
|---|---------|-------------|:----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Category Presentation (Web) | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 2 | Category Presentation (Mobile) | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 3 | AI Shopping Assistant (Web) | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 4 | AI Shopping Assistant (Mobile) | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 5 | Customer Profile KPI (Web) | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 6 | Customer Profile KPI (Mobile) | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 7 | Hero Video Aspect Scaling (Web) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 8 | Hero Video Aspect Scaling (Mobile) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 9 | Brand Asset Parity (Web) | R5 | 5 tests | 5 tests | ✓ | ✓ |
| 10 | Brand Asset Parity (Mobile) | R5 | 5 tests | 5 tests | ✓ | ✓ |
| 11 | District & Postcode Parity | R6 | 5 tests | 5 tests | ✓ | ✓ |
| 12 | Automated Order Placement Pipeline | R6 | 5 tests | 5 tests | ✓ | ✓ |

## Test Architecture
- **API Automated Test Runner**: `apps/api/src/orders.test.ts` executing via Node test runner (`tsx --test`) through `npm test`.
  - Fastify `app.inject()` provides opaque HTTP request/response validation without live network dependency.
- **Monorepo Type Safety**: `npm run typecheck:all` enforcing strict TypeScript validation across `apps/api`, `apps/web`, `apps/mobile`.
- **UI & Layout Verification**: Verifies component contracts, CSS aspect-ratio properties, token contrast $\ge 4.5:1$, and responsive scaling.

## Test Scenarios & Pass/Fail Criteria
### Tier 1 — Feature Coverage
- Order creation for Cash on Delivery (COD) produces `status: "processing"` and `set_paid: false`.
- Order creation for prepaid (`bkash`, `sslcommerz`) produces `status: "on-hold"` and `set_paid: true`.
- District code mapping normalizes Dhaka to `BD-13` with ৳50 shipping fee.
- District code mapping normalizes Outside Dhaka (e.g. Sylhet `BD-60`) with ৳90 shipping fee.
- Store pickup applies ৳0 shipping fee.
- Category filtering on Web & Mobile returns products matching selected category slug.
- AI Assistant correctly identifies sizing queries, delivery fee queries, and showroom queries.
- Customer profile calculates correct Total Spend (৳), Total Items, and Orders.

### Tier 2 — Boundary & Corner Cases
- Mobile number validation rejects invalid formats (<11 digits, letters, invalid prefixes).
- Zero-order state on customer profile renders gracefully (`৳0`, 0 items, 0 orders, 0 returns) without crashing.
- Empty cart checkout rejected with 400 status.
- All 64 Bangladesh district codes (`BD-01` to `BD-64`) correctly normalize without throwing or returning undefined.
- Single-flight duplicate order prevention: Rapid duplicate submissions return 409 Conflict.

### Tier 3 — Cross-Feature Interactions
- Order created via checkout -> Customer Profile KPI updates Total Spend and Total Orders dynamically.
- Category selected from Shop navigation -> Correct authentic cover photo and poetic description displayed.
- Dark mode toggle -> Official brand logo switches from dark lettermark to white lettermark while preserving `#EB6508` orange without color distortion.

### Tier 4 — Real-World Application Workloads
- User browses Category-Wise Catalog -> chats with AI Assistant for size recommendation -> adds to cart -> completes COD checkout with Outside Dhaka district -> views order in Profile with live tracking status.

## Coverage Goals
- 100% automated test pass on `npm test`.
- 0 TypeScript compilation errors on `npm run typecheck:all`.
- Verification of WCAG 2.2 AA contrast on dark/light profile KPI cards.
- Complete visual parity between Web and Mobile across all 6 requirements.
