import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processAiCommerceQuery } from "./agent.js";

const MOCK_CATALOG = [
  {
    id: "j1",
    name: "Raw Washed Selvedge Jeans – Slim Fit",
    category: "JEANS",
    price: 2490,
    salePrice: 1743,
    sizes: ["30", "32", "34", "36", "38"],
    stockStatus: "instock",
    images: ["https://example.com/j1.jpg"],
    fabric: "13.5 oz Raw Indigo Denim",
  },
  {
    id: "j2",
    name: "Jet Black Selvedge Jeans – Straight Fit",
    category: "JEANS",
    price: 2890,
    salePrice: 2190,
    sizes: ["32", "34", "36"],
    stockStatus: "instock",
    images: ["https://example.com/j2.jpg"],
    fabric: "13 oz Jet Black Denim",
  },
  {
    id: "p1",
    name: "Royal Navy Semi-Long Panjabi",
    category: "PANJABI",
    price: 3200,
    sizes: ["M", "L", "XL"],
    stockStatus: "instock",
    images: ["https://example.com/p1.jpg"],
    fabric: "100% Fine Cotton",
  },
];

describe("DEEN AI Commerce Concierge & RAG Tests", () => {
  it("Product Recommendation: recommends jeans under budget in Bengali", async () => {
    const res = await processAiCommerceQuery(
      "আমার জন্য একটা জিন্স সাজেস্ট করো, বাজেট ৩০০০ টাকা",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "product_recommendation");
    assert.ok(res.suggestedProducts && res.suggestedProducts.length > 0);
    assert.equal(res.suggestedProducts[0].category, "JEANS");
    assert.ok((res.suggestedProducts[0].salePrice || res.suggestedProducts[0].price) <= 3000);
  });

  it("Exchange Policy: retrieves 7-day doorstep size swap policy", async () => {
    const res = await processAiCommerceQuery(
      "সাইজ না মিললে কি এক্সচেঞ্জ করা যাবে?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "policy_qa");
    assert.match(res.reply, /৭ দিনের মধ্যে ফ্রি ডোরস্টেপ এক্সচেঞ্জ/);
    assert.ok(res.suggestedActions?.some((a) => a.action === "navigate_returns"));
  });

  it("Delivery Calculator: calculates outside Dhaka delivery fee accurately", async () => {
    const res = await processAiCommerceQuery(
      "চট্টগ্রামে ডেলিভারি চার্জ কত?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "delivery_calc");
    assert.match(res.reply, /৳৯০/);
    assert.ok(res.suggestedActions?.some((a) => a.action === "navigate_checkout"));
  });

  it("Delivery Calculator: calculates Dhaka metro delivery fee accurately", async () => {
    const res = await processAiCommerceQuery(
      "What is the delivery fee for Dhanmondi Dhaka?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "delivery_calc");
    assert.match(res.reply, /৳50/);
  });

  it("Showroom Locator: retrieves 4 retail showrooms with hotline", async () => {
    const res = await processAiCommerceQuery(
      "আউটলেটগুলোর ঠিকানা দিন",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "store_locator");
    assert.match(res.reply, /মিরপুর ১২/);
    assert.match(res.reply, /ওয়ারী/);
    assert.match(res.reply, /কুমিল্লা/);
    assert.match(res.reply, /সিলেট/);
    assert.match(res.reply, /01952-700500/);
  });

  it("Sizing Guide: provides jeans waist sizing guidance without shopping intent", async () => {
    const res = await processAiCommerceQuery(
      "জিন্সের সাইজ কেমন? waist কি standard?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "policy_qa");
    assert.match(res.reply, /ট্রু-টু-সাইজ/);
  });
});
