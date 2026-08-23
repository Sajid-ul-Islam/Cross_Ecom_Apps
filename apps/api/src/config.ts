import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Public base URL of THIS gateway. Used to advertise itself on /v1/health. */
  publicUrl: process.env.GATEWAY_PUBLIC_URL ?? "",
  /** Optional client key apps must send as x-api-key. Blank = open. */
  apiKey: process.env.GATEWAY_API_KEY ?? "",
  /** Allowed CORS origins (comma-separated). Defaults to known app origins. */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").length
    ? process.env.ALLOWED_ORIGINS!.split(",").map((s) => s.trim()).filter(Boolean)
    : ["https://cross-ecom-apps.onrender.com", "http://localhost:3001", "http://localhost:8081", "exp://10.0.0.2:19000"],
  /** Rate-limit threshold (auth endpoints, per IP per window). */
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 20),
  logLevel: (process.env.LOG_LEVEL as "info" | "debug" | "warn" | "error") ?? "info",
  woo: {
    site: process.env.WOO_SITE ?? "https://deencommerce.com",
    consumerKey: process.env.WOO_CONSUMER_KEY ?? "",
    consumerSecret: process.env.WOO_CONSUMER_SECRET ?? "",
  },
  pathao: {
    baseUrl: process.env.PATHAO_BASE_URL ?? "https://hermes-api.pathao.com",
    clientId: process.env.PATHAO_CLIENT_ID ?? "",
    clientSecret: process.env.PATHAO_CLIENT_SECRET ?? "",
    username: process.env.PATHAO_USERNAME ?? "",
    password: process.env.PATHAO_PASSWORD ?? "",
    storeId: process.env.PATHAO_STORE_ID ?? "",
  },
};

/** True when live WooCommerce credentials are present. */
export const wooEnabled = Boolean(config.woo.consumerKey && config.woo.consumerSecret);
/** True when Pathao credentials are present. */
export const pathaoEnabled = Boolean(config.pathao.clientId && config.pathao.clientSecret && config.pathao.username && config.pathao.password);

