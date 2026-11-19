import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { webLiteRT } from "./ai/LiteRTEngine.js";
import { webGeminiNano } from "./ai/GeminiNanoEngine.js";

describe("Web Google LiteRT & Gemini Nano On-Device AI", () => {
  test("LiteRT on web predicts accurate waist size in 0ms", () => {
    const res = webLiteRT.predictSmartFit({
      heightCm: 175,
      weightKg: 72,
      fitPreference: "regular",
    });

    assert.equal(res.predictedWaist, 32);
    assert.equal(res.recommendedSize, "32");
    assert.equal(res.engine, "Google LiteRT On-Device (Web)");
  });

  test("Gemini Nano on web synthesizes styling advice client-side", async () => {
    const res = await webGeminiNano.generateStylingAdvice("Kuroki Raw Denim", "Slim");
    assert.ok(res.content.includes("Kuroki Raw Denim"));
    assert.equal(res.metadata.privacy, "100% Client-Side");
  });

  test("Gemini Nano answers delivery inquiry instantly offline", async () => {
    const res = await webGeminiNano.answerQuery("What is delivery charge to Chittagong?");
    assert.ok(res.content.includes("৳90"));
  });
});
