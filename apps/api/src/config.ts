import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Public base URL of THIS gateway. Used to advertise itself on /v1/health. */
  publicUrl: process.env.GATEWAY_PUBLIC_URL ?? "",
  /** Optional client key apps must send as x-api-key. Blank = open. */
  apiKey: process.env.GATEWAY_API_KEY ?? "",
  logLevel: (process.env.LOG_LEVEL as "info" | "debug" | "warn" | "error") ?? "info",
  woo: {
    site: process.env.WOO_SITE ?? "https://deencommerce.bd",
    consumerKey: process.env.WOO_CONSUMER_KEY ?? "",
    consumerSecret: process.env.WOO_CONSUMER_SECRET ?? "",
  },
};

/** True when live WooCommerce credentials are present. */
export const wooEnabled = Boolean(config.woo.consumerKey && config.woo.consumerSecret);
