# Session Log — DEEN Commerce

> Running record of user instructions → actions/answers. Updated each turn.
> Source-of-truth principle: app is a THIN client over gateway→WooCommerce→WordPress.

## 2026-08-23

### SaaS blueprint + tiers
- **Instruction**: Make it SaaS production-grade for real customers + increase sales.
- **Action**: Delivered blueprint across tiers (Reliability, App Quality, Conversion, Multi-tenancy, Data/Security/Compliance, Ops). Saved as `BLUEPRINT.md` + skill `saas-commerce-production-grade`.

### Source-of-truth rule
- **Instruction (verbatim)**: "rest api -> woocom -> wordpress should be the truth of soruce"
- **Action**: App must only show data from gateway (Woo). No hardcoded/local/AI-host/placeholder images. Covers sourced from Woo `products/categories` `image.src`.

### Reliability foundation
- **Action**: Gateway `/health`+`/v1/health` (woo: ok|degraded|down); `wooFetch` timeout+retry+circuit-breaker; cache covers+variations; per-key rate limiting; PII-masked audit logging; GDPR `export-data`/`delete-account`.
- **Commit**: `936fad3` Reliability + App Quality foundation.

### Secret incident + scrub
- **Instruction**: "if i make the repo priveta will it solev?" → answered: no, rotate keys. "scrub it" → ran `git filter-repo` to purge `apps/api/.env` from all history + force-pushed; purged APKs from history.
- **Lesson saved to memory**: NEVER commit .env; rotate on exposure.

### Build the app
- **Instruction**: "build the app" (overrides earlier hold).
- **Action**: `expo prebuild` + Gradle `assembleRelease` (JDK17, 4GB heap — OOM fix in `gradle.properties`). APK at `android/app/build/outputs/apk/release/app-release.apk` → installed on emulator, launched OK.

### master → main
- **Instruction**: "master should be the source of truth" + "push master to main".
- **Action**: `main` force-mirrored to `master` (both at `21b4497`); `origin/HEAD -> main`.

### Docs
- **Instruction**: "Save this in a file" / "go deeper" / "update the doc".
- **Action**: `docs/HOW_THE_APP_WORKS.md`, `docs/HOW_THE_APP_WORKS_DEEP_DIVE.md` (with security tier, .env scrub, branch state, build heap fix).

### Live/offline flicker
- **Instruction**: "the app is frequently switching live and offline mood why?"
- **Root cause**: `request()` flipped global connection state on EVERY call (no hysteresis).
- **Fix**: hysteresis (offline only after 3 consecutive fails); background calls (bugs, push-stats) marked `silent`. **Commit `832864f`.**
- **Correction**: "donot just rebuild frequently, build when I say." → saved rule: only build/push on explicit request.

### Remove online/offline indicator from customer app
- **Instruction**: "dont show, online offline at all in the app... if we implement robust admin panel in future then we can include the features there."
- **Action**: Removed LIVE/OFFLINE dot from Header + `ConnectionBanner` from Home (deleted component). Kept internal connection state for offline order re-sync. **Commit `fad7698`.**

### Cashback + free-tee + quantity (IN PROGRESS)
- **Instruction**: "dont show any extra features or offer like complementary gifty added, that you can [not] defend from source of truth from api of woocm" + "in product landing page there should be quantity selection option" + "cashback offer should also from woocom, because it is actual offer, acting like a discount, auto deducted from total order value but it shows as cashback."
- **Decisions**:
  - Free-tee gift (hardcoded, not from Woo) → REMOVE everywhere.
  - Cashback (real Woo coupon/discount) → KEEP, but source from gateway/Woo, not app-hardcoded.
  - Quantity selector → ADD on product page.
- **Action so far**: Gateway `calculateCashback()` + `GET /v1/deen/cashback?subtotal=` added (single source of truth). Next: app reads it; remove free-tee UI; add qty selector.

### Cashback + free-tee + quantity (DONE)
- **Instruction**: "dont show any extra features or offer like complementary gifty added, that you can [not] defend from source of truth from api of woocm" + "in product landing page there should be quantity selection option" + "cashback offer should also from woocom, because it is actual offer, acting like a discount, auto deducted from total order value but it shows as cashback."
- **Decisions**:
  - Free-tee gift (hardcoded, not from Woo) → REMOVED everywhere (product tag, bag gift card + summary row, complimentary-tee notification; `FreeTeeBanner` renamed `CashbackBanner`).
  - Cashback (real Woo coupon/discount) → KEEP, but sourced from gateway, not app-hardcoded.
  - Quantity selector → ADDED on product page (stepper, reset after add/buy).
- **Action**:
  - Gateway: `calculateCashback()` + `GET /v1/deen/cashback?subtotal=` (single source of truth, matches the Woo coupon the gateway builds at checkout).
  - App `gateway.ts`: `fetchCashback(subtotal)` (cached 30s, silent, offline-safe).
  - App `CartContext`: cashback now fetched from gateway (async state), removed `freeTeeEligible`/`freeTeeGap` hardcoded fields.
  - Product page: quantity stepper UI + `qty` state wired to addToCart/buyNow.
  - **Commit `a634ec1`.** (Not built/pushed to main per user rule: build only on explicit request.)
- **Note**: `INITIAL_BROADCASTS` bc_1 (DEEN20 promo) is still seed/demo data — a real promo code must exist in Woo to be valid; flagged for later (admin broadcasts should come from Woo/WP).

### Save every prompt+answer
- **Instruction**: "what we do every prompt and your answer should be save in somwhere"
- **Action**: Created `docs/SESSION_LOG.md`; appends each exchange. Each prompt → action/answer recorded here.

