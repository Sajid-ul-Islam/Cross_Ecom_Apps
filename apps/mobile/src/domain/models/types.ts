/**
 * Clean Architecture --- Domain Models
 * Pure domain interfaces and types, independent of any UI or network framework.
 */

export interface DomainUser {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  isGuest: boolean;
  role: "customer" | "admin";
}

export interface DomainDistrict {
  id: number;
  name: string;
  code: string; // e.g. "BD-13"
  zone: "dhaka" | "outside_dhaka";
}

export interface DomainShippingFeeResult {
  charge: number;
  zone: "dhaka" | "outside_dhaka" | "pickup";
  formattedCharge: string;
  title: string;
}

export interface DomainVoucherCalculation {
  discountAmount: number;
  finalTotal: number;
  isEligible: boolean;
  message?: string;
}

export interface DomainConsignmentTracking {
  hasTracking: boolean;
  consignmentId: string | null;
  trackingUrl: string | null;
  statusLabel: string;
}
