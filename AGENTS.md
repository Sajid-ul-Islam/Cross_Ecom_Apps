# Workspace Guidelines & E-commerce Rules

This codebase contains:
- `apps/api`: Fastify Gateway Server connected to WooCommerce (`https://deencommerce.com`)
- `apps/mobile`: Expo / React Native App (Android/iOS)
- `apps/web`: Next.js 14 App (Full-fledged E-commerce Web Frontend)

---

## 1. WooCommerce & Logistics Operational Rules

1. **Order Placement Standards**:
   - Order creation must always include `city`, `state` (from the 64 Bangladesh districts with official `BD-XX` WooCommerce state codes), `postcode`, and `country: "BD"` in both `billing` and `shipping`.
   - Include `shipping_lines` with delivery charge: `৳50` for Dhaka, `৳90` for Outside Dhaka, `৳0` for Store Pickup.
   - For COD (`cod`), `payment_method_title` is `Cash on Delivery (COD)` with `set_paid: false`.

2. **Pathao Logistics Tracking**:
   - Pathao consignment IDs are NOT auto-generated or faked on new orders.
   - When a real `ptc_consignment_id` (e.g. `DD220826MDKMP9`) is attached to an order (from Pathao/WooCommerce), resolve `pathaoConsignmentId` and live tracking link `https://merchant.pathao.com/tracking?consignment_id={consignment_id}`.
   - Display Pathao Consignment ID and clickable tracking link on Order Confirmation, My Orders, and Profile screens only when `pathaoConsignmentId` is present. Otherwise, show "Preparing Dispatch".

3. **64 District Selection**:
   - Both Web and Mobile checkout forms provide full 64 Bangladesh districts dropdown/modal selection with official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).

---

## 2. Infrastructure, Gateway & High-Traffic Rules (`apps/api`)

1. **Edge Load-Balancer & Keep-Alive Alignment**:
   - Always maintain `app.server.keepAliveTimeout = 65_000` and `app.server.headersTimeout = 66_000` to exceed cloud reverse proxy timeouts (Render/Cloudflare 60s) and eliminate `502 Bad Gateway` / socket reset races.
   - Enforce `bodyLimit: 524_288` (512 KB) on Fastify to prevent memory ballooning from oversized requests.

2. **Multi-Tier Rate Limiting with Memory Bounding**:
   - **Auth / Login endpoints**: `10 req/min/IP`.
   - **Order Creation (`POST /v1/deen/orders`)**: `6 req/min/IP`.
   - **Public Catalog browsing**: `120 req/min/IP`.
   - Always implement store pruning (`_pruneExpired` on maps $> 10,000$ entries) to prevent Node.js heap memory leaks under high concurrency.

3. **Retry Storm Prevention & Jitter (`woo.ts`)**:
   - Upstream calls against WordPress/WooCommerce must use randomized exponential backoff:
     $$\text{delay} = 200\text{ms} \times 2^{\text{attempt}} + \text{random}(0, 150\text{ms})$$
   - Cap upstream retries at `MAX_RETRIES = 2` with `TIMEOUT_MS = 6000` so Fastify handles degradation *before* mobile client 8s abort timers trip.

4. **In-Memory Catalog Caching**:
   - Protect WordPress from flash-sale read traffic by serving 95%+ of catalog queries from Fastify in-memory cache (5-minute TTL with `catalogWarming` single-flight protection).

---

## 3. UI/UX, Design System & Accessibility (WCAG 2.2 AA) Rules

1. **Dark & Light Mode Contrast**:
   - Dark mode backgrounds (`#0D111A`, `#161C2A`) must always pair with bright, high-contrast typography (`#F4F6FC` primary, `#B2BBD4` secondary, `#8C96B2` tertiary) achieving $\ge 4.5:1$ (WCAG AA).
   - Never import static `Colors.*` tokens in stylesheets. Always use dynamic `useTheme()` tokens.

2. **Touch Targets & Hit Slop ($\ge 44\text{ dp}$)**:
   - All interactive icons (Search, Bag, Notifications, Back arrows, Heart chips) must maintain minimum $44 \times 44\text{ dp}$ touch areas using `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`.

3. **Screen Reader & Semantics**:
   - Interactive SVG icon buttons must declare `accessibilityRole="button"` and descriptive `accessibilityLabel`.
   - Status indicators must use `accessibilityRole="status"` with polite live updates.

4. **Action-Oriented Microcopy & Error Prevention**:
   - Checkout CTAs must clearly reflect the payment mode:
     - For COD: `PLACE CASH ON DELIVERY ORDER · ৳...`
     - For Prepaid: `PROCEED TO PAYMENT · ৳...`
   - Validate 11-digit Bangladeshi mobile numbers (`01XXXXXXXXX`) and delivery addresses inline before submission.
