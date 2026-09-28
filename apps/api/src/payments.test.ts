import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac, createHash } from "node:crypto";
import Fastify from "fastify";
import { registerDeenRoutes, signSessionToken } from "./routes.js";
import { verifySslCommerzIpnSignature } from "./payments.js";
import { config } from "./config.js";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

function formEncode(fields: Record<string, string>): string {
  return Object.entries(fields).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

/** Mirror of the provider's official signature scheme: MD5 of sorted k=v pairs per verify_key. */
function signIpn(fields: Record<string, string>, verifyKey: string[]): string {
  const payload: Record<string, string> = { ...fields, verify_key: verifyKey.join(",") };
  const parts = verifyKey.sort().map((k) => `${k}=${payload[k]}`);
  return createHash("md5").update(parts.join("&")).digest("hex");
}

test("payment verification engine confirms settlement only via the provider", async (t) => {
  const wooPaymentWrites: any[] = [];
  let validationResponse: () => Response = () => json({ status: "FAILED" });
  let validationShouldFail = false;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/payment_gateways")) return json([{ id: "cod", title: "Cash", enabled: true }, { id: "sslcommerz", title: "Cards", enabled: true }]);
    if (url.pathname.endsWith("/shipping/zones")) return json([{ id: 1, name: "Inside Dhaka" }]);
    if (url.pathname.endsWith("/shipping/zones/1/methods")) return json([{ method_id: "flat_rate", enabled: true, settings: { cost: { value: "50" } } }]);
    if (url.pathname.endsWith("/products")) return json([{ id: 123, status: "publish", sku: "DENIM", name: "Jeans", price: "1200", regular_price: "1200", categories: [{ name: "JEANS" }], images: [], attributes: [{ name: "Size", options: ["M"] }], stock_status: "instock" }]);
    if (url.pathname.endsWith("/products/123/variations")) return json([{ id: 124, price: "1200", regular_price: "1200", stock_status: "instock", attributes: [{ option: "M" }] }]);
    if (url.pathname.endsWith("/validator/api/validationserverAPI.php")) {
      if (validationShouldFail) throw new TypeError("network unreachable");
      return validationResponse();
    }
    if (url.pathname.endsWith("/orders") && init?.method === "POST") {
      return json({ id: 9001, number: "WC-9001", total: "1250", payment_url: "https://woo.test/pay", order_key: "k", status: "pending" }, 201);
    }
    if (/\/orders\/\d+$/.test(url.pathname) && init?.method === "PUT") {
      wooPaymentWrites.push(JSON.parse(String(init.body)));
      return json({ id: 9001, status: JSON.parse(String(init.body)).status });
    }
    if (url.pathname.endsWith("/orders")) return json([], 200);
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };

  process.env.SSLCOMMERZ_STORE_ID = "test_store_id";
  process.env.SSLCOMMERZ_STORE_PASSWD = "test_store_passwd";
  delete process.env.SSLCOMMERZ_MODE;
  t.after(() => {
    globalThis.fetch = originalFetch;
    delete process.env.SSLCOMMERZ_STORE_ID;
    delete process.env.SSLCOMMERZ_STORE_PASSWD;
  });

  const app = Fastify();
  await registerDeenRoutes(app);
  t.after(() => app.close());

  const guest = signSessionToken({ type: "guest", iat: Date.now(), exp: Date.now() + 60_000 });
  const headers = { authorization: `Bearer ${guest}`, "content-type": "application/json" };

  // Place a prepaid (SSLCommerz) order against the mocked Woo backend.
  const place = await app.inject({
    method: "POST",
    url: "/v1/deen/orders",
    headers: { ...headers, "idempotency-key": randomUUID() },
    payload: {
      name: "Test Customer", phone: "01712345678", address: "House 12, Road 4, Dhaka", city: "Dhaka",
      state: "BD-13", district: "BD-13", postcode: "1200", area: "dhaka", payment: "sslcommerz",
      items: [{ productId: "123", variationId: 124, size: "M", qty: 1 }],
    },
  });
  assert.equal(place.statusCode, 201, place.body);
  const order = place.json();
  assert.equal(order.total, 1250);

  await t.test("verify without a provider reference is a validation error", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id } });
    assert.equal(res.statusCode, 422);
    assert.equal(res.json().fields?.[0], "valId");
  });

  await t.test("an unsettled transaction never marks the order paid", async () => {
    validationResponse = () => json({ status: "FAILED", tran_id: "WC-9001", currency_amount: "1250", risk_level: 0 });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_failed_1" } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, "NOT_SETTLED");
    assert.equal(wooPaymentWrites.length, 0, "no upstream write before verification");
  });

  await t.test("a settled amount that mismatches the order total is rejected", async () => {
    validationResponse = () => json({ status: "VALID", tran_id: "WC-9001", currency_amount: "999", risk_level: 0 });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_mismatch" } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, "AMOUNT_MISMATCH");
    assert.equal(wooPaymentWrites.length, 0);
  });

  await t.test("a settled transaction belonging to another order is rejected", async () => {
    validationResponse = () => json({ status: "VALID", tran_id: "SOMEONE-ELSE", currency_amount: "1250", risk_level: 0 });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_foreign" } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, "TRANSACTION_MISMATCH");
    assert.equal(wooPaymentWrites.length, 0);
  });

  await t.test("a risky settlement is held, not confirmed", async () => {
    validationResponse = () => json({ status: "VALID", tran_id: "WC-9001", currency_amount: "1250", risk_level: 1 });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_risky" } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, "RISKY_TRANSACTION");
    assert.equal(wooPaymentWrites.length, 0);
  });

  await t.test("provider outage yields 502 and no state change", async () => {
    validationShouldFail = true;
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_outage" } });
    assert.equal(res.statusCode, 502);
    assert.equal(wooPaymentWrites.length, 0);
    validationShouldFail = false;
  });

  await t.test("verified settlement marks the order paid exactly once upstream", async () => {
    validationResponse = () => json({ status: "VALIDATED", tran_id: "WC-9001", currency_amount: "1250", risk_level: 0, val_id: "val_ok", bank_tran_id: "BANK-1" });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_ok" } });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().paymentStatus, "Paid");
    assert.equal(wooPaymentWrites.length, 1);
    assert.equal(wooPaymentWrites[0].set_paid, true);
    assert.equal(wooPaymentWrites[0].status, "processing");
    assert.equal(wooPaymentWrites[0].transaction_id, "WC-9001");
  });

  await t.test("repeat verification is idempotent and does not rewrite the order", async () => {
    const writesBefore = wooPaymentWrites.length;
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: order.id, valId: "val_ok" } });
    assert.equal(res.statusCode, 200);
    assert.equal(wooPaymentWrites.length, writesBefore, "already-paid orders skip the upstream write");
  });

  await t.test("foreign sessions cannot verify someone else's order", async () => {
    const stranger = signSessionToken({ type: "user", userId: 777, role: "customer", iat: Date.now(), exp: Date.now() + 60_000 });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers: { authorization: `Bearer ${stranger}`, "content-type": "application/json" }, payload: { orderId: order.id, valId: "val_ok" } });
    assert.equal(res.statusCode, 404);
  });

  await t.test("COD orders have nothing to verify online", async () => {
    const cod = await app.inject({
      method: "POST", url: "/v1/deen/orders",
      headers: { ...headers, "idempotency-key": randomUUID() },
      payload: {
        name: "COD Customer", phone: "01812345678", address: "House 9, Road 2, Dhaka", city: "Dhaka",
        state: "BD-13", district: "BD-13", postcode: "1200", area: "dhaka", payment: "cod",
        items: [{ productId: "123", variationId: 124, size: "M", qty: 1 }],
      },
    });
    assert.equal(cod.statusCode, 201);
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId: cod.json().id, valId: "val_x" } });
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, "NOT_VERIFIABLE");
  });

  await t.test("unsigned JSON callback posts are still rejected", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", headers: { "content-type": "application/json" }, payload: { orderId: order.id, status: "SUCCESS" } });
    assert.equal(res.statusCode, 401);
  });

  await t.test("signed IPN with a bad signature is rejected", async () => {
    const fields = { tran_id: "WC-9001", val_id: "val_ok", amount: "1250.00", status: "VALID" };
    const body = formEncode({ ...fields, verify_key: "store_id,tran_id,val_id,status,amount", verify_sign: "deadbeef" });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", headers: { "content-type": "application/x-www-form-urlencoded" }, payload: body });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error, "BAD_SIGNATURE");
  });

  await t.test("a valid signed IPN is re-validated against the provider before confirming", async () => {
    validationResponse = () => json({ status: "VALID", tran_id: "WC-9001", currency_amount: "1250", risk_level: 0, val_id: "val_ipn" });
    const fields = { tran_id: "WC-9001", val_id: "val_ipn", amount: "1250.00", status: "VALID", store_id: "test_store_id" };
    const sign = signIpn(fields, ["store_id", "tran_id", "val_id", "status", "amount"]);
    const body = formEncode({ ...fields, verify_key: "store_id,tran_id,val_id,status,amount", verify_sign: sign });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", headers: { "content-type": "application/x-www-form-urlencoded" }, payload: body });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().verified, true);
  });

  await t.test("duplicate IPN deliveries are acknowledged idempotently", async () => {
    const fields = { tran_id: "WC-9001", val_id: "val_ipn", amount: "1250.00", status: "VALID", store_id: "test_store_id" };
    const sign = signIpn(fields, ["store_id", "tran_id", "val_id", "status", "amount"]);
    const body = formEncode({ ...fields, verify_key: "store_id,tran_id,val_id,status,amount", verify_sign: sign });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", headers: { "content-type": "application/x-www-form-urlencoded" }, payload: body });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().duplicate, true);
  });

  await t.test("IPN failure notice flips a pending order to failed/cancelled", async () => {
    const order2 = await app.inject({
      method: "POST", url: "/v1/deen/orders",
      headers: { ...headers, "idempotency-key": randomUUID() },
      payload: {
        name: "Fail Customer", phone: "01912345678", address: "House 3, Road 7, Dhaka", city: "Dhaka",
        state: "BD-13", district: "BD-13", postcode: "1200", area: "dhaka", payment: "sslcommerz",
        items: [{ productId: "123", variationId: 124, size: "M", qty: 1 }],
      },
    });
    assert.equal(order2.statusCode, 201);
    const failed = order2.json();
    const fields = { tran_id: failed.number, val_id: "val_none", amount: "1250.00", status: "FAILED", store_id: "test_store_id" };
    const sign = signIpn(fields, ["store_id", "tran_id", "val_id", "status", "amount"]);
    const body = formEncode({ ...fields, verify_key: "store_id,tran_id,val_id,status,amount", verify_sign: sign });
    const res = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", headers: { "content-type": "application/x-www-form-urlencoded" }, payload: body });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().status, "failed");
  });
});

test("IPN signature helper matches the official MD5 scheme and rejects tampering", async () => {
  const fields = { tran_id: "T1", val_id: "V1", amount: "100.00", status: "VALID", store_id: "S1" };
  const verifyKey = ["store_id", "tran_id", "val_id", "status", "amount"];

  const good = signIpn(fields, verifyKey);
  assert.equal(verifySslCommerzIpnSignature({ ...fields, verify_key: verifyKey.join(","), verify_sign: good }), true);
  assert.equal(verifySslCommerzIpnSignature({ ...fields, verify_key: verifyKey.join(","), verify_sign: good.toUpperCase() }), true, "case-insensitive hex compare");

  assert.equal(verifySslCommerzIpnSignature({ ...fields, verify_key: verifyKey.join(","), verify_sign: "0".repeat(32) }), false, "wrong hash");
  assert.equal(verifySslCommerzIpnSignature({ ...fields, verify_key: "store_id,tran_id", verify_sign: good }), false, "verify_key naming a missing field");
  assert.equal(verifySslCommerzIpnSignature({ ...fields }), false, "missing signature fields");

  // Exact documented construction: sorted k=v joined with &, MD5 hex.
  const manual = createHash("md5").update("amount=100.00&status=VALID&store_id=S1&tran_id=T1&val_id=V1").digest("hex");
  assert.equal(good, manual);
});

test("without provider credentials the verify endpoint keeps the safe legacy behaviour", async (t) => {
  const saved = { ...process.env };
  delete process.env.SSLCOMMERZ_STORE_ID;
  delete process.env.SSLCOMMERZ_STORE_PASSWD;
  delete process.env.BKASH_APP_KEY;
  t.after(() => { process.env = saved as any; });

  let sawOrderWrite = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/payment_gateways")) return json([{ id: "cod", title: "Cash", enabled: true }, { id: "sslcommerz", title: "Cards", enabled: true }]);
    if (url.pathname.endsWith("/shipping/zones")) return json([{ id: 1, name: "Inside Dhaka" }]);
    if (url.pathname.endsWith("/shipping/zones/1/methods")) return json([{ method_id: "flat_rate", enabled: true, settings: { cost: { value: "50" } } }]);
    if (url.pathname.endsWith("/products")) return json([{ id: 123, status: "publish", sku: "DENIM", name: "Jeans", price: "1200", regular_price: "1200", categories: [{ name: "JEANS" }], images: [], attributes: [{ name: "Size", options: ["M"] }], stock_status: "instock" }]);
    if (url.pathname.endsWith("/products/123/variations")) return json([{ id: 124, price: "1200", regular_price: "1200", stock_status: "instock", attributes: [{ option: "M" }] }]);
    if (url.pathname.endsWith("/orders") && init?.method === "POST") return json({ id: 9100, number: "WC-9100", total: "1250", payment_url: "https://woo.test/pay", order_key: "k", status: "pending" }, 201);
    if (/\/orders\/\d+$/.test(url.pathname) && init?.method === "PUT") { sawOrderWrite = true; return json({ id: 9100, status: "processing" }); }
    if (url.pathname.endsWith("/orders")) return json([], 200);
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };

  const app = Fastify();
  await registerDeenRoutes(app);
  t.after(async () => { globalThis.fetch = originalFetch; await app.close(); });

  // Guest places a prepaid order, then tries to self-confirm with a made-up trxId.
  const guest = signSessionToken({ type: "guest", iat: Date.now(), exp: Date.now() + 60_000 });
  const headers = { authorization: `Bearer ${guest}`, "content-type": "application/json" };
  const place = await app.inject({
    method: "POST", url: "/v1/deen/orders",
    headers: { ...headers, "idempotency-key": randomUUID() },
    payload: { name: "Legacy Customer", phone: "01712345678", address: "House 12, Road 4, Dhaka", city: "Dhaka", state: "BD-13", district: "BD-13", postcode: "1200", area: "dhaka", payment: "sslcommerz", items: [{ productId: "123", variationId: 124, size: "M", qty: 1 }] },
  });
  assert.equal(place.statusCode, 201, place.body);
  const orderId = place.json().id;

  const res = await app.inject({ method: "POST", url: "/v1/deen/payments/verify", headers, payload: { orderId, trxId: "MADEUP" } });
  assert.equal(res.statusCode, 422);
  assert.equal(res.json().error, "PAYMENT_VERIFICATION_REQUIRED");
  assert.equal(sawOrderWrite, false, "no upstream write without provider verification");

  const cb = await app.inject({ method: "POST", url: "/v1/deen/payments/callback", payload: { orderId: "123", status: "SUCCESS" } });
  assert.equal(cb.statusCode, 401);

  assert.equal(createHmac("sha256", config.webhookSecret).update("x").digest("base64").length > 0, true);
});
