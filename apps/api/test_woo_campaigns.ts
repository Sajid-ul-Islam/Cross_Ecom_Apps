import { config } from "./src/config";

async function run() {
  console.log("Checking live WooCommerce API at:", config.woo.site);
  if (!config.woo.consumerKey || !config.woo.consumerSecret) {
    console.log("No consumer key/secret configured.");
    return;
  }

  const auth = Buffer.from(`${config.woo.consumerKey}:${config.woo.consumerSecret}`).toString("base64");

  try {
    const res = await fetch(`${config.woo.site}/wp-json/wc/v3/coupons?per_page=20`, {
      headers: {
        Authorization: `Basic ${auth}`,
        "User-Agent": "DEEN-Gateway/1.0",
      },
    });
    console.log("Coupons status:", res.status);
    const data = await res.json();
    console.log("Coupons data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

run();
