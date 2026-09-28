import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { build } from "./app.js";
import { signSessionToken, verifySessionToken } from "./routes.js";
import { config } from "./config.js";

const token = (id = 42, role: "customer" | "admin" = "customer") => signSessionToken({
  type: "user", userId: `wp_${id}`, username: `customer${id}`, role,
  iat: Date.now(), exp: Date.now() + 60_000,
});

test("production handlers enforce authentication and session boundaries", async (t) => {
  const app = await build();
  t.after(() => app.close());

  await t.test("empty admin login and historical default credentials cannot mint sessions", async () => {
    for (const payload of [{}, { password: "admin" }, { password: "admin123" }]) {
      const result = await app.inject({ method: "POST", url: "/v1/auth/admin-login", payload });
      assert.ok([400, 401].includes(result.statusCode));
      assert.equal(result.json().token, undefined);
    }
  });

  await t.test("admin APIs reject guests, public client keys and absent key configuration", async () => {
    for (const headers of [{}, { "x-gateway-key": "deen_mobile_gateway_secret_2026" }, { authorization: `Bearer ${token()}` }]) {
      const result = await app.inject({ url: "/v1/deen/admin/analytics/scheduler/status", headers });
      assert.equal(result.statusCode, 403);
    }
    assert.equal((await app.inject({ url: "/v1/deen/admin/analytics/scheduler/status", headers: { authorization: `Bearer ${token(1, "admin")}` } })).statusCode, 200);
  });

  await t.test("profile writes and consignment changes require the appropriate identity", async () => {
    assert.equal((await app.inject({ method: "POST", url: "/v1/auth/update-profile", payload: { name: "Attacker", phone: "01712345678" } })).statusCode, 401);
    assert.equal((await app.inject({ method: "POST", url: "/v1/deen/orders/123/consignment", payload: { consignmentId: "FAKE" } })).statusCode, 403);
  });

  await t.test("logout revokes a signed token and expiry cannot fall back to stored sessions", async () => {
    const bearer = token();
    const headers = { authorization: `Bearer ${bearer}` };
    assert.equal((await app.inject({ url: "/v1/auth/me", headers })).statusCode, 200);
    await app.inject({ method: "POST", url: "/v1/auth/logout", headers });
    assert.equal((await app.inject({ url: "/v1/auth/me", headers })).statusCode, 401);
    assert.equal(verifySessionToken(bearer), null);
    const expired = signSessionToken({ type: "user", iat: Date.now() - 1000, exp: Date.now() - 1 });
    assert.equal(verifySessionToken(expired), null);
    assert.equal(verifySessionToken(token().replace(/^usr/, "gst")), null);
  });

  await t.test("unverified payment submissions never report payment success", async () => {
    // Anonymous callers can't address an order at all (order lookup is auth-scoped).
    assert.equal((await app.inject({ method: "POST", url: "/v1/deen/payments/verify", payload: { orderId: "123", trxId: "MADEUP" } })).statusCode, 404);
    assert.equal((await app.inject({ method: "POST", url: "/v1/deen/payments/callback", payload: { orderId: "123", status: "SUCCESS" } })).statusCode, 401);
  });

  await t.test("Woo webhook signatures are mandatory and checked over original bytes", async () => {
    const payload = '{"id":123, "status":"processing"}';
    const headers = { "content-type": "application/json", "x-wc-webhook-topic": "order.updated" };
    assert.equal((await app.inject({ method: "POST", url: "/v1/deen/webhook/woo", headers, payload })).statusCode, 401);
    const signature = createHmac("sha256", config.webhookSecret).update(payload).digest("base64");
    assert.equal((await app.inject({ method: "POST", url: "/v1/deen/webhook/woo", headers: { ...headers, "x-wc-webhook-signature": signature }, payload })).statusCode, 200);
  });

  await t.test("CORS rejects suffix spoofing and supports PATCH for configured origins", async () => {
    for (const origin of ["https://deencommerce.com.evil.test", "https://evil.test/?localhost", "https://unrelated.vercel.app"]) {
      const result = await app.inject({ url: "/v1/health", headers: { origin } });
      assert.equal(result.headers["access-control-allow-origin"], undefined);
    }
    const result = await app.inject({ method: "OPTIONS", url: "/v1/deen/admin/orders/1/status", headers: { origin: "https://deencommerce.com", "access-control-request-method": "PATCH" } });
    assert.equal(result.statusCode, 204);
    assert.match(String(result.headers["access-control-allow-methods"]), /PATCH/);
  });
});

test("rate limits execute before route handlers and cannot be evaded with X-Forwarded-For", async (t) => {
  const app = await build();
  t.after(() => app.close());
  for (let i = 0; i < 10; i++) {
    assert.equal((await app.inject({ method: "POST", url: "/v1/auth/login", headers: { "x-forwarded-for": `203.0.113.${i}` }, payload: {} })).statusCode, 400);
  }
  assert.equal((await app.inject({ method: "POST", url: "/v1/auth/login", headers: { "x-forwarded-for": "203.0.113.123" }, payload: {} })).statusCode, 429);
});
