# Blog / Later-Fix: Per-Fit Jeans Size Charts

> **Status: PARKED.** Root cause found + app wiring done. Blocked only on real
> measurement data from the brand. NOT a go-live blocker — parked so we can ship
> the app first and revisit here.

## The problem (reported by owner)
"there is three type of jenas, Ragular, slim, and Stright fit, and there size chart is
notrt same, now verify it in the app, is shoing it correctly?"

## Verification result (BEFORE any fix)
The app was **NOT** correct. `SizeGuideModal` had a single hardcoded `JEANS_CHART`
and branched only by `category` — there was **no fit dimension at all**. The `Product`
type had no `fit` field, and the modal was opened with only `category`. So tapping SIZE
CHART on a Slim, Regular, or Straight jean all showed the **same generic numbers**.

## Root cause (found against live WooCommerce)
- The store is **`https://deencommerce.com`** (NOT `.bd` — that was a stale `.env` comment).
- **Fit is a WooCommerce product CATEGORY**, not a `pa_fit` attribute. Three exist:
  - `SLIM FIT` — 11 jeans products (e.g. "High-End Raw Washed Jeans - Slim Fit")
  - `REGULAR FIT` — 5 jeans products
  - `STRAIGHT FIT` — 2 jeans products
- **WooCommerce stores NO per-fit size-chart data.** Product meta only contains
  Facebook-catalog junk. So the per-fit measurement tables are the **brand's own spec**,
  not something retrievable from Woo.

## What was fixed (committed)
- `apps/api/src/woo.ts` `getFit()` now derives fit from the **product category name**
  (regex `(\w+)\s*fit` → "Slim" / "Regular" / "Straight"). Real Woo data = source of truth.
- `fit` flows: Woo category → `mapWooToDeen` → `DeenProduct.fit` → gateway JSON →
  mobile `Product.fit` → `SizeGuideModal.resolveJeansChart(fit)`.
- `SizeGuideModal` now selects a per-fit chart and shows e.g. *"Slim Fit · Raw Selvedge
  Denim Sizing"* in the subtitle.
- Product page passes `fit={product.fit}` into the modal.
- Commits: `e68f753` (plumbing) + `683a29c` (fit-from-category correction).

## What is STILL missing (the only blocker for THIS feature)
`FIT_CHARTS.regular / slim / straight` in `SizeGuideModal.tsx` currently all fall back to
the generic `JEANS_CHART` as a placeholder. To show **distinct** charts per fit, we need
the **real measurement tables** from the brand:

| Size | Waist | Hip | Thigh | Leg Opening |
|------|-------|-----|-------|-------------|
| 28   | ?     | ?   | ?     | ?           |
| 30   | ?     | ?   | ?     | ?           |
| 32   | ?     | ?   | ?     | ?           |
| 34   | ?     | ?   | ?     | ?           |
| 36   | ?     | ?   | ?     | ?           |
| 38   | ?     | ?   | ?     | ?           |

(for each of Regular / Slim / Straight; inches or cm — match existing chart format)

**Do NOT invent these numbers** (source-of-truth rule). Paste the brand's official spec,
drop into `FIT_CHARTS`, commit, then build.

## Why parked, not blocking
The fit *selection* is fully wired and will be correct the moment real tables are added.
Until then every fit shows the same (still valid) generic denim chart — acceptable for
launch. Per owner decision: ship the app first, fix this later.

## Re-enable checklist (when we come back)
1. Owner pastes the 3 real per-fit tables.
2. Populate `FIT_CHARTS` in `SizeGuideModal.tsx`.
3. Typecheck + build APK.
4. Verify on device: open a Slim, Regular, Straight jean → each shows its own chart +
   correct subtitle.
