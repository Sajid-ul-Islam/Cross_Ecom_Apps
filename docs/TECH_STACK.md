# Monorepo Tech Stack & Authoritative Version Matrix

> **Source of Truth:** This document is the single authoritative source of truth for all framework, SDK, runtime, and dependency versions across the monorepo. All other documentation, PRs, and AI coding agents must reference this matrix directly. **Never infer versions from historical review or migration logs.**

---

## 1. Monorepo Workspaces & Version Matrix

| Workspace | Domain / Purpose | Framework / Runtime | Version | Language / Tooling |
| :--- | :--- | :--- | :--- | :--- |
| **`apps/mobile`** | iOS & Android Native Retail App | **Expo SDK**<br>**React Native**<br>**React** | **`~57.0.17` (SDK 57)**<br>**`0.86.3`**<br>**`19.2.3`** | TypeScript `~6.0`<br>Expo Router `~57.0`<br>EAS Build (Android SDK 36)<br>`uuid@^11.1.1` override |
| **`apps/api`** | Fastify REST Middle Gateway | **Fastify**<br>**Node.js Runtime** | **`^5.12.5` (Fastify 5.x)**<br>**`>= 20.x` (LTS)** | TypeScript `^5.5`<br>`@fastify/cors@^11.3.0`<br>`tsx` `^4.19` (ESM native) |
| **`apps/web`** | Next.js Storefront & Mobile Web | **Next.js (App Router)**<br>**React** | **`^15.5.26` (Next 15)**<br>**`^18.3.1`** | TypeScript `^5.5`<br>Async Route Params (`Promise`)<br>`postcss@^8.5.28` override |
| **Root Tooling** | Monorepo Orchestration & CI | **Node.js / npm** | **Node `>= 20.x` / npm `>= 10`** | GitHub Actions CI<br>`tsx --test` Test Runner<br>`uuid@^11.1.1` |

---

## 2. Workspace Deep Dive

### A. Mobile Application (`apps/mobile`)
* **Framework:** Expo SDK 57 (`expo@~57.0.17`)
* **Core Native Engine:** React Native `0.86.3` + React `19.2.3`
* **Routing & Navigation:** Expo Router `~57.0.17` (Typed file-based routing)
* **Graphics & Icons:** `react-native-svg@15.15.4`, `lottie-react-native@~7.3.4`
* **Android Target:** Compile SDK `36`, Target SDK `36`, Min SDK `24`
* **iOS Target:** iOS Deployment Target `16.4`
* **Security & Overrides:** `uuid@^11.1.1` override (GHSA-w5hq-g745-h8pq clean)

### B. Gateway API (`apps/api`)
* **HTTP Framework:** Fastify `^5.12.5` (`@fastify/cors@^11.3.0`)
* **Execution:** Native TypeScript execution via `tsx` (zero compile step required in dev/prod)
* **Architecture:** In-memory high-throughput reverse gateway connected to WooCommerce (`https://deencommerce.com`) with rate limiting, response caching, exponential backoff, atomic single-flight order deduplication, two-phase idempotency reconciliation, and Pathao logistics tracking.

### C. Web Storefront (`apps/web`)
* **Framework:** Next.js `^15.5.26` (Next 15 App Router) + React `18.3.1`
* **Server Components:** Async route `params` and `searchParams` (`Promise`)
* **Build Configuration:** `outputFileTracingRoot` anchored to monorepo root
* **Security & Overrides:** `postcss@^8.5.28` override (0 vulnerabilities)
* **Deployment Target:** Vercel Edge / Node.js Runtime (Zero-config live gateway failover)
* **Parity Standard:** 100% feature and visual parity with the mobile app on mobile viewports (`< 768px`).

---

## 3. Upstream & External Integrations

| Service | Protocol / Endpoint | Purpose |
| :--- | :--- | :--- |
| **WooCommerce** | `https://deencommerce.com/wp-json/wc/v3` | Products catalog, variations, customer orders, inventory |
| **Pathao Logistics** | `https://hermes-api.pathao.com` | Automated consignment creation & live parcel tracking |
| **WhatsApp Hotline** | `https://wa.me/8801952700500` | 1-Tap Customer Concierge |
