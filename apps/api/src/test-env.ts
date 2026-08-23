import "dotenv/config";
import { config, wooEnabled } from "./config.js";
import { fetchWooProducts } from "./woo.js";

async function test() {
  console.log("=== Testing DEEN Gateway .env Configuration ===");
  console.log("Port:", config.port);
  console.log("Public URL:", config.publicUrl || "(none configured)");
  console.log("API Key required:", config.apiKey ? "Yes" : "No (open)");
  console.log("WooCommerce Site:", config.woo.site);
  console.log("Woo Consumer Key configured:", config.woo.consumerKey ? "Yes (hidden)" : "No");
  console.log("Woo Consumer Secret configured:", config.woo.consumerSecret ? "Yes (hidden)" : "No");
  console.log("Woo Enabled:", wooEnabled ? "YES (Live mode)" : "NO (Fallback/Seed mode)");

  if (wooEnabled) {
    console.log("\nAttempting to connect to WooCommerce API at", config.woo.site, "...");
    try {
      const products = await fetchWooProducts();
      console.log("✓ SUCCESS: Successfully connected to WooCommerce!");
      console.log(`✓ Fetched ${products.length} products from WooCommerce store.`);
      if (products.length > 0) {
        console.log("Sample product:", products[0].name, "-", products[0].sku, `(৳${products[0].price})`);
      }
    } catch (err: any) {
      console.error("✗ WooCommerce Connection Failed:", err.message);
    }
  } else {
    console.log("\nℹ WooCommerce credentials not fully set. Gateway will operate in Seed/Mock mode.");
  }
}

test();
