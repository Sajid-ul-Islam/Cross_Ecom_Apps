import type { Product, OrderResult, BdDistrict, BankOffer, ActiveCampaignState } from "./api";

/**
 * Lightweight zero-dependency runtime validation contracts for WooCommerce & Gateway payloads.
 * Protects Next.js components from malformed upstream WordPress data.
 */

export function isValidProduct(data: unknown): data is Product {
  if (!data || typeof data !== "object") return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.price === "number" &&
    Array.isArray(p.images)
  );
}

export function validateProductList(data: unknown): Product[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isValidProduct);
}

export function isValidOrderResult(data: unknown): data is OrderResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.number === "string" &&
    typeof o.total === "number"
  );
}

export function isValidDistrict(data: unknown): data is BdDistrict {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.code === "string" && typeof d.name === "string";
}

export function validateDistrictList(data: unknown): BdDistrict[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isValidDistrict);
}
