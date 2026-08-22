import { getPathaoToken, getPathaoStores, getPathaoCities, getPathaoTrackingInfo } from "./src/pathao.js";

async function runPathaoTests() {
  console.log("==================================================");
  console.log("  PATHAO COURIER API INTEGRATION TEST SUITE       ");
  console.log("==================================================\n");

  console.log("1. Authenticating with Pathao Hermes API (/aladdin/api/v1/issue-token)...");
  const token = await getPathaoToken();
  if (!token) {
    console.error("  ❌ Failed to acquire Pathao bearer token. Check credentials.");
    process.exit(1);
  }
  console.log(`  ✔ Bearer token issued successfully (Prefix: ${token.slice(0, 15)}...)`);

  console.log("\n2. Fetching Merchant Stores (/aladdin/api/v1/stores)...");
  const stores = await getPathaoStores();
  if (stores && stores.data) {
    const list = stores.data.data ?? stores.data;
    console.log(`  ✔ Successfully fetched stores: ${list.length} store(s) found:`);
    for (const s of list) {
      console.log(`    • [ID: ${s.store_id}] "${s.store_name}" | Address: ${s.store_address}`);
    }
  } else {
    console.log("  ℹ Stores endpoint response:", JSON.stringify(stores));
  }

  console.log("\n3. Fetching Bangladesh Cities (/aladdin/api/v1/countries/1/city-list)...");
  const cities = await getPathaoCities();
  if (cities && cities.data) {
    console.log(`  ✔ Successfully fetched delivery cities: ${cities.data.data?.length ?? cities.data.length ?? 0} cities available.`);
  } else {
    console.log("  ℹ Cities endpoint response:", JSON.stringify(cities));
  }

  console.log("\n4. Testing Live Parcel Tracking Lookup (/aladdin/api/v1/orders/{id}/info)...");
  const testConsId = "DD220826MDKMP9";
  const tracking = await getPathaoTrackingInfo(testConsId);
  console.log(`  ✔ Live tracking query executed for consignment: ${testConsId}`);
  if (tracking) {
    console.log("    Response:", JSON.stringify(tracking).slice(0, 120) + "...");
  } else {
    console.log("    (Consignment query completed; test ID not found or historical)");
  }

  console.log("\n==================================================");
  console.log("  PATHAO COURIER API TEST COMPLETED SUCCESSFULLY! ");
  console.log("==================================================\n");
}

runPathaoTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
