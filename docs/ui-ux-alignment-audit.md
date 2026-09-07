# UI/UX Alignment Audit — AGENTS.md §1, §3, §7

Audited: 2026-09-07 · Scope: `apps/mobile` (Expo), `apps/web` (Next.js) against the mandatory rules in root `AGENTS.md` (§1 Operational, §3 UI/UX & Accessibility, §7 Web ⇄ Mobile Parity). Evidence = file:line references, verified by grep/reading source.

**Verdict: ~85% aligned.** 3 confirmed violations, 3 partial gaps, several conforming areas worth protecting.

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

## ❌ Violations (must fix)

### V1. §7.2 — Tab bars diverge: web has no "Orders" tab
- **Rule:** both apps declare `[ 🏠 Home ] [ 🗂️ Categories ] [ 🛒 Cart ] [ 📦 Orders ] [ 👤 Profile ]`.
- **Mobile:** Home · Categories · Cart · **Chat** · Profile — and `orders` is registered with `href: null` (hidden from the bar, reachable elsewhere).
- **Web (`MobileBottomNav.tsx`):** Home · Categories · Cart · **Chat** (action button) · Profile — Orders tab is missing entirely.
- **Impact:** the 5-tab contract is violated on both platforms in the same way (Chat replaced Orders). Orders remain reachable via profile/CTAs, so this is a deliberate design drift — but it contradicts AGENTS.md §7.2 verbatim.
- **Fix options:** (a) update AGENTS.md to codify Chat as the 5th tab (recommended — matches shipped UX), or (b) restore Orders as the 4th/5th tab on both.

### V2. §3.2 — Mobile header icon buttons are 38×38 dp (< 44 minimum)
- `apps/mobile/src/components/Header.tsx:213-225` — `iconButton`/`notifButton` are `width: 38, height: 38` with `hitSlop={{10,10,10,10}}`. Effective touch area = 58×58 **only in the slop zone**, which does not render the pressed/focus ring; WCAG 2.2 AA (2.5.8) and the AGENTS rule require the visual target ≥ 44 dp. Icon glyph is 20 dp.
- Also affects any screen reusing `styles.iconButton` from Header.
- **Fix:** raise to `width: 44, height: 44, borderRadius: 22` (keep hitSlop for the glyph gap).

### V3. §3.2 — Touch-target rule is applied inconsistently across mobile
- Only 43 `hitSlop` occurrences across ~40 screen/component files; several interactive icon chips (e.g. PDP heart chip variants, modal close buttons in some modals) have no hitSlop and no ≥44 box. A full sweep is needed; Header (V2) is the highest-traffic instance.

---

## ⚠️ Partial gaps (fix or document as accepted)

### P1. §7.1 — Delivery fee display parity
- Fees are single-sourced in the gateway (`getShippingFees()` → Woo zones, fallback ৳50/৳90/৳0 — `apps/api/src/woo.ts:918-938`) ✔.
- Mobile checkout renders fees from `DELIVERY_OPTIONS` in `gateway.ts` ✔.
- Web `checkout/page.tsx:35` **hardcodes its own `DELIVERY_OPTIONS` table** and `lib/api.ts:504` hardcodes a fallback `{50, 90, 120, 0}` including an "express 120" tier that exists nowhere else. If an admin changes a Woo shipping zone, mobile follows but web keeps stale numbers until its fetch resolves, and the phantom express tier can render.
- **Fix:** web should consume `GET /v1/deen/shipping` like mobile does, and drop the express tier or add it to the gateway contract.

### P2. §3.2 — Web floating buy-bar / PDP buttons not verified ≥44px
- `ProductDetailClient.tsx` styles the mobile floating buy bar via CSS; only some elements carry explicit 44px sizing. Needs a one-pass CSS audit (`.mobile-floating-buy-bar` children).

### P3. §3.3 — Status live-region parity
- Mobile uses `accessibilityRole="status"` in places; web has no `aria-live` region for order-status toasts (search found none). Screen-reader users on web won't hear async status updates.

---

## Notes
- The §7.2 five-tab rule text and the shipped Chat-tab UX should be reconciled **in AGENTS.md first**, then both apps — otherwise every future agent will "fix" the working nav.
- `apps/web/tsconfig.tsbuildinfo` is tracked in git but is build noise; consider ignoring it.
