import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerDeenRoutes } from "./routes.js";

export async function build() {
  const app = Fastify({
    logger: { level: config.logLevel },
    bodyLimit: 524_288, // 512 KB
    connectionTimeout: 10_000,
    trustProxy: process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true",
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
        (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
      ) {
        return cb(null, true);
      }
      return cb(new Error("CORS origin not allowed: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

  // The gateway is OPEN: client identity is carried by the JWT Bearer token on
  // /v1/auth/* and /v1/deen/orders. There is no x-api-key gate. See the
  // companion note: the JWT signing secret (SESSION_SIGNING_SECRET) still
  // validates customer identity; the x-api-key previously only identified the
  // app and is now dead config.
  app.addHook("onRequest", async (_req, _reply) => {
    // No key gate. Public endpoints remain exempt (health, auth, catalog, ...);
    // all /v1/deen routes are open. Only rate limits apply (see _rateLimitHook).
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
  if (_rateStore.size >= _MAX_STORE_SIZE) {
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
    if (_rateStore.size >= _MAX_STORE_SIZE && !entry) return false;
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

    // Tier 3: General public browsing (120 req/min/IP, including public client keys)
    {
      const limit = config.catalogRateLimit || 120;
      if (!_checkRateLimit(`catalog:${ip}`, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many requests. Please slow down." });
      }
    }
  });
}

  _rateLimitHook();
  await registerDeenRoutes(app);
  app.get("/", async () => ({ name: "DEEN Gateway", mode: "open", docs: "/v1/health" }));

  return app;
}

