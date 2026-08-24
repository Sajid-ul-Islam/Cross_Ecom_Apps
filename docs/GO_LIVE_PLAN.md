# Go-Live Plan — DEEN App (prioritized)

> Goal: get the app in front of REAL customers ASAP. Derived from a code audit of the
> current state (gateway + mobile). Parked/non-blocking items are called out.

## TL;DR priority
1. **P0 — Bring the gateway back live** (Render suspended + verify env). Nothing works without it.
2. **P0 — Prove a real order reaches Woo** (login → cart → checkout → Woo order + manual payment).
3. **P1 — Decide & harden the payment model** (manual TrxID now; real gateway later).
4. **P1 — Ship a distributable build** (Play Store AAB, or at least a hosted/signed APK).
5. **P2 — Polish & parked features** (per-fit charts, push, admin panel).

---

## P0 — BLOCKERS (app is dead without these)

### P0-1. Reactivate the Render gateway + fix env
- **State**: live gateway returns `<title>Service Suspended</title>`. Render froze the free
  service. App is a thin client → with no gateway, the app shows nothing.
- **Action**:
  - Unsuspend/reactivate the service in Render dashboard (or redeploy to resume).
  - Confirm Render env vars:
    - `WOO_SITE=https://deencommerce.com`  ← NOT `.bd` (key is for `.com`; otherwise 401)
    - `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` = the NEW keys (verified working on `.com`)
    - `GATEWAY_API_KEY` (user said set on Render)
    - `x-api-key` the app sends must match (app's `extra.gatewayApiKey`)
  - After deploy: `curl https://cross-ecom-apps.onrender.com/v1/health` → expect `woo: ok`.
- **Why first**: every other test depends on a live gateway.

### P0-2. End-to-end order proof (login → Woo)
- **State**: `pushWooOrder` (routes.ts ~927) builds a real Woo order; `auth/login`,
  `auth/guest`, `auth/register` exist; checkout posts `/v1/deen/orders`. Not yet verified
  live against `.com` with the new key.
- **Action** (once P0-1 live):
  - Log in with a REAL customer WP account (test creds `sazid` were used before — re-verify).
  - Add a jean to cart → checkout (COD or manual bKash) → confirm a Woo order is created
    with correct items, price, cashback coupon, and customer note.
  - Verify the order appears in `deencommerce.com` WP-Admin → WooCommerce → Orders.
- **Why**: this is the money path. A broken order = no business.

### P0-3. Secrets hygiene (one-time, critical)
- `.env` was previously committed + scrubbed from history. **Rotate the Woo keys** if they
  were ever exposed. The new keys are in `.env` (untracked) + Render — keep `.env` out of git
  (`git status` clean, `.gitignore` covers it).
- Confirm no secrets in the APK (app only holds `extra.gatewayApiKey`, which is client-id, not a secret — OK).

---

## P1 — Launch-quality (do before public release)

### P1-1. Payment model decision
- **State**: NO bKash/Nagad/SSLCommerz keys. Payments are **manual**: customer sends money
  to merchant `01952700500` and enters the TrxID; gateway marks order Paid + syncs to Woo.
- **Options**:
  - **(A) Launch with manual + COD** — shippable now, zero integration. Risk: trust/manual
    reconciliation; some customers expect in-app paid confirmation.
  - **(B) Integrate a real gateway** (SSLCommerz / bKash Payment Gateway) — needs a merchant
    account + API keys + callback verification. More trustworthy, more setup.
- **Recommendation for "ASAP"**: ship (A) first (COD + manual TrxID), and queue (B) as P2.
  Clearly label the manual steps in-app so customers aren't confused.

### P1-2. Distributable build
- **State**: only a sideloaded debug APK exists (built earlier, on emulator). Real customers
  need a distribution channel.
- **Action**:
  - Generate a **signed release AAB** (`gradlew bundleRelease` + upload key) for Google Play.
  - OR host a signed APK for direct install (simpler, but Play Protect warnings).
  - Need: Play Console developer account, privacy policy URL, store listing (screenshots,
    description), app icon (DEEN brand already done).
- **Note**: `eas build` is blocked on Windows; use `expo prebuild` + Gradle (already proven).

### P1-3. Basic production hardening
- Error reporting: `reportBug` exists (gateway `/v1/deen/bugs`). Confirm it's on.
- Rate limiting + audit logging: present (security.ts). Good.
- Offline order queue: present (OrderContext). Good.
- Remove any remaining seed/demo content shown to customers (e.g. `INITIAL_BROADCASTS` bc_1
  DEEN20 promo is demo data — confirm it matches a real Woo coupon or remove).

---

## P2 — Later (parked / enhancement)

- **Per-fit jeans size charts** → see `BLOG_JEANS_FIT_CHARTS.md` (parked; needs brand tables).
- **Push notifications** → Expo push tokens wired; needs Expo push key + real campaigns.
- **Admin panel** (the future home for connection-health, sales/BI, broadcast management).
- **Real payment gateway** integration (P1-1 option B).
- **Multi-tenant SaaS** (config.ts `STORES` scaffolding exists; thread through wooFetch).

---

## Definition of "live for customers"
Gateway up (P0-1) + a real order reaches Woo (P0-2) + a signed build customers can install
(P1-2) + payment path clearly communicated (P1-1). Fit-charts and admin panel are NOT required
for launch.
