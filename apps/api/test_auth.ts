import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerDeenRoutes } from "./src/routes.js";
import { config } from "./src/config.js";

async function runTests() {
  console.log("==================================================");
  console.log("  DEEN AUTH SUITE TEST (Login / Logout / Signup)  ");
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

  // 1. Test Guest session creation (Signup as Guest)
  console.log("\n1. Testing Anonymous Guest Signup (`POST /v1/auth/guest`)...");
  const guestRes = await app.inject({
    method: "POST",
    url: "/v1/auth/guest",
    headers: defaultHeaders,
    payload: {},
  });
  assert(guestRes.statusCode === 201, `Guest signup status code is 201 (got ${guestRes.statusCode})`);
  const guestData = JSON.parse(guestRes.payload);
  assert(guestData.success === true, "Guest signup success is true");
  assert(typeof guestData.token === "string" && guestData.token.startsWith("guest_"), `Guest token format valid: ${guestData.token}`);
  assert(/^01[3-9]\d{8}$/.test(guestData.phone), `Guest phone format valid BD number: ${guestData.phone}`);

  // 2. Test Guest Token Verification (`GET /v1/auth/guest/:token`)
  console.log("\n2. Testing Guest Token Lookup (`GET /v1/auth/guest/:token`)...");
  const guestLookupRes = await app.inject({
    method: "GET",
    url: `/v1/auth/guest/${guestData.token}`,
    headers: defaultHeaders,
  });
  assert(guestLookupRes.statusCode === 200, "Guest lookup status code is 200");
  const guestLookupData = JSON.parse(guestLookupRes.payload);
  assert(guestLookupData.phone === guestData.phone, "Guest lookup matched phone");

  // 3. Test Customer Registration / Signup (`POST /v1/auth/register`)
  console.log("\n3. Testing Customer Signup / Register (`POST /v1/auth/register`)...");
  const testPhone = "01952700500";
  const testName = "Sajid Islam Test";
  const testEmail = "sajid.test@deencommerce.com";

  const regRes = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    headers: defaultHeaders,
    payload: {
      name: testName,
      phone: testPhone,
      email: testEmail,
    },
  });
  assert(regRes.statusCode === 200, `Register status is 200 (got ${regRes.statusCode})`);
  const regData = JSON.parse(regRes.payload);
  assert(regData.success === true, "Register response success is true");
  assert(regData.user.name === testName, "Register returned correct user name");
  assert(regData.user.phone === testPhone, "Register returned correct phone");
  assert(regData.user.role === "customer", "Register user role is customer");

  // 4. Test Customer Lookup (`GET /v1/auth/customer/:phone`)
  console.log("\n4. Testing Customer Lookup by Phone (`GET /v1/auth/customer/:phone`)...");
  const custLookupRes = await app.inject({
    method: "GET",
    url: `/v1/auth/customer/${testPhone}`,
    headers: defaultHeaders,
  });
  assert(custLookupRes.statusCode === 200, "Customer lookup status is 200");
  const custData = JSON.parse(custLookupRes.payload);
  assert(custData.found === true, "Customer was found in directory");
  assert(custData.customer.name === testName, "Customer name matches");

  // 5. Test Register Validation Errors (Empty name, invalid phone format)
  console.log("\n5. Testing Signup Validation Guardrails...");
  const badRegRes1 = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    headers: defaultHeaders,
    payload: {
      name: "A", // too short (schema requires minLength 2)
      phone: testPhone,
    },
  });
  assert(badRegRes1.statusCode === 400 || badRegRes1.statusCode === 422, "Short name rejected properly (schema/handler validation)");

  const badRegRes2 = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    headers: defaultHeaders,
    payload: {
      name: "Valid Name",
      phone: "12345", // invalid BD phone
    },
  });
  assert(badRegRes2.statusCode === 400 || badRegRes2.statusCode === 422, "Invalid phone rejected properly");

  // 6. Test Login Validation & Authentication Flow (`POST /v1/auth/login`)
  console.log("\n6. Testing Login Handler & Credential Checks (`POST /v1/auth/login`)...");
  const emptyLoginRes = await app.inject({
    method: "POST",
    url: "/v1/auth/login",
    headers: defaultHeaders,
    payload: {
      username: "",
      password: "",
    },
  });
  assert(emptyLoginRes.statusCode === 400 || emptyLoginRes.statusCode === 422, "Empty login credentials rejected");

  const invalidLoginRes = await app.inject({
    method: "POST",
    url: "/v1/auth/login",
    headers: defaultHeaders,
    payload: {
      username: "non_existent_wp_user_9988",
      password: "incorrect_password_123",
    },
  });
  assert(invalidLoginRes.statusCode === 401, `Invalid credentials properly return 401 Unauthorized (got ${invalidLoginRes.statusCode})`);
  const invalidLoginData = JSON.parse(invalidLoginRes.payload);
  assert(invalidLoginData.success === false, "Invalid login returned success: false");

  // 7. Test `/v1/auth/me` without token and with invalid token
  console.log("\n7. Testing Session Inspection & Logout Guard (`GET /v1/auth/me`)...");
  const noTokenRes = await app.inject({
    method: "GET",
    url: "/v1/auth/me",
    headers: defaultHeaders,
  });
  assert(noTokenRes.statusCode === 401, "Request without token returns 401");

  const fakeTokenRes = await app.inject({
    method: "GET",
    url: "/v1/auth/me",
    headers: {
      ...defaultHeaders,
      authorization: "Bearer fake_token_abc_123",
    },
  });
  assert(fakeTokenRes.statusCode === 401, "Request with invalid/logged-out token returns 401");

  // 8. Test Session Persistence Across Server Restarts
  console.log("\n8. Testing Session Persistence & Restart Recovery...");
  // Mint a guest session
  const rebootGuest = await app.inject({
    method: "POST",
    url: "/v1/auth/guest",
    headers: defaultHeaders,
    payload: {},
  });
  const rebootGuestData = JSON.parse(rebootGuest.payload);
  const guestTokenToPersist = rebootGuestData.token;

  // Create a second Fastify instance to simulate server restart
  const app2 = Fastify({ logger: false });
  await app2.register(cors, { origin: true });
  await registerDeenRoutes(app2);
  await app2.ready();

  const restoredGuestRes = await app2.inject({
    method: "GET",
    url: `/v1/auth/guest/${guestTokenToPersist}`,
    headers: defaultHeaders,
  });
  assert(restoredGuestRes.statusCode === 200, "Guest session restored from disk on new server instance");
  const restoredGuestData = JSON.parse(restoredGuestRes.payload);
  assert(restoredGuestData.token === guestTokenToPersist, "Restored guest token matches");

  console.log(`\n==================================================`);
  console.log(`  ALL ${passed}/${total} AUTH TESTS PASSED SUCCESSFULLY!  `);
  console.log(`==================================================\n`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
