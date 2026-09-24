# DEEN Commerce — Web Storefront (`apps/web`)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**Full-fledged Next.js 14 E-commerce Web Storefront** for DEEN Commerce — Bangladesh's premier denim and dobby panjabi brand.

---

## 🌟 Key Features

- **SSR & Fast Edge Rendering**: Powered by Next.js 14 App Router for rapid page loads and high SEO rankings.
- **Full 64 Bangladesh Districts Checkout**: Integrated dropdown & modal selection supporting official WooCommerce BD state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).
- **Dynamic Delivery Charge Engine**:
  - Inside Dhaka: **৳50**
  - Outside Dhaka (all 63 districts): **৳90**
  - Store Pickup: **৳0**
- **Live Pathao Logistics Tracking**: Orders with `ptc_consignment_id` render real-time clickable Pathao tracking buttons (`https://merchant.pathao.com/tracking?consignment_id=...`).
- **Cart & Wishlist State Management**: Client-side reactive cart, coupon discount applications, item count badges, and persistent storage.
- **Multiple Payment Gateways**: Cash on Delivery (COD), bKash, and Card payments (SSLCommerz).
- **Modern Responsive Design**: Editorial aesthetics tailored for raw selvedge denim, premium panjabis, and menswear collections.

---

## 📂 Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx             # Root layout with fonts, metadata, and cart provider
│   ├── page.tsx               # Homepage with hero slider, featured collections & craft highlights
│   ├── globals.css            # Custom CSS design system, dark/light variables & animations
│   ├── shop/                  # Product catalog with category, size & price filtering
│   ├── product/[id]/          # Detailed product view with sizing, stock check & image gallery
│   ├── cart/                  # Shopping bag summary, coupon validator & checkout trigger
│   ├── checkout/              # 64 BD districts form, payment selection & live order placement
│   ├── orders/                # Customer order tracking & status lookup
│   └── order-success/         # Order confirmation with invoice summary & Pathao tracking
├── components/                # Reusable UI widgets (Header, Footer, ProductCard, CartDrawer)
├── lib/
│   ├── api.ts                 # Gateway REST client connecting to apps/api
│   ├── cart.tsx               # React Context for shopping cart state
│   └── districts.ts           # 64 Bangladesh districts & delivery charge calculators
└── public/                    # Static brand assets, badges, and icons
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in `apps/web/`:

```env
# Gateway API URL
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8807
NEXT_PUBLIC_API_KEY=deen_secret_gateway_key_2026

# Site Metadata
NEXT_PUBLIC_SITE_NAME="DEEN Commerce"
NEXT_PUBLIC_SITE_URL="https://deencommerce.com"
```

---

## 💻 Local Development

```bash
# Navigate to web directory
cd apps/web

# Install dependencies
npm install

# Run Next.js development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` in your browser.

---

## 🚀 Deployment

The Next.js storefront is ready for zero-config deployment on **Vercel**:
- Root directory: `apps/web` (or root using `vercel.json`)
- Framework Preset: `Next.js`
- Set `NEXT_PUBLIC_GATEWAY_URL` and `NEXT_PUBLIC_API_KEY` in Vercel Environment Settings.

---

## 🤖 Multilingual Rule-Based E-Commerce Chatbot

An ultra-reliable, production-grade conversational agent designed specifically for Bangladeshi WooCommerce stores.

> **CRITICAL ARCHITECTURAL CONSTRAINT: ZERO LLM / ZERO EXTERNAL AI**  
> Built with 100% deterministic logic: regular expressions, Banglish phonetic matching, multi-category synonym expansion, Fuse.js fuzzy matching, and a finite state-machine for multi-turn dialogs. No OpenAI, Claude, Gemini, or local models. Zero API fees, sub-10ms response times, zero hallucinations.

### 📐 Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 Next.js Frontend                                |
|  [ ChatWidget.tsx ] <--> [ ChatMessage.tsx ] + [ QuickReplies.tsx ]             |
|                                       │                                         |
|                                       ▼ POST /api/bot                           |
+---------------------------------------------------------------------------------+
                                        │
                                        ▼
+---------------------------------------------------------------------------------+
|                           Rule-Based Bot Engine (/lib)                          |
|                                                                                 |
| 1. Rate Limiter (20 req/min/IP)                                                 |
| 2. Session Store (Map + SessionStore adapter interface, 30m TTL, bounded LRU)   |
| 3. Normalizer (Bengali digits ০-৯ ➔ 0-9, trim, whitespace collapse)             |
| 4. Language Detector (bn [U+0980-U+09FF] | banglish [phonetic dict] | en)       |
|                                                                                 |
|                                ┌───────────────┐                                |
|                                │ Active State? │                                |
|                                └───────┬───────┘                                |
|                        Yes             │            No                          |
|            ┌───────────────────────────┴───────────────────────────┐            |
|            ▼                                                       ▼            |
|   [ Multi-Turn State Machine ]                           [ Intent Classifier ]  |
|   • ORDER_PRODUCT ➔ ORDER_SIZE                           • PLACE_ORDER (1.0)    |
|     ➔ ORDER_QTY ➔ ORDER_PHONE                            • ORDER_STATUS (1.0)   |
|     ➔ ORDER_ADDRESS ➔ CONFIRM                            • PRODUCT_SEARCH (0.7) |
|   • STATUS_PHONE ➔ STATUS_ORDERNO                        • HUMAN_HANDOFF (0.7)  |
|                                                          • GREETING (0.7)       |
|                                                          • UNKNOWN (0.0)        |
|                                                                    │            |
|                                                                    ▼            |
|                                                          [ Route to Flow ]      |
+---------------------------------------------------------------------------------+
         │                                      │                     │
         ▼                                      ▼                     ▼
+--------------------+                +--------------------+  +-------------------+
|  Synonym Expander  |                |   Fuse.js Search   |  | WooCommerce REST  |
|  (synonyms.json)   | ─────────────> |  (productMatch.ts) |  |   API v3 (woo.ts) |
|  Banglish/Bangla   |                |  Threshold: 0.45   |  |   Basic Auth      |
+--------------------+                +--------------------+  +-------------------+
```

---

### ⚙️ Environment Configuration (`.env.local`)

Add the following variables to `apps/web/.env.local`:

```env
# WooCommerce REST API v3 Credentials
WOO_URL=https://deencommerce.com/wp-json/wc/v3
WOO_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOO_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Bot Store Branding
NEXT_PUBLIC_STORE_NAME="DEEN Commerce"
```

---

### 🔑 Obtaining WooCommerce REST API Keys

1. Log into your WordPress Admin Dashboard (`/wp-admin`).
2. Go to **WooCommerce** ➔ **Settings** ➔ **Advanced** ➔ **REST API**.
3. Click **Add key** (or **Create an API key**).
4. Enter the details:
   - **Description**: `DEEN Next.js Chatbot`
   - **User**: Select an admin or shop manager user account.
   - **Permissions**: `Read/Write` (Required to create orders and look up order statuses).
5. Click **Generate API key**.
6. Copy the **Consumer Key** (`ck_...`) to `WOO_KEY` and **Consumer Secret** (`cs_...`) to `WOO_SECRET` in `.env.local`.

---

### 🧪 Automated Testing & Verification

The chatbot engine includes an automated test suite verifying all 6 intents, Bengali digit normalization, phonetic Banglish detection, entity extraction, session timeouts, and multi-turn state machines.

```bash
# Run chatbot test suite
npx tsx apps/web/lib/chatbot.test.ts

# Run entire monorepo typecheck
npm run typecheck:all
```

#### Verification Checklist Cases:

| Language | Test Phrase | Expected Intent / Behavior |
| :--- | :--- | :--- |
| **Bangla** | `"হ্যালো"` | `GREETING` |
| **Bangla** | `"শার্টের দাম কত?"` | `PRODUCT_SEARCH` |
| **Bangla** | `"আমি একটা শার্ট অর্ডার করতে চাই"` | `PLACE_ORDER` (starts dialog) |
| **Bangla** | `"০১৭১২৩৪৫৬৭৮"` | Entity extraction (`phone: "01712345678"`) |
| **English** | `"Hi"` | `GREETING` |
| **English** | `"Show me panjabi"` | `PRODUCT_SEARCH` |
| **English** | `"I want to order a shirt"` | `PLACE_ORDER` |
| **English** | `"What's the status of order #1234"` | `ORDER_STATUS` |
| **Banglish** | `"assalam vai"` | `GREETING` |
| **Banglish** | `"sharter dam koto"` | `PRODUCT_SEARCH` |
| **Banglish** | `"ami ekta shirt order korte chai"` | `PLACE_ORDER` |
| **Banglish** | `"order status bolen, phone 01712345678 order 1234"` | `ORDER_STATUS` |

---

### 🛠️ Extending the Chatbot

#### 1. Adding New Synonyms (`lib/synonyms.json`)
To support new Bangladeshi apparel terms, edit `apps/web/lib/synonyms.json`:
```json
{
  "products": {
    "polo": ["polo t-shirt", "পোলো", "collar tee", "polo shirt"]
  },
  "colors": {
    "maroon": ["মেরুন", "kohl", "wine"]
  }
}
```

#### 2. Adding a New Intent (`lib/intents.ts`)
1. Add your intent name to `Intent` type in `apps/web/lib/types.ts`.
2. Register patterns and trilingual keyword dictionaries in `apps/web/lib/intents.ts`:
```ts
{
  intent: "STORE_LOCATIONS",
  patterns: [
    /(?:showroom|branch|outlet|location|kothay\s*dokon)/i,
    /(?:দোকান|শো-?রুম|আউটলেট|কোথায়)/
  ],
  keywords: {
    bn: ["শোরুম", "দোকান", "আউটলেট"],
    en: ["showroom", "outlet", "branch", "store", "location"],
    banglish: ["showroom", "outlet", "dokon", "kothay", "thikana"]
  }
}
```
3. Add trilingual response templates in `apps/web/lib/responses.ts`.
4. Route the new intent in `apps/web/lib/orderFlow.ts`.
