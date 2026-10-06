# Mobile Application Domain Rules (`apps/mobile`)

These rules apply to all native mobile development within `apps/mobile` (Expo / React Native).

---

## 1. UI/UX, Theme & WCAG 2.2 AA Contrast
- **AMOLED True Black**: Pair `#000000` (background) and `#101010` (surface elevation 1) with bright, high-contrast typography (`#FFFFFF` primary, `#A3A3A3` secondary, `#737373` tertiary) to maintain $\ge 4.5:1$ contrast ratio.
- **Dynamic Themes**: NEVER import static `Colors.*` tokens into stylesheets. Always consume dynamic theme tokens via `useTheme()`.

## 2. Touch Targets & Hit Areas (≥ 44 dp)
- All interactive icon buttons (Search, Bag, Notifications, Back arrows, Heart chips) must maintain minimum $44 \times 44\text{ dp}$ touch area using `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`.
- Standalone boxed icon buttons must visually be $\ge 44 \times 44\text{ dp}$.

## 3. Navigation Hierarchy
- Maintain the 5 primary tabs:
  `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]`
- Order history and tracking are accessible via the Profile screen and post-checkout success flows.

## 4. Checkout Validation & Logistics
- Full 64 Bangladesh district selector modal with WooCommerce state codes (`BD-XX`).
- Enforce 11-digit Bangladeshi mobile format (`01XXXXXXXXX`) with inline error feedback.
- Render live Pathao tracking links `https://merchant.pathao.com/tracking?consignment_id={consignment_id}` whenever `pathaoConsignmentId` exists.

## 5. Security & Ownership
- Customer profile updates and order lookups require authenticated user session matching account owner.
- Never hardcode administrative bypasses or mock order confirmations on failed payments.
