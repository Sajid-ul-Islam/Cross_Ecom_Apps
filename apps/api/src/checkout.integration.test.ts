import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import Fastify from "fastify";
import { registerDeenRoutes, signSessionToken } from "./routes.js";
import { config } from "./config.js";

test("checkout handlers create only verified Woo orders and protect their state", async (t) => {
  const writes: any[] = [];
  let failOrder = false;
  let failLookup = false;
  let resolveWrite: (() => void) | undefined;
  let holdWrite = false;
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/payment_gateways")) return json([{ id: "cod", title: "Cash", enabled: true }, { id: "custom-pay", title: "Configured Gateway", enabled: true }, { id: "disabled-pay", enabled: false }]);
    if (url.pathname.endsWith("/shipping/zones")) return json([{ id: 1, name: "Inside Dhaka" }, { id: 2, name: "Outside Dhaka" }]);
    if (url.pathname.endsWith("/shipping/zones/1/methods")) return json([{ method_id: "flat_rate", enabled: true, settings: { cost: { value: "50" } } }]);
    if (url.pathname.endsWith("/shipping/zones/2/methods")) return json([{ method_id: "flat_rate", enabled: true, settings: { cost: { value: "90" } } }]);
    if (url.pathname.endsWith("/products")) return json([{ id: 123, status: "publish", sku: "DENIM", name: "Jeans", price: "1200", regular_price: "1200", categories: [{ name: "JEANS" }], images: [], attributes: [{ name: "Size", options: ["M", "L"] }], stock_status: "instock" }]);
    if (url.pathname.endsWith("/products/123/variations")) return json([{ id: 124, price: "1200", regular_price: "1200", stock_status: "instock", attributes: [{ option: "M" }] }, { id: 125, price: "1200", stock_status: "outofstock", attributes: [{ option: "L" }] }]);
    if (url.pathname.endsWith("/orders") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      writes.push(body);
      if (holdWrite) await new Promise<void>((resolve) => { resolveWrite = resolve; });
      if (failOrder) throw new TypeError("Network connection lost after submission");
      return json({ id: 1000 + writes.length, number: `WC-${1000 + writes.length}`, total: "1275", payment_url: "https://woo.test/checkout/order-pay/1001/?key=real", order_key: "real", status: "pending" }, 201);
    }
    if (url.pathname.endsWith("/orders")) return json(failLookup ? {} : [], failLookup ? 401 : 200);
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };
  const app = Fastify();
  await registerDeenRoutes(app);
  t.after(async () => { globalThis.fetch = originalFetch; await app.close(); });
  const payload = { name: "Test Customer", phone: "01712345678", address: "House 12, Road 4, Dhaka", city: "Dhaka", state: "BD-13", district: "BD-13", postcode: "1200", area: "dhaka", payment: "cod", items: [{ productId: "123", variationId: 124, size: "M", qty: 1 }] };
  const guest = signSessionToken({ type: "guest", iat: Date.now(), exp: Date.now() + 60_000 });
  let order: any;
  const place = (key: string, data: any = payload, headers: Record<string, string> = {}) => app.inject({ method: "POST", url: "/v1/deen/orders", payload: data, headers: { "idempotency-key": key, authorization: `Bearer ${guest}`, ...headers } });

  await t.test("real receipt, unpaid state, official address, fees and variant metadata", async () => {
    const key = randomUUID();
    const res = await place(key, { ...payload, payment: "custom-pay", customerId: 9999, pathaoConsignmentId: "FAKE" });
    assert.equal(res.statusCode, 201, res.body);
    order = res.json();
    assert.equal(order.number, "WC-1001");
    assert.equal(order.total, 1275, "Woo total is authoritative");
    assert.equal(order.paymentUrl, "https://woo.test/checkout/order-pay/1001/?key=real");
    assert.equal(order.pathaoConsignmentId, undefined);
    assert.equal(order.customerId, 0, "request-body customerId is untrusted");
    assert.equal(writes[0].set_paid, false);
    assert.equal(writes[0].payment_method, "custom-pay");
    for (const field of ["billing", "shipping"]) {
      assert.equal(writes[0][field].country, "BD");
      assert.equal(writes[0][field].state, "BD-13");
      assert.equal(writes[0][field].postcode, "1200");
      assert.equal(writes[0][field].city, "Dhaka");
    }
    assert.equal(writes[0].shipping_lines[0].total, "50");
    assert.equal(writes[0].line_items[0].variation_id, 124);
    assert.ok(writes[0].meta_data.some((m: any) => m.key === "_idempotency_key" && m.value === key));
  });

  await t.test("private order data requires its owner; public number lookup returns status only", async () => {
    const publicResult = await app.inject({ url: `/v1/deen/orders?number=${order.number}` });
    assert.deepEqual(Object.keys(publicResult.json()[0]).sort(), ["number", "paymentStatus", "status"]);
    const foreign = signSessionToken({ type: "user", userId: 777, role: "customer", iat: Date.now(), exp: Date.now() + 60_000 });
    assert.deepEqual((await app.inject({ url: "/v1/deen/orders", headers: { authorization: `Bearer ${foreign}` } })).json(), []);
    assert.equal((await app.inject({ url: "/v1/deen/orders", headers: { authorization: `Bearer ${guest}` } })).json()[0].number, order.number);
    assert.equal((await app.inject({ url: `/v1/deen/orders/reconcile?key=${order.id}` })).statusCode, 400);
  });

  await t.test("invalid district, mismatched delivery, foreign variant and disabled payment fail before write", async () => {
    const count = writes.length;
    for (const change of [{ district: "BD-99", state: "BD-99" }, { state: "BD-10" }, { payment: "disabled-pay" }, { items: [{ productId: "123", variationId: 999, size: "M", qty: 1 }] }, { items: [{ productId: "123", variationId: 125, size: "L", qty: 1 }] }]) {
      const res = await place(randomUUID(), { ...payload, ...change });
      assert.equal(res.statusCode, 422, res.body);
    }
    assert.equal(writes.length, count);
  });

  await t.test("outside Dhaka fees are not mistaken for inside Dhaka", async () => {
    const res = await place(randomUUID(), { ...payload, district: "BD-60", state: "BD-60", city: "Sylhet", postcode: "3100", area: "outside_standard" });
    assert.equal(res.statusCode, 201, res.body);
    assert.equal(writes.at(-1).shipping_lines[0].total, "90");
  });

  await t.test("concurrent retries use one upstream write and a changed payload conflicts", async () => {
    const key = randomUUID();
    const input = { ...payload, address: "House 15, Road 1, Dhaka" };
    const count = writes.length;
    holdWrite = true;
    const first = place(key, input);
    while (!resolveWrite) await new Promise((resolve) => setTimeout(resolve, 5));
    const same = place(key, input);
    const changed = await place(key, { ...input, address: "Another house in Dhaka" });
    assert.equal(changed.statusCode, 409);
    resolveWrite();
    holdWrite = false;
    const results = await Promise.all([first, same]);
    assert.deepEqual(results.map((res) => res.statusCode).sort(), [200, 201]);
    assert.equal(writes.length, count + 1);
    assert.equal((await place(key, input)).statusCode, 200);
    assert.equal(writes.length, count + 1);
  });

  await t.test("a failed Woo POST produces no fake confirmation or fallback write", async () => {
    failOrder = true;
    const count = writes.length;
    const res = await place(randomUUID(), { ...payload, address: "House 20, Road 2, Dhaka" });
    assert.equal(res.statusCode, 502, res.body);
    assert.equal(res.json().number, undefined);
    assert.equal(writes.length, count + 1, "POST is never automatically retried");
    failOrder = false;
  });

  await t.test("unknown reconciliation state blocks a new Woo write", async () => {
    failLookup = true;
    const count = writes.length;
    const res = await place(randomUUID(), { ...payload, address: "House 22, Road 2, Dhaka" });
    assert.equal(res.statusCode, 502);
    assert.equal(writes.length, count);
    failLookup = false;
  });

  await t.test("only a signed Woo order event confirms payment and attaches tracking", async () => {
    const payload = JSON.stringify({ id: order.wooId, status: "processing", date_paid: "2026-09-27T12:00:00", transaction_id: "PROVIDER-VERIFIED", meta_data: [{ key: "ptc_consignment_id", value: "DD220826MDKMP9" }] });
    const res = await app.inject({ method: "POST", url: "/v1/deen/webhook/woo", payload, headers: { "content-type": "application/json", "x-wc-webhook-topic": "order.updated", "x-wc-webhook-signature": createHmac("sha256", config.webhookSecret).update(payload).digest("base64") } });
    assert.equal(res.statusCode, 200);
    const status = await app.inject({ url: `/v1/deen/payments/${order.id}`, headers: { authorization: `Bearer ${guest}` } });
    assert.equal(status.json().paymentStatus, "Paid");
    assert.equal(status.json().transactionId, "PROVIDER-VERIFIED");
  });
});
