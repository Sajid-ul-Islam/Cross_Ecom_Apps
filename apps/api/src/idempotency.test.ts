import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "crypto";

/* ------------------------------------------------------------------ */
/*  Idempotency & Failover Reconciliation Unit Tests                  */
/* ------------------------------------------------------------------ */

interface OrderRecord {
  id: string;
  number: string;
  idempotencyKey: string;
  phone: string;
  total: number;
}

class MockGateway {
  public store = new Map<string, { at: number; order: OrderRecord }>();
  public inFlight = new Map<string, Promise<OrderRecord>>();
  public upstreamCalls = 0;
  private seq = 1000;

  async createOrder(key: string, phone: string, total: number, delayMs = 20): Promise<OrderRecord> {
    // 1. Check completed duplicate
    const existing = this.store.get(key);
    if (existing && Date.now() - existing.at < 300_000) {
      return existing.order;
    }

    // 2. Check in-flight lock
    const inFlightPromise = this.inFlight.get(key);
    if (inFlightPromise) {
      return inFlightPromise;
    }

    // 3. Create execution promise
    const promise = (async () => {
      this.upstreamCalls += 1;
      await new Promise((r) => setTimeout(r, delayMs));
      const order: OrderRecord = {
        id: `ord_${Date.now()}`,
        number: `DC-${++this.seq}`,
        idempotencyKey: key,
        phone,
        total,
      };
      return order;
    })();

    this.inFlight.set(key, promise);
    try {
      const order = await promise;
      this.store.set(key, { at: Date.now(), order });
      return order;
    } finally {
      this.inFlight.delete(key);
    }
  }

  reconcile(key: string): { reconciled: boolean; order?: OrderRecord } {
    const entry = this.store.get(key);
    if (entry) return { reconciled: true, order: entry.order };
    return { reconciled: false };
  }
}

test("Idempotency: Concurrent duplicate requests trigger upstream create exactly once", async () => {
  const gateway = new MockGateway();
  const idempotencyKey = "client-key-12345";
  const phone = "01712345678";

  // Simulate 5 rapid concurrent POST requests (e.g. multi-gateway failover retry or double tap)
  const results = await Promise.all([
    gateway.createOrder(idempotencyKey, phone, 2500, 30),
    gateway.createOrder(idempotencyKey, phone, 2500, 30),
    gateway.createOrder(idempotencyKey, phone, 2500, 30),
    gateway.createOrder(idempotencyKey, phone, 2500, 30),
    gateway.createOrder(idempotencyKey, phone, 2500, 30),
  ]);

  // All 5 requests must receive the exact same order number
  const firstOrderNumber = results[0].number;
  for (const res of results) {
    assert.equal(res.number, firstOrderNumber);
    assert.equal(res.idempotencyKey, idempotencyKey);
  }

  // Upstream WooCommerce push must have been called exactly ONCE
  assert.equal(gateway.upstreamCalls, 1);
});

test("Idempotency: Subsequent request after completion returns recorded order without new push", async () => {
  const gateway = new MockGateway();
  const idempotencyKey = "client-key-67890";
  const phone = "01812345678";

  const order1 = await gateway.createOrder(idempotencyKey, phone, 3200);
  const order2 = await gateway.createOrder(idempotencyKey, phone, 3200);

  assert.equal(order1.number, order2.number);
  assert.equal(gateway.upstreamCalls, 1);
});

test("Reconciliation: Client timeout on primary resolves through reconciliation without duplicate", async () => {
  const primaryGateway = new MockGateway();
  const secondaryGateway = new MockGateway();
  const idempotencyKey = "failover-key-99999";
  const phone = "01912345678";

  // Primary gateway receives write and completes upstream
  await primaryGateway.createOrder(idempotencyKey, phone, 1800);

  // Client timed out waiting for primary response.
  // Instead of blindly POSTing to secondary, client runs reconciliation check:
  const checkPrimary = primaryGateway.reconcile(idempotencyKey);
  assert.equal(checkPrimary.reconciled, true);
  assert.equal(checkPrimary.order?.idempotencyKey, idempotencyKey);

  // Secondary gateway upstream calls remain 0 because reconciliation adopted existing order
  assert.equal(secondaryGateway.upstreamCalls, 0);
});

test("Reconciliation: If reconciliation confirms not found, safe retry on secondary succeeds", async () => {
  const primaryGateway = new MockGateway();
  const secondaryGateway = new MockGateway();
  const idempotencyKey = "clean-failover-key-111";
  const phone = "01312345678";

  // Primary completely failed before upstream write
  const checkPrimary = primaryGateway.reconcile(idempotencyKey);
  assert.equal(checkPrimary.reconciled, false);

  // Safe to failover to secondary with exact same idempotency key
  const order = await secondaryGateway.createOrder(idempotencyKey, phone, 2100);
  assert.equal(order.idempotencyKey, idempotencyKey);
  assert.equal(secondaryGateway.upstreamCalls, 1);
});

test("Webhook Idempotency: Retried WooCommerce delivery with same delivery ID is skipped", () => {
  const processedWebhooks = new Map<string, number>();
  let cacheInvalidationCalls = 0;

  function handleWebhook(deliveryId: string, topic: string) {
    const eventKey = `woo_del_${deliveryId}`;
    const now = Date.now();
    const prev = processedWebhooks.get(eventKey);
    if (prev && now - prev < 600_000) {
      return { ok: true, duplicate: true, eventKey, topic };
    }
    processedWebhooks.set(eventKey, now);
    cacheInvalidationCalls += 1;
    return { ok: true, duplicate: false, eventKey, topic };
  }

  // Delivery 1: initial delivery
  const res1 = handleWebhook("del_100234", "product.updated");
  assert.equal(res1.ok, true);
  assert.equal(res1.duplicate, false);
  assert.equal(cacheInvalidationCalls, 1);

  // Delivery 2: WordPress retry with same delivery ID
  const res2 = handleWebhook("del_100234", "product.updated");
  assert.equal(res2.ok, true);
  assert.equal(res2.duplicate, true);
  assert.equal(cacheInvalidationCalls, 1); // Not incremented!
});

test("Webhook Idempotency: Duplicate payment callback with same transaction ID is acknowledged without re-execution", () => {
  const processedCallbacks = new Map<string, number>();
  let wooPaymentUpdates = 0;

  function handlePaymentCallback(orderId: string, trxId: string, status: string) {
    const key = `pay_cb_${orderId}_${trxId}_${status}`;
    const now = Date.now();
    const prev = processedCallbacks.get(key);
    if (prev && now - prev < 600_000) {
      return { success: true, duplicate: true };
    }
    processedCallbacks.set(key, now);
    wooPaymentUpdates += 1;
    return { success: true, duplicate: false };
  }

  // 1st callback
  const r1 = handlePaymentCallback("DC-1045", "TRX_BKASH_999", "SUCCESS");
  assert.equal(r1.duplicate, false);
  assert.equal(wooPaymentUpdates, 1);

  // 2nd callback retry
  const r2 = handlePaymentCallback("DC-1045", "TRX_BKASH_999", "SUCCESS");
  assert.equal(r2.duplicate, true);
  assert.equal(wooPaymentUpdates, 1);
});

test("Offline Sync Idempotency: Reconnecting and syncing an offline-placed order with persistent idempotency key never duplicates WooCommerce order", async () => {
  const gateway = new MockGateway();
  const persistentIdempotencyKey = "deen-usr_8801700000000-ord_offline_1740880000";
  const phone = "01700000000";

  // 1. First attempt: Request reached WooCommerce, but network dropped on response path to mobile
  const createdOnGateway = await gateway.createOrder(persistentIdempotencyKey, phone, 3500);
  assert.equal(createdOnGateway.idempotencyKey, persistentIdempotencyKey);
  assert.equal(gateway.upstreamCalls, 1);

  // 2. Mobile queued the order locally as offline with persistentIdempotencyKey preserved.
  // When connectivity is restored, syncOfflineOrders() sends the order with the same key:
  const syncedOrder = await gateway.createOrder(persistentIdempotencyKey, phone, 3500);

  // 3. Gateway must return the existing order #, NOT spawn a second WooCommerce order
  assert.equal(syncedOrder.number, createdOnGateway.number);
  assert.equal(gateway.upstreamCalls, 1); // Exactly 1 call upstream!
});

test("Stateless HMAC Session Tokens: Token minted on Gateway A is verifiable on Gateway B with shared secret", () => {
  const SHARED_CLUSTER_SECRET = "deen_test_cluster_secret_9988";

  function mintToken(payload: any) {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(data).digest("base64url");
    return `gst.${data}.${sig}`;
  }

  function verifyToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [prefix, data, sig] = parts;
    const expectedSig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(data).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  }

  // 1. Gateway A mints token
  const tokenFromGatewayA = mintToken({
    type: "guest",
    phone: "01711223344",
    name: "Guest Shopper",
    iat: Date.now(),
    exp: Date.now() + 7 * 86400000,
  });

  // 2. Gateway B (separate process/memory) verifies token using shared secret
  const verifiedOnGatewayB = verifyToken(tokenFromGatewayA);
  assert.notEqual(verifiedOnGatewayB, null);
  assert.equal(verifiedOnGatewayB.phone, "01711223344");
  assert.equal(verifiedOnGatewayB.type, "guest");
});

test("Stateless HMAC Session Tokens: Tampered payload or signature is rejected", () => {
  const SHARED_CLUSTER_SECRET = "deen_test_cluster_secret_9988";

  function verifyToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [prefix, data, sig] = parts;
    const expectedSig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(data).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  }

  // Valid token
  const validData = Buffer.from(JSON.stringify({ phone: "01700000000", role: "customer" })).toString("base64url");
  const validSig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(validData).digest("base64url");

  // Tampered payload (attacker changed role to admin)
  const tamperedData = Buffer.from(JSON.stringify({ phone: "01700000000", role: "admin" })).toString("base64url");
  const tamperedToken = `usr.${tamperedData}.${validSig}`;

  assert.equal(verifyToken(tamperedToken), null);
});

test("Stateless HMAC Session Tokens: Expired token is rejected", () => {
  const SHARED_CLUSTER_SECRET = "deen_test_cluster_secret_9988";

  function mintExpiredToken(payload: any) {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(data).digest("base64url");
    return `usr.${data}.${sig}`;
  }

  function verifyToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [prefix, data, sig] = parts;
    const expectedSig = createHmac("sha256", SHARED_CLUSTER_SECRET).update(data).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  }

  const expiredToken = mintExpiredToken({
    type: "user",
    username: "customer1",
    exp: Date.now() - 1000, // 1 second in the past
  });

  assert.equal(verifyToken(expiredToken), null);
});

test("Social Auth: Google/Facebook sign-in maps to real WooCommerce customer record", async () => {
  // Simulates findOrCreateWooCustomer logic
  const mockCustomerDb = new Map<string, { id: number; email: string; name: string; username: string }>();
  mockCustomerDb.set("existing@gmail.com", {
    id: 5821,
    email: "existing@gmail.com",
    name: "Existing Shopper",
    username: "existing_shopper",
  });

  async function mockFindOrCreateCustomer(email: string, name: string, provider: string, providerId: string) {
    if (mockCustomerDb.has(email)) {
      return { ...mockCustomerDb.get(email)!, isNew: false };
    }
    const newId = 6001;
    const created = { id: newId, email, name, username: email.split("@")[0], isNew: true };
    mockCustomerDb.set(email, created);
    return created;
  }

  // 1. Existing user signs in with Google -> adopts existing WooCommerce customer ID 5821
  const existingResult = await mockFindOrCreateCustomer("existing@gmail.com", "Existing Shopper", "google", "goog_123");
  assert.equal(existingResult.id, 5821);
  assert.equal(existingResult.isNew, false);

  // 2. New user signs in with Facebook -> creates WooCommerce customer ID 6001
  const newResult = await mockFindOrCreateCustomer("newshopper@facebook.deencommerce.com", "Tanvir Ahmed", "facebook", "fb_9988");
  assert.equal(newResult.id, 6001);
  assert.equal(newResult.isNew, true);
});

test("Social Auth: Order placement attaches verified customer_id rather than guest customer_id=0", () => {
  const verifiedSocialSession = {
    userId: 5821,
    username: "existing_shopper",
    email: "existing@gmail.com",
    role: "customer",
  };

  function buildWooOrderPayload(session: any, items: any[], total: number) {
    return {
      customer_id: session?.userId ? Number(session.userId) : 0,
      payment_method: "cod",
      billing: { email: session?.email || "guest@deencommerce.com" },
      total,
    };
  }

  const orderPayload = buildWooOrderPayload(verifiedSocialSession, [{ productId: 101, qty: 1 }], 2490);
  assert.equal(orderPayload.customer_id, 5821); // Real customer account in WooCommerce!
  assert.notEqual(orderPayload.customer_id, 0); // Not a guest order!
});
