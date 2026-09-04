import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerDeenRoutes } from "./routes.js";

async function build() {
  const app = Fastify({
    logger: { level: config.logLevel },
    bodyLimit: 524_288, // 512 KB
    connectionTimeout: 10_000,
    trustProxy: true,
  });

  // Align HTTP keep-alive with cloud reverse proxies / load balancers
  app.server.keepAliveTimeout = 65_000;
  app.server.headersTimeout = 66_000;

  // CORS: restrict to known origins (SEC-8) and development environments.
  await app.register(cors, {
    origin: (origin, cb) => {
      // Browser same-origin / no-origin requests (curl) are allowed.
      if (!origin) return cb(null, true);
      const allowed = config.allowedOrigins || [];
      if (
        allowed.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.includes("vercel.app") ||
        origin.includes("onrender.com") ||
        origin.includes("deencommerce.com") ||
        origin.includes("localhost")
      ) {
        return cb(null, true);
      }
      return cb(new Error("CORS origin not allowed: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-api-key",
      "authorization",
      "Authorization",
      "idempotency-key",
      "Idempotency-Key",
      "x-idempotency-key",
      "x-gateway-key",
      "x-request-id",
    ],
    exposedHeaders: ["x-request-id", "idempotency-key", "Content-Type"],
  });

  // Optional client authentication: every request must carry x-api-key or x-gateway-key
  // when GATEWAY_API_KEY is enforced.
  // The mobile app embeds its client key in app.json (extra.gatewayApiKey);
  // accept well-known client keys too so app<->gateway stay in sync.
  const ACCEPTED_KEYS = new Set(
    [
      config.apiKey,
      "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973",
      "deen_mobile_gateway_secret_2026",
      "deen_commerce_cluster_secret_key_2026",
    ].filter(Boolean)
  );

  app.addHook("onRequest", async (req, reply) => {
    if (req.method === "OPTIONS") return;

    const path = req.url.split("?")[0];

    // Public endpoints exempt from requiring client api keys
    const isPublic =
      path === "/" ||
      path.startsWith("/v1/health") ||
      path.startsWith("/v1/deen/webhooks") ||
      path.startsWith("/v1/auth") ||
      path.startsWith("/v1/deen/catalog") ||
      path.startsWith("/v1/deen/campaigns") ||
      path.startsWith("/v1/deen/offers") ||
      path.startsWith("/v1/deen/outlets") ||
      path.startsWith("/v1/deen/coupon") ||
      path.startsWith("/v1/deen/districts") ||
      path.startsWith("/v1/deen/shipping-zones") ||
      path.startsWith("/v1/deen/settings") ||
      path.startsWith("/v1/deen/pathao/track");

    if (isPublic) return;

    const providedKey =
      (req.headers["x-api-key"] as string) ||
      (req.headers["x-gateway-key"] as string) ||
      "";

    if (config.apiKey && (!providedKey || !ACCEPTED_KEYS.has(providedKey))) {
      return reply.code(401).send({ error: "UNAUTHENTICATED", message: "Invalid x-api-key." });
    }
  });

/* ------------------------------------------------------------------ */
/*  Multi-tier in-memory rate limiter with bounded storage (SEC-9).   */
/*  Protects Auth (10/m), Orders (6/m), and Catalog (120/m).          */
/* ------------------------------------------------------------------ */
type _RateEntry = { count: number; resetAt: number };
const _rateStore: Map<string, _RateEntry> = new Map();
const _RL_WINDOW_MS = 60_000;
const _MAX_STORE_SIZE = 10_000;

function _pruneExpired(now: number) {
  if (_rateStore.size > _MAX_STORE_SIZE) {
    for (const [k, v] of _rateStore.entries()) {
      if (v.resetAt <= now) _rateStore.delete(k);
    }
  }
}

function _checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  _pruneExpired(now);
  const entry = _rateStore.get(key);
  if (!entry || entry.resetAt <= now) {
    _rateStore.set(key, { count: 1, resetAt: now + _RL_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

function _rateLimitHook() {
  return app.addHook("onRequest", async (req, reply) => {
    if (req.method === "OPTIONS") return;
    const path = req.url.split("?")[0] || "";
    if (path === "/" || path === "/health" || path.startsWith("/v1/health")) return;

    const ip = req.ip || (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

    // Tier 1: Auth routes (10 req/min/IP)
    if (path.startsWith("/v1/auth/") || path.startsWith("/v1/deen/auth/")) {
      const limit = config.authRateLimit || 10;
      if (!_checkRateLimit(`auth:${ip}`, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many login attempts. Please wait a minute and try again." });
      }
      return;
    }

    // Tier 2: Order placement POST (6 req/min/IP)
    if (req.method === "POST" && (path === "/v1/deen/orders" || path === "/v1/orders")) {
      const limit = config.orderRateLimit || 6;
      if (!_checkRateLimit(`order:${ip}`, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many orders placed in a short window. Please wait a minute." });
      }
      return;
    }

    // Tier 2B: AI Assistant & RAG Chat (30 req/min/IP)
    if (path === "/v1/deen/ai/chat") {
      const limit = 30;
      if (!_checkRateLimit(`aichat:${ip}`, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many AI assistant messages. Please wait a moment." });
      }
      return;
    }

    // Tier 3: General public browsing (120 req/min/IP when unauthenticated)
    const hasValidApiKey = Boolean(config.apiKey && req.headers["x-api-key"] === config.apiKey);
    if (!hasValidApiKey) {
      const limit = config.catalogRateLimit || 120;
      if (!_checkRateLimit(`catalog:${ip}`, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many requests. Please slow down." });
      }
    }
  });
}

  await registerDeenRoutes(app);
  _rateLimitHook();
  app.get("/", async () => ({ name: "DEEN Gateway", mode: config.apiKey ? "keyed" : "open", docs: "/v1/health" }));

  return app;
}

build()
  .then((app) =>
    app.listen({ port: config.port, host: "0.0.0.0" }).then(() => {
      console.log(`[gateway] listening on :${config.port} (mode=${config.woo.consumerKey ? "live" : "seed"})`);
      if (config.dataDir.startsWith("/tmp")) {
        console.warn(`[gateway] DATA_DIR=${config.dataDir} is ephemeral (S1 scalability scope: set DATA_DIR to a persistent disk or Redis-backed store before horizontal scaling; sessions/orders in /tmp are lost on deploy/restart).`);
      }
    })
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
