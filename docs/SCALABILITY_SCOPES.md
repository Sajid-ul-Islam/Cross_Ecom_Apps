# Scalability Scopes — Cross_Ecom_Apps (DEEN Commerce)

> Current ceiling: **single gateway instance**. Every scale step is gated by in-memory + `/tmp` state.
> Source files: `apps/api/src/routes.ts`, `apps/api/src/woo.ts`, `apps/api/src/pathao.ts`, `apps/api/src/biCacheService.ts`, `apps/api/src/index.ts`, `apps/mobile/src/services/gateway.ts`, `apps/mobile/src/context/OrderContext.tsx`.

## S0 — Config / no-code (do first)
- Render `plan: free` → Starter+, `region: oregon` → Singapore (close to BD users). Free sleeps cause 8–10s cold starts that trip mobile aborts.
- Set persistent `DATA_DIR` (disk) instead of default `/tmp/deen_gateway_data` (`routes.ts:401`, `biCacheService.ts:21`) — /tmp wipes on deploy/restart.
- Vercel edge-cache GET catalog responses 60–300s; keep POSTs single-origin (no blind failover on writes).

## S1 — Single-instance hardening (code, no new infra)
- Env-drive all TTLs: catalog 5m (`woo.ts:195`), Pathao tracking 1m (`pathao.ts:253`), webhook dedupe 10m (`routes.ts:256`), BI 10m (`biCacheService.ts:22`), auth 30d / guest 7d (`routes.ts:607,688`).
- Warn on boot when `DATA_DIR` starts with `/tmp` (ephemeral) so deploys don't silently lose sessions/orders.
- Keep stateless HMAC tokens; treat file JSON (`auth_sessions.json`, `guest_sessions.json`, `orders.json`) as cache, not source of truth.
- Mobile offline sync: sequential loop today (`OrderContext.tsx:38-60`) — add exponential backoff + reconcile-before-resubmit via existing `findWooOrderByKey` path.

## S2 — Horizontal scale (needs Redis + Postgres)
Blockers (all per-process today, diverge with 2+ replicas):
- `routes.ts:227-228` order idempotency + in-flight map, `:255` webhook dedupe, `:431` payments, `:471` push tokens, `index.ts:102` rate limiter.
- `woo.ts` variation/catalog/cover/hero caches, `pathao.ts:254` tracking cache (N replicas = N× upstream load, staggered expiry herds; single-flight is intra-process only).
- Scope: Redis for rate/idempotency/catalog/sessions/Pathao token; Postgres for orders/customers/payments. Gateway becomes stateless; Maps become L1 only.
- Write-behind order queue: accept → Redis stream → return `pending` → worker reconciles to Woo (extends current offline-sync pattern). Webhook handlers ack-then-queue.

## S3 — Decouple + multi-region
- BI calc off request threads (use existing `startBackgroundWorker`, add dedicated worker).
- AI chat: cache by normalized query + catalog version; per-user rate tier.
- Catalog reads via CDN/edge; Woo read replica; gateway SIN + US with sticky or shared Redis.
- `STORES` registry (`config.ts`) already supports SaaS split per tenant.

## Order of work
1. S0 deploy changes (biggest latency win, zero code).
2. S1 code items in this repo (tracked in todo list: `fix-typecheck`, `s1-config`, `s2-sync`).
3. S2 Redis/Postgres + queue worker.
4. S3 multi-region + BI worker split.
