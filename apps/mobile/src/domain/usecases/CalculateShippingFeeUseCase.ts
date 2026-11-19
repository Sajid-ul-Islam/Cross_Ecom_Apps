/**
 * Clean Architecture --- UseCase: CalculateShippingFeeUseCase
 *
 * Enforces WooCommerce & Pathao logistics shipping rates across all 64 districts:
 * - Dhaka District (code: "BD-13"): ৳50 standard delivery
 * - Outside Dhaka (all other 63 districts): ৳90 delivery
 * - Store Pickup: ৳0
 */

import { DomainShippingFeeResult } from "../models/types";

export class CalculateShippingFeeUseCase {
  public static readonly DHAKA_CODE = "BD-13";
  public static readonly DHAKA_FEE = 50;
  public static readonly OUTSIDE_DHAKA_FEE = 90;
  public static readonly PICKUP_FEE = 0;

  public execute(districtCode: string, isPickup: boolean = false): DomainShippingFeeResult {
    if (isPickup) {
      return {
        charge: CalculateShippingFeeUseCase.PICKUP_FEE,
        zone: "pickup",
        formattedCharge: "৳0",
        title: "Store Pickup (Free)",
      };
    }

    const isDhaka = (districtCode || "").trim().toUpperCase() === CalculateShippingFeeUseCase.DHAKA_CODE;

    if (isDhaka) {
      return {
        charge: CalculateShippingFeeUseCase.DHAKA_FEE,
        zone: "dhaka",
        formattedCharge: `৳${CalculateShippingFeeUseCase.DHAKA_FEE}`,
        title: "Inside Dhaka Delivery (৳50)",
      };
    }

    return {
      charge: CalculateShippingFeeUseCase.OUTSIDE_DHAKA_FEE,
      zone: "outside_dhaka",
      formattedCharge: `৳${CalculateShippingFeeUseCase.OUTSIDE_DHAKA_FEE}`,
      title: "Outside Dhaka Delivery (৳90)",
    };
  }
}
