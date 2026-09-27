# Direct WordPress Public Fallback & Gateway Keep-Warm Architecture

## 1. Executive Summary

This architecture establishes a high-resilience, multi-tier strategy for DEEN Commerce across **Mobile** (`apps/mobile`) and **Web** (`apps/web`):

1. **Tier 1 (Primary - Fastest)**: Render Fastify Gateway In-Memory RAM Cache (`https://cross-ecom-apps-4b4n.onrender.com`). Serves 95%+ of catalog queries in <10ms without touching WordPress PHP or MySQL.
2. **Tier 2 (Failover - Public Direct)**: Direct WooCommerce Store API (`https://deencommerce.com/wp-json/wc/store/v1/products`) & WordPress Core REST API (`/wp-json/wp/v2/pages`). **No API keys or secrets required**. Automatically activates if Render is cold-starting or unreachable.
3. **Tier 3 (Offline - Snapshot)**: Bundled catalog snapshot JSON (`catalog.snapshot.json` / `catalog.ts`). Guarantees zero crashes and instant app open even in zero-connectivity or airplane mode.

---

## 2. Public vs. Private Endpoint Directory

### A. Public Endpoints (Direct Access Allowed)
These endpoints do **not** require WooCommerce consumer keys or secrets:

| System | Endpoint | Method | Data Returned | App Fallback Usage |
| :--- | :--- | :--- | :--- | :--- |
| **WC Store API** | `/wp-json/wc/store/v1/products` | `GET` | Catalog of published products | `fetchProducts` fallback |
| **WC Store API** | `/wp-json/wc/store/v1/products/:id` | `GET` | Single product details & variations | `fetchProduct` / `fetchProductById` |
| **WC Store API** | `/wp-json/wc/store/v1/products/categories` | `GET` | Store categories & product counts | `fetchCategories` fallback |
| **WP Core REST** | `/wp-json/wp/v2/pages?slug=:slug` | `GET` | Static pages (About Us, Return Policy) | `fetchPage` fallback |
| **WP Core REST** | `/wp-json/wp/v2/media` | `GET` | Media library attachments & banners | Image CDN resolution |

### B. Authenticated Endpoints (STRICTLY Protected Behind Gateway)
These endpoints require secret credentials and **must never be called directly from frontend apps**:

| Domain | Gateway Route | Upstream Service | Why It Must Stay on Gateway |
| :--- | :--- | :--- | :--- |
| **Order Placement** | `POST /v1/deen/orders` | WooCommerce `/wp-json/wc/v3/orders` | Requires WC Consumer Key/Secret, pricing validation, stock deduction, and fraud/rate-limiting checks. |
| **Courier Tracking** | `GET /v1/deen/pathao/track/:id` | Pathao Courier API | Requires Pathao OAuth Client ID & Secret, live bearer token exchange, and merchant webhook reconciliation. |
| **Customer Auth** | `POST /v1/auth/login`, `/register` | WordPress `/wp-login.php` & WC API | Protects user passwords, HMAC guest tokens, and customer databases. |
| **Coupons & Pricing** | `POST /v1/deen/pricing`, `/coupon` | In-Memory Engine & WC Coupons | Enforces BOGO rules, cashback tiers, and prevents client-side price tampering. |
| **Admin & BI** | `GET /v1/deen/admin/*` | Gateway Analytics Engine | Protects store revenue, profit margins, and return intelligence metrics. |

---

## 3. Implementation Details

### Mobile App (`apps/mobile/src/services/gateway.ts`)
- **`mapStoreProductToMobile(sp)`**: Normalizes raw Store API products into the standard `Product` type (matching category whitelist, sizes, fits, discount tags, and image variants).
- **`fetchProducts()`**:
  - Attempts live Render Gateway (`/v1/deen/products`).
  - If unreachable or timeout occurs, fetches directly from `https://deencommerce.com/wp-json/wc/store/v1/products`.
  - If direct fetch fails, gracefully falls back to bundled snapshot.
- **`fetchProductById(id)`**:
  - Tries gateway `/v1/deen/products/:id`.
  - On failure, queries `https://deencommerce.com/wp-json/wc/store/v1/products/:id` directly.
- **`fetchPage(slug)`**:
  - Tries gateway `/v1/deen/page?slug=...`.
  - On failure, queries `https://deencommerce.com/wp-json/wp/v2/pages?slug=...`.

### Web App (`apps/web/lib/api.ts` & `apps/web/app/api/products/route.ts`)
- **`mapStoreProductToWeb(sp)`**: Maps raw WooCommerce Store API products to the Next.js `Product` type.
- **`fetchDirectStoreProductsWeb()`**:
  - On the server: directly fetches from `https://deencommerce.com/wp-json/wc/store/v1/products` (zero CORS).
  - In browser client: queries `/api/products` (internal Next.js proxy route) to bypass browser CORS restrictions.
- **`startWebGatewayKeepAlive()` & `<GatewayKeepAlive />`**:
  - Sends a lightweight keep-warm ping to `https://cross-ecom-apps-4b4n.onrender.com/health` every 4 minutes during active user sessions.

---

## 4. Free 24/7 Gateway Keep-Warm Setup (Zero Cold Starts)

Render free-tier instances sleep after 15 minutes of inactivity. To keep the gateway permanently awake with 0ms cold starts without upgrading to paid instances:

### Option 1: UptimeRobot (Recommended - 100% Free)
1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Click **+ Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `DEEN Fastify Gateway Keep-Warm`
   - **URL (or IP)**: `https://cross-ecom-apps-4b4n.onrender.com/health`
   - **Monitoring Interval**: `Every 5 minutes`
3. Click **Create Monitor**.
4. Result: UptimeRobot will ping the `/health` endpoint every 5 minutes, keeping Node.js RAM warm and eliminating cold starts forever.

### Option 2: Cron-Job.org (Free Alternative)
1. Go to [cron-job.org](https://cron-job.org).
2. Create a cron job pointing to `https://cross-ecom-apps-4b4n.onrender.com/health`.
3. Schedule: `Every 9 minutes` (`*/9 * * * *`).
