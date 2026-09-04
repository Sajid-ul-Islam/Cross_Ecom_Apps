# High-Traffic Monorepo Architecture & Systems Specification

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Clients["Customer Frontends"]
        Mobile["📱 React Native / Expo App<br/>(Android & iOS)"]
        Web["💻 Next.js 14 App<br/>(SSR, RSC & Mobile View)"]
    end

    subgraph Edge["Edge Infrastructure & Ingress"]
        CF["Cloudflare CDN / Proxy<br/>(SSL Termination & DDoS Shield)"]
        LoadBalancer["Reverse Proxy / Ingress<br/>(60s Keep-Alive Window)"]
    end

    subgraph Gateway["Fastify API Gateway (apps/api)"]
        KeepAlive["Keep-Alive & Headers Timeout<br/>(65s / 66s)"]
        RateLimiter["Memory-Bounded Rate Limiter<br/>(Auth: 10/m, Order: 6/m, Public: 120/m)"]
        Cache["In-Memory Catalog & Social Cache<br/>(Catalog: 5m, Social: 15m)"]
        Idempotency["Idempotency Engine & Lock Manager<br/>(Double-Submit Protection)"]
        AIRAG["DEEN AI Concierge & Knowledge RAG"]
    end

    subgraph Upstream["Upstream Business Systems"]
        WC["WordPress / WooCommerce Core<br/>(https://deencommerce.com)"]
        Pathao["Pathao Logistics Hermes API<br/>(Consignment & Tracking)"]
        Social["Curated Social Media Feed<br/>(Reels & Stories)"]
    end

    Mobile -->|HTTPS / API Calls| CF
    Web -->|HTTPS / API Calls| CF
    CF --> LoadBalancer
    LoadBalancer --> KeepAlive
    KeepAlive --> RateLimiter
    RateLimiter --> Cache
    RateLimiter --> Idempotency
    RateLimiter --> AIRAG

    Cache -->|Cached Reads (95%+)| Clients
    Cache -->|Cache Miss / Refresh| WC
    Idempotency -->|Create Order with Retry Jitter| WC
    Idempotency -->|Book Consignment| Pathao
    AIRAG -->|Catalog Lookup & Sizing Logic| WC
    Gateway -->|Curated Feed & Tags| Social
```

---

## 2. Infrastructure & Edge Resilience Standards

### 2.1 Keep-Alive & Socket Alignment
To prevent cloud proxy timeout races (`502 Bad Gateway`) between edge reverse proxies (Cloudflare/Render with 60s idle socket timeouts) and the Node.js Fastify process:
- `app.server.keepAliveTimeout = 65_000` (65 seconds)
- `app.server.headersTimeout = 66_000` (66 seconds)
- Enforce strict `bodyLimit: 524_288` (512 KB) to prevent heap memory exhaustion during high traffic bursts.

### 2.2 Multi-Tier Rate Limiting with Heap Memory Protection
- **Auth & Login**: `10 req/min/IP`
- **Order Placement (`POST /v1/deen/orders`)**: `6 req/min/IP`
- **Public Catalog Browsing**: `120 req/min/IP`
- **Memory Bounding**: The rate limiter enforces automated pruning (`_pruneExpired()`) on internal maps exceeding 10,000 entries, preventing memory leaks during flash sales.

### 2.3 Exponential Backoff with Jitter (`woo.ts`)
Upstream requests against WordPress/WooCommerce implement randomized exponential backoff:
$$\text{delay} = 200\text{ms} \times 2^{\text{attempt}} + \text{random}(0, 150\text{ms})$$
- Retries are capped at `MAX_RETRIES = 2` with `TIMEOUT_MS = 6000` so Fastify handles degradation gracefully before client 8s abort timers trip.

---

## 3. Core Data Flows

### 3.1 Order Placement & Idempotency Pipeline
1. Client generates UUID v4 idempotency key per checkout attempt.
2. Gateway verifies key state in memory / persistent store.
3. If already processed, returns previously created order record immediately.
4. If in-flight, queues second request until lock resolves.
5. Injects verified district code (`BD-XX`), calculates exact delivery fee (৳50 Dhaka / ৳90 Outside Dhaka), and posts to WooCommerce.
6. Auto-associates Pathao consignment when available and returns order confirmation with live tracking links.

### 3.2 In-Memory Catalog Caching & Single-Flight Warming
- Upstream catalog responses are cached in gateway memory with 5-minute TTL.
- Under heavy concurrent load, multiple identical requests coalesce into a single upstream fetch via promise sharing (`catalogWarming`), preventing the "thundering herd" problem from bringing down the WordPress server.

### 3.3 Social Media Content & 1-Tap Commerce
- Gateway exposes `GET /v1/deen/social/feed` caching curated video reels and stories for 15 minutes.
- Each reel carries metadata for linked apparel items.
- Clients consume the feed via isolated services (`socialContent.ts`), providing instant "Quick Bag" or PDP navigation without external scraping.

### 3.4 DEEN AI Concierge & Knowledge RAG
- The AI Concierge answers real-time inventory questions, sizing queries, showroom locations, and delivery pricing.
- Evaluated and verified by automated test suites in `apps/api/src/ai/ai.test.ts`.
