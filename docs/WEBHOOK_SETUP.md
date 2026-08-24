# Real-time sync: WooCommerce → DEEN Gateway webhooks

> Makes the app show new products / price changes / discounts / stock changes
> in **seconds** instead of waiting for the 5-min cache to expire.

## What it does
When you edit/add a product in `deencommerce.com` WP-Admin, WooCommerce POSTs a
webhook to the gateway. The gateway verifies the signature and **invalidates the
right cache** so the next app request re-fetches from Woo immediately.

- `product.*` → bust catalog + that product's variation cache
- `product_variation.*` → bust that product's variation cache (size price/stock)
- `category.*` → bust covers + catalog
- `order.*` / `customer.*` → bust derived stats

## Setup (one time, after deploy)
1. Set env `WEBHOOK_SECRET` on the **gateway** (Render) to a random string.
   (Local dev: it's already appended to `apps/api/.env`.)
2. Ensure the gateway `WOO_SITE=https://deencommerce.com` and the Woo keys are set.
3. Call the auto-provisioner (one POST does all of it — no WP Admin clicking):

```bash
curl -X POST https://cross-ecom-apps.onrender.com/v1/deen/webhook/woo/register
# optional, also wires covers + admin stats:
curl -X POST "https://cross-ecom-apps.onrender.com/v1/deen/webhook/woo/register?full=1"
```

It creates webhooks in Woo pointing at `<gateway>/v1/deen/webhook/woo` with the
matching secret, and skips duplicates if re-run.

## Verify it works
- Edit a product price in Woo → within ~1-2s the app listing reflects it.
- Check gateway logs for `woo_webhook` audit entries (verified + cache busted).
- Manual test: `curl -X POST <gateway>/v1/deen/webhook/woo -H "content-type: application/json" -d '{"id":123}'` (with the correct signature header if secret set).

## Security
- Every webhook is HMAC-SHA256 verified against `WEBHOOK_SECRET` (Woo sends
  `X-WC-Webhook-Signature`). Bad signatures → `401 BAD_SIGNATURE`.
- If `WEBHOOK_SECRET` is blank, verification is skipped (dev convenience only).

## Files
- `apps/api/src/woo.ts` — `invalidateCatalogCache` / `invalidateVariationCache` /
  `invalidateCoverCache` / `invalidateStats` + `wooPost` helper.
- `apps/api/src/routes.ts` — `POST /v1/deen/webhook/woo` (receiver, topic-aware)
  + `POST /v1/deen/webhook/woo/register` (auto-provisioner).
- `apps/api/src/config.ts` — `config.webhookSecret`.
