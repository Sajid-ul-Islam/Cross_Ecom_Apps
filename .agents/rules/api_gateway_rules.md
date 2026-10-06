# API Gateway Domain Rules (`apps/api`)

These rules govern all backend development within `apps/api` (Fastify Gateway connected to WooCommerce and Logistics).

---

## 1. Edge Load-Balancer & Keep-Alive Settings
- Maintain `app.server.keepAliveTimeout = 65_000` and `app.server.headersTimeout = 66_000` to exceed upstream reverse proxy timeouts (Render/Cloudflare 60s) and eliminate `502 Bad Gateway` / socket reset races.
- Enforce `bodyLimit: 524_288` (512 KB) on Fastify to prevent memory ballooning from oversized request payloads.

## 2. Multi-Tier Rate Limiting
- **Auth / Login endpoints**: `10 req/min/IP`.
- **Order Creation (`POST /v1/deen/orders`)**: `6 req/min/IP`.
- **Public Catalog browsing**: `120 req/min/IP`.
- Implement store pruning (`_pruneExpired` on maps > 10,000 entries) to prevent Node.js heap leaks under high concurrency.

## 3. Upstream WooCommerce Resilience & Jitter
- Upstream calls against WordPress/WooCommerce must use randomized exponential backoff:
  $$\text{delay} = 200\text{ms} \times 2^{\text{attempt}} + \text{random}(0, 150\text{ms})$$
- Cap upstream retries at `MAX_RETRIES = 2` with `TIMEOUT_MS = 6000` so Fastify handles degradation before client abort timers fire.

## 4. In-Memory Catalog Caching
- Protect WooCommerce from flash-sale read spikes by serving catalog queries from Fastify in-memory cache (5-minute TTL with single-flight warming protection).

## 5. Security & Session Integrity
- Social OAuth tokens (`POST /v1/auth/google|facebook`) must verify provider audience (`GOOGLE_CLIENT_ID`, Facebook `debug_token` + `appsecret_proof`). Never trust raw body email without verification.
- HMAC-sign session tokens using `SESSION_SIGNING_SECRET` (fallback `WEBHOOK_SECRET` / `GATEWAY_API_KEY`).
- Error envelope `{ error, message, status, fields? }` is strictly enforced by the `onSend` hook in `routes.ts`.
