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

### Jeans fit: verify per-fit size chart (CORRECTED - fit source found)
- **Key discovery**: user updated `.env` keys; direct Woo to `deencommerce.bd` 401'd. User clarified key is for `https://deencommerce.com/`. Re-queried `.com` → 200 OK. **The real store is `deencommerce.com`** (gateway `config.woo.site` already defaults to `.com` ✓).
- **Fit is a Woo CATEGORY, not a `pa_fit` attribute.** Three fit categories exist: SLIM FIT (11 products), REGULAR FIT (5), STRAIGHT FIT (2). Product names like "High-End Raw Washed Jeans - Slim Fit". No per-fit size-chart data in Woo meta (only FB-catalog junk).
- **Fix (commit `683a29c`)**: `getFit()` now derives fit from the product CATEGORY name (regex `(\w+)\s*fit` → "Slim"/"Regular"/"Straight"), not an attribute. `mapWooToDeen` already returns `fit`; flows to app `Product.fit` → `SizeGuideModal.resolveJeansChart(fit)`.
- **REMAINING**: `FIT_CHARTS.regular/slim/straight` currently all = generic `JEANS_CHART` (placeholder). Woo has NO per-fit measurement tables → they are the brand's spec. **Need user to paste real per-fit tables (waist/hip/thigh/leg-opening per size) to populate.** Must not invent.
- **Flag**: ensure Render env `WOO_SITE` = `https://deencommerce.com` (not `.bd`) after redeploy, else gateway 401s with the new key. Live gateway currently "Service Suspended" on Render.


- **Instruction**: "there is three type of jenas, Ragular, slim, and Stright fit, and there size chart is notrt same, now verify it in the app, is shoing it correctly?"
- **Verification finding (BEFORE fix)**: app was NOT correct. `SizeGuideModal` had ONE hardcoded `JEANS_CHART` and branched only by `category` — no `fit` dimension. `Product` type had no `fit` field. Modal called with only `category`. So Regular/Slim/Straight all showed the SAME generic chart.
- **User confirmed**: "fit" IS already a WooCommerce attribute on jeans products.
- **Fix (commit `e68f753`)**:
  - Gateway `woo.ts`: `getFit()` extracts the Woo "fit" attribute (matches "fit" in attr name → covers "Fit"/"pa_fit"/"Fit Type"); `mapWooToDeen` now returns `fit`.
  - Gateway `seed.ts`: `DeenProduct.fit?` added.
  - Mobile `types/index.ts`: `Product.fit?` added.
  - Mobile `SizeGuideModal`: new `fit` prop + `FIT_CHARTS` map + `resolveJeansChart(fit)` selects per-fit chart; subtitle shows "X Fit · Raw Selvedge Denim Sizing".
  - Product page passes `fit={product.fit}` to the modal.
  - Gateway returns `DeenProduct` JSON directly as `Product` (no mapProduct), so `fit` flows automatically — no mobile gateway mapping needed.
- **REMAINING**: `FIT_CHARTS.regular/slim/straight` currently all = `JEANS_CHART` (placeholder). Need the REAL per-fit measurement tables (waist/hip/thigh/leg-opening per size) from the brand spec to populate. Must NOT invent numbers (source-of-truth rule). Will drop in real tables when user provides. After that, redeploy gateway + rebuild APK to see live.
- **Note**: local `.env` Woo keys are stale (direct Woo call 401'd); live gateway uses Render keys. Could not hit Woo directly to confirm exact attribute slug, but `getFit` matches by substring "fit" so it's robust.

- **Instruction**: "what we do every prompt and your answer should be save in somwhere"
- **Action**: Created `docs/SESSION_LOG.md`; appends each exchange. Each prompt → action/answer recorded here.

### Real Woo order number shown to customer (DONE + verified live)
- **Instruction**: "if the order placed customer should get real order number that generated in woocommerce. show it to customer not demo"
- **Finding**: gateway created a REAL Woo order (`pushWooOrder`) but only captured `id`, so `order.number` was the gateway's own `DC-NNN` sequence — NOT the Woo number. Customer saw `DC-5`, not the store's `#204639`.
- **Fix** (commit `87ca891`, typecheck clean):
  - `woo.ts pushWooOrder` returns `{ id, number }` (Woo's real `number`).
  - `routes.ts`: capture `wooNumber` on order object; push notification + response use `wooNumber || number`.
  - `checkout.tsx`: pass `orderNumber: created.wooNumber || created.number` + `gatewayRef: created.number`.
  - `order-success.tsx`: shows real Woo `#` as primary; `DC-` app ref as secondary "APP REFERENCE" line.
  - `types/index.ts Order`: added `wooNumber?`.
  - `orders.tsx` + `profile.tsx`: show `#wooNumber` primary, app `DC-` ref as badge.
- **Verification**: started gateway locally (port 8807), tested Woo orders API directly → Woo returned `{"id":204639,"number":"204639"}`. Then trashed the test order (cleanup). CONFIRMED real number flows.
- **Note**: user said Render suspended → use local `.env` for testing (deencommerce.com). Done; gateway stopped after test.

### (b) Live emulator UX critique
- BLOCKED: Render gateway suspended. Plan: after unsuspend + redeploy, drive emulator, screenshot Home/PDP/Bag/Checkout/Profile/Orders, critique. Not done yet.

### (c) P0 UX enhancements
- Real Woo order number: DONE (above).
- Remaining P0 candidates (not yet done): order confirmation clarity, My Orders view (exists: orders.tsx), guest checkout, payment clarity at checkout (manual TrxID to 01952700500 — needs clear UI).


- **Instruction**: "how to add webhook?" then "there are many option product wise, order wise, and customer wise, how can I optimize the work?"
- **Action** (commit `d1c5f33`, typecheck clean):
  - `woo.ts`: `invalidateCatalogCache` + `invalidateVariationCache(productId?)` + `invalidateCoverCache` + `invalidateStats` + `wooPost` helper (exported `wooFetch` too).
  - `routes.ts`: `POST /v1/deen/webhook/woo` — verifies HMAC-SHA256 (`X-WC-Webhook-Signature`) against `config.webhookSecret`; **topic-aware** surgical bust (product.* → catalog+variation; product_variation.* → variation only; category.* → covers; order/customer.* → stats). Also added a raw-body stash via content-type parser for signature verification.
  - `routes.ts`: `POST /v1/deen/webhook/woo/register` — **auto-provisioner**: one call creates all webhooks in Woo via API (no WP Admin clicking), skips duplicates; `?full=1` adds category/order/customer topics.
  - `config.ts`: `webhookSecret` from `WEBHOOK_SECRET` env. `.env` got a generated secret (untracked); `.env.example` documented.
  - `docs/WEBHOOK_SETUP.md` written.
- **Optimization answer to user**: subscribe ONLY to what changes customer-facing data — `product.*` + `product_variation.*` (7 topics) covers new products, price, discount, stock, size. `category.*` only if covers change often; `order.*`/`customer.*` only for admin stats (not customer UI). The register endpoint provisions exactly that set; `?full=1` for the rest. One endpoint handles ALL topics (reads `x-wc-webhook-topic`).
- **Setup after deploy**: set `WEBHOOK_SECRET` on Render, then `curl -X POST <gateway>/v1/deen/webhook/woo/register`.


- **Instruction**: "now how can I solev thi? for this time make a flog about it, so that we can fix it later but meanwhile we can focus on some real important features... find out what need be fix first"
- **Action**:
  - `docs/BLOG_JEANS_FIT_CHARTS.md` — parked issue (fit = Woo category; getFit fixed `683a29c`; blocked on brand's real per-fit tables; NOT a go-live blocker).
  - `docs/GO_LIVE_PLAN.md` — prioritized go-live audit from real code:
    - **P0**: (1) Reactivate Render gateway ("Service Suspended") + verify `WOO_SITE=https://deencommerce.com` + new keys; (2) prove real order reaches Woo; (3) secrets hygiene.
    - **P1**: payment model (currently MANUAL TrxID to `01952700500`, no bKash/Nagad keys → launch COD+manual, queue real gateway); signed release build (AAB/APK); prod hardening (remove demo broadcasts).
    - **P2**: per-fit charts (parked), push, admin panel, real payment gateway, multi-tenant.
  - **Commit `c52ec9f`** (docs).

## 2026-08-25

### WordPress wire-up + coupon input on checkout (built & verified)
- **Instruction**: explore what more can be wired to actual WordPress; build
  store-info, add what can be sourced from WP, and add a coupon input on the
  order page exactly like the website (customer may have a code written down).
- **Action** (commits `514e7b8`, `b6481da`):
  - Gateway: `getStoreSettings()` (Woo `settings/general`), `getPage(slug)`
    via new `wpFetch()` (wp/v2), `getCouponByCode()` (Woo `coupons`, expiry-aware),
    `GET /v1/deen/store-info`, `GET /v1/deen/page`, `GET /v1/deen/coupon`,
    order route + `/v1/deen/pricing` apply a customer coupon as a real Woo coupon.
    `config.contact` (STORE_HOTLINE/WHATSAPP/BKASH/EMAIL env).
  - Mobile: `StoreContext` (fetches store-info, `getPage`) wired in `_layout`;
    AboutModal + WhatsAppConciergeButton use store-info (no hardcoded numbers);
    checkout "Have a coupon?" input → validates vs Woo → applies discount →
    passes code to `placeOrder`; `Order.coupon/couponDiscount` types.
  - **Bug fix**: `getPage` was hitting `wc/v3/pages` (404) → added `wpFetch()`
    for `wp/v2`. Verified live: store-info, WP page content, coupon valid
    (`deen150`→৳150) + invalid→404, and coupon applied to an order total.
  - BOGO + Woo-sourced delivery + combos + Cart terminology rename landed in
    earlier commits this session (`6e3d786`, `328907e`): route `(tabs)/bag`→
    `cart`, tab "Cart", "Your Cart is Empty", "CONTINUE SHOPPING".

### Backend resilience & WordPress control-plane (R&D spec, NOT built)
- **Instruction**: suggest how to make it more real/reusable — API backup if
  Render is down, and WordPress as the source of truth where admin can dictate
  push notifications etc.
- **Action**: wrote `docs/BACKEND_RESILIENCE_AND_WP_CONTROL.md` (spec only).
  Key points: (1) gateway is stateful on ephemeral disk → need shared state
  (Supabase/Upstash/R2) + app-side gateway fallback list + keep-alive + 2nd
  deploy; (2) "you dictate from WP" = `POST /v1/deen/admin/broadcast` +
  `order.updated` webhook → customer push; (3) gateway already tenant-agnostic
  (config-driven) → reusable for another store. Open questions for owner in doc.

## 2026-08-25 (cont.)

### Woo-sized product images (thumb/single/full) — built
- **Instruction**: website images don't fit the app view; manage it. Use Woo
  images perfectly (same source), pick the right Woo size + frame it.
- **Action** (commit `f8c3713`): gateway `mapWooToDeen` now extracts Woo/WP
  image variants — `thumbnail` (grid), `woocommerce_single` (PDP), `src` (zoom)
  — into `DeenProduct.thumb/single/full` (all Woo-sourced, never hosted by app).
  Mobile: `ProductCard` uses `thumb` (fast + correct ratio) in the existing
  aspectRatio box; PDP gallery uses `single` while lightbox uses `full` (zoom
  quality). Seed updated. api + mobile typecheck clean.

### Build attempt — BLOCKED by EAS Free quota
- **Instruction**: "after that build the app."
- **Action**: `eas build -p android --profile preview` (APK, internal). EAS
  accepted upload, used remote Keystore (Build Credentials 7Dz6fIdpfn), computed
  fingerprint OK — but **failed at submission**: "This account has used its
  Android builds from the Free plan this month; resets Tue Sep 01 2026."
- **Local fallback not possible**: no Android SDK / Gradle / local keystore on
  this machine (signing lives on EAS).
- **Resolution**: either wait until Sep 01 2026 for quota reset, or upgrade the
  EAS plan (expo.dev/accounts/sajid.islam/settings/billing). Code is
  build-ready. No code change needed.

