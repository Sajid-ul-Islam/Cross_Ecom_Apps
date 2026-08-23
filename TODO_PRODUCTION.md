# Production Hardening — To-Do Before Go-Live

> Development is fine as-is. Complete these before deploying to production.

---

## ⚙️ Config / Infra

- [ ] **Set `GATEWAY_API_KEY`** in Render environment variables
  - Pick any strong random string (e.g. `openssl rand -hex 32`)
  - Add it to Render → Environment → `GATEWAY_API_KEY=<value>`
  - Add the same value to the mobile app and web app as the `x-api-key` header

- [ ] **Rotate WooCommerce API keys**
  - Current key in `.env` has full read+write access
  - Go to WP Admin → WooCommerce → Settings → Advanced → REST API
  - Create a **Read-only** key for local dev use
  - Keep the **Read/Write** key only in Render's environment variables (never in `.env`)

- [x] **Persist sessions across gateway restarts** ✅ Done
  - `authSessions` persisted to `auth_sessions.json` (30-day TTL, pruned on load)
  - `guestSessions` persisted to `guest_sessions.json` (7-day TTL, pruned on load)
  - Same JSON file pattern as `orders` and `customers` — no new dependencies

---

_Last updated: 2026-08-22 | Security audit by Antigravity_
