# DEEN Commerce — Gateway API (`apps/api`)

[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![WooCommerce](https://img.shields.io/badge/WooCommerce-REST_Proxy-96588A?style=for-the-badge&logo=woocommerce&logoColor=white)](https://woocommerce.com/)

**High-performance Fastify middle-tier gateway** bridging the DEEN Mobile (Expo) & Web (Next.js) clients with the upstream WordPress / WooCommerce store at [deencommerce.com](https://deencommerce.com). See [`docs/TECH_STACK.md`](../../docs/TECH_STACK.md) for the authoritative version matrix.

---

## 🚀 Key Responsibilities

1. **Security & Credential Shielding**: Holds WooCommerce Consumer Key & Secret securely on the server; client apps communicate using an `x-api-key` header without exposing credentials.
2. **Resilient In-Memory Caching & Circuit Breaking**: Automatically caches catalog data (with 5-minute TTL) and falls back to bundled catalog snapshots if upstream WooCommerce times out or errors.
3. **Multi-Gateway Failover & Probing**: Exposes `/v1/health` and live endpoints designed to work seamlessly with client-side failover pools across Render / secondary cloud origins.
4. **Real-time Webhook Invalidation**: Verifies WooCommerce HMAC-SHA256 signatures (`/v1/deen/webhook/woo`) for immediate product/stock cache purging on inventory changes.
5. **Pathao Logistics & Order Fulfillment**: Normalizes order payload structure (64 Bangladesh districts, delivery charges, COD / bKash / Nagad metadata) and attaches Pathao consignment tracking IDs (`ptc_consignment_id`).

---

## 📡 REST API Specification

### Health & System
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/health` | Gateway status, upstream WooCommerce connectivity & uptime | Public |
| `GET` | `/v1/auth/demo-accounts` | Returns pre-configured demo test user accounts | Public |

### Catalog & Products
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/deen/products` | Paginated product list with search, category filtering & sort | `x-api-key` |
| `GET` | `/v1/deen/products/:id` | Single product details with live WooCommerce variations | `x-api-key` |
| `GET` | `/v1/deen/categories` | Store product categories list and count | `x-api-key` |
| `GET` | `/v1/deen/snapshot` | Bundled catalog snapshot for offline-first boot | `x-api-key` |
| `GET` | `/v1/deen/store-info` | Live WordPress / WooCommerce site metadata | `x-api-key` |

### Orders & Discounts
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/deen/order` | Place live WooCommerce order with district & delivery charges | `x-api-key` |
| `GET` | `/v1/deen/orders` | Customer order history query (phone / order ID / customer ID) | Bearer / Key |
| `GET` | `/v1/deen/coupon` | Validate coupon code against live WooCommerce discounts | `x-api-key` |
| `GET` | `/v1/deen/cashback` | Calculate dynamic tier-based cashback | `x-api-key` |

### Webhooks & Marketing
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/deen/webhook/woo` | Real-time WooCommerce webhook handler (product.created, etc.) | HMAC-SHA256 |
| `POST` | `/v1/deen/webhook/woo/register`| Auto-provisions WooCommerce webhooks on upstream store | `x-api-key` |
| `GET` | `/v1/deen/broadcasts` | Retrieve push notification broadcast history | `x-api-key` |
| `POST` | `/v1/deen/broadcasts` | Dispatch marketing announcement to audience targets | Admin Key |
| `POST` | `/v1/deen/returns` | File customer size exchange / return ticket | `x-api-key` |

---

## 🛠️ Environment Variables

Create a `.env` file in `apps/api/`:

```env
PORT=8807
HOST=0.0.0.0
NODE_ENV=development

# WooCommerce Upstream
WOO_URL=https://deencommerce.com
WOO_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOO_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Security Key (used by mobile and web clients)
DEEN_API_KEY=deen_secret_gateway_key_2026

# Webhook Secret (HMAC SHA-256)
WOO_WEBHOOK_SECRET=deen_webhook_secret_hmac_2026

# Pathao Logistics (Optional)
PATHAO_CLIENT_ID=
PATHAO_CLIENT_SECRET=
PATHAO_USERNAME=
PATHAO_PASSWORD=
```

---

## 💻 Local Development

```bash
# Navigate to API directory
cd apps/api

# Install dependencies
npm install

# Run typecheck
npm run typecheck

# Start development server with live reload
npm run dev

# Run standalone test scripts
npx tsx test_auth.ts
npx tsx test_pathao.ts
npx tsx test_payments.ts
```

---

## 🐳 Docker Deployment

```bash
# Build image
docker build -t deen-api:latest .

# Run container
docker run -p 8807:8807 --env-file .env deen-api:latest
```
