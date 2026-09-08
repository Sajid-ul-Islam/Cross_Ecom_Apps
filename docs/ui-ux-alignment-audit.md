# UI/UX Alignment Audit — AGENTS.md §1, §3, §7

Audited: 2026-09-07 · Scope: `apps/mobile` (Expo), `apps/web` (Next.js) against the mandatory rules in root `AGENTS.md` (§1 Operational, §3 UI/UX & Accessibility, §7 Web ⇄ Mobile Parity). Evidence = file:line references, verified by grep/reading source.

**Verdict: ~99% aligned.** All 3 violations + P1 + P3 FIXED (2026-09-07); 1 partial gap remains (P2), several conforming areas worth protecting.

---

## ✅ Conforming (no action needed)

| Rule | Evidence |
| :--- | :--- |
| §3.1 Dark palette `#0D111A` / `#161C2A` / `#F4F6FC` / `#B2BBD4` / `#8C96B2` | `apps/mobile/src/theme/colors.ts` (DarkColors) — exact match. Web `apps/web/app/globals.css` uses identical hex (`--bg:#0d111a`, `--ink:#f4f6fc`…) |
| §3.1 Dynamic tokens, never static `Colors.*` | Zero matches for `Colors.<token>` usage in `apps/mobile` (static `Colors` import exists only as a fallback export, unused) |
| §3.2 Touch targets (web) | `.nav__icon-btn` 44×44, `.mobile-tab-btn` min-height 44px (`globals.css:324,795`) |
| §3.3 Screen-reader semantics | 39 `accessibilityRole` uses in mobile; 47 `aria-label` in web; status/live roles present |
| §3.4 COD/Prepaid CTA microcopy | Mobile `checkout.tsx:962-963` and Web `checkout/page.tsx:1213-1239` — both emit `PLACE CASH ON DELIVERY ORDER · ৳…` / `PROCEED TO PAYMENT · ৳…` |
| §3.4 Inline BD phone validation | Both apps use the identical regex `/^01[3-9]\d{8}$/` with inline ✓/✗ hints (mobile `checkout.tsx:416-429`, web `checkout/page.tsx:320,638`) |
| §1.3 64 districts, official `BD-XX` codes | `apps/mobile/src/data/districts.ts` and `apps/web/lib/districts.ts` are **byte-identical**: 64 districts + Dhaka city, same 123 `BD-XX` occurrences |
| §7.3 Campaign sync | Both apps fetch `GET /v1/deen/campaigns` (mobile `gateway.ts:1556`, web `api.ts:659`) and render the promo/cashback banner |
| §7.4 Segmented auth flows | `[ SIGN IN ]` / `[ CREATE ACCOUNT ]` segmented control in mobile `LoginModal.tsx:269-290` and web `profile/page.tsx:1242-1252` |
| §7.4 WhatsApp hotline | Same `wa.me/8801952700500` deep link on both apps (mobile `profile.tsx:480`, web `profile/page.tsx:640`) |
| §1.2 Pathao display rule | Both apps gate on `Boolean(order.pathaoConsignmentId)` and show **"Preparing Dispatch"** otherwise — mobile `orders.tsx:88-154`, `cart.tsx:81-132`, `RecentOrderPreview.tsx:52-55`; web `profile/page.tsx:851-861`, `OrdersLookupView.tsx:124-260`. Tracking link = `merchant.pathao.com/tracking?consignment_id=` on both |
| §7.2 Cart live badge | Mobile `tabBarBadge={totalItems}` (`(tabs)/_layout.tsx`), web `badge={totalItems}` (`MobileBottomNav.tsx`) |

---

## ✅ Resolved (fixed 2026-09-07)

### V1. §7.2 — Tab-bar contract reconciled: **Chat** is the 5th tab
- **Decision (user-confirmed):** codify the shipped layout — `[ 🏠 Home ] [ 🗂️ Categories ] [ 🛒 Cart (live badge) ] [ 💬 Chat ] [ 👤 Profile ]` — instead of restoring Orders to the bar.
- **Evidence:** AGENTS.md §7.2 now declares Chat as the 5th tab and explicitly forbids re-adding Orders to the tab bar; Orders stays reachable via Profile + order-success with live Pathao tracking (consistent with `docs/design-system.md` §5.2, which already listed Chat). `apps/mobile/app/(tabs)/_layout.tsx` and `apps/web/components/MobileBottomNav.tsx` already matched this contract — no nav code change required.

### V2. §3.2 — Header icon buttons raised to 44×44 dp
- `apps/mobile/src/components/Header.tsx` — `iconButton`, `notifButton`, `bagButton` now `width: 44, height: 44, borderRadius: 22` (was 38/38/19). hitSlop 10 retained for the glyph gap, so the visual pressed ring and touch target are both ≥ 44 dp.

### V3. §3.2 — Full interactive-icon sweep completed
- **12 modal close buttons raised 36 → 44 dp** (`AboutModal`, `AdminBroadcastModal`, `CourierTrackingModal`, `DailyRewardsModal`, `DenimCareGuideModal`, `GiftCardModal`, `NotificationModal`, `ProductReviewsModal`, `ReturnExchangeModal`, `SizeGuideModal`, `StoreStockModal`, `WishlistModal` — `closeBtn` now 44/44/r22).
- **PDP chips raised to 44 dp:** `product/[id].tsx` `wishlistBtn` 36→44 (r18→22) and `qtyBtn` 38→44; `ImageLightboxModal` `iconBtn` 40→44 (r20→22).
- **Text ✕ close buttons** in `profile/ContactDetailsForm.tsx` (district + address modals) gained `hitSlop {10,10,10,10}`.
- **Audited & left as compliant** (already ≥ 44 effective via hitSlop): ProductCard `heartBtn` (32+10), NavBar `iconBtn`/`bagBtn` (36+10), checkout back `iconBtn` (36+10), LoginModal & AdminCustomersModal close (34+8), ProfileDrawerModal & SocialReelModal close (32+10/12), FestivalGreetingModal close (28+10), AiConcierge/SocialAuth close (padding +10). Decorative inner circles (Banner chips, `ordersIconCircle`, `menuItemIcon`, `iconCircle`, `riderAvatar`) are inside larger pressable rows and are not targets.

---

## ⚠️ Partial gaps (fix or document as accepted)

### P1. §7.1 — Delivery fee display parity — ✅ RESOLVED (2026-09-07)
- **Correction to earlier audit claim:** the "express" tier is NOT phantom. `dhaka_express` is a real, customer-selectable delivery option in both apps (mobile `DELIVERY_OPTIONS.dhaka_express`, badge FASTEST) and the gateway genuinely charges it (`/v1/deen/orders` + `/v1/deen/pricing` price `dhaka_express` = inside-Dhaka flat rate + `EXPRESS_SURCHARGE`, default 70; method title "Express Home Delivery"). The actual defect was **web-only hardcoding with a stale rate**: web checkout/cart listed Express at ৳110 while the server charges ৳120, and neither web page fetched live fees at all (mobile's CartContext already does via `/v1/deen/pricing`).
- **Fix applied:**
  - API `GET /v1/deen/shipping` (`routes.ts`) now returns `fees.express` = inside-Dhaka + `config.expressSurcharge`, making it the complete live fee source.
  - Web `lib/api.ts` `fetchDeliveryFees()` switched from a POST to `/v1/deen/pricing` to a `GET /v1/deen/shipping` (falls back to gateway-default costs only when the API is unreachable).
  - Web checkout `checkout/page.tsx`: static `DELIVERY_OPTIONS` table → `DELIVERY_OPTION_META` (metadata only) + live `deliveryOptions` built from `fetchDeliveryFees()` on mount; stale ৳110 gone; admin Woo-zone / surcharge edits now propagate with no rebuild.
  - Web cart `cart/page.tsx`: same treatment (metadata list + live `feeFor()` map); all hardcoded fees removed.
- Remaining web fee flows are unaffected: PDP estimate + order placement already use the gateway, and the server recomputes the authoritative delivery charge on `/v1/deen/orders` regardless of client display.

### P2. §3.2 — Web floating buy-bar / PDP buttons not verified ≥44px
- `ProductDetailClient.tsx` styles the mobile floating buy bar via CSS; only some elements carry explicit 44px sizing. Needs a one-pass CSS audit (`.mobile-floating-buy-bar` children).

### P3. §3.3 — Status live-region parity — ✅ RESOLVED (2026-09-07)
- Web had zero `aria-live` / `role="status"` regions; mobile announces the per-card delivery state via `accessibilityLiveRegion="polite"` (`orders.tsx` "Preparing Dispatch" pill).
- **Fix applied:** `role="status"` + `aria-live="polite"` added to the three async order-status surfaces on web:
  - `OrdersLookupView.tsx` — "Preparing Dispatch at Central Studio" status line in each looked-up order card (content arrives after the async lookup fetch).
  - `app/profile/page.tsx` — order status pill (`status-pill`) and the "Preparing Dispatch" fallback in the profile recent-orders drawer (async orders fetch).
  - `PathaoTrackingModal.tsx` — the courier status line (`data.summary || data.status`), which populates after the async `fetchPathaoTracking` resolves.
- Screen-reader users now hear polite announcements when a looked-up order list loads, a profile order status refreshes, or Pathao live-timeline data returns.

---

## Notes
- §7.2 five-tab rule reconciled in AGENTS.md (Chat codified, Orders de-tabbed) — resolved 2026-09-07. `apps/web/tsconfig.tsbuildinfo` is tracked in git but is build noise; consider ignoring it.
