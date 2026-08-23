import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerDeenRoutes } from "./src/routes.js";
import { config } from "./src/config.js";

async function runPaymentTests() {
  console.log("==================================================");
  console.log("  DEEN BANGLADESHI PAYMENT GATEWAY TEST SUITE     ");
  console.log("==================================================");

  const apiKey = config.gatewayApiKey || "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";
  const defaultHeaders = {
    "content-type": "application/json",
    "x-api-key": apiKey,
  };

  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });
  await registerDeenRoutes(app);
  await app.ready();

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Create a Test Order with bKash
  console.log("\n1. Creating Test Order for bKash Payment...");
  const productsRes = await app.inject({
    method: "GET",
    url: "/v1/deen/products?per_page=1",
    headers: defaultHeaders,
  });
  const productsList = JSON.parse(productsRes.payload);
  const targetProduct = Array.isArray(productsList) && productsList.length > 0 ? productsList[0] : { id: "dn-01" };

  const orderRes = await app.inject({
    method: "POST",
    url: "/v1/deen/orders",
    headers: defaultHeaders,
    payload: {
      name: "Sajid Islam",
      phone: "01952700500",
      address: "Kemal Ataturk Ave, Banani",
      area: "dhaka",
      city: "Dhaka",
      state: "BD-13",
      payment: "bkash",
      items: [{ productId: String(targetProduct.id), size: "32", qty: 1 }],
    },
  });

  if (orderRes.statusCode !== 201) {
    console.error("Order creation returned:", orderRes.statusCode, orderRes.payload);
  }
  assert(orderRes.statusCode === 201, "Test order created successfully (201)");
  const orderData = JSON.parse(orderRes.payload);
  const testOrderId = orderData.id;
  assert(orderData.payment === "bkash", "Order payment method is bkash");
  assert(orderData.total > 0, `Order total is ৳${orderData.total}`);

  // 2. Test Payment Initiation
  console.log("\n2. Testing Payment Session Initiation (`POST /v1/deen/payments/initiate`)...");
  const initRes = await app.inject({
    method: "POST",
    url: "/v1/deen/payments/initiate",
    headers: defaultHeaders,
    payload: {
      orderId: testOrderId,
      paymentMethod: "bkash",
      amount: orderData.total,
    },
  });

  assert(initRes.statusCode === 200, "Payment initiation returned 200");
  const initData = JSON.parse(initRes.payload);
  assert(initData.success === true, "Initiation success is true");
  assert(initData.merchantNumber === "01952700500", "DEEN Merchant number is 01952700500");
  assert(initData.transaction.id.startsWith("TXN_BKASH_"), "Valid transaction token generated");

  // 3. Test Manual / Customer TrxID Submission & Verification
  console.log("\n3. Testing TrxID Verification (`POST /v1/deen/payments/verify`)...");
  const mockTrxId = "BK789XYZ12";
  const verifyRes = await app.inject({
    method: "POST",
    url: "/v1/deen/payments/verify",
    headers: defaultHeaders,
    payload: {
      orderId: testOrderId,
      trxId: mockTrxId,
      paymentMethod: "bkash",
      senderPhone: "01952700500",
    },
  });

  assert(verifyRes.statusCode === 200, "Payment verification returned 200");
  const verifyData = JSON.parse(verifyRes.payload);
  assert(verifyData.success === true, "Verification success is true");
  assert(verifyData.order.paymentStatus === "Paid", "Order paymentStatus updated to Paid");
  assert(verifyData.order.status === "processing", "Order status updated to processing");
  assert(verifyData.order.transactionId === mockTrxId, "Order transactionId matches TrxID");

  // 4. Test Check Payment Status Endpoint (`GET /v1/deen/payments/:orderId`)
  console.log("\n4. Testing Payment Status Query (`GET /v1/deen/payments/:orderId`)...");
  const statusRes = await app.inject({
    method: "GET",
    url: `/v1/deen/payments/${testOrderId}`,
    headers: defaultHeaders,
  });

  assert(statusRes.statusCode === 200, "Payment status query returned 200");
  const statusData = JSON.parse(statusRes.payload);
  assert(statusData.paymentStatus === "Paid", "Queried paymentStatus is Paid");
  assert(statusData.transactionId === mockTrxId, "Queried transactionId is recorded");

  // 5. Test Payment Gateway Callback / Webhook Handler
  console.log("\n5. Testing Payment Callback / Webhook (`POST /v1/deen/payments/callback`)...");
  const callbackRes = await app.inject({
    method: "POST",
    url: "/v1/deen/payments/callback",
    headers: defaultHeaders,
    payload: {
      orderId: testOrderId,
      status: "SUCCESS",
      trxId: "IPN_AUTOPAY_999",
    },
  });

  assert(callbackRes.statusCode === 200, "Payment callback returned 200");
  const callbackData = JSON.parse(callbackRes.payload);
  assert(callbackData.paymentStatus === "Paid", "Order marked as paid via callback");

  console.log(`\n==================================================`);
  console.log(`  ALL ${passed}/${total} PAYMENT GATEWAY TESTS PASSED! `);
  console.log(`==================================================\n`);
  process.exit(0);
}

runPaymentTests().catch((err) => {
  console.error("Payment test failed:", err);
  process.exit(1);
});
