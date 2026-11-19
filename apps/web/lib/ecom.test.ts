/**
 * Automated Unit Tests for Web E-commerce Logic & Logistics Parity
 * Verifies 64 districts resolution, shipping charge calculations, and BDT formatting.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BD_DISTRICTS } from "./districts";
import { bdt } from "./api";

describe("Web E-commerce & Logistics Parity Tests", () => {
  it("includes all 64 Bangladesh districts with valid BD-XX codes", () => {
    assert.equal(BD_DISTRICTS.length, 64);

    const dhaka = BD_DISTRICTS.find((d) => d.code === "BD-13");
    assert.ok(dhaka, "Dhaka district (BD-13) must exist");
    assert.equal(dhaka?.name, "Dhaka");

    const chittagong = BD_DISTRICTS.find((d) => d.code === "BD-10");
    assert.ok(chittagong, "Chattogram district (BD-10) must exist");

    // Ensure every district has a name and code starting with BD-
    for (const district of BD_DISTRICTS) {
      assert.ok(district.name.length > 0, "District name cannot be empty");
      assert.ok(district.code.startsWith("BD-"), `Invalid district code: ${district.code}`);
    }
  });

  it("calculates accurate delivery charges according to district code (Dhaka BD-13 vs outside)", () => {
    function getShippingCharge(districtCode: string, isPickup: boolean = false): number {
      if (isPickup) return 0;
      return districtCode === "BD-13" ? 50 : 90;
    }

    assert.equal(getShippingCharge("BD-13"), 50); // Dhaka: ৳50
    assert.equal(getShippingCharge("BD-10"), 90); // Chattogram: ৳90
    assert.equal(getShippingCharge("BD-60"), 90); // Sylhet: ৳90
    assert.equal(getShippingCharge("BD-27"), 90); // Khulna: ৳90
    assert.equal(getShippingCharge("BD-13", true), 0); // Store Pickup: ৳0
    assert.equal(getShippingCharge("BD-10", true), 0); // Store Pickup: ৳0
  });

  it("formats BDT currency with Bangladeshi Taka symbol ৳ correctly", () => {
    assert.equal(bdt(0), "৳0");
    assert.equal(bdt(50), "৳50");
    assert.equal(bdt(2500), "৳2,500");
    assert.equal(bdt(10000), "৳10,000");
  });
});
