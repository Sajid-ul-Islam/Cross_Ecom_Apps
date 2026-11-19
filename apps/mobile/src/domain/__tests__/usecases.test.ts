/**
 * Automated Unit Tests for Mobile Clean Architecture UseCases
 * Tests phone validation, shipping fee calculation, voucher application, and Pathao consignment tracking.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ValidatePhoneUseCase } from "../usecases/ValidatePhoneUseCase";
import { CalculateShippingFeeUseCase } from "../usecases/CalculateShippingFeeUseCase";
import { ApplyVoucherUseCase } from "../usecases/ApplyVoucherUseCase";
import { TrackConsignmentUseCase } from "../usecases/TrackConsignmentUseCase";

describe("Mobile Clean Architecture --- UseCases", () => {
  describe("ValidatePhoneUseCase", () => {
    const useCase = new ValidatePhoneUseCase();

    it("accepts a valid standard 11-digit Bangladeshi mobile number", () => {
      const res = useCase.execute("01712345678");
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, "01712345678");
    });

    it("normalizes international +880 format", () => {
      const res = useCase.execute("+8801952700500");
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, "01952700500");
    });

    it("normalizes Bengali numerals to ASCII numerals", () => {
      const res = useCase.execute("০১৯৫২৭০০৫০০");
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, "01952700500");
    });

    it("rejects non-Bangladeshi numbers and short strings", () => {
      assert.equal(useCase.execute("012345").isValid, false);
      assert.equal(useCase.execute("12345678901").isValid, false);
      assert.equal(useCase.execute("").isValid, false);
    });
  });

  describe("CalculateShippingFeeUseCase", () => {
    const useCase = new CalculateShippingFeeUseCase();

    it("calculates ৳50 delivery fee for Dhaka district (BD-13)", () => {
      const res = useCase.execute("BD-13");
      assert.equal(res.charge, 50);
      assert.equal(res.zone, "dhaka");
      assert.equal(res.formattedCharge, "৳50");
    });

    it("calculates ৳90 delivery fee for Outside Dhaka districts", () => {
      const resChattogram = useCase.execute("BD-10");
      assert.equal(resChattogram.charge, 90);
      assert.equal(resChattogram.zone, "outside_dhaka");
      assert.equal(resChattogram.formattedCharge, "৳90");

      const resSylhet = useCase.execute("BD-60");
      assert.equal(resSylhet.charge, 90);
      assert.equal(resSylhet.zone, "outside_dhaka");
    });

    it("calculates ৳0 for store pickup", () => {
      const res = useCase.execute("BD-13", true);
      assert.equal(res.charge, 0);
      assert.equal(res.zone, "pickup");
      assert.equal(res.formattedCharge, "৳0");
    });
  });

  describe("ApplyVoucherUseCase", () => {
    const useCase = new ApplyVoucherUseCase();

    it("applies fixed discount correctly", () => {
      const voucher = {
        code: "STREAK150",
        discountType: "fixed" as const,
        discountValue: 150,
      };
      const res = useCase.execute(2000, voucher, 50);
      assert.equal(res.isEligible, true);
      assert.equal(res.discountAmount, 150);
      assert.equal(res.finalTotal, 1900); // 2000 + 50 - 150
    });

    it("applies percentage discount correctly", () => {
      const voucher = {
        code: "JAPAN15",
        discountType: "percentage" as const,
        discountValue: 15,
      };
      const res = useCase.execute(2000, voucher, 50);
      assert.equal(res.isEligible, true);
      assert.equal(res.discountAmount, 300); // 15% of 2000 = 300
      assert.equal(res.finalTotal, 1750); // 2050 - 300
    });

    it("applies free shipping discount correctly", () => {
      const voucher = {
        code: "FREEDHAKA",
        discountType: "free_shipping" as const,
        discountValue: 0,
      };
      const res = useCase.execute(1500, voucher, 50);
      assert.equal(res.isEligible, true);
      assert.equal(res.discountAmount, 50);
      assert.equal(res.finalTotal, 1500); // 1500 + 50 - 50
    });

    it("rejects voucher when order is below minOrder", () => {
      const voucher = {
        code: "MIN2500",
        discountType: "fixed" as const,
        discountValue: 250,
        minOrder: 2500,
      };
      const res = useCase.execute(2000, voucher, 50);
      assert.equal(res.isEligible, false);
      assert.equal(res.discountAmount, 0);
      assert.equal(res.finalTotal, 2050);
    });

    it("rejects already used vouchers", () => {
      const voucher = {
        code: "USED100",
        discountType: "fixed" as const,
        discountValue: 100,
        used: true,
      };
      const res = useCase.execute(2000, voucher, 50);
      assert.equal(res.isEligible, false);
    });
  });

  describe("TrackConsignmentUseCase", () => {
    const useCase = new TrackConsignmentUseCase();

    it("resolves live Pathao merchant tracking link for real consignment id", () => {
      const res = useCase.execute("DD220826MDKMP9");
      assert.equal(res.hasTracking, true);
      assert.equal(res.consignmentId, "DD220826MDKMP9");
      assert.equal(
        res.trackingUrl,
        "https://merchant.pathao.com/tracking?consignment_id=DD220826MDKMP9"
      );
      assert.ok(res.statusLabel.includes("DD220826MDKMP9"));
    });

    it("returns 'Preparing Dispatch' when consignment id is absent or empty", () => {
      const res1 = useCase.execute(null);
      assert.equal(res1.hasTracking, false);
      assert.equal(res1.trackingUrl, null);
      assert.equal(res1.statusLabel, "Preparing Dispatch");

      const res2 = useCase.execute("");
      assert.equal(res2.hasTracking, false);
    });

    it("does not create synthetic links for mock or pending placeholder values", () => {
      const res = useCase.execute("pending");
      assert.equal(res.hasTracking, false);
      assert.equal(res.trackingUrl, null);
    });
  });
});
