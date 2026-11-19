/**
 * Clean Architecture --- UseCase: ApplyVoucherUseCase
 *
 * Computes discount calculations for vouchers and loyalty rewards.
 */

import { DomainVoucherCalculation } from "../models/types";

export interface VoucherInput {
  code: string;
  discountType: "fixed" | "percentage" | "free_shipping";
  discountValue: number;
  minOrder?: number;
  used?: boolean;
  expiresAt?: string;
}

export class ApplyVoucherUseCase {
  public execute(
    subtotal: number,
    voucher: VoucherInput,
    shippingFee: number = 0
  ): DomainVoucherCalculation {
    if (subtotal <= 0) {
      return {
        discountAmount: 0,
        finalTotal: 0,
        isEligible: false,
        message: "Cart is empty.",
      };
    }

    if (voucher.used) {
      return {
        discountAmount: 0,
        finalTotal: subtotal + shippingFee,
        isEligible: false,
        message: "This voucher has already been used.",
      };
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
      return {
        discountAmount: 0,
        finalTotal: subtotal + shippingFee,
        isEligible: false,
        message: "This voucher has expired.",
      };
    }

    if (voucher.minOrder && subtotal < voucher.minOrder) {
      return {
        discountAmount: 0,
        finalTotal: subtotal + shippingFee,
        isEligible: false,
        message: `Minimum order amount of ৳${voucher.minOrder} required to apply this voucher.`,
      };
    }

    let discount = 0;

    switch (voucher.discountType) {
      case "fixed":
        discount = Math.min(voucher.discountValue, subtotal);
        break;
      case "percentage":
        discount = Math.round((subtotal * voucher.discountValue) / 100);
        break;
      case "free_shipping":
        discount = shippingFee;
        break;
      default:
        discount = 0;
    }

    const totalBeforeDiscount = subtotal + shippingFee;
    const finalTotal = Math.max(0, totalBeforeDiscount - discount);

    return {
      discountAmount: discount,
      finalTotal,
      isEligible: true,
      message: `Voucher "${voucher.code}" applied successfully (-৳${discount}).`,
    };
  }
}
