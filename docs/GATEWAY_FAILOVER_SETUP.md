# Gateway Failover & Keep-Alive — Deployment Runbook (X)

> Implements the "API backup if Render is down" part of
> `BACKEND_RESILIENCE_AND_WP_CONTROL.md` (section 1, layers A + C + D).
> Status: **app-side code is built & verified live**; this doc covers the
> deployment side (deploy a 2nd origin + keep it awake).

---

## What already works (verified 2026-08-25)

- `apps/mobile/src/services/gateway.ts`:
  - `GATEWAY_URLS` = `[extra.gatewayUrl, ...extra.gatewayUrls, DEFAULT]`.
  - `request()` **fails over across origins** on network/timeout (a real
    4xx/5xx from a reachable gateway is thrown, not failed over).
  - `startGatewayKeepAlive()` runs at app launch (`app/_layout.tsx`) and now
    **pings every origin**, shifting `preferredGatewayIdx` to the first healthy
    one.
- `app.json` `extra.gatewayUrls` already lists a backup origin.

### Live proof
- Backup origin `https://cross-ecom-apps-4b4n.onrender.com/health` (with
  `x-api-key`) → **200** `{ok:true, gateway:"ok"}`.
- Primary `https://cross-ecom-apps.onrender.com` → **503 Service Suspended**
  at test time → app automatically fails over to the backup. Confirmed working.

---

## Deployment steps

### 1. Deploy the 2nd gateway (layer A)
The gateway is stateless-from-config: the same repo deploys anywhere. Options:
- **Second Render service** (different service, same repo/branch) — simplest,
  same dashboard.
- **Railway / Fly.io** — free tier, different provider (best for true
  region/provider independence).
- **Same repo, different Render region** — protects against a region outage.

Set the **same env** on the backup as the primary:
`WOO_SITE`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`, `GATEWAY_API_KEY`,
`WEBHOOK_SECRET`, `PUBLIC_NOTICE`, `EXPRESS_SURCHARGE`, `COMBOS`,
`STORE_HOTLINE`, `STORE_WHATSAPP`, `STORE_BKASH`, `STORE_EMAIL`.

> ⚠️ **Shared state caveat (layer B, not yet built):** the gateway persists
> `orders.json`, `push_tokens.json`, `broadcasts.json`, `customers.json`,
> `guest_sessions.json`, `auth_sessions.json` to its **local ephemeral disk**.
> Two instances therefore have **divergent state**. The failover keeps the app
> *reachable*, but if the primary dies mid-order the backup won't have its
> local JSON. Until shared state (Supabase/Upstash/R2) lands, treat the backup
> as an availability safety net, not a state mirror. See resilience doc §1-B.

### 2. Register the backup origin in the app (layer C)
In `apps/mobile/app.json` → `extra.gatewayUrls`:
```json
"gatewayUrls": [
  "https://<your-backup-origin>"
]
```
No app rebuild needed to *change* an already-listed URL (it's read at runtime),
but adding a *new* key requires a rebuild. Keep at least one valid entry.

### 3. Keep both origins awake (layer D)
Free tier hosts spin down after ~15 min idle. Configure an **external uptime
ping** to hit `/health` on BOTH origins every 5 min:

**UptimeRobot (free):**
1. Add monitor → **HTTP(s)** → URL = `https://<origin>/health` (with
   `x-api-key` header — UptimeRobot supports custom headers on paid; on free,
   point at `/v1/health` which is also keyed, or expose an unkeyed `/ping`).
2. Set interval = 5 minutes.
3. Repeat for each origin.
4. Optionally alert you if an origin goes down.

**Better Uptime / Cron-job.org** — same idea, different UI.

> Note: the gateway's `/health` and `/v1/health` currently require `x-api-key`.
> Free uptime pingers (UptimeRobot free) can't send custom headers, so either
> (a) use a pinger that supports headers (UptimeRobot paid / Better Uptime), or
> (b) later add a tiny unkeyed `GET /ping` returning `{ok:true}` for public
> pingers. Until (b) exists, use a header-capable pinger or ping `/v1/health`
> with the key configured in the monitor.

### 4. Verify
```bash
# primary (may be suspended) vs backup
curl -s -w "\n[%{http_code}]\n" -H "x-api-key: $KEY" https://<primary>/health
curl -s -w "\n[%{http_code}]\n" -H "x-api-key: $KEY" https://<backup>/health
# from the app: kill the primary, confirm the app still loads products/checkout.
```

---

## Rollback / rotation
- To retire an origin: remove it from `extra.gatewayUrls` and let the external
  pinger stop. No app rebuild if you only *remove* (runtime reads the list).
- To rotate the Woo key: update env on **both** origins; the app is unaffected.
