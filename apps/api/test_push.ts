import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerDeenRoutes } from "./src/routes.js";
import { config } from "./src/config.js";

async function runPushTests() {
  console.log("==================================================");
  console.log("  DEEN PUSH NOTIFICATION & BROADCAST TEST SUITE  ");
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

  // 1. Register Client Push Tokens
  console.log("\n1. Testing Push Token Registration (`POST /v1/deen/push/register-token`)...");
  const testToken1 = "ExponentPushToken[mock_iphone_token_12345678]";
  const regPushRes = await app.inject({
    method: "POST",
    url: "/v1/deen/push/register-token",
    headers: defaultHeaders,
    payload: {
      token: testToken1,
      phone: "01952700500",
      area: "dhaka",
      device: {
        platform: "ios",
        osVersion: "17.4",
        model: "iPhone 15 Pro",
      },
    },
  });

  assert(regPushRes.statusCode === 200, `Register push token returned 200 (got ${regPushRes.statusCode})`);
  const regPushData = JSON.parse(regPushRes.payload);
  assert(regPushData.success === true, "Register push token success is true");

  // Register second device in outside dhaka
  const testToken2 = "ExponentPushToken[mock_android_token_87654321]";
  await app.inject({
    method: "POST",
    url: "/v1/deen/push/register-token",
    headers: defaultHeaders,
    payload: {
      token: testToken2,
      phone: "01812345678",
      area: "outside_standard",
      device: {
        platform: "android",
        osVersion: "14",
        model: "Pixel 8",
      },
    },
  });

  // 2. Test Push Stats Endpoint (Gated behind Admin Auth)
  console.log("\n2. Testing Push Stats Endpoint (`GET /v1/deen/push/stats`)...");
  const unauthStatsRes = await app.inject({
    method: "GET",
    url: "/v1/deen/push/stats",
    headers: defaultHeaders,
  });
  assert(unauthStatsRes.statusCode === 403, "Unauthenticated access to push stats blocked (403)");

  // 3. Test Broadcast Inbox (`GET /v1/deen/broadcasts`)
  console.log("\n3. Testing Public Broadcasts Inbox (`GET /v1/deen/broadcasts`)...");
  const listBcRes = await app.inject({
    method: "GET",
    url: "/v1/deen/broadcasts",
    headers: defaultHeaders,
  });
  assert(listBcRes.statusCode === 200, "Broadcasts inbox returned 200");
  const broadcastsList = JSON.parse(listBcRes.payload);
  assert(Array.isArray(broadcastsList) && broadcastsList.length >= 2, "Default broadcasts retrieved");

  // 4. Test Validation on Broadcast Dispatch (`POST /v1/deen/broadcasts`)
  console.log("\n4. Testing Broadcast Input Validation Guardrails...");
  const invalidBcRes = await app.inject({
    method: "POST",
    url: "/v1/deen/broadcasts",
    headers: defaultHeaders,
    payload: {
      title: "",
      body: "",
    },
  });
  assert(invalidBcRes.statusCode === 400 || invalidBcRes.statusCode === 403 || invalidBcRes.statusCode === 422, "Invalid broadcast payload rejected");

  console.log(`\n==================================================`);
  console.log(`  ALL ${passed}/${total} PUSH NOTIFICATION TESTS PASSED!  `);
  console.log(`==================================================\n`);
  process.exit(0);
}

runPushTests().catch((err) => {
  console.error("Push test failed:", err);
  process.exit(1);
});
