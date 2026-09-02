// API client — reads NEXT_PUBLIC_API_URL or defaults to live Render gateway (Zero config needed on Vercel)
export const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps-4b4n.onrender.com";
export const BACKUP_GATEWAY_URL = "https://cross-ecom-apps.onrender.com";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_GATEWAY_URL;

/** Shared gateway key — sent as x-api-key on every request. */
const DEFAULT_GATEWAY_API_KEY = "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";
const GATEWAY_API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || DEFAULT_GATEWAY_API_KEY;

/**
 * Safe fetch wrapper that includes x-api-key and automatically fails over
 * to the backup gateway ONLY for idempotent GET requests.
 * Mutating writes (POST/PUT/DELETE) use explicit two-phase reconciliation.
 */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

  const isGet = !init?.method || init.method.toUpperCase() === "GET";

  try {
    const res = await fetch(input, { ...init, headers });
    if (!res.ok && isGet && input.startsWith(DEFAULT_GATEWAY_URL)) {
      // If primary returned 502/503 (Render cold start) on a GET, failover to backup gateway
      const backupUrl = input.replace(DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL);
      const backupRes = await fetch(backupUrl, { ...init, headers }).catch(() => null);
      if (backupRes && backupRes.ok) return backupRes;
    }
    return res;
  } catch (err) {
    if (isGet && input.startsWith(DEFAULT_GATEWAY_URL)) {
      const backupUrl = input.replace(DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL);
      return fetch(backupUrl, { ...init, headers });
    }
    throw err;
  }
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
  description?: string;
  slug?: string;
  tags?: string[];
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
  postcode?: string;
  deliverySlot?: string;
  deliveryNotes?: string;
  customerNote?: string;
  coupon?: string;
  isGuestOrder?: boolean;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  guestToken?: string;
  idempotencyKey?: string;
  trxId?: string;
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
  idempotencyKey?: string;
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

import catalogSnapshot from "./catalog.snapshot.json";

/**
 * Canonical product image resolver:
 * Converts relative paths, HTTP urls, and protocol-relative URLs into high-speed HTTPS CDN urls.
 */
export function resolveProductImage(src?: string, fallback?: string): string {
  if (!src || typeof src !== "string" || src.trim().length === 0) {
    return fallback || "https://deencommerce.com/wp-content/uploads/2026/05/jeans-1.jpg";
  }
  let clean = src.trim();
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("/")) return `https://deencommerce.com${clean}`;
  if (clean.startsWith("http://")) return clean.replace("http://", "https://");
  return clean;
}

/**
 * Fetches real-time updated images and gallery for a product directly from REST API.
 */
export async function fetchProductImages(id: string): Promise<{
  images: [string, string];
  gallery: string[];
  thumb: string;
  single: string;
  full: string;
} | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/images/product/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export function getBundledProducts(): Product[] {
  const data = catalogSnapshot as unknown as { products?: Product[] } | Product[];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

function applyLocalFilters(
  products: Product[],
  category?: string,
  search?: string,
  sort?: string
): Product[] {
  // Always filter out out-of-stock and draft products for customers
  let list = [...products].filter(
    (p) => (p.stockStatus || "instock") !== "outofstock"
  );

  if (category && category !== "ALL") {
    const cat = category.toUpperCase();
    list = list.filter((p) => {
      const pCat = (p.category || "").toUpperCase();
      if (cat === "JEANS") return pCat.includes("JEAN") || pCat.includes("DENIM");
      if (cat === "SHIRT") return pCat.includes("SHIRT") && !pCat.includes("T-SHIRT");
      if (cat === "T-SHIRT") return pCat.includes("T-SHIRT") || pCat.includes("TEE");
      if (cat === "PANJABI") return pCat.includes("PANJABI") || pCat.includes("PUNJABI");
      if (cat === "POLO") return pCat.includes("POLO");
      if (cat === "TROUSERS") return pCat.includes("TROUSER") || pCat.includes("PANT") || pCat.includes("CHINO");
      if (cat === "COMBO") return pCat.includes("COMBO") || (p.tags && p.tags.some((t) => t.toUpperCase().includes("COMBO")));
      return pCat.includes(cat);
    });
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (sort) {
    if (sort === "price-asc") list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    else if (sort === "price-desc") list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "new") list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
  }

  return list;
}

/**
 * Fetches products from live Fastify Gateway REST API with automatic failover
 * and offline-first bundled catalog fallback.
 */
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
    if (params?.search) {
      qs.set("search", params.search);
      qs.set("q", params.search);
    }
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.per_page) qs.set("per_page", String(params.per_page));

    const res = await apiFetch(
      `${API_URL}/v1/deen/products${qs.toString() ? "?" + qs.toString() : ""}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data: Product[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Defense-in-depth: filter out OOS products even if API missed them
        return data.filter((p) => (p.stockStatus || "instock") !== "outofstock");
      }
    }
  } catch {
    // Network or timeout failure — fallback gracefully to bundled snapshot
  }

  // Graceful fallback to bundled catalog snapshot
  const fallback = applyLocalFilters(
    getBundledProducts(),
    params?.category,
    params?.search,
    params?.sort
  );
  if (params?.per_page && params.per_page > 0) {
    return fallback.slice(0, params.per_page);
  }
  return fallback;
}

/**
 * Fetches single product details with real variations from the REST API gateway,
 * with fallback to bundled snapshot.
 */
export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const product = await res.json();
      if (product && product.id) return product;
    }
  } catch {
    // Network or timeout failure — fallback
  }

  // Fallback to snapshot search by ID or slug
  const all = getBundledProducts();
  const found = all.find((p) => String(p.id) === String(id) || p.slug === id);
  return found || null;
}

/**
 * Fetches live category counts from the REST API gateway, with fallback.
 */
export async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/categories`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  // Fallback: derive categories from bundled snapshot
  const bundled = getBundledProducts();
  const counts: Record<string, number> = {};
  bundled.forEach((p) => {
    const cat = p.category || "OTHER";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

/**
 * Fetches live category cover image URLs from WooCommerce REST API.
 */
export async function fetchCategoryCovers(): Promise<Record<string, string>> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/category-covers`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") return data;
    }
  } catch {}
  return {};
}

export interface BankOffer {
  id: string;
  bankName: string;
  cardType: string;
  discount: string;
  discountPct: number;
  maxDiscount: number;
  minSpend: number;
  couponCode: string;
  badge: string;
  validTill: string;
  description: string;
  logoText: string;
  color: string;
}

export interface RotatingCampaignItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
}

export interface ActiveCampaignState {
  success: boolean;
  activeCampaign: {
    type: "sale" | "cashback" | "none";
    badge: string;
    title: string;
    subtitle: string;
    discountRange?: string;
    bannerText?: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null;
  cashback: {
    enabled: boolean;
    tier1?: { minSpend: number; amount: number };
    tier2?: { minSpend: number; amount: number };
  };
  sale: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    discountRange: string;
  };
  bankOffers?: BankOffer[];
  rotatingCampaigns?: RotatingCampaignItem[];
}

export interface BdDistrict {
  code: string;
  name: string;
}

/**
 * Fetches 64 Bangladesh districts from REST API (/v1/deen/districts).
 * Single source of truth — matches WooCommerce BD-XX state codes.
 */
export async function fetchDistricts(): Promise<BdDistrict[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/districts`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data: BdDistrict[] = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  // Fallback to local copy if API unreachable
  const { BD_DISTRICTS } = await import("@/lib/districts");
  return BD_DISTRICTS;
}

export interface DeliveryFees {
  insideDhaka: number;
  outsideDhaka: number;
  express: number;
  storePickup: number;
}

/**
 * Fetches live delivery fees from REST API (/v1/deen/pricing).
 * Single source of truth — mirrors WooCommerce shipping zones.
 */
export async function fetchDeliveryFees(): Promise<DeliveryFees> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [], area: "dhaka_standard" }),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.deliveryFees) return data.deliveryFees;
    }
  } catch {}
  return { insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 };
}

/**
 * Fetches live campaign status and bank offers from REST API (/v1/deen/campaigns).
 */
export async function fetchCampaigns(): Promise<ActiveCampaignState | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/campaigns`, {
      cache: "no-store",
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/**
 * Fetches active bank card discounts and payment offers (/v1/deen/offers).
 */
export async function fetchBankOffers(): Promise<BankOffer[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/offers`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.bankOffers) return data.bankOffers;
    }
  } catch {}
  return [];
}

/**
 * Fetches calculated cashback from REST API (/v1/deen/cashback).
 * Returns 0 if the offer is disabled on the gateway.
 */
export async function fetchCashback(subtotal: number): Promise<{ amount: number; nextTierAt: number | null }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/cashback?subtotal=${Math.round(subtotal)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return { amount: data.cashback || 0, nextTierAt: data.nextTierAt ?? null };
    }
  } catch {}
  return { amount: 0, nextTierAt: null };
}

/**
 * Fetches live store metadata from REST API (/v1/deen/store-info).
 */
export async function fetchStoreInfo(): Promise<{
  name: string;
  description: string;
  currency: string;
  phone: string;
  email: string;
  hotline: string;
  whatsapp: string;
} | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/store-info`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/**
 * Reconcile order across gateway instances by idempotencyKey or phone (Two-Phase Reconciliation).
 */
export async function reconcileOrder(
  idempotencyKey: string,
  phone?: string
): Promise<{ reconciled: boolean; order?: OrderResult }> {
  if (!idempotencyKey && !phone) return { reconciled: false };
  const qs = new URLSearchParams();
  if (idempotencyKey) qs.set("key", idempotencyKey);
  if (phone) qs.set("phone", phone);

  const origins = Array.from(new Set([API_URL, DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL]));

  for (const base of origins) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

      const res = await fetch(`${base}/v1/deen/orders/reconcile?${qs.toString()}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = (await res.json()) as { reconciled: boolean; order?: OrderResult };
        if (data && data.reconciled && data.order) {
          return data;
        }
      }
    } catch {
      // Continue checking next gateway
    }
  }
  return { reconciled: false };
}

export async function placeOrder(
  payload: OrderPayload & { idempotencyKey?: string }
): Promise<OrderResult> {
  const token = getGuestToken();
  const cleanPhone = String(payload.phone || "").replace(/[^0-9]/g, "");
  const idempotencyKey =
    payload.idempotencyKey ||
    `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Map delivery option keys to API-accepted area values
  const areaMap: Record<string, string> = {
    dhaka_standard: "dhaka",
    dhaka_express: "dhaka_express",
    outside: "outside",
    outside_standard: "outside_standard",
    store_pickup: "store_pickup",
    pickup: "pickup",
  };

  const orderPayload = {
    ...payload,
    phone: cleanPhone,
    area: areaMap[payload.area || "dhaka_standard"] || payload.area || "dhaka",
    idempotencyKey,
  };

  const origins = Array.from(new Set([API_URL, BACKUP_GATEWAY_URL]));

  let lastError: Error | null = null;

  for (const base of origins) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "x-idempotency-key": idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

      const res = await fetch(`${base}/v1/deen/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return (await res.json()) as OrderResult;
      }

      // 4xx is definitive validation/client error: DO NOT fail over or retry
      if (res.status >= 400 && res.status < 500) {
        const body = await res.text().catch(() => "");
        let cleanMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(body);
          if (parsed.message) cleanMsg = parsed.message;
          else if (parsed.error) cleanMsg = parsed.error;
        } catch {
          if (body) cleanMsg = body.slice(0, 150);
        }
        throw new Error(cleanMsg);
      }

      lastError = new Error(`Gateway returned ${res.status}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isDefinitiveClientError =
        err?.message &&
        !err?.name?.includes("Abort") &&
        !err?.message?.includes("failed") &&
        !err?.message?.includes("timed out") &&
        !err?.message?.includes("Network request") &&
        !err?.message?.includes("Failed to fetch");

      if (isDefinitiveClientError && !err?.message?.startsWith("HTTP 5")) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // ── TWO-PHASE RECONCILIATION ──
    // The request timed out or returned 5xx. DO NOT blindly retry POST.
    // Check if the order was created before trying the backup gateway!
    try {
      const reconciliation = await reconcileOrder(idempotencyKey, cleanPhone);
      if (reconciliation.reconciled && reconciliation.order) {
        return reconciliation.order;
      }
    } catch {}
  }

  throw lastError || new Error("Order placement failed. Please check your connection and try again.");
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
export async function fetchPathaoTracking(consignmentId: string): Promise<PathaoTrackingResult> {
  const cleanId = String(consignmentId || "").trim();
  if (!cleanId) {
    return {
      success: false,
      consignmentId: "",
      summary: "Invalid consignment ID",
      status: "unknown",
      steps: [],
      trackingUrl: "",
      lastUpdated: new Date().toISOString(),
      message: "Consignment ID cannot be empty",
    };
  }
  const res = await apiFetch(`${API_URL}/v1/deen/pathao/track/${encodeURIComponent(cleanId)}`);
  return res.json();
}

/* --------------------------- Social Auth (Google / Facebook) ---------------------------- */

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "customer" | "admin";
  accountType?: "customer" | "admin" | "guest";
  phone?: string;
  wpUserId?: number;
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
  isNewCustomer?: boolean;
}

export async function loginWithGoogle(
  idToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, email, name }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Authentication failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Google sign-in network error." };
  }
}

export async function loginWithFacebook(
  accessToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/facebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, email, name }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Authentication failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Facebook sign-in network error." };
  }
}

export async function loginCustomer(
  identifier: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: any; name?: string; email?: string; role?: string; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Login failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Sign in network error. Please check your connection." };
  }
}

export async function registerCustomer(
  name: string,
  phone: string,
  password: string,
  email?: string
): Promise<{ success: boolean; token?: string; user?: any; name?: string; role?: string; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: phone.trim(),
        name: name.trim(),
        phone: phone.trim(),
        password,
        email: email?.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Registration failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Registration network error. Please check your connection." };
  }
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; code?: string; amount?: number; type?: "fixed" | "percent"; description?: string; message?: string }> {
  try {
    const clean = code.trim().toUpperCase();
    const res = await apiFetch(`${API_URL}/v1/deen/coupon/${encodeURIComponent(clean)}`);
    return await res.json();
  } catch (err: any) {
    return { valid: false, message: "Could not verify coupon." };
  }
}

/* ------------------------- outlets (source of truth = gateway env) ---- */

export interface Outlet {
  id: string;
  name: string;
  tag?: string;
  address: string;
  hours: string;
  phone: string;
  mapQuery?: string;
  pickup?: boolean;
  stockText?: string;
  units?: number;
}

/** Fetch physical retail outlets from the gateway. */
export async function fetchOutlets(): Promise<Outlet[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/outlets`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.outlets || [];
    }
  } catch {}
  return [];
}

/* ------------------------- app settings (business rules) ------------ */

export interface AppSettings {
  cashbackTiers: {
    enabled: boolean;
    tier1: { minSpend: number; cashback: number };
    tier2: { minSpend: number; cashback: number };
  };
  exchangeFees: { insideDhaka: number; outsideDhaka: number };
  freeTeeThreshold: number;
  bogo: { rule: string; minItems: number };
  contact: { hotline: string; whatsapp: string; bkash: string; email: string };
}

/** Fetch app-wide business settings from the gateway. */
export async function fetchAppSettings(): Promise<AppSettings | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/settings`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/** Submit a return / exchange request to the gateway. */
export async function submitReturnRequest(payload: {
  orderId: string;
  orderNumber: string;
  phone: string;
  reason: string;
  details: string;
  items: any[];
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error submitting return request." };
  }
}
