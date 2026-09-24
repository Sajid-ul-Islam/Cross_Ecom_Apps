# Multilingual Rule-Based E-Commerce Chatbot Architecture

> **Document Status:** Authoritative Architectural Guide  
> **Workspace:** `apps/web` (Next.js 14 App Router)  
> **Constraint:** Strictly Zero LLM / Zero External AI / 100% Deterministic Rule-Based Engine  
> **Target Upstream:** WordPress + WooCommerce REST API v3 (`https://deencommerce.com`)

---

## 1. Executive Summary & Design Principles

The DEEN E-Commerce Chatbot is a production-ready, ultra-fast conversational agent specifically engineered for Bangladeshi retail commerce. It supports **Bangla (`bn`)**, **English (`en`)**, and **Banglish (`banglish`)** across customer inquiries, catalog search, order status lookups, and multi-turn conversational order placement.

### Core Architectural Principles:
1. **Zero LLM / Zero Paid APIs**: No OpenAI, Claude, Gemini, or local models. Eliminates API token costs, latency spikes, and generative hallucinations.
2. **Deterministic State Machine**: Predictable multi-turn order-taking dialogs (`ORDER_PRODUCT ➔ ORDER_SIZE ➔ ORDER_QTY ➔ ORDER_PHONE ➔ ORDER_ADDRESS ➔ ORDER_CONFIRM`).
3. **Phonetic & Script Awareness**: Seamlessly handles Bengali script Unicode (`U+0980–U+09FF`), Bengali numerals (`০-৯`), and phonetic Latin Banglish (`sharter dam koto`, `korte chai`, `bolen`).
4. **Fuzzy Search with Synonym Expansion**: Leverages Fuse.js with category-specific Bangladeshi apparel dictionaries (`synonyms.json`) to bridge phonetic queries with WooCommerce product catalog records.
5. **Decoupled Session Persistence**: Built on an abstract `SessionStore` interface with an in-memory Map implementation (30-min TTL, bounded LRU pruning), allowing instant swap to Redis or Upstash.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                 Next.js 14 Web Frontend                                 |
|                                                                                         |
|  [ ChatWidget.tsx ] <──> [ ChatMessage.tsx ] + [ QuickReplies.tsx ]                     |
|  • Floating circular bubble (bottom: 24px desktop / bottom: 76px mobile above nav)      |
|  • Responsive 400x600 floating panel / 100vw x 100vh full-screen on mobile (< 640px)     |
|                                         │                                               |
|                                         ▼ POST /api/bot                                 |
+-----------------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------------+
|                            Next.js API Bot Engine (`apps/web/lib`)                      |
|                                                                                         |
|  1. IP Rate Limiter: max 20 req/min/IP (in-memory sliding window)                       |
|  2. Session Store: get/set/clear session (30-min sliding TTL, auto-prunes at 10k items)   |
|  3. Normalizer: Bengali digits ০-৯ ➔ 0-9, trim, whitespace collapse (`normalize.ts`)     |
|  4. Language Detector: bn [U+0980-U+09FF] | banglish [phonetic dict] | en (`langDetect.ts`)|
|                                                                                         |
|                                 ┌───────────────┐                                       |
|                                 │ Active State? │                                       |
|                                 └───────┬───────┘                                       |
|                         Yes             │            No                                 |
|             ┌───────────────────────────┴───────────────────────────┐                   |
|             ▼                                                       ▼                   |
|    [ Active State Machine ]                               [ Intent Classifier ]         |
|    • ORDER_PRODUCT ➔ ORDER_SIZE                           • PLACE_ORDER (1.0)           |
|      ➔ ORDER_QTY ➔ ORDER_PHONE                            • ORDER_STATUS (1.0)          |
|      ➔ ORDER_ADDRESS ➔ ORDER_CONFIRM                      • PRODUCT_SEARCH (0.7)        |
|    • STATUS_PHONE ➔ STATUS_ORDERNO                        • HUMAN_HANDOFF (0.7)         |
|    • Universal 'cancel' / 'বাতিল' ➔ IDLE                  • GREETING (0.7)              |
|    • Universal 'back' / 'পিছনে' ➔ Step -1                 • UNKNOWN (0.0 ➔ Fallback)    |
|                                                                     │                   |
|                                                                     ▼                   |
|                                                           [ Route to Flow ]             |
+-----------------------------------------------------------------------------------------+
          │                                       │                       │
          ▼                                       ▼                       ▼
+--------------------+                 +--------------------+   +-------------------+
|  Synonym Expander  |                 |   Fuse.js Search   |   | WooCommerce REST  |
|  (synonyms.json)   | ──────────────> |  (productMatch.ts) |   |   API v3 (woo.ts) |
|  Bangla / Banglish |                 |  Threshold: 0.45   |   |   Basic Auth      |
+--------------------+                 +--------------------+   +-------------------+
```

---

## 3. Component & Directory Breakdown

```
apps/web/
├── app/api/bot/
│   ├── route.ts                 # Main chat endpoint (POST /api/bot) with rate limiting & session update
│   └── session/
│       └── route.ts             # Session reset endpoint (POST /api/bot/session)
├── components/
│   ├── ChatWidget.tsx           # Floating circular button with modal dialog (responsive desktop/mobile)
│   ├── ChatMessage.tsx          # Localized message bubbles, product card carousels & Order Now triggers
│   └── QuickReplies.tsx         # Tappable disambiguation chips
├── lib/
│   ├── types.ts                 # Type definitions: Lang, BotState, Intent, Session, ProductCard, etc.
│   ├── normalize.ts             # Bengali-to-Latin digit conversion, non-joiner cleanup, whitespace trim
│   ├── langDetect.ts            # Unicode script vs. phonetic Banglish vs. English grammar classifier
│   ├── intents.ts               # Regex patterns & trilingual keyword dictionaries with priority ordering
│   ├── entities.ts              # Entity extraction: BD phone (01[3-9]\d{8}), order#, size, qty, price
│   ├── synonyms.json            # Apparel and color synonym maps across BN, EN, and Banglish
│   ├── responses.ts             # Trilingual template registry with dynamic {var} substitution
│   ├── session.ts               # SessionStore interface + in-memory Map implementation with 30-min TTL
│   ├── woo.ts                   # WooCommerce REST API v3 wrappers (Basic Auth + local snapshot fallback)
│   ├── productMatch.ts          # Multi-tiered Fuse.js fuzzy product matcher with synonym expansion
│   ├── orderLookup.ts           # Order status lookup with phone-number verification
│   ├── orderFlow.ts             # Master turn processor & dispatcher (logs UNKNOWN intents)
│   ├── flows/
│   │   ├── placeOrder.ts        # Conversational order taking state machine
│   │   ├── orderStatus.ts       # Order status tracking dialog
│   │   └── productSearch.ts     # Catalog inquiry & product card formatting
│   └── chatbot.test.ts          # Comprehensive unit & state machine test suite (25 test cases)
```

---

## 4. State Machine Specification

### A. Order Placement State Machine (`flows/placeOrder.ts`)

```
 [ IDLE ]
    │
    ▼ (PLACE_ORDER intent)
 [ ORDER_PRODUCT ] ──(No match, retry >= 2)──> [ HUMAN_HANDOFF ] ──> [ IDLE ]
    │ (Product matched via Fuse.js / WooCommerce)
    ▼
 [ ORDER_SIZE ]
    │ (Size captured: S, M, L, XL, 32, 34, etc.)
    ▼
 [ ORDER_QTY ]
    │ (Quantity parsed, default 1, max 10)
    ▼
 [ ORDER_PHONE ] ──(Invalid BD mobile: 01XXXXXXXXX)──> [ Re-ask Phone ]
    │ (Valid phone confirmed)
    ▼
 [ ORDER_ADDRESS ] ──(Address < 8 characters)────────> [ Re-ask Address ]
    │ (Address accepted)
    ▼
 [ ORDER_CONFIRM ]
    ├── "Yes" / "হ্যাঁ" / "confirm" ──> Create WC Order ──> [ ORDER_PLACED ] ──> [ IDLE ]
    ├── "No" / "না" / "cancel" ──────> [ ORDER_CANCELLED ] ──────────────────> [ IDLE ]
    └── Other ───────────────────────> [ Re-ask Confirmation ]

 * Universal Commands:
   • "cancel" / "stop" / "বাতিল" at ANY state resets slots and returns to IDLE.
   • "back" / "পিছনে" moves one state backwards in the sequence.
```

### B. Order Status Inquiry State Machine (`flows/orderStatus.ts`)

```
 [ IDLE ]
    │
    ▼ (ORDER_STATUS intent)
 [ STATUS_PHONE ] ──(Invalid BD mobile)──> [ Re-ask Phone ]
    │ (Valid 11-digit mobile captured)
    ▼
 [ STATUS_ORDERNO ]
    │ (Fetch order by ID, verify billing.phone matches)
    ├── Match ────> [ STATUS_FOUND ] (status, items, total, date) ──> [ IDLE ]
    └── No Match ─> [ STATUS_NOT_FOUND ] ─────────────────────────> [ IDLE ]
```

---

## 5. Intent Classifier Priority & Rules (`lib/intents.ts`)

Intent classification evaluates user input with strict priority to avoid routing collisions:

$$\text{PLACE\_ORDER} > \text{ORDER\_STATUS} > \text{PRODUCT\_SEARCH} > \text{HUMAN\_HANDOFF} > \text{GREETING} > \text{UNKNOWN}$$

### Scoring Formula:
- **Pattern Match (Regex)**: Confidence = $1.0$
- **Keyword Match**: Confidence = $0.7$
- **No Match**: Confidence = $0.0$ (dispatched to `UNKNOWN`, logged server-side for rule refinement)

---

## 6. Language Detection Logic (`lib/langDetect.ts`)

```
                ┌──────────────────────────────────┐
                │        Input User Message        │
                └────────────────┬─────────────────┘
                                 │
                 Contains Bengali Unicode chars?
                 (/[\u0980-\u09FF]/)
                                 │
                     ┌───────────┴───────────┐
                     ▼ Yes                   ▼ No
                 Return "bn"         Tokenize words
                                             │
                             Matches DISTINCT_BANGLISH_WORDS?
                             (koto, dam, chai, lagbe, vai,
                              bolen, ami, ekta, etc.)
                                             │
                                 ┌───────────┴───────────┐
                                 ▼ Yes                   ▼ No
                            Return "banglish"       Return "en"
```

---

## 7. Product Matching & Synonym Expansion (`lib/productMatch.ts`)

Fuse.js fuzzy matching uses a multi-tier search pipeline to avoid multi-word scoring penalties:
1. **Tier 1 (Direct Query)**: Search raw clean query against cached catalog.
2. **Tier 2 (Tokenized Search)**: For multi-word queries (e.g. `"Selvedge Jeans"`), search significant individual tokens (`"Jeans"`).
3. **Tier 3 (Synonym Expansion)**: Cross-reference query tokens against `synonyms.json` (e.g. `"shart"` ➔ `"shirt"`, `"pant"` ➔ `"jeans"`, `"পাঞ্জাবি"` ➔ `"panjabi"`) and search canonical terms.
4. **Tier 4 (Live WooCommerce Search)**: Query `GET /wp-json/wc/v3/products?search=...` as upstream fallback when configured.

---

## 8. Environment Variables & Credentials

Create `apps/web/.env.local`:

```env
# WooCommerce REST API v3
WOO_URL=https://deencommerce.com/wp-json/wc/v3
WOO_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOO_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Branding
NEXT_PUBLIC_STORE_NAME="DEEN Commerce"
```

---

## 9. Verification & Automated Testing

Execute the chatbot test suite covering all 6 intents, Bengali digit normalization, entity extraction, session timeouts, and state machines:

```bash
# Chatbot test suite (25 tests across 11 suites)
npx tsx apps/web/lib/chatbot.test.ts

# Monorepo typecheck across API, Web, and Mobile
npm run typecheck:all
```
