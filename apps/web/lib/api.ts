// API client — reads NEXT_PUBLIC_API_URL or falls back to local gateway
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice?: number;
  regularPrice?: number;
  salePct?: number;
  sizes: string[];
  images: [string, string];
  gallery?: string[];
  fabric?: string;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  rating: number;
  ratingCount: number;
  blurb?: string;
  isNew?: boolean;
}

export interface OrderLine {
  productId: string;
  variationId?: number;
  size: string;
  qty: number;
}

export interface OrderPayload {
  name: string;
  phone: string;
  address: string;
  area: string;
  payment: string;
  items: OrderLine[];
}

export interface OrderResult {
  id: string;
  number: string;
  wooId?: number;
  total: number;
  subtotal: number;
  delivery: number;
  status: string;
  createdAt: string;
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  sort?: string;
  per_page?: number;
}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== "ALL")
    qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  const res = await fetch(
    `${API_URL}/v1/deen/products${qs.toString() ? "?" + qs.toString() : ""}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/v1/deen/products/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function placeOrder(payload: OrderPayload): Promise<OrderResult> {
  const res = await fetch(`${API_URL}/v1/deen/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Order failed");
  }
  return res.json();
}

export function bdt(n: number) {
  return "৳" + n.toLocaleString("en-BD");
}

export const CATEGORIES = [
  "ALL",
  "JEANS",
  "SHIRT",
  "PANJABI",
  "T-SHIRT",
  "TROUSERS",
  "POLO",
  "ACCESSORIES",
] as const;
export type Category = (typeof CATEGORIES)[number];
