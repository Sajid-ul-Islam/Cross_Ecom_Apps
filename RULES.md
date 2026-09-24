# Monorepo Engineering, Operational & Parity Rules

> **Status:** Mandatory Monorepo Rules  
> **Audience:** All Human Developers, Team Leads, and Autonomous AI Agents  
> **Zero Tolerance:** No PR or commit may violate these rules without explicit team consensus.

---

## 1. WooCommerce & Logistics Operational Rules

1. **Order Placement Data Integrity**:
   - Order creation payloads must always include `city`, `state` (from the 64 Bangladesh districts with official `BD-XX` WooCommerce state codes), `postcode`, and `country: "BD"` in both `billing` and `shipping`.
   - Include `shipping_lines` with standardized delivery charges:
     - **৳50** for Dhaka Metro Standard
     - **৳90** for Outside Dhaka (all 63 districts)
     - **৳0** for Store Pickup
   - For COD (`cod`), set `payment_method_title: "Cash on Delivery (COD)"` with `set_paid: false`.

2. **Pathao Logistics Tracking Integrity**:
   - Pathao consignment IDs are **NEVER** auto-generated or faked on new orders.
   - When a real `ptc_consignment_id` (e.g. `DD220826MDKMP9`) is attached to an order from Pathao/WooCommerce, resolve `pathaoConsignmentId` and generate the live tracking link:  
     `https://merchant.pathao.com/tracking?consignment_id={consignment_id}`
   - Render the live milestone stepper and tracking link only when `pathaoConsignmentId` is present. Otherwise, show `"Preparing Dispatch"`.

3. **64 District Selection**:
   - Both Web and Mobile checkout forms must provide the full 64 Bangladesh districts selection mapped to official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).

---

## 2. Infrastructure, Gateway & High-Traffic Rules (`apps/api`)

1. **Edge Load-Balancer & Keep-Alive Alignment**:
   - Always maintain `app.server.keepAliveTimeout = 65_000` and `app.server.headersTimeout = 66_000` to exceed cloud reverse proxy timeouts (Render/Cloudflare 60s) and eliminate `502 Bad Gateway` socket reset races.
   - Enforce `bodyLimit: 524_288` (512 KB) on Fastify to prevent memory ballooning from oversized requests.

2. **Multi-Tier Rate Limiting with Memory Bounding**:
   - **Auth / Login endpoints**: `10 req/min/IP`.
   - **Order Creation (`POST /v1/deen/orders`)**: `6 req/min/IP`.
   - **Public Catalog browsing**: `120 req/min/IP`.
   - Prune expired entries when sliding window maps exceed 10,000 keys to prevent Node.js heap leaks.

3. **Retry Storm Prevention & Jitter (`woo.ts`)**:
   - Upstream calls against WordPress/WooCommerce must use randomized exponential backoff:
     $$\text{delay} = 200\text{ms} \times 2^{\text{attempt}} + \text{random}(0, 150\text{ms})$$
   - Cap upstream retries at `MAX_RETRIES = 2` with `TIMEOUT_MS = 6000` so Fastify handles degradation before client timers abort.

4. **In-Memory Catalog Caching**:
   - Protect WordPress from flash-sale read traffic by serving 95%+ of catalog queries from Fastify in-memory cache (5-minute TTL with single-flight cache warming).

5. **Stateless HMAC Authentication Tokens**:
   - Session tokens are signed via HMAC-SHA256 with `SESSION_SIGNING_SECRET`.
   - Never mint a session from an unverified request-body email. OAuth tokens from Google / Facebook must prove client ownership (`aud` / `app_id` check) before provisioning customer sessions.

---

## 3. UI/UX, Design System & Accessibility Rules (WCAG 2.2 AA)

1. **Dark & Light Mode Contrast**:
   - Dark mode backgrounds (`#000000` true AMOLED black, `#101010` surface elevation) must pair with bright typography (`#FFFFFF` primary, `#A3A3A3` secondary) achieving contrast $\ge 4.5:1$.
   - Never hardcode static color hexes in component files. Always use dynamic theme tokens (`useTheme()` on Mobile / CSS variables on Web).

2. **Touch Targets & Hit Slop ($\ge 44\text{ dp}$)**:
   - All interactive icons (Search, Bag, Notifications, Back arrows, Heart toggles) must maintain minimum $44 \times 44\text{ dp}$ touch areas using `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`.

3. **Action-Oriented Checkout Microcopy**:
   - CTAs must reflect the selected payment mode:
     - For COD: `PLACE CASH ON DELIVERY ORDER · ৳...`
     - For Prepaid: `PROCEED TO PAYMENT · ৳...`

---

## 4. Mandatory Web & Mobile Parity Rules (`apps/web` ⇄ `apps/mobile`)

1. **Strict Feature & Layout Synchronization**:
   - The web app mobile view (`apps/web` on mobile viewports `< 768px`) must **exactly replicate the mobile app front view, layout, hierarchy, and functionality**.
   - **Any feature added to Mobile must simultaneously be implemented on Web, and vice-versa.**

2. **5 Standard Navigation Tabs**:
   - Both Web Mobile View and Native Mobile App declare the **5 standard navigation tabs**:
     `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]`
   - The Orders screen is deliberately located inside Profile and Order Success, reserving the 4th tab for Live Chat and Concierge.

3. **Hybrid Quick Add & Stock Guard**:
   - If a product has only 1 size in stock, Quick Add adds it directly to the bag.
   - If multiple sizes are available, Quick Add opens a stock-aware modal (`QuickAddModal` / `QuickAddBottomSheet`).
   - Out-of-stock sizes and products must never be visible as selectable options.

---

## 5. E-Commerce Chatbot Determinism Constraint (`apps/web`)

1. **Strictly Zero LLM**:
   - The conversational chatbot in `apps/web/lib/` must remain 100% rule-based and deterministic.
   - Under **no circumstances** may OpenAI, Gemini, Claude, or local LLM libraries be installed or invoked in this pipeline.

2. **Intent Priority Hierarchy**:
   $$\text{PLACE\_ORDER} > \text{ORDER\_STATUS} > \text{PRODUCT\_SEARCH} > \text{HUMAN\_HANDOFF} > \text{GREETING} > \text{UNKNOWN}$$

3. **Language Detection Standard**:
   - Bengali script Unicode `[\u0980-\u09FF]` ➔ `"bn"`
   - Distinct Banglish phonetic keywords (`koto`, `dam`, `chai`, `lagbe`, `vai`, `bolen`, etc.) ➔ `"banglish"`
   - Standard English grammar ➔ `"en"`

---

## 6. Monorepo Quality Gate

Before declaring any task complete or merging code into `master`:
1. `npm run typecheck:all` must report **0 errors** across all 3 workspaces.
2. `npm test` must pass all automated backend tests.
3. `npx tsx apps/web/lib/chatbot.test.ts` must pass all 25 chatbot tests.
