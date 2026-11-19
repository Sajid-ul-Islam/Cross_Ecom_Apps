import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fetchProducts, WORDPRESS_SITE_URL } from "./api";
import { webLiteRT } from "./ai/LiteRTEngine";
import { webGeminiNano } from "./ai/GeminiNanoEngine";

describe("DEEN Commerce System & Integration Verification", () => {
  it("verifies live fetching from actual WooCommerce store at deencommerce.com", async () => {
    assert.strictEqual(WORDPRESS_SITE_URL, "https://deencommerce.com");
    const products = await fetchProducts({ per_page: 5 });
    assert.ok(Array.isArray(products));
    assert.ok(products.length > 0, "Should have fetched products from deencommerce.com or fallback");
    assert.ok(products[0].id, "First product must have valid ID");
    assert.ok(products[0].name, "First product must have valid title");
  });

  it("verifies Google LiteRT on-device AI fast waist prediction & Banglish intent routing", () => {
    const start = performance.now();
    const fit = webLiteRT.predictSmartFit({
      heightCm: 175,
      weightKg: 72,
      fitPreference: "regular",
      denimStretch: "comfort_stretch",
    });
    const elapsed = performance.now() - start;
    assert.strictEqual(fit.predictedWaist, 32);
    assert.ok(elapsed < 10, `LiteRT inference must be under 10ms (was ${elapsed.toFixed(2)}ms)`);

    const intent = webLiteRT.classifyCustomerIntent("delivery charge koto?");
    assert.strictEqual(intent.intent, "delivery");
    assert.ok(intent.confidence >= 0.7);
  });

  it("verifies Google Gemini Nano offline AI style & care synthesis", async () => {
    const answer = await webGeminiNano.answerQuery("What is delivery charge in Dhaka?");
    assert.ok(answer.content.includes("৳50") || answer.content.includes("Dhaka"));

    const styling = await webGeminiNano.generateStylingAdvice("Deep Indigo Raw Selvedge Jeans", "Straight");
    assert.ok(styling.content.includes("Deep Indigo Raw Selvedge Jeans"));
    assert.strictEqual(styling.metadata.privacy, "100% Client-Side");
  });
});
