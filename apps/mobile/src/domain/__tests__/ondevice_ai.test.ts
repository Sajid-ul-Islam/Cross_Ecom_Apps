import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { litert } from "../../services/ai/LiteRTEngine.js";
import { geminiNano } from "../../services/ai/GeminiNanoEngine.js";

describe("Google LiteRT On-Device AI Engine", () => {
  test("predicts optimal waist size 32 for average South Asian male (175cm, 72kg)", () => {
    const res = litert.predictSmartFit({
      heightCm: 175,
      weightKg: 72,
      fitPreference: "regular",
      denimStretch: "comfort_stretch",
    });

    assert.equal(res.predictedWaist, 32);
    assert.equal(res.recommendedSize, "32");
    assert.equal(res.recommendedInseam, 32);
    assert.ok(res.confidence >= 0.85);
    assert.equal(res.engine, "Google LiteRT On-Device");
  });

  test("adjusts size upward for heavier weight (178cm, 78kg -> Size 34)", () => {
    const res = litert.predictSmartFit({
      heightCm: 178,
      weightKg: 78,
      fitPreference: "regular",
    });

    assert.equal(res.predictedWaist, 34);
  });

  test("compensates for authentic raw rigid denim shrinkage", () => {
    const res = litert.predictSmartFit({
      heightCm: 175,
      weightKg: 75,
      fitPreference: "regular",
      denimStretch: "rigid_raw",
    });

    assert.ok(res.stretchAdjustment.includes("raw denim shrinkage"));
  });

  test("classifies Bengali delivery query with high confidence", () => {
    const res = litert.classifyIntent("ঢাকার বাইরে ডেলিভারি চার্জ কত?");
    assert.equal(res.intent, "delivery");
    assert.equal(res.detectedLanguage, "bn");
    assert.ok(res.confidence > 0.7);
  });

  test("classifies Banglish exchange query correctly", () => {
    const res = litert.classifyIntent("kobe exchange korte parbo 7 days er moddhe?");
    assert.equal(res.intent, "exchange");
    assert.equal(res.detectedLanguage, "banglish");
  });

  test("classifies selvedge raw denim craft query", () => {
    const res = litert.classifyIntent("Tell me about your Japanese shuttle loom red line selvedge denim");
    assert.equal(res.intent, "selvedge_craft");
    assert.equal(res.detectedLanguage, "en");
  });
});

describe("Google Gemini Nano On-Device Foundation AI", () => {
  test("synthesizes on-device styling advice for selvedge denim", async () => {
    const res = await geminiNano.generateStylingAdvice("Raw Indigo Selvedge", "Jeans", "Slim");
    assert.ok(res.content.includes("Raw Indigo Selvedge"));
    assert.equal(res.metadata.model, "gemini-nano-v1");
    assert.equal(res.metadata.isOfflineReady, true);
    assert.ok(res.metadata.latencyMs < 100);
  });

  test("generates raw denim care & wash preservation guide offline", async () => {
    const res = await geminiNano.generateCareGuide();
    assert.ok(res.content.includes("First Soak"));
    assert.ok(res.content.includes("Washing Protocol"));
    assert.equal(res.metadata.provider, "Google Gemini Nano On-Device");
  });

  test("answers customer queries locally without network", async () => {
    const res = await geminiNano.answerQuery("What are the delivery charges?");
    assert.ok(res.content.includes("৳50"));
    assert.ok(res.content.includes("৳90"));
  });
});
