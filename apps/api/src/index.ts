import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerDeenRoutes } from "./routes.js";

async function build() {
  const app = Fastify({ logger: { level: config.logLevel } });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
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
