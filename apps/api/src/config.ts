import "dotenv/config";

export interface StoreConfig {
  id: string;
  /** API key this store's app sends as x-api-key. */
  apiKey: string;
  woo: {
    site: string;
    consumerKey: string;
    consumerSecret: string;
  };
  brand?: {
    name?: string;
    primaryColor?: string;
  };
}

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
  /** Multi-tenant store registry (SaaS). JSON array in STORES env.
      When set, each store is keyed by its own apiKey and carries its own
      Woo credentials + branding. The default (legacy) store uses the top-level
      woo config + GATEWAY_API_KEY. */
  stores: parseStores(process.env.STORES),
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

function parseStores(raw?: string): StoreConfig[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as StoreConfig[];
  } catch {
    console.error("[config] STORES env was not valid JSON — ignoring multi-tenant config.");
  }
  return [];
}

/** Resolve a store by the x-api-key a client sends. Falls back to the
    legacy/default store when no multi-tenant registry matches. */
export function resolveStore(apiKey?: string): StoreConfig | null {
  if (!apiKey) return null;
  return config.stores.find((s) => s.apiKey === apiKey) ?? null;
}

/** True when live WooCommerce credentials are present. */
export const wooEnabled = Boolean(config.woo.consumerKey && config.woo.consumerSecret);
/** True when Pathao credentials are present. */
export const pathaoEnabled = Boolean(config.pathao.clientId && config.pathao.clientSecret && config.pathao.username && config.pathao.password);

