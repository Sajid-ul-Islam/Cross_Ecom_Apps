// API client — reads NEXT_PUBLIC_API_URL or falls back to local gateway
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

/** Shared gateway key — sent as x-api-key on every request. */
const GATEWAY_API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || "";

/**
 * Drop-in replacement for fetch() that always includes the gateway x-api-key
 * header so no endpoint is accidentally called without authentication.
 */
function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;
  return fetch(input, { ...init, headers });
}

const GUEST_TOKEN_KEY = "deen_web_guest_token";

/**
 * Returns a guest session token from localStorage, if present.
 * SEC-4 sync: the orders endpoint now requires a valid session token.
 */
function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Ensures a guest session token exists, minting one from the gateway if needed.
 * Falls back to null (orders will use cache) if the gateway is unreachable.
 */
async function ensureGuestToken(): Promise<string | null> {
  const existing = getGuestToken();
  if (existing) return existing;
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/guest`, {
      method: "POST",
    });
    if (!res.ok) return null;
    const data: { token?: string } = await res.json();
    if (data.token) {
      localStorage.setItem(GUEST_TOKEN_KEY, data.token);
      return data.token;
    }
  } catch {
    // network offline — no token, orders will use cache
  }
  return null;
}

export async function fetchOrders(phone?: string): Promise<OrderResult[]> {
  try {
    const token = await ensureGuestToken();
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const res = await apiFetch(`${API_URL}/v1/deen/orders${qs}`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

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
  email?: string;
  city?: string;
  district?: string;
  state?: string;
  guestToken?: string;
}

export interface OrderResult {
  id: string;
  number: string;
  wooId?: number;
  total: number;
  subtotal: number;
  delivery: number;
  status: string;
  payment: string;
  paymentTitle?: string;
  createdAt: string;
  name?: string;
  phone?: string;
  address?: string;
  pathaoConsignmentId?: string;
  pathaoTrackingUrl?: string;
  /** Live Pathao tracking info embedded by the gateway when consignmentId exists. */
  pathaoTrackingInfo?: {
    consignmentId: string;
    summary: string;
    status: string;
    steps: Array<{
      timestamp: string;
      status: string;
      label: string;
      location?: string;
      completed: boolean;
      current: boolean;
    }>;
    trackingUrl: string;
    lastUpdated: string;
  };
  lines?: { name: string; size: string; qty: number; unit: number; gift?: boolean }[];
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  sort?: string;
  per_page?: number;
}): Promise<Product[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.category && params.category !== "ALL")
      qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    const res = await apiFetch(
      `${API_URL}/v1/deen/products${qs.toString() ? "?" + qs.toString() : ""}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function placeOrder(payload: OrderPayload): Promise<OrderResult> {
  const token = getGuestToken();
  const res = await apiFetch(`${API_URL}/v1/deen/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Order failed");
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

/* ----------------------------- payments ---------------------------- */

export async function initiatePayment(
  orderId: string,
  paymentMethod: "bkash" | "nagad" | "card" | "online",
  amount?: number
): Promise<{ success: boolean; transaction?: Record<string, unknown>; merchantNumber: string; instruction: string; verificationUrl: string }> {
  const res = await apiFetch(`${API_URL}/v1/deen/payments/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, paymentMethod, amount }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Payment initiation failed");
  }
  return res.json();
}

export async function verifyPayment(
  orderId: string,
  trxId: string,
  paymentMethod: "bkash" | "nagad" | "card" | "online" = "bkash",
  senderPhone?: string
): Promise<{ success: boolean; message: string; order?: OrderResult }> {
  const res = await apiFetch(`${API_URL}/v1/deen/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, trxId, paymentMethod, senderPhone }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Payment verification failed");
  }
  return res.json();
}

/* --------------------------- Pathao tracking ---------------------------- */

export interface PathaoStep {
  timestamp: string;
  status: string;
  label: string;
  location?: string;
  completed: boolean;
  current: boolean;
}

export interface PathaoTrackingResult {
  success: boolean;
  consignmentId: string;
  summary: string;
  status: string;
  steps: PathaoStep[];
  trackingUrl: string;
  lastUpdated: string;
  message?: string;
}

/**
 * Fetch live Pathao tracking info by consignment ID.
 * Calls GET /v1/deen/pathao/track/:consignmentId on the gateway.
 */
export async function fetchPathaoTracking(consignmentId: string): Promise<PathaoTrackingResult | null> {
  if (!consignmentId) return null;
  try {
    const res = await apiFetch(
      `${API_URL}/v1/deen/pathao/track/${encodeURIComponent(consignmentId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
