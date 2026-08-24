# How the DEEN Android App Works

> Plain-language architecture explanation, grounded in the actual code
> (`apps/mobile` + `apps/api`).

## The big picture — a 3-layer architecture

```
┌────────────────────────┐      HTTPS       ┌────────────────────────┐      Woo REST API      ┌──────────────────┐
│  ANDROID APP (you)     │  ───────────────▶ │  GATEWAY (Render)      │  ───────────────────▶ │  WooCommerce /   │
│  No secrets inside     │   x-api-key      │  Holds Woo keys        │   consumer key+secret  │  WordPress       │
└────────────────────────┘                  └────────────────────────┘                       └──────────────────┘
        ↑ live data + cache                         ↑ the "middle man"                          ↑ the real store
```

**The rule that runs everything:** *"REST API → Woo → WordPress is the source of truth."*
The app is a **thin client** — it never invents products, prices, or images. It asks the
gateway, the gateway asks WooCommerce, and WooCommerce reads from WordPress.

---

## Layer 1 — The app (what's on the phone)

### How it starts (`app/_layout.tsx`)
When you tap the DEEN icon:
1. **Splash screen** plays (the orange "DEEN" animation), then hides.
2. A stack of **Providers** wraps the whole app — these are like global memory boxes:
   - `ThemeProvider` (light/dark), `CartProvider`, `OrderProvider`, `ProfileProvider`,
     `WishlistProvider`, `RewardsProvider`, `ReturnProvider`, `NotificationProvider`.
   - Each holds one piece of state so any screen can read/write it (e.g. cart contents, who's logged in).
3. A **global crash handler** is installed: if the app throws an uncaught error, it silently
   sends it to the gateway's bug store (`reportBug`) so crashes are visible — but the user never sees an ugly error.

### How it talks to data (`src/services/gateway.ts`)
This one file is the **only** way the app reaches the internet:
- `GATEWAY_URL` = `https://cross-ecom-apps.onrender.com` (from `app.json` → `extra.gatewayUrl`).
- `API_KEY` = the client key in `app.json` → `extra.gatewayApiKey`, sent as an `x-api-key` header.
  **This is NOT a secret** — it only identifies the app; the real Woo secrets live on the gateway.
- **No Woo keys, no passwords, no DB creds are in the app bundle.** That's why it's safe to ship.

### How navigation works (`expo-router`)
File-based router (folders = screens):
- `(tabs)` = bottom bar: **Home / Shop / Bag / Profile**.
- `product/[id]` = product detail page (`[id]` = any product id).
- `category/[slug]` = category page.
- `checkout` = buy screen (slides up as a modal).
- `order-success` = "thank you" page.

### How it stays fast & never crashes (offline-first)
- Renders instantly from a **local cache / bundled catalog** first.
- Then does a **live sync with a timeout** against the gateway.
- If the gateway is down, shows a cached catalog + an "offline" banner (`ConnectionBanner`)
  instead of an error.

---

## Layer 2 — The gateway (the middle man on Render)

A small **Fastify server** (Node.js) hosted on Render. The brain that protects WooCommerce:
- **Holds the WooCommerce keys** in its environment (never in the app).
- **Every app request must carry the `x-api-key`** — otherwise rejected (the 401 we fixed).
- **Caching**: products, categories, covers cached ~5 min, so a Woo hiccup still shows the store.
- **Resilience**: `wooFetch` has timeout + retry + circuit-breaker.
- **Health**: `/v1/health` reports `woo: ok|degraded|down`.
- **Security**: per-key rate limiting, PII-redacted audit logging, GDPR endpoints
  (`export-data`, `delete-account`).
- **Multi-tenant ready**: `config.ts` can hold multiple stores (the SaaS play), looked up by API key.

---

## Layer 3 — WooCommerce / WordPress (the real store)

`deencommerce.com`'s backend. The gateway calls WooCommerce's REST API to:
- Get the **real product list, prices, sizes, stock**.
- Get **category cover images** from WordPress media.
- **Create real orders** on checkout (lands in Woo exactly like a web order).
- Apply **cashback** as a coupon.

---

## A real example: "Customer buys a Panjabi"

1. App opens → fetches products from gateway → gateway fetches from Woo → shows Panjabi list
   (real sizes; broken/empty sizes sanitized out).
2. Customer taps a Panjabi → `product/[id]` → gateway returns variations (size → stock + price) from Woo.
3. Customer adds to bag → stored in `CartProvider` + shows "You'll save ৳X" cashback.
4. Checkout → gateway `POST /v1/deen/order` → gateway converts to a Woo order (with cashback coupon)
   → Woo records it → returns an order id.
5. If internet dies mid-checkout → app **saves the order locally** and **re-syncs when back online**
   (`OrderContext` reconciliation).

---

## Why this design matters

- **Safe**: no secrets in the APK — reverse-engineering the app can't touch Woo (still needs
  the gateway key + the gateway's Woo keys).
- **Reliable**: caches + circuit-breakers mean a Woo slowdown shows "old prices" instead of a broken app.
- **Scalable (SaaS)**: the gateway already supports multiple stores via API keys — that's how you'd
  sell this backend to other BD retailers.

**TL;DR:** The app is a thin window. It shows whatever the **gateway** fetches from
**WooCommerce/WordPress**, and the gateway is the only place that holds the keys and the smarts
(caching, security, retries).

---

## Security & recent hardening (see `HOW_THE_APP_WORKS_DEEP_DIVE.md` §4.5)

- **Per-API-key rate limiting** + **PII-masked audit logging** on the gateway.
- **GDPR endpoints**: `export-data` + `delete-account`.
- **`.env` incident**: a gateway `.env` (Woo keys) was briefly committed to the public repo,
  then **scrubbed from all git history** with `git filter-repo` and force-pushed. The only real
  fix for an exposed secret is **rotating the Woo keys** (WooCommerce → Settings → Advanced →
  REST API) and updating Render's env. `.env` is gitignored and never committed; APKs are
  gitignored too.
- **Build**: APK built via `expo prebuild` + Gradle `assembleRelease` (JDK 17, 4 GB heap).
- **Branches**: `master` is the source of truth; `main` is force-mirrored to it.
