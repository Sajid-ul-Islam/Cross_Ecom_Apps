import test from "node:test";
import assert from "node:assert/strict";

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
