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

const MOCK_ORDERS = [
  {
    id: "d-1725000001",
    number: "1041",
    name: "Tanvir Ahmed",
    phone: "01711223344",
    status: "processing",
    total: 2490,
    city: "Dhaka",
    state: "BD-13",
    pathaoConsignmentId: "DD220826MDKMP9",
    pathaoTrackingUrl: "https://merchant.pathao.com/tracking?consignment_id=DD220826MDKMP9",
    pathaoTrackingInfo: {
      consignment_id: "DD220826MDKMP9",
      order_status: "In Transit - Hub Transfer",
    },
    createdAt: "2026-09-01T12:00:00.000Z",
  },
  {
    id: "d-1725000002",
    number: "1042",
    name: "Rahim Chowdhury",
    phone: "01811223344",
    status: "delivered",
    total: 3200,
    city: "Chattogram",
    state: "BD-10",
    pathaoConsignmentId: "DD220827CHTG01",
    pathaoTrackingUrl: "https://merchant.pathao.com/tracking?consignment_id=DD220827CHTG01",
    createdAt: "2026-09-02T14:30:00.000Z",
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
    assert.match(res.reply, /৭ দিনের মধ্যে সম্পূর্ণ ফ্রি ডোরস্টেপ সাইজ এক্সচেঞ্জ/);
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

  it("Real-Time Order Tracking: looks up order #1041 with live Pathao tracking", async () => {
    const res = await processAiCommerceQuery(
      "আমার অর্ডার #১০৪১ এর অবস্থা কী?",
      MOCK_CATALOG,
      [],
      { orders: MOCK_ORDERS }
    );

    assert.equal(res.intent, "order_track");
    assert.match(res.reply, /1041/);
    assert.match(res.reply, /DD220826MDKMP9/);
    assert.match(res.reply, /merchant\.pathao\.com\/tracking/);
    assert.ok(res.suggestedActions?.some((a) => a.action === "open_url" && a.payload?.url?.includes("DD220826MDKMP9")));
  });

  it("Real-Time Order Tracking: looks up order by phone number", async () => {
    const res = await processAiCommerceQuery(
      "আমার ফোন নম্বর 01811223344, পার্সেল কোথায়?",
      MOCK_CATALOG,
      [],
      { orders: MOCK_ORDERS }
    );

    assert.equal(res.intent, "order_track");
    assert.match(res.reply, /1042/);
    assert.match(res.reply, /DD220827CHTG01/);
  });

  it("Real-Time Order Tracking: gracefully handles non-existent order number", async () => {
    const res = await processAiCommerceQuery(
      "Track order #9999 please",
      MOCK_CATALOG,
      [],
      { orders: MOCK_ORDERS }
    );

    assert.equal(res.intent, "order_track");
    assert.match(res.reply, /could not locate|খুঁজে পাওয়া যায়নি/i);
    assert.match(res.reply, /9999/);
  });

  it("Real-Time Multi-Attribute Search: checks size availability in catalog", async () => {
    const res = await processAiCommerceQuery(
      "Suggest selvedge jeans in size 32 under 3000",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "product_recommendation");
    assert.ok(res.suggestedProducts && res.suggestedProducts.length > 0);
    assert.ok(res.suggestedProducts.every((p) => p.sizes.includes("32")));
    assert.match(res.reply, /Size 32 in stock/i);
  });

  it("Selvedge Heritage: retrieves shuttle loom and red-line craftsmanship details", async () => {
    const res = await processAiCommerceQuery(
      "What is special about your selvedge denim and shuttle loom?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "policy_qa");
    assert.match(res.reply, /shuttle looms|shuttle loom/i);
    assert.match(res.reply, /Red-Line/i);
    assert.match(res.reply, /sanforized/i);
  });

  it("Payment & EMI: explains COD, cards, and 0% EMI gateways", async () => {
    const res = await processAiCommerceQuery(
      "কিভাবে পেমেন্ট করা যাবে? কিস্তি বা EMI সুবিধা আছে কি?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "policy_qa");
    assert.match(res.reply, /ক্যাশ অন ডেলিভারি/);
    assert.match(res.reply, /বিকাশ/);
    assert.match(res.reply, /০% ইএমআই/);
  });

  it("Dynamic Campaigns: retrieves active cashback tiers and bank offers", async () => {
    const res = await processAiCommerceQuery(
      "বর্তমানে কি কি ক্যাশব্যাক বা ডিসকাউন্ট অফার আছে?",
      MOCK_CATALOG
    );

    assert.equal(res.intent, "policy_qa");
    assert.match(res.reply, /২,?৫০০/);
    assert.match(res.reply, /৫০০/);
    assert.match(res.reply, /৭০০/);
    assert.match(res.reply, /AMEXDEEN/);
  });
});
