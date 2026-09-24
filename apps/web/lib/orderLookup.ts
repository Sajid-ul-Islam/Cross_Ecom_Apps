import { getOrderById, getOrdersByPhone } from "./woo";

export interface OrderLookupResult {
  found: boolean;
  orderId?: string | number;
  status?: string;
  total?: number;
  items?: string;
  date?: string;
  consignmentId?: string;
  trackingUrl?: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard 11 digits (e.g. 017XXXXXXXX)
 */
function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Looks up WooCommerce order details and validates that the provided phone matches the billing phone.
 */
export async function lookupOrderStatus(
  phone: string,
  orderNumber: string
): Promise<OrderLookupResult> {
  const targetPhone = cleanPhone(phone);
  const targetOrder = String(orderNumber).replace(/\D/g, "");

  if (!targetOrder && !targetPhone) {
    return { found: false, error: "Missing phone or order number" };
  }

  // 1. Try fetching by order ID first
  if (targetOrder) {
    const order = await getOrderById(targetOrder);
    if (order && order.id) {
      const billingPhone = cleanPhone(order.billing?.phone || "");
      // If phone was provided, verify ownership
      if (targetPhone && !billingPhone.includes(targetPhone) && !targetPhone.includes(billingPhone)) {
        return {
          found: false,
          error: "Phone number did not match the billing record on file for this order.",
        };
      }

      const itemNames = (order.line_items || [])
        .map((li: any) => `${li.name} (x${li.quantity})`)
        .join(", ") || "General Apparel";

      const dateStr = order.date_created
        ? new Date(order.date_created).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      const consignmentId = (order.meta_data || []).find(
        (m: any) =>
          m.key === "ptc_consignment_id" ||
          m.key === "pathao_consignment_id" ||
          m.key === "_pathao_consignment_id"
      )?.value;

      return {
        found: true,
        orderId: order.id,
        status: (order.status || "processing").toUpperCase(),
        total: Number(order.total) || 0,
        items: itemNames,
        date: dateStr,
        consignmentId: consignmentId || undefined,
        trackingUrl: consignmentId ? `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}` : undefined,
      };
    }
  }

  // 2. If order not found by ID or no ID given, search by phone
  if (targetPhone) {
    const list = await getOrdersByPhone(targetPhone);
    if (list && list.length > 0) {
      const latest = list[0];
      const itemNames = (latest.line_items || [])
        .map((li: any) => `${li.name} (x${li.quantity})`)
        .join(", ") || "General Apparel";

      const dateStr = latest.date_created
        ? new Date(latest.date_created).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      const consignmentId = (latest.meta_data || []).find(
        (m: any) =>
          m.key === "ptc_consignment_id" ||
          m.key === "pathao_consignment_id" ||
          m.key === "_pathao_consignment_id"
      )?.value;

      return {
        found: true,
        orderId: latest.id,
        status: (latest.status || "processing").toUpperCase(),
        total: Number(latest.total) || 0,
        items: itemNames,
        date: dateStr,
        consignmentId: consignmentId || undefined,
        trackingUrl: consignmentId ? `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}` : undefined,
      };
    }
  }

  return { found: false };
}
