import { ProductCard } from "./types";
import { BD_DISTRICTS, getDistrictPostcode } from "./districts";
import { getBundledProducts, resolveProductImage, decodeHtmlEntities } from "./api";

const WOO_URL = (process.env.WOO_URL || "https://deencommerce.com/wp-json/wc/v3").replace(/\/$/, "");
const WOO_KEY = process.env.WOO_KEY || "";
const WOO_SECRET = process.env.WOO_SECRET || "";

function getAuthHeader(): Record<string, string> {
  if (WOO_KEY && WOO_SECRET) {
    const creds = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");
    return {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Searches WooCommerce products via REST API v3 with graceful fallback to bundled catalog.
 */
export async function searchProducts(query: string, limit = 5): Promise<ProductCard[]> {
  try {
    if (WOO_KEY && WOO_SECRET) {
      const url = `${WOO_URL}/products?search=${encodeURIComponent(query)}&per_page=${limit}&status=publish`;
      const res = await fetch(url, {
        headers: getAuthHeader(),
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map(mapWooProductToCard);
        }
      }
    }
  } catch (err) {
    console.warn("[bot-woo] Live searchProducts failed, using local catalog fallback:", err);
  }

  // Fallback to local catalog
  const all = getBundledProducts();
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length >= 3);

  const matched = all.filter((p) => {
    const name = p.name.toLowerCase();
    const cat = p.category.toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    const fabric = (p.fabric || "").toLowerCase();

    if (name.includes(q) || cat.includes(q) || brand.includes(q) || fabric.includes(q)) {
      return true;
    }
    return words.some((w) => name.includes(w) || cat.includes(w));
  });

  return matched.slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.salePrice ?? p.price,
    regularPrice: p.regularPrice ?? p.price,
    salePrice: p.salePrice,
    image: resolveProductImage(p.images?.[0] || ""),
    permalink: `/product/${p.id}`,
    in_stock: p.stockStatus !== "outofstock",
    sizes: p.sizes,
    category: p.category,
    sku: p.sku,
  }));
}

/**
 * Retrieves a single product by ID.
 */
export async function getProductById(id: string | number): Promise<ProductCard | null> {
  try {
    if (WOO_KEY && WOO_SECRET) {
      const url = `${WOO_URL}/products/${encodeURIComponent(String(id))}`;
      const res = await fetch(url, {
        headers: getAuthHeader(),
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const raw = await res.json();
        if (raw && raw.id) return mapWooProductToCard(raw);
      }
    }
  } catch (err) {
    console.warn("[bot-woo] Live getProductById failed, checking local catalog:", err);
  }

  // Fallback to local catalog
  const all = getBundledProducts();
  const found = all.find((p) => String(p.id) === String(id));
  if (found) {
    return {
      id: found.id,
      name: found.name,
      price: found.salePrice ?? found.price,
      regularPrice: found.regularPrice ?? found.price,
      salePrice: found.salePrice,
      image: resolveProductImage(found.images?.[0] || ""),
      permalink: `/product/${found.id}`,
      in_stock: found.stockStatus !== "outofstock",
      sizes: found.sizes,
      category: found.category,
      sku: found.sku,
    };
  }

  return null;
}

/**
 * Fetches product variations (sizes and stock status).
 */
export async function getVariations(productId: string | number): Promise<Array<{ id: number; size: string; stock: string }>> {
  try {
    if (WOO_KEY && WOO_SECRET) {
      const url = `${WOO_URL}/products/${productId}/variations?per_page=50`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          return list.map((v: any) => ({
            id: v.id,
            size: (v.attributes || []).map((a: any) => a.option).join(" ") || "Standard",
            stock: v.stock_status || "instock",
          }));
        }
      }
    }
  } catch (err) {
    console.warn("[bot-woo] getVariations failed:", err);
  }
  return [];
}

/**
 * Retrieves WooCommerce order details by Order ID.
 */
export async function getOrderById(orderId: string | number): Promise<any | null> {
  try {
    if (WOO_KEY && WOO_SECRET) {
      const cleanId = String(orderId).replace(/\D/g, "");
      if (!cleanId) return null;

      const url = `${WOO_URL}/orders/${cleanId}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn("[bot-woo] getOrderById failed:", err);
  }
  return null;
}

/**
 * Searches orders by customer phone number.
 */
export async function getOrdersByPhone(phone: string): Promise<any[]> {
  try {
    if (WOO_KEY && WOO_SECRET) {
      const cleanPhone = phone.replace(/\D/g, "");
      // Try search query parameter
      const url = `${WOO_URL}/orders?search=${encodeURIComponent(cleanPhone)}&per_page=10`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const orders = await res.json();
        if (Array.isArray(orders)) {
          return orders.filter((o: any) => {
            const p = (o.billing?.phone || "").replace(/\D/g, "");
            return /^01[3-9]\d{8}$/.test(cleanPhone.slice(-11)) && p.slice(-11) === cleanPhone.slice(-11);
          });
        }
      }
    }
  } catch (err) {
    console.warn("[bot-woo] getOrdersByPhone failed:", err);
  }
  return [];
}

/**
 * Creates an order in WooCommerce.
 */
export async function createOrder(payload: {
  customerName?: string;
  phone: string;
  address: string;
  district: string;
  idempotencyKey: string;
  items: Array<{ productId: string | number; size?: string; quantity: number }>;
  note?: string;
}): Promise<{ id: number | string; total: number; number?: string } | null> {
  const district = BD_DISTRICTS.find((entry) => entry.code === payload.district);
  if (!district || !/^01[3-9]\d{8}$/.test(payload.phone) || payload.address.trim().length < 8) return null;
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://cross-ecom-apps-4b4n.onrender.com";
  const headers: Record<string, string> = { "Content-Type": "application/json", "Idempotency-Key": payload.idempotencyKey };
  const apiKey = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/deen/orders`, {
      method: "POST", headers, signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({ name: payload.customerName || "Customer", phone: payload.phone,
        address: payload.address, district: district.code, state: district.code, city: district.name,
        postcode: getDistrictPostcode(district.code), area: district.code === "BD-13" ? "dhaka" : "outside",
        payment: "cod", idempotencyKey: payload.idempotencyKey, customerNote: payload.note,
        items: payload.items.map((item) => ({ productId: String(item.productId), size: item.size, qty: item.quantity })),
      }),
    });
    if (!res.ok) return null;
    const order = await res.json();
    if (!order.wooId || !order.number || !Number.isFinite(order.total)) return null;
    return { id: order.wooId, number: order.number, total: order.total };
  } catch { return null; }
}

function mapWooProductToCard(raw: any): ProductCard {
  const currentPrice = Number(raw.price) || Number(raw.sale_price) || Number(raw.regular_price) || 0;
  const regularPrice = Number(raw.regular_price) || currentPrice;
  const salePrice = raw.sale_price ? Number(raw.sale_price) : undefined;
  const image = raw.images?.[0]?.src || "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";

  const sizeAttr = (raw.attributes || []).find((a: any) => /size|মাপ/i.test(a.name));
  const sizes = sizeAttr?.options || ["M", "L", "XL"];

  return {
    id: raw.id,
    name: decodeHtmlEntities(raw.name || ""),
    price: currentPrice,
    regularPrice,
    salePrice,
    image,
    permalink: raw.permalink || `/product/${raw.id}`,
    in_stock: raw.stock_status === "instock",
    sizes,
    category: raw.categories?.[0]?.name || "APPAREL",
    sku: raw.sku || `DS-${raw.id}`,
  };
}
