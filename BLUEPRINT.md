# DEEN Commerce — SaaS Production-Grade Blueprint

> Goal: run the DEEN storefront like a real retail business AND evolve the gateway
> into a reusable, multi-tenant commerce backend (true SaaS).
>
> **Core rule (source of truth):** the app is a thin client over
> `gateway → WooCommerce → WordPress`. Every product, price, size, category cover
> image, and social/showcase image MUST originate from Woo/WordPress via the
> gateway. Never hardcode, bundle third-party AI-hosted images, or scrape
> Facebook/Instagram directly — surface WP/Woo media via the gateway instead.

---

## 0. Reliability (no more "blank / 401 / timeout" in front of customers)

- [ ] **Gateway `/health`** returns `woo: ok|degraded|down`; app shows cached catalog + soft "prices may be a few min old" banner on degrade (never a hard error).
- [ ] **Caching + rate-limit protection:** extend existing 5-min catalog cache to covers, stats, variations (TTL 60–300s) so a Woo hiccup never takes down the store.
- [ ] **Retry + timeout + circuit-breaker** on every Woo call so one bad request can't snowball.
- [ ] **Centralized error model** `{error, message, retryable}` → app shows retry vs contact-support vs offline.
- [ ] **Observability:** request logs, error alerts (Slack/email) on Woo/gateway failure, uptime monitoring.
- [ ] **Rotatable `GATEWAY_API_KEY`** + per-store API keys for multi-tenant future.
- [ ] **CI guard:** automated typecheck/tests on PR so a missing `build` script (the a955ebe break) can't reach production. Render PR preview deploys.

## 1. Conversion & Sales (the money part)

- [ ] **Frictionless auth:** finish in-app **registration (Option B)** + one-tap login; add **passwordless / OTP** (SMS via Pathao or BD SMS gateway) and later "Continue with Google".
- [ ] **Cart & checkout that convert:** saved addresses from Woo, express checkout, **abandoned-cart recovery** (gateway fires Woo/email reminder), live **cashback + free-gift** messaging in the bag.
- [ ] **Trust signals on PDP:** real ratings/reviews (Woo), stock urgency ("Only 2 left"), delivery ETA, 7-day exchange promise backed by real data.
- [ ] **Personalization:** "Recommended for your size", "New arrivals", "Best sellers" from Woo reports on Home.
- [ ] **Promotions engine:** coupons/bundles/offers pulled from Woo as banners — never hardcoded.
- [ ] **Post-purchase:** order tracking (Pathao already integrated), push notifications for status, reorder from history.
- [ ] **BD-local payments:** **bKash / Nagad / SSLCommerz** at checkout (currently COD only) — biggest BD conversion lever.

## 2. Multi-tenancy = actual SaaS

- [ ] **Per-store config:** `store_id` → Woo URL + keys + branding, looked up by API key or subdomain (`storeA.deenapi.com`).
- [ ] **Tenant isolation** in cache/state; **usage metering** (requests/orders per store) for billing.
- [ ] **White-label app** build per store (Expo EAS channels) with store branding from Woo.
- [ ] Turn the DEEN gateway into a commerce backend you can sell to other BD retailers.

## 3. Data, Security, Compliance

- [ ] **Backups** of gateway config + audit logs; Cloudflare/WAF in front.
- [ ] **PII handling:** encrypt tokens at rest, minimize stored data, enforce promo-consent flags.
- [ ] **Input validation** on all gateway endpoints (orders, auth) + schema tests.
- [ ] **Rate limiting per API key** to stop abuse.
- [ ] **GDPR-style rights:** account deletion, data export.

## 4. App Quality (what the customer feels)

- [ ] **Performance:** WebP/resize via Woo/CDN, list virtualization, instant navigation.
- [ ] **Offline resilience:** full offline catalog + queue orders when back online.
- [ ] **Accessibility & i18n:** Bengali + English, scalable text, WCAG contrast (enforce in themes).
- [ ] **Crash-free releases:** staged rollout, crash reporting (Sentry), privacy-first analytics.
- [ ] **Store-listing readiness:** real privacy policy, support contact, smooth first-run.

## 5. Ops & Growth

- [ ] **CI/CD:** automated tests + preview deploys; bad pushes never reach customers.
- [ ] **A/B tests** for PDP/checkout to lift sales.
- [ ] **SEO/Share:** product deep links + social cards.
- [ ] **Support:** in-app chat/ticket, FAQ, return flow.

---

## Phased Roadmap

### Phase 0 — this release (ship with next APK)
- [ ] In-app registration (Option B) + Sign-Up toggle in login modal.
- [ ] Dark / Light theme switcher (persist to AsyncStorage).
- [ ] Loading skeletons + brand placeholders for all remote images.
- [ ] Offline banner + cached-catalog fallback.
- [ ] Cart cashback / free-gift live messaging.
- [ ] Verify & fix app icon after install.
- [ ] CI typecheck guard.

### Phase 1 — Reliability + Conversion (highest BD leverage)
- [ ] Caching + circuit-breaker + centralized errors.
- [ ] OTP / passwordless login.
- [ ] Saved addresses synced to Woo.
- [ ] **bKash / Nagad / SSLCommerz** payments.
- [ ] Order history + Pathao tracking + push notifications.

### Phase 2 — Sales Engine
- [ ] Personalization (recommendations by size).
- [ ] Promos/bundles/offers from Woo.
- [ ] Abandoned-cart cart recovery.
- [ ] Ratings/reviews from Woo.
- [ ] Full BD payments.

### Phase 3 — SaaS
- [ ] Multi-tenant store config + metering/billing.
- [ ] White-label Expo app builds per store.
- [ ] Tenant dashboard.

---

## Status (as of 2026-08-23)
- ✅ Category covers now sourced from Woo (`/v1/deen/category-covers`) — live & verified.
- ✅ x-api-key 401 fixed; login reaches WordPress.
- ✅ Panjabi broken-size sanitization (mobile, committed).
- ✅ Round social buttons (WhatsApp/IG/FB) + login keyboard fix (mobile, committed).
- ✅ Gateway deploy fixed (`build` script) — live on `a955ebe`.
- ⏳ APK not rebuilt (held per user). Mobile source on `master` awaiting rebuild.
- ⏳ Registration (Option B), dark mode, skeletons, offline banner, icon verify — Phase 0, not yet built.
