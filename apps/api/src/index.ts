import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerDeenRoutes } from "./routes.js";

async function build() {
  const app = Fastify({ logger: { level: config.logLevel } });

  // CORS: restrict to known origins (SEC-8). Avoids reflecting arbitrary
  // origins which would let any website call the gateway with a user's cookies.
  await app.register(cors, {
    origin: (origin, cb) => {
      // Browser same-origin / no-origin requests (curl) are allowed.
      if (!origin) return cb(null, true);
      const allowed = config.allowedOrigins || [];
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), true); // reflect error
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "authorization"],
  });

  // Optional client authentication: every request must carry x-api-key
  // when GATEWAY_API_KEY is set. This is app identification, not a secret
  // that unlocks Woo — the Woo key stays server-side regardless.
  if (config.apiKey) {
    app.addHook("onRequest", async (req, reply) => {
      if (req.method === "OPTIONS") return;
      if (req.headers["x-api-key"] !== config.apiKey) {
        return reply.code(401).send({ error: "UNAUTHENTICATED", message: "Invalid x-api-key." });
      }
    });
  }


/* ------------------------------------------------------------------ */
/*  Lightweight in-memory rate limiter for auth endpoints (SEC-9).       */
/*  No external dependency needed — simple sliding-window per IP.        */
/* ------------------------------------------------------------------ */
type _RateEntry = { count: number; resetAt: number };
const _rateStore: Map<string, _RateEntry> = new Map();
const _RL_WINDOW_MS = 60_000;

function _checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = _rateStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    _rateStore.set(ip, { count: 1, resetAt: now + _RL_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

function _rateLimitHook() {
  return app.addHook("onRequest", async (req, reply) => {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const isAuthRoute = req.url.startsWith("/v1/auth/");
    if (isAuthRoute && !req.headers["x-api-key"]) {
      // Only rate-limit when api-key is not present (i.e. the gateway is "open").
      // When api-key is enforced, that's the primary auth surface.
      const limit = config.authRateLimit || 20;
      if (!_checkRateLimit(ip, limit)) {
        return reply.code(429).send({ error: "RATE_LIMITED", message: "Too many requests. Please wait a minute and try again." });
      }
    }
  });
}

  await registerDeenRoutes(app);

  app.get("/", async () => ({ name: "DEEN Gateway", mode: config.apiKey ? "keyed" : "open", docs: "/v1/health" }));

  return app;
}

build()
  .then((app) =>
    app.listen({ port: config.port, host: "0.0.0.0" }).then(() => {
      console.log(`[gateway] listening on :${config.port} (mode=${config.woo.consumerKey ? "live" : "seed"})`);
    })
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
