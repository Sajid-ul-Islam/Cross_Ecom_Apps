import { test, describe } from "node:test";
import assert from "node:assert";
import { normalize } from "./normalize";
import { detectLanguage } from "./langDetect";
import { classifyIntent } from "./intents";
import { extractEntities } from "./entities";
import { reply } from "./responses";
import { createNewSession, InMemorySessionStore } from "./session";
import { processDialogTurn } from "./orderFlow";

describe("Multilingual Rule-Based Chatbot Engine", () => {
  // 1. Text Normalization
  describe("Text Normalization", () => {
    test("converts Bengali digits to Latin digits", () => {
      assert.strictEqual(normalize("০১৭১২৩৪৫৬৭৮"), "01712345678");
      assert.strictEqual(normalize("দাম ১২৫০ টাকা"), "দাম 1250 টাকা");
      assert.strictEqual(normalize("অর্ডার #৪৫৬৭"), "অর্ডার #4567");
    });

    test("collapses whitespace and trims", () => {
      assert.strictEqual(normalize("   hello    world   "), "hello world");
      assert.strictEqual(normalize("শার্টের      দাম\nকত?"), "শার্টের দাম কত?");
    });
  });

  // 2. Language Detection
  describe("Language Detection", () => {
    test("detects Bengali script as 'bn'", () => {
      assert.strictEqual(detectLanguage("হ্যালো"), "bn");
      assert.strictEqual(detectLanguage("শার্টের দাম কত?"), "bn");
      assert.strictEqual(detectLanguage("আমি একটা শার্ট অর্ডার করতে চাই"), "bn");
      assert.strictEqual(detectLanguage("০১৭১২৩৪৫৬৭৮"), "bn");
    });

    test("detects Banglish keywords as 'banglish'", () => {
      assert.strictEqual(detectLanguage("assalam vai"), "banglish");
      assert.strictEqual(detectLanguage("sharter dam koto"), "banglish");
      assert.strictEqual(detectLanguage("ami ekta shirt order korte chai"), "banglish");
      assert.strictEqual(detectLanguage("order status bolen, phone 01712345678 order 1234"), "banglish");
      assert.strictEqual(detectLanguage("koto taka lagbe"), "banglish");
    });

    test("detects English as 'en'", () => {
      assert.strictEqual(detectLanguage("Hi"), "en");
      assert.strictEqual(detectLanguage("Show me panjabi"), "en");
      assert.strictEqual(detectLanguage("I want to order a shirt"), "en");
      assert.strictEqual(detectLanguage("What's the status of order #1234"), "en");
    });
  });

  // 3. Intent Classification (Testing Checklist verification)
  describe("Intent Classification", () => {
    test("Bangla checklist", () => {
      assert.strictEqual(classifyIntent("হ্যালো", "bn").intent, "GREETING");
      assert.strictEqual(classifyIntent("শার্টের দাম কত?", "bn").intent, "PRODUCT_SEARCH");
      assert.strictEqual(classifyIntent("আমি একটা শার্ট অর্ডার করতে চাই", "bn").intent, "PLACE_ORDER");
    });

    test("English checklist", () => {
      assert.strictEqual(classifyIntent("Hi", "en").intent, "GREETING");
      assert.strictEqual(classifyIntent("Show me panjabi", "en").intent, "PRODUCT_SEARCH");
      assert.strictEqual(classifyIntent("I want to order a shirt", "en").intent, "PLACE_ORDER");
      assert.strictEqual(classifyIntent("What's the status of order #1234", "en").intent, "ORDER_STATUS");
    });

    test("Banglish checklist", () => {
      assert.strictEqual(classifyIntent("assalam vai", "banglish").intent, "GREETING");
      assert.strictEqual(classifyIntent("sharter dam koto", "banglish").intent, "PRODUCT_SEARCH");
      assert.strictEqual(classifyIntent("ami ekta shirt order korte chai", "banglish").intent, "PLACE_ORDER");
      assert.strictEqual(classifyIntent("order status bolen, phone 01712345678 order 1234", "banglish").intent, "ORDER_STATUS");
    });

    test("Human handoff intent", () => {
      assert.strictEqual(classifyIntent("talk to human agent", "en").intent, "HUMAN_HANDOFF");
      assert.strictEqual(classifyIntent("manush er sathe kotha bolte chai", "banglish").intent, "HUMAN_HANDOFF");
      assert.strictEqual(classifyIntent("কাস্টমার কেয়ার নম্বর দিন", "bn").intent, "HUMAN_HANDOFF");
    });

    test("Knowledge domain intents (delivery, exchange, showrooms, offers, sizing)", () => {
      assert.strictEqual(classifyIntent("Chittagong delivery charge & time?", "en").intent, "DELIVERY_INFO");
      assert.strictEqual(classifyIntent("চট্টগ্রামে ডেলিভারি চার্জ কত?", "bn").intent, "DELIVERY_INFO");
      assert.strictEqual(classifyIntent("delivery charge koto", "banglish").intent, "DELIVERY_INFO");

      assert.strictEqual(classifyIntent("How does the 7-day size exchange work?", "en").intent, "EXCHANGE_POLICY");
      assert.strictEqual(classifyIntent("৭ দিনের এক্সচেঞ্জ পলিসি কি?", "bn").intent, "EXCHANGE_POLICY");
      assert.strictEqual(classifyIntent("size exchange policy bolen", "banglish").intent, "EXCHANGE_POLICY");

      assert.strictEqual(classifyIntent("Where are your retail showrooms in Dhaka?", "en").intent, "STORE_LOCATOR");
      assert.strictEqual(classifyIntent("ধানমন্ডি শোরুমের ঠিকানা কোথায়?", "bn").intent, "STORE_LOCATOR");
      assert.strictEqual(classifyIntent("showroom kothay ache", "banglish").intent, "STORE_LOCATOR");

      assert.strictEqual(classifyIntent("What is the current offer & discount?", "en").intent, "OFFERS");
      assert.strictEqual(classifyIntent("বর্তমান অফার ও ক্যাশব্যাক কি?", "bn").intent, "OFFERS");
      assert.strictEqual(classifyIntent("kono discount offer ache?", "banglish").intent, "OFFERS");

      assert.strictEqual(classifyIntent("Jeans sizing and waist fit guide", "en").intent, "SIZING_GUIDE");
      assert.strictEqual(classifyIntent("সাইজ গাইড ও মাপজোক", "bn").intent, "SIZING_GUIDE");
    });

    test("Unknown intent falls back with confidence 0", () => {
      const res = classifyIntent("xyz random gibberish 9999", "en");
      assert.strictEqual(res.intent, "UNKNOWN");
      assert.strictEqual(res.confidence, 0);
    });
  });

  // 4. Entity Extraction
  describe("Entity Extraction", () => {
    test("extracts Bangladeshi phone number with Latin digits", () => {
      const entities = extractEntities("My number is 01712345678 please call");
      assert.strictEqual(entities.phone, "01712345678");
    });

    test("extracts Bangladeshi phone number with Bengali digits", () => {
      const entities = extractEntities("আমার ফোন ০১৭১২৩৪৫৬৭৮");
      assert.strictEqual(entities.phone, "01712345678");
    });

    test("extracts order number", () => {
      const e1 = extractEntities("Order #1234");
      assert.strictEqual(e1.orderNumber, "1234");

      const e2 = extractEntities("status of order 56789");
      assert.strictEqual(e2.orderNumber, "56789");
    });

    test("extracts size", () => {
      const e1 = extractEntities("I need size XL");
      assert.strictEqual(e1.size, "XL");

      const e2 = extractEntities("waist 32 pant");
      assert.strictEqual(e2.size, "32");
    });

    test("extracts quantity and price", () => {
      const e1 = extractEntities("Give me 3 pcs of this");
      assert.strictEqual(e1.quantity, 3);

      const e2 = extractEntities("Price is 2450 tk");
      assert.strictEqual(e2.price, 2450);
    });
  });

  // 5. Response Templates & Variable Substitution
  describe("Response Templates", () => {
    test("substitutes variables in localized responses", () => {
      const bnRes = reply("bn", "ORDER_PLACED", { orderId: 1042 });
      assert.ok(bnRes.includes("1042"));
      assert.ok(bnRes.includes("ধন্যবাদ"));

      const enRes = reply("en", "ORDER_PLACED", { orderId: 1042 });
      assert.ok(enRes.includes("1042"));
      assert.ok(enRes.includes("Thank you"));

      const bgRes = reply("banglish", "ORDER_PLACED", { orderId: 1042 });
      assert.ok(bgRes.includes("1042"));
      assert.ok(bgRes.includes("Dhonnobad"));
    });
  });

  // 6. Session Store & Memory Bounding
  describe("Session Store", () => {
    test("stores, retrieves, and clears sessions", () => {
      const store = new InMemorySessionStore(1000);
      const session = createNewSession("test-1", "bn");
      session.slots.phone = "01712345678";

      store.set("test-1", session);
      const retrieved = store.get("test-1");
      assert.ok(retrieved);
      assert.strictEqual(retrieved?.slots.phone, "01712345678");

      store.clear("test-1");
      assert.strictEqual(store.get("test-1"), null);
    });
  });

  // 7. Multi-Turn Order Flow State Machine
  describe("Multi-Turn Order Flow State Machine", () => {
    test("executes end-to-end order placement dialog turn by turn", async () => {
      const session = createNewSession("order-turn-test", "en");

      // Turn 1: Start order
      const turn1 = await processDialogTurn("I want to order", session, "PLACE_ORDER");
      assert.strictEqual(session.state, "ORDER_PRODUCT");
      assert.ok(turn1.reply.length > 0);

      // Turn 2: Pick product
      const turn2 = await processDialogTurn("Selvedge Jeans", session, "PRODUCT_SEARCH");
      assert.strictEqual(session.state, "ORDER_SIZE");
      assert.ok(session.slots.product);

      // Turn 3: Pick size
      const turn3 = await processDialogTurn("32", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_QTY");
      assert.strictEqual(session.slots.size, "32");

      // Turn 4: Pick qty
      const turn4 = await processDialogTurn("2 pcs", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_PHONE");
      assert.strictEqual(session.slots.quantity, 2);

      // Turn 5: Phone validation error handling
      const turn5Err = await processDialogTurn("invalid-number", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_PHONE"); // Stays on phone

      // Turn 5b: Provide valid phone
      const turn5 = await processDialogTurn("01712345678", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_ADDRESS");
      assert.strictEqual(session.slots.phone, "01712345678");

      // Turn 6: Provide Address
      const turn6 = await processDialogTurn("House 12, Road 4, Dhanmondi, Dhaka", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_CONFIRM");
      assert.ok(turn6.reply.includes("Order Summary"));

      // Turn 7: Confirm
      const turn7 = await processDialogTurn("Yes, confirm", session, "UNKNOWN");
      assert.strictEqual(session.state, "IDLE"); // Reset after order placed
      assert.ok(turn7.reply.includes("Order ID"));
    });

    test("handles cancel at any stage", async () => {
      const session = createNewSession("order-cancel-test", "bn");
      session.state = "ORDER_SIZE";
      session.slots.productName = "Jeans";

      const res = await processDialogTurn("বাতিল", session, "UNKNOWN");
      assert.strictEqual(session.state, "IDLE");
      assert.strictEqual(Object.keys(session.slots).length, 0);
      assert.ok(res.reply.includes("বাতিল"));
    });

    test("handles back command to step back one stage", async () => {
      const session = createNewSession("order-back-test", "en");
      session.state = "ORDER_QTY";
      session.slots.productName = "Jeans";
      session.slots.size = "32";

      const res = await processDialogTurn("back", session, "UNKNOWN");
      assert.strictEqual(session.state, "ORDER_SIZE");
      assert.ok(res.reply.length > 0);
    });
  });

  // 8. Order Status Tracking Flow
  describe("Order Status Flow State Machine", () => {
    test("runs order status inquiry flow (phone -> order# -> result -> IDLE)", async () => {
      const session = createNewSession("status-test", "en");

      // Turn 1: Trigger ORDER_STATUS
      const turn1 = await processDialogTurn("What's the status of order #1234", session, "ORDER_STATUS");
      assert.strictEqual(session.state, "STATUS_PHONE");
      assert.ok(turn1.reply.length > 0);

      // Turn 2: Invalid phone stays on STATUS_PHONE
      const turn2Err = await processDialogTurn("hello", session, "UNKNOWN");
      assert.strictEqual(session.state, "STATUS_PHONE");

      // Turn 2b: Valid phone moves to STATUS_ORDERNO
      const turn2 = await processDialogTurn("01712345678", session, "UNKNOWN");
      assert.strictEqual(session.state, "STATUS_ORDERNO");
      assert.strictEqual(session.slots.phone, "01712345678");

      // Turn 3: Order number completes and resets to IDLE
      const turn3 = await processDialogTurn("1234", session, "UNKNOWN");
      assert.strictEqual(session.state, "IDLE");
      assert.ok(turn3.reply.length > 0);
    });
  });

  // 9. Product Search Flow
  describe("Product Search Flow", () => {
    test("searches products and returns cards and quick replies", async () => {
      const session = createNewSession("search-test", "en");
      const res = await processDialogTurn("Show me panjabi", session, "PRODUCT_SEARCH");

      assert.strictEqual(session.state, "IDLE");
      assert.ok(res.reply.length > 0);
      assert.ok(res.products !== undefined);
      assert.ok(res.quickReplies && res.quickReplies.length > 0);
    });
  });

  // 10. Complete Prompt Testing Checklist
  describe("Complete Prompt Testing Checklist", () => {
    test("Bangla Checklist", () => {
      // "হ্যালো" → GREETING
      assert.strictEqual(classifyIntent("হ্যালো", "bn").intent, "GREETING");

      // "শার্টের দাম কত?" → PRODUCT_SEARCH
      assert.strictEqual(classifyIntent("শার্টের দাম কত?", "bn").intent, "PRODUCT_SEARCH");

      // "আমি একটা শার্ট অর্ডার করতে চাই" → PLACE_ORDER (starts flow)
      assert.strictEqual(classifyIntent("আমি একটা শার্ট অর্ডার করতে চাই", "bn").intent, "PLACE_ORDER");

      // "০১৭১২৩৪৫৬৭৮" → phone extracted
      const entities = extractEntities("০১৭১২৩৪৫৬৭৮");
      assert.strictEqual(entities.phone, "01712345678");
    });

    test("English Checklist", () => {
      // "Hi" → GREETING
      assert.strictEqual(classifyIntent("Hi", "en").intent, "GREETING");

      // "Show me panjabi" → PRODUCT_SEARCH
      assert.strictEqual(classifyIntent("Show me panjabi", "en").intent, "PRODUCT_SEARCH");

      // "I want to order a shirt" → PLACE_ORDER
      assert.strictEqual(classifyIntent("I want to order a shirt", "en").intent, "PLACE_ORDER");

      // "What's the status of order #1234" → ORDER_STATUS
      assert.strictEqual(classifyIntent("What's the status of order #1234", "en").intent, "ORDER_STATUS");
    });

    test("Banglish Checklist", () => {
      // "assalam vai" → GREETING
      assert.strictEqual(classifyIntent("assalam vai", "banglish").intent, "GREETING");

      // "sharter dam koto" → PRODUCT_SEARCH
      assert.strictEqual(classifyIntent("sharter dam koto", "banglish").intent, "PRODUCT_SEARCH");

      // "ami ekta shirt order korte chai" → PLACE_ORDER
      assert.strictEqual(classifyIntent("ami ekta shirt order korte chai", "banglish").intent, "PLACE_ORDER");

      // "order status bolen, phone 01712345678 order 1234" → ORDER_STATUS
      assert.strictEqual(
        classifyIntent("order status bolen, phone 01712345678 order 1234", "banglish").intent,
        "ORDER_STATUS"
      );
    });
  });
});
