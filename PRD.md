# Product Requirements Document (PRD) — DEEN Commerce

**Project Name:** DEEN Commerce — Cross-Platform E-commerce Monorepo  
**Brand:** DEEN (Bangladesh's Artisanal Raw Selvedge Denim & Contemporary Apparel)  
**Authoritative Tech Stack:** Next.js 14 App Router (`apps/web`), Expo SDK 57 React Native (`apps/mobile`), Fastify 4.x Gateway (`apps/api`)  
**Backend:** WordPress + WooCommerce REST API v3 (`https://deencommerce.com`)  
**Status:** Production-Ready  

---

## 1. Executive Summary & Product Vision

DEEN Commerce is an omnichannel, high-concurrency retail platform engineered to provide a luxurious, blisteringly fast shopping experience across Bangladesh. The platform unifies a native mobile app (iOS & Android via Expo SDK 57) and an editorial Next.js 14 web storefront with 100% mobile feature parity, connected via a resilient Fastify caching gateway and an upstream WooCommerce cluster.

### Core Strategic Goals:
1. **Frictionless Mobile-First Commerce**: Ultra-fast shopping bag interactions with hybrid stock-aware quick add, 1-click checkout, and full 64 Bangladesh district delivery calculation.
2. **Dual Conversational Commerce**:
   - **Enterprise AI Concierge (`/v1/deen/ai/chat`)**: RAG-powered style recommendations, denim care guides, and showroom locations.
   - **Deterministic Multilingual Chatbot (`/api/bot`)**: Zero-hallucination, zero-LLM rule-based assistant supporting Bangla, Banglish, and English for conversational ordering and order lookups.
3. **Logistics Transparency**: Real-time integration with Pathao Logistics, displaying live milestone consignment tracking and 7-day doorstep size exchanges.
4. **Resilient High-Traffic Infrastructure**: Multi-tier rate limiting, memory-bounded idempotency, and in-memory catalog caching to withstand flash-sale traffic spikes.

---

## 2. Target Market & User Personas

| Persona | Demographics | Primary Need | Platform Preference |
| :--- | :--- | :--- | :--- |
| **The Denim Enthusiast** | 20–35, Dhaka / Chittagong | Heavyweight Japanese raw selvedge, authentic fading guides, size fit accuracy | Native Mobile App (iOS / Android) |
| **The Festive Shopper** | 22–45, Nationwide (64 Districts) | Dobby cotton panjabis, Cuban collar shirts, Cash on Delivery (COD) assurance | Mobile Web (`apps/web` on mobile viewports) |
| **The Casual Browser** | 18–30, Metro hubs | Quick Add to bag, social video reels inspiration, instant WhatsApp / Bot inquiry | Desktop Web & Mobile Web |

---

## 3. Product Architecture & Navigation Standard

Both Web Mobile View and Native Mobile App enforce the **5 Standard Navigation Tabs**:
```
[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]
```
- Orders is deliberately located inside **Profile** and the **Order Success** screen to reserve the high-value 4th tab for **Live Concierge & Shopping Assistance**.

---

## 4. Feature Specifications & Requirements

### 4.1. Catalog & Category-Wise Presentation
- **Dynamic Grouping**: Categories (Jeans, Half Shirts, Cuban Collar, Panjabi, Accessories) showcase authentic brand cover photography, titles, and descriptions.
- **Stock-Aware Filtering**: Products marked as `outofstock` or draft in WooCommerce are automatically hidden from customer-facing discovery.
- **Size Spec Modals**: Interactive sizing charts (Inches & CM) for waist, chest, length, and sleeve measurements.

### 4.2. Hybrid Quick Add & Size Selection
- **Single-Stock Products**: If a product has only 1 size in stock (or is One-Size / `OS`), tapping "Quick Add" immediately increments the bag and displays a temporary "Added" confirmation.
- **Multi-Size Products**: If multiple sizes are available, tapping "Quick Add" opens a lightweight bottom sheet (`QuickAddBottomSheet` on Mobile / `QuickAddModal` on Web) displaying only available in-stock sizes.
- **Zero Accidental Out-of-Stock Orders**: Unavailable sizes are disabled with strike-through styling.

### 4.3. Shopping Cart & Dynamic Pricing Rules
- **Live BDT Currency**: Formatted consistently with Bengali/Latin currency standards (`৳` symbol).
- **Automated Promotional Campaigns**:
  - **Instant Cashback**: `৳0` under ৳2,500 subtotal, `৳500` for ৳2,500–৳2,999, `৳700` for ৳3,000+ subtotals.
  - **BOGO 50% Off**: Automatically applies 50% discount to the lowest-priced denim item when 2+ jeans are in the cart.
  - **Free Tank Top**: Automatically triggers when the order subtotal reaches the qualifying campaign threshold.

### 4.4. 64-District Checkout & Delivery Engine
- **Full Bangladesh Coverage**: Standardized dropdown selector mapping all 64 districts to official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, `BD-58` Sylhet, etc.).
- **Dynamic Delivery Charges**:
  - Dhaka Metro Standard: **৳50**
  - Outside Dhaka (all 63 districts): **৳90**
  - Store Pickup (Mirpur, Wari, Cumilla, Sylhet): **৳0**
- **Bangladeshi Phone Validation**: Inline verification enforcing 11-digit mobile format (`01[3-9]\d{8}`).
- **Payment Modes**:
  - Cash on Delivery (`cod`) with explicit CTA: `PLACE CASH ON DELIVERY ORDER · ৳...`
  - Prepaid (bKash, Nagad, Card / SSLCommerz) with explicit CTA: `PROCEED TO PAYMENT · ৳...`

### 4.5. Live Pathao Logistics Tracking
- **Consignment Linking**: Orders with real `ptc_consignment_id` render a visual milestone stepper and clickable tracking link (`https://merchant.pathao.com/tracking?consignment_id=...`).
- **Unassigned Orders**: Display "Preparing Dispatch" without faked or placeholder consignment numbers.

### 4.6. Dual Conversational Engines

#### Engine A: Fastify Gateway AI Concierge (`/v1/deen/ai/chat`)
- RAG architecture connected to live catalog snapshots, showroom location database, exchange policies, and WhatsApp escalation.

#### Engine B: Multilingual Deterministic E-Commerce Chatbot (`/api/bot`)
- **Strict Constraint**: Zero LLM / Zero External AI.
- **Trilingual Comprehension**: Native support for **Bangla (`bn`)**, **English (`en`)**, and **Banglish (`banglish`)**.
- **Finite State Machine**:
  - Conversational Ordering: `ORDER_PRODUCT ➔ ORDER_SIZE ➔ ORDER_QTY ➔ ORDER_PHONE ➔ ORDER_ADDRESS ➔ ORDER_CONFIRM ➔ IDLE`
  - Status Lookup: `STATUS_PHONE ➔ STATUS_ORDERNO ➔ STATUS_FOUND / NOT_FOUND ➔ IDLE`
- **Fuzzy Search & Synonyms**: Fuse.js fuzzy index with category apparel dictionary (`synonyms.json`) expanding terms like `sharter dam koto` ➔ `shirt`.

### 4.7. Customer Executive KPI Dashboard
- Customer profile calculates live lifetime metrics from WooCommerce order history:
  - Total Spend (৳)
  - Total Items Bought
  - Completed Orders Count
  - Active Returns & Size Exchanges

---

## 5. Non-Functional & SLA Requirements

| Metric | Target SLA | Implementation Mechanism |
| :--- | :--- | :--- |
| **Chatbot Bot Turn Latency** | $< 15\text{ms}$ | 100% in-memory rule engine + regex + Fuse.js (zero network LLM hops) |
| **Catalog Flash-Sale Protection** | $95\%+$ cache hit | Fastify in-memory catalog cache with single-flight warming |
| **Order Idempotency** | Zero duplicates | In-flight promise deduplication + 5-minute memory-bounded idempotency keys |
| **Accessibility & Contrast** | WCAG 2.2 AA ($\ge 4.5:1$) | AMOLED dark surfaces (`#000000`, `#101010`) paired with high-contrast typography |
| **Touch Target Area** | $\ge 44 \times 44\text{ dp}$ | Visual button sizing + hit-slop expansion |
| **Type Safety** | 0 errors | Monorepo verification via `npm run typecheck:all` |
