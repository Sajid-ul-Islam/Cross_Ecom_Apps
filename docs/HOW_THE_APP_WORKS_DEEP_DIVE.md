# DEEN App — Deep Dive (for running & extending as a business)

Companion to `HOW_THE_APP_WORKS.md`. This goes under the hood of the four flows that
actually matter in production: **how a request travels**, **authentication**, **order
creation + offline resilience**, and **multi-tenancy (the SaaS play)**. All grounded in
real code in `apps/mobile/src/services/gateway.ts` and `apps/api/src/`.

---

## 1. The request lifecycle (every call, every screen)

Every network call from the app goes through ONE function: `request<T>()` in
`src/services/gateway.ts`. This is the contract:

```ts
export async function request<T>(path, init?, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // hard cutoff
  const headers = { "Content-Type": "application/json", ...init?.headers };
  if (API_KEY) headers["x-api-key"] = API_KEY;                       // identity, NOT a secret
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers, signal: controller.signal });
  ...
  setConnection("online");   // any success flips the app to "online"
  return res.json();
  // on ANY error: setConnection("offline"); throw err;
}
```

**What this means in practice:**
- **Timeout**: every call has a hard ceiling (default 8s; orders use 10s; bugs 5s). If the
  gateway is slow, the call fails fast instead of hanging the UI.
- **x-api-key**: auto-injected on every request. The gateway's `index.ts` hook rejects any
  request missing/invalid key with `401` — that's the wall that keeps random clients out.
- **Connection state is global**: `setConnection("online"|"offline")` flips a single flag that
  the `ConnectionBanner` (on Home) and `OrderContext` (offline order re-sync) both subscribe to.
  One failed call = whole app knows it's offline.

**The gateway side** (`apps/api/src/index.ts`): a Fastify `onRequest` hook applies
**per-API-key rate limiting** (20 req/min on `/v1/auth/*`) using `security.ts`. Then
`wooFetch()` (in `woo.ts`) calls WooCommerce with **timeout + retry + circuit-breaker**:
if Woo is slow/down, the circuit opens and subsequent calls fail fast (`wooStatus()` returns
`degraded`/`down`), which is what `/v1/health` surfaces.

---

## 2. Authentication (who is the customer?)

Three identity modes, all minted by the gateway:

### a) Login (real WordPress customer)
`POST /v1/auth/login` → gateway calls `wpLogin(username, password)` (WordPress
username+password → cookie exchange). On success the gateway returns:
```json
{ "success": true, "user": { "id": "wp_123", "role": "customer"|"admin", ... }, "token": "wp_<uuid>" }
```
- `role: "admin"` is derived from WordPress `administrator`/`shop_manager` roles. The app
  **hides all sales/BI features** unless `role === "admin"`.
- The `token` is a **Bearer token** the app stores in `AsyncStorage` and sends on later
  calls via `Authorization: Bearer <token>`.
- Failed logins are **audit-logged** (`audit("auth.login", false, maskPhone(username))`) —
  PII is masked, never logged raw.

### b) Guest session (frictionless checkout)
`POST /v1/auth/guest` → mints an anonymous BD phone + bearer token. This lets a first-time
buyer check out **without registering** — the order still has a real phone number for delivery.
This replaced the old "shared hardcoded guest account" (a real data-correctness bug we fixed).

### c) Register (Option B — in-app sign-up)
`POST /v1/auth/register` → `{ name, phone }`, validated as a BD mobile (`/^01[3-9]\d{8}$/`).
If the phone already exists it's treated as a **returning customer** (greets them), otherwise
a new customer record is created. Returns a token so the app can treat them as logged-in.

**Why this model is safe:** the app never sees the WordPress password after login; it only
holds a gateway-issued bearer token. Rotating gateway keys invalidates all tokens.

---

## 3. Order creation + offline resilience (money can't be lost)

`createOrder(orderData)` in `gateway.ts` is the critical path. Step by step:

1. **Clean the payload**: strip promo gift lines (`dn-06`, `gift-tee` — the server adds the
   free T-shirt automatically, so the client must not double-send it). Normalize phone, size,
   qty.
2. **POST `/v1/deen/orders`** to the gateway (10s timeout). The gateway converts this into a
   **real WooCommerce order** (with cashback applied as a coupon), and Woo returns the order id.
3. **On success**: the order is cached in `AsyncStorage` (`deen_gateway_orders_v1`) so the
   "My Orders" list works even offline later.
4. **On failure (offline / gateway error)**: the app does NOT lose the sale. It creates a
   **local offline order**:
   ```ts
   const created: Order = {
     ...orderData,
     id: `offline-${Date.now()}`,
     number: `DC-OFFLINE-<random>`,
     status: "received",
     createdAt: new Date().toISOString(),
   };
   ```
   and caches it. `OrderContext` then **re-syncs** any `offline-*` order when the connection
   flips back to `"online"` (it re-calls `createOrder`, which now hits Woo for real).

**Business impact:** a network drop at checkout = a queued order, not a lost customer.

---

## 4. Multi-tenancy — the actual SaaS play

The gateway is already wired to serve **many stores**. Two pieces:

### `config.ts` — the store registry
```ts
export interface StoreConfig {
  id: string;
  apiKey: string;            // the x-api-key THIS store's app sends
  woo: { site, consumerKey, consumerSecret };
  brand?: { name?, primaryColor? };
}
// Set via STORES env var (JSON array). Empty = legacy single-store mode.
config.stores = parseStores(process.env.STORES);
```

### `resolveStore(apiKey)` — routing
```ts
export function resolveStore(apiKey?: string): StoreConfig | null {
  return config.stores.find((s) => s.apiKey === apiKey) ?? null;
}
```
When a store's app sends its `x-api-key`, the gateway looks it up and uses **that store's**
Woo credentials + branding. If no match, it falls back to the legacy top-level `woo` config
(the DEEN store today).

### What's still needed to truly sell this
- **Per-store request routing**: `wooFetch` currently always uses the top-level `config.woo`.
  Every Woo call must be threaded through `resolveStore(apiKey)` so store A hits store A's Woo.
- **Isolation + metering**: a `usage` map keyed by `store.id` (requests/orders per window) for
  billing; cache keyed per store so one store's catalog never leaks into another's.
- **White-label build**: an EAS build per store reading its own `gatewayUrl` + `gatewayApiKey`
  + brand color from `app.json` (or a build-time env inject). The app already reads
  `extra.gatewayUrl` / `extra.gatewayApiKey` from `app.json`, so per-store branding is mostly
  a build-config change, not a code change.

**Today:** single store (DEEN). The scaffolding exists; the per-request routing + metering is
the remaining engineering to flip it to multi-tenant revenue.

---

## 5. Where the secrets live (and don't)

| Secret                        | Lives in                          | In the app? |
|-------------------------------|-----------------------------------|-------------|
| Woo consumer key/secret       | Gateway env (Render)             | ❌ No       |
| Gateway API key (`GATEWAY_API_KEY`) | Render env (validates clients) | ❌ (app sends its client key, which is identity not secret) |
| WordPress customer password   | User's head / WordPress          | ❌ (exchanged for a token at login) |
| App client key (`extra.gatewayApiKey`) | `app.json`              | ✅ but it's just an identifier, safe to ship |

**Rule:** the APK contains zero credentials that can touch WooCommerce. Reverse-engineering
the app yields only the gateway URL + a client key — useless without the gateway's own Woo keys.

---

## 6. Failure modes (and how each is handled)

| Failure                        | Behavior                                         |
|-------------------------------|--------------------------------------------------|
| Woo slow / down               | Circuit breaker opens → `/v1/health` shows `degraded`/`down` → app shows cached catalog + "prices may be a few min old" |
| Gateway unreachable            | App flips to `offline` → `ConnectionBanner` shows → cached catalog still browsable |
| Checkout while offline         | Order queued locally as `offline-*` → re-synced on reconnect |
| App crash (JS exception)      | Global handler → `reportBug` → gateway bug store (admin-visible) |
| Bad api-key                    | Gateway `401` before any Woo call                |
| Rate limit exceeded (auth)    | Gateway `429` (20/min per key)                    |

---

## 7. Build & deploy recap

- **App**: `expo prebuild --platform android` → Gradle `assembleRelease` (JDK 17, 4 GB heap).
  Output: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.
- **Gateway**: Node.js on Render, rootDir `apps/api`, start `tsx src/index.ts`. Push to
  `master` (or `main`) auto-deploys. Needs a `build` script (`tsc --noEmit`) or Render's
  default build step fails.
- **Source of truth**: `master` (both `master` and `main` are aligned at the same commit).
