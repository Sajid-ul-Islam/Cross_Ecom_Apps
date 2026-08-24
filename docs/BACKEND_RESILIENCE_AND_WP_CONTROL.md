# Backend Resilience & WordPress-as-Control-Plane (R&D Spec)

> Status: **R&D / planning** — not yet implemented. Captured for future work.
> Goal: make the DEEN backend (a) survive a gateway/Region outage, and
> (b) let the WordPress admin *dictate* customer-facing behavior (push
> notifications, offers, notices) without touching the app or rebuilding.

---

## 0. Current state (what exists today)

- **Gateway** (`apps/api`) is **stateful**: it persists JSON to a local
  `DATA_DIR` — `orders.json`, `payments.json`, `push_tokens.json`,
  `broadcasts.json`, `customers.json`, `guest_sessions.json`,
  `auth_sessions.json`. On Render's free tier this disk is **ephemeral**
  (wiped on sleep/redeploy).
- The app has a **single** `gatewayUrl` in `app.json` (`extra.gatewayUrl`).
  If that gateway is down, the app is dead.
- A `/health` + `/v1/health` endpoint already exists (reports Woo contact).
- Woo/WordPress is already the source of truth for **data** (products,
  orders, coupons, shipping, pages).
- Webhook auto-provisioner already exists (`POST /v1/deen/webhook/woo/register`)
  and can be extended to new topics.

### Implication
Two gateway instances today would have **divergent local state** (each its
own `orders.json`/`push_tokens.json`). So "just deploy a 2nd instance" is a
*partial* fix — it only helps if the primary's disk is the failure point,
not if the whole Region dies. **Shared state is the real requirement.**

---

## 1. API backup — survive Render being down

### Architecture: active gateway + warm standby + app-side fallback

| Layer | What | Effort |
|---|---|---|
| **A. Two gateway deployments** | Deploy the *same* gateway repo to 2 services (Render primary + a cheap Railway/Fly.io or 2nd Render region). Both use the same Woo keys + same `GATEWAY_API_KEY`. | Low (1 more deploy) |
| **B. Shared state, not local disk** | Move JSON state to a shared store so both instances agree: (i) Supabase Postgres free-tier `kv` table, (ii) Cloudflare KV / Upstash Redis, (iii) S3/R2 + atomic write (eventually consistent). **This is the real fix.** | Medium |
| **C. App gateway auto-fallback** | In `gateway.ts` keep an ordered list `[PRIMARY, BACKUP]`; on fetch failure/timeout retry the next URL. List sourced from `app.json` extra so it's changeable without rebuild. | Low (~30 lines) |
| **D. Render keep-alive** | Free UptimeRobot / Better Uptime ping to `/health` every 5 min so free tier doesn't spin down. | Trivial (free) |

### Recommended order
1. **Now (no new infra):** C + D + A. App works even if primary sleeps.
2. **Next (½ day):** B via Supabase free Postgres `kv`. Kills ephemeral-disk
   risk; backup becomes truly shared.
3. **Interim alt:** point `gatewayUrl` at a Cloudflare/SmartDNS that
   health-checks both origins and fails over. Zero app code, but B still
   required for stateful correctness.

### Caveat
A alone is partial. Do **B** before relying on the backup for anything
stateful (orders, push tokens, guest sessions).

---

## 2. WordPress as the control plane — "you dictate" from WP

The principle already in force ("admin works in WP, no app rebuild") is
extended to **messaging and behavior**.

| Capability | How it maps to "you dictate from WP" | Effort |
|---|---|---|
| **Push from WP admin** | `POST /v1/deen/admin/broadcast` (gateway-key protected) sends to all stored `push_tokens` via Expo/FCM. A tiny WP plugin/admin page (or Zapier/webhook) calls it. You type a message in WP → customers get it. | Medium |
| **Coupon/sale → automatic push** | When you publish a Woo coupon or "Sale" category, the gateway webhook fires → optionally triggers a broadcast. Extend the existing auto-provisioner to the relevant topic. | Low–Med |
| **Store notice from WP** | Already done via `PUBLIC_NOTICE` env; better: source it from a WP page/ACF field so you edit in WP, not Render env. | Low |
| **Order status → customer push** | When Woo order status flips (`order.updated` webhook), gateway looks up the customer's `push_token` and sends "Your order shipped". Plumbing exists (`push_tokens.json` + webhook infra); just wire `order.updated` → push. | Med |
| **Rich notifications** | Gateway formats payload; app's `notifee`/Expo handler displays. Partially present. | Low |

### Cleanest "you dictate" loop
```
WP Admin publishes coupon/sale/notice
   → Woo / webhook
   → gateway receives
   → gateway sends push to all push_tokens + appends broadcasts.json
   → app shows it
```
You never touch the app or Render. This is the source-of-truth principle
applied to *messaging*.

---

## 3. Reusability — spin up another store from this backend

The gateway is already **tenant-agnostic** (config-driven):
`WOO_SITE`, `WOO_CONSUMER_KEY`, `GATEWAY_API_KEY`, `COMBOS`, `PUBLIC_NOTICE`,
`EXPRESS_SURCHARGE`, `STORE_HOTLINE/WHATSAPP/BKASH/EMAIL`.

- **Per-store env = a new store.** Same repo, different Render env.
- Add `STORE_SLUG` to config so `push_tokens`/`orders` are namespaced per
  store if one gateway is ever shared.
- The mobile app only needs `gatewayUrl` + `gatewayApiKey` per build, so a
  second app (`app.json`) points at the same gateway with different keys, or
  at a different gateway instance.

---

## 4. Suggested implementation order

1. **Survival (1 evening, no new infra):** app-side gateway fallback list
   (C) + UptimeRobot keep-alive (D) + 2nd cheap deploy of same repo (A).
2. **Shared state (½ day):** Supabase free Postgres `kv` (B) — removes
   ephemeral-disk risk; makes the backup truly shared.
3. **Control (1 day):** `POST /v1/deen/admin/broadcast` + wire
   `order.updated` webhook → customer push (the "you dictate from WP" part).
   Optionally a minimal WP admin button that hits it.

---

## 5. Open questions for the owner

- Which backup host? (Railway / Fly.io / 2nd Render region)
- Supabase vs Upstash vs R2 for shared state?
- Push provider for admin broadcasts: Expo Push (already in app) vs FCM direct?
- Should the WP "dictate" UI be a custom plugin, or is a webhook/Zapier enough?

_Nothing here is built yet. This doc is the spec for future R&D sessions._
