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
    : [
        "https://cross-ecom-apps.onrender.com",
        "https://cross-ecom-apps-4b4n.onrender.com",
        "https://deencommerce.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8081",
        "http://localhost:8082",
        "exp://10.0.0.2:19000",
      ],
  /** Rate-limit thresholds (per IP per minute). */
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
  catalogRateLimit: Number(process.env.CATALOG_RATE_LIMIT ?? 120),
  orderRateLimit: Number(process.env.ORDER_RATE_LIMIT ?? 6),
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
  /** Shared secret for verifying WooCommerce webhook signatures
      (X-WC-Webhook-Signature). Set this, then call POST /v1/deen/webhook/woo/register
      once to auto-provision the webhooks in Woo. */
  webhookSecret: process.env.WEBHOOK_SECRET ?? "",
  /** Public store notice shown as a dismissible banner in the app.
      Source of truth = set here (Render env), NOT hardcoded in the app bundle.
      Leave blank for no banner. Example: "Get ৳500 cashback on orders over ৳2500". */
  publicNotice: process.env.PUBLIC_NOTICE ?? "",
  /** Express (same-day) delivery surcharge added on top of the Inside Dhaka Woo
      zone fee. Admin can change via EXPRESS_SURCHARGE env without app rebuild. */
  expressSurcharge: Number(process.env.EXPRESS_SURCHARGE ?? "70"),
  /** Curated combos/bundles (source of truth = Render env COMBOS as JSON).
      Admin edits this to change the "Add Combo" window without an app rebuild.
      Shape: [{ id, name, image?, description?, items:[{productId,size?}], price? }] */
  combos: (() => {
    try { return JSON.parse(process.env.COMBOS ?? "[]"); } catch { return []; }
  })(),
  /** Dynamic campaign controls (Cashback vs Up to 50% Sale).
      Source of truth = gateway env / REST API, allows auto-triggering on/off. */
  campaigns: {
    cashbackEnabled: process.env.CAMPAIGN_CASHBACK_ENABLED === "true", // Default false: Cashback offer is currently OFF
    saleEnabled: process.env.CAMPAIGN_SALE_ENABLED !== "false", // Default true: Up to 50% Sale is LIVE
    saleTitle: process.env.CAMPAIGN_SALE_TITLE ?? "FLAT UP TO 50% OFF",
    saleSubtitle: process.env.CAMPAIGN_SALE_SUBTITLE ?? "Season Clearance: 40%–50% discount on selected artisanal denim & apparel",
    saleBadge: process.env.CAMPAIGN_SALE_BADGE ?? "LIMITED TIME SALE",
    discountRange: "40%–50%",
  },
  /** Store contact details (source of truth = gateway env, falls back to the
      real DEEN numbers). Admin can change via env without an app rebuild. */
  contact: {
    hotline: process.env.STORE_HOTLINE ?? "09617-700500",
    whatsapp: process.env.STORE_WHATSAPP ?? "01952-700500",
    bkash: process.env.STORE_BKASH ?? "01952700500",
    email: process.env.STORE_EMAIL ?? "support@deencommerce.com",
  },
  pathao: {
    baseUrl: process.env.PATHAO_BASE_URL ?? "https://hermes-api.pathao.com",
    clientId: process.env.PATHAO_CLIENT_ID ?? "",
    clientSecret: process.env.PATHAO_CLIENT_SECRET ?? "",
    username: process.env.PATHAO_USERNAME ?? "",
    password: process.env.PATHAO_PASSWORD ?? "",
    storeId: process.env.PATHAO_STORE_ID ?? "",
  },
  /** Exchange fees — admin-editable via env without app rebuild. */
  exchangeFees: {
    insideDhaka: Number(process.env.EXCHANGE_FEE_INSIDE ?? "50"),
    outsideDhaka: Number(process.env.EXCHANGE_FEE_OUTSIDE ?? "90"),
  },
  /** Physical retail outlets (source of truth = STORE_OUTLETS env JSON).
      Admin edits this to add/remove/rename outlets without an app rebuild.
      Shape: [{ id, name, tag?, address, hours, phone, mapQuery?, pickup? }] */
  outlets: (() => {
    try { return JSON.parse(process.env.STORE_OUTLETS ?? "[]"); } catch { return []; }
  })(),
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

