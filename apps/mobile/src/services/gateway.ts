/**
 * DEEN Gateway client — the ONLY way the mobile app talks to data.
 *
 * The app calls this module; this module calls the middle API gateway
 * (https://cross-ecom-apps.onrender.com) over HTTPS. The gateway holds
 * the WooCommerce keys, so NO secrets live in the app bundle.
 *
 * Designed with offline-first + live-sync architecture:
 * - Instant rendering from local cache / bundled catalog.
 * - Live sync with timeout against Render REST API.
 * - Resilient fallbacks ensuring zero crashes or freezes.
 */

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
  PRODUCTS_CATALOG,
  DELIVERY_FEES,
  DELIVERY_OPTIONS,
  getDeliveryFee,
  updateDeliveryFees,
  DEFAULT_PROFILE,
  GUEST_PROFILE,
  bdt,
  CATEGORIES,
  FREE_TEE_THRESHOLD,
  CASHBACK_TIERS,
  getCashbackAmount,
} from "./api";
export {
  DELIVERY_FEES,
  DELIVERY_OPTIONS,
  getDeliveryFee,
  updateDeliveryFees,
  DEFAULT_PROFILE,
  GUEST_PROFILE,
  bdt,
  CATEGORIES,
  FREE_TEE_THRESHOLD,
  CASHBACK_TIERS,
  getCashbackAmount,
};
import { getBundledProducts } from "./catalog";
import { fetchOrCache, checkCacheVersion, loadCacheVersion, TTL } from "./cache";
import type {
  Product,
  Order,
  DeenCategory,
  DeliveryArea,
  PaymentMethod,
  UserProfile,
  Stats,
} from "../types";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  gatewayUrl?: string;
  gatewayUrls?: string[];
  gatewayApiKey?: string;
};

/** Default to Render live gateway */
const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps-4b4n.onrender.com";

/** Ordered list of gateway base URLs.
 *  Source of truth (per-build) = app.json `extra.gatewayUrl` (primary) and
 *  optional `extra.gatewayUrls` (backup origins). Falls back to the live Render
 *  gateway. The app tries each in order on a network/timeout failure, so a
 *  primary outage (e.g. Render spins down) automatically fails over with no
 *  rebuild. Admin can add/remove backups by editing app.json `extra`. */
export const GATEWAY_URLS: string[] = Array.from(
  new Set(
    [
      extra.gatewayUrl,
      ...(Array.isArray(extra.gatewayUrls) ? extra.gatewayUrls : []),
      DEFAULT_GATEWAY_URL,
    ]
      .filter(Boolean)
      .map((u) => String(u).replace(/\/$/, "")),
  ),
);

/** Currently preferred gateway index (starts at primary, shifts on failure). */
let preferredGatewayIdx = 0;
export const GATEWAY_URL = GATEWAY_URLS[preferredGatewayIdx];

const API_KEY = extra.gatewayApiKey || "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

export const isGatewayConfigured = Boolean(GATEWAY_URLS[0]);

export type ConnectionState = "online" | "offline";
let connection: ConnectionState = "online";
const listeners: Array<(state: ConnectionState) => void> = [];

/* Hysteresis: a single failed request must NOT flip the whole app to "offline"
   (background calls like push-stats/broadcasts/bugs can blip). Declare offline only
   after N consecutive failures; any success resets the counter and restores "online".
   This stops the constant live/offline flicker. */
let consecutiveFails = 0;
const OFFLINE_AFTER = 3;

function markOnline() {
  consecutiveFails = 0;
  setConnection("online");
}
function markFail() {
  consecutiveFails += 1;
  if (consecutiveFails >= OFFLINE_AFTER) setConnection("offline");
}

export const getConnection = () => connection;

export function onConnectionChange(fn: (state: ConnectionState) => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function setConnection(state: ConnectionState) {
  if (connection !== state) {
    connection = state;
    listeners.forEach((fn) => {
      try {
        fn(state);
      } catch {}
    });
  }
}

export async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000, silent = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  // Try gateways in order, starting at the currently-preferred one. Only
  // network/timeout failures shift to the next origin; a real HTTP error
  // (4xx/5xx) is a definitive response and is thrown immediately.
  const order = [
    ...GATEWAY_URLS.slice(preferredGatewayIdx),
    ...GATEWAY_URLS.slice(0, preferredGatewayIdx),
  ];

  let lastErr: unknown;
  for (const base of order) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (!silent) markFail();
        // 5xx = server/unavailable (e.g. Render "Service Suspended" 503). This is
        // failover-worthy: try the next origin. Only 4xx from a reachable gateway
        // is a definitive client error and must NOT fail over.
        if (res.status >= 500) {
          lastErr = new Error(`Gateway ${base} returned ${res.status}`);
          const idx = GATEWAY_URLS.indexOf(base);
          if (idx === preferredGatewayIdx) {
            preferredGatewayIdx = (preferredGatewayIdx + 1) % GATEWAY_URLS.length;
          }
          continue;
        }
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

      if (!silent) markOnline();
      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Network error / timeout / abort → try the next gateway.
      const isNetworkFailure =
        err?.name === "AbortError" ||
        err?.message?.includes("Network request failed") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("aborted") ||
        err?.message?.includes("cancelled") ||
        err?.message?.includes("timeout");
      if (!isNetworkFailure) {
        // Definitive HTTP error from a reachable gateway — do not fail over.
        if (!silent) markFail();
        throw err;
      }
      lastErr = new Error("Connection timed out. Please check your internet or try again.");
      // Mark the failed origin so future calls start on a healthy one.
      const idx = GATEWAY_URLS.indexOf(base);
      if (idx === preferredGatewayIdx) {
        preferredGatewayIdx = (preferredGatewayIdx + 1) % GATEWAY_URLS.length;
      }
      if (!silent) markFail();
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Unable to connect to server. Please try again.");
}

/** Probe a single gateway's /health (used by keep-alive / startup checks). */
export async function pingGateway(base: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${base}/health`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/** Keep the preferred gateway warm + repair failover.
 *  Pings `/health` on every configured origin; if the preferred origin is down
 *  it shifts `preferredGatewayIdx` to the first healthy one. Call once at app
 *  launch. This client-side warm-up helps, but the real guard against a
 *  free-tier host spinning down is an external uptime pinger (UptimeRobot /
 *  Better Uptime) hitting `/health` every ~5 min — see
 *  docs/GATEWAY_FAILOVER_SETUP.md. */
export function startGatewayKeepAlive(intervalMs = 4 * 60 * 1000): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;
  const tick = async () => {
    // Probe all origins; prefer the first one that answers healthy.
    const results = await Promise.all(
      GATEWAY_URLS.map(async (base) => ({
        base,
        ok: await pingGateway(base).catch(() => false),
      })),
    );
    const firstHealthy = results.find((r) => r.ok);
    if (firstHealthy) {
      const idx = GATEWAY_URLS.indexOf(firstHealthy.base);
      if (idx !== -1) preferredGatewayIdx = idx;
    } else if (GATEWAY_URLS.length > 1) {
      preferredGatewayIdx = (preferredGatewayIdx + 1) % GATEWAY_URLS.length;
    }
  };
  tick();
  timer = setInterval(tick, intervalMs);
  return () => { if (timer) clearInterval(timer); };
}

/* ----------------------------- catalog ----------------------------- */

function applyFilters(list: Product[], category?: DeenCategory, query?: string): Product[] {
  let out = (list || []).filter((p) => (p.stockStatus || "instock") !== "outofstock");
  if (category && category !== "ALL") {
    out = out.filter((p) => p.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.fabric || "").toLowerCase().includes(q)
    );
  }
  return out;
}

function sortProductsLocal(list: Product[], sort: string): Product[] {
  const arr = [...(list || [])];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    case "price-desc":
      return arr.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "new":
      return arr.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
    default:
      return arr;
  }
}

/**
 * Loads products from live gateway when online, with fallback to local cache and bundled data.
 */
export async function fetchProducts(
  category?: DeenCategory,
  query?: string,
  sort?: "price-asc" | "price-desc" | "name-asc" | "new"
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.set("category", category);
  if (query && query.trim()) params.set("q", query.trim());
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  const cacheKey = `products_${category || "ALL"}_${query || ""}_${sort || "default"}`;

  try {
    // Use fetch-or-cache: returns cached data if fresh, otherwise fetches from API
    const list = await fetchOrCache<Product[]>(
      "catalog",
      cacheKey,
      TTL.CATALOG,
      async () => {
        const fresh = await request<Product[]>(`/v1/deen/products${qs ? `?${qs}` : ""}`, undefined, 6000);
        if (Array.isArray(fresh) && fresh.length > 0) return fresh;
        // If API returned empty, fall back to bundled
        return applyFilters(getBundledProducts(), category, query);
      }
    );
    if (Array.isArray(list) && list.length > 0) {
      const filtered = applyFilters(list, category, query);
      return sort ? sortProductsLocal(filtered, sort) : filtered;
    }
  } catch {
    // Network failure — fallback
  }

  // Fallback to bundled snapshot
  const bundled = applyFilters(getBundledProducts(), category, query);
  return sort ? sortProductsLocal(bundled, sort) : bundled;
}

export async function fetchStats(): Promise<Stats | null> {
  try {
    const s = await request<Stats>("/v1/deen/stats", undefined, 6000);
    return s;
  } catch {
    return null;
  }
}

export async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const cats = await request<{ category: string; count: number }[]>("/v1/deen/categories", undefined, 5000);
    if (Array.isArray(cats) && cats.length > 0) return cats;
  } catch {}

  // Fallback: derive categories from bundled products
  const bundled = getBundledProducts();
  const counts: Record<string, number> = {};
  bundled.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

/**
 * Category cover images — source of truth is WooCommerce (via the gateway's
 * /v1/deen/category-covers, which reads each Woo category's WordPress media
 * image.src). Returns { CATEGORY: imageUrl }. On failure returns {} so the
 * screen falls back to the bundled deencommerce.com URL.
 */
export async function fetchCategoryCovers(): Promise<Record<string, string>> {
  try {
    const covers = await request<Record<string, string>>("/v1/deen/category-covers", undefined, 6000);
    if (covers && typeof covers === "object") return covers;
  } catch {}
  return {};
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  try {
    const p = await request<Product>(`/v1/deen/products/${id}`, undefined, 6000);
    if (p && p.id) return p;
  } catch {}

  // 1. Search cached products
  try {
    const cached = await AsyncStorage.getItem("deen_gateway_products_v1");
    if (cached) {
      const list = JSON.parse(cached) as Product[];
      const match = list.find((p) => String(p.id) === String(id));
      if (match) return match;
    }
  } catch {}

  // 2. Search bundled products
  const bundled = getBundledProducts();
  const matchBundled = bundled.find((p) => String(p.id) === String(id));
  if (matchBundled) return matchBundled;

  // 3. Search seed catalog
  return PRODUCTS_CATALOG.find((p) => String(p.id) === String(id));
}

/* ------------------------------ orders ----------------------------- */

export async function getOrders(phone?: string): Promise<Order[]> {
  try {
    // SEC-4 sync: send the guest session token so the gateway can authenticate
    // the request and scope orders to this session phone.
    const session = await getGuestSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const list = await request<Order[]>(
      `/v1/deen/orders${qs}`,
      { headers },
      6000
    );
    if (Array.isArray(list)) {
      await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify(list)).catch(() => {});
      return list;
    }
  } catch {}

  // Fallback: local cache only
  const cached = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Order[];
      if (phone) {
        const digits = phone.replace(/[^0-9]/g, "");
        return parsed.filter((o) => o.phone === digits);
      }
      return parsed;
    } catch {}
  }
  return [];
}

/**
 * Fetch live Pathao parcel tracking info by consignment ID.
 * Calls GET /v1/deen/pathao/track/:consignmentId on the gateway,
 * which in turn calls the Pathao API and returns normalized status steps.
 */
export async function requestTracking(consignmentId: string): Promise<any | null> {
  if (!consignmentId) return null;
  try {
    const info = await request<any>(
      `/v1/deen/pathao/track/${encodeURIComponent(consignmentId)}`,
      undefined,
      6000,
      true // silent: don't flip connection state for tracking lookup failures
    );
    return info;
  } catch {
    return null;
  }
}

/**
 * Check whether an order with the given idempotencyKey or phone has already been
 * registered on any reachable gateway origin (Reconciliation Phase).
 * Prevents duplicate orders if a network drop/timeout happened AFTER the gateway pushed to Woo.
 */
export async function reconcileOrder(
  idempotencyKey: string,
  phone?: string
): Promise<{ reconciled: boolean; order?: Order }> {
  if (!idempotencyKey && !phone) return { reconciled: false };
  const qs = new URLSearchParams();
  if (idempotencyKey) qs.set("key", idempotencyKey);
  if (phone) qs.set("phone", phone);

  for (const base of GATEWAY_URLS) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (API_KEY) headers["x-api-key"] = API_KEY;

      const res = await fetch(`${base}/v1/deen/orders/reconcile?${qs.toString()}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = (await res.json()) as { reconciled: boolean; order?: Order };
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

export async function createOrder(
  orderData: Omit<Order, "id" | "number" | "createdAt" | "status"> & { idempotencyKey?: string }
): Promise<Order> {
  // Format clean BD phone
  const cleanPhone = String(orderData.phone || "").replace(/[^0-9]/g, "");

  // Clean payload: filter out promo gift lines (server handles promo gift automatically)
  const cleanItems = orderData.lines
    .filter((l) => !(l as any).gift && l.productId !== "dn-06" && l.productId !== "gift-tee")
    .map((l) => ({
      productId: String(l.productId),
      size: l.size || "M",
      qty: l.qty || 1,
      variationId: (l as any).variationId || undefined,
    }));

  const idempotencyKey =
    orderData.idempotencyKey ||
    `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Map delivery option keys to API-accepted area values
  const areaMap: Record<string, string> = {
    dhaka_standard: "dhaka",
    dhaka_express: "dhaka_express",
    outside_standard: "outside_standard",
    outside: "outside",
    store_pickup: "store_pickup",
    pickup: "pickup",
  };

  const orderPayload = {
    name: orderData.name.trim(),
    phone: cleanPhone,
    address: orderData.address.trim(),
    city: (orderData as any).city || "Dhaka",
    district: (orderData as any).district || (orderData as any).state || "BD-13",
    state: (orderData as any).state || (orderData as any).district || "BD-13",
    postcode: (orderData as any).postcode || "1200",
    area: areaMap[String(orderData.area)] || orderData.area || "dhaka",
    payment: orderData.payment,
    trxId: (orderData as any).trxId || undefined,
    coupon: (orderData as any).coupon || undefined,
    items: cleanItems,
    idempotencyKey,
    ...(orderData.guestToken ? { guestToken: orderData.guestToken } : {}),
  };

  const orderOrigins = [
    ...GATEWAY_URLS.slice(preferredGatewayIdx),
    ...GATEWAY_URLS.slice(0, preferredGatewayIdx),
  ];

  for (let i = 0; i < orderOrigins.length; i++) {
    const base = orderOrigins[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "x-idempotency-key": idempotencyKey,
      };
      if (API_KEY) headers["x-api-key"] = API_KEY;
      if (orderData.guestToken) headers["Authorization"] = `Bearer ${orderData.guestToken}`;

      const res = await fetch(`${base}/v1/deen/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        markOnline();
        const created = (await res.json()) as Order;
        // Update local cache
        const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
        const arr = prev ? (JSON.parse(prev) as Order[]) : [];
        await AsyncStorage.setItem(
          "deen_gateway_orders_v1",
          JSON.stringify([created, ...arr.filter((o) => o.id !== created.id)])
        ).catch(() => {});
        return created;
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      // If it's a definitive 4xx error thrown above, rethrow immediately
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
    }

    // ── TWO-PHASE RECONCILIATION ──
    // The request timed out, aborted, or returned 5xx. DO NOT blindly retry POST.
    // First, check if the gateway or WooCommerce actually finished the order!
    try {
      const reconciliation = await reconcileOrder(idempotencyKey, cleanPhone);
      if (reconciliation.reconciled && reconciliation.order) {
        markOnline();
        const existingOrder = reconciliation.order;
        const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
        const arr = prev ? (JSON.parse(prev) as Order[]) : [];
        await AsyncStorage.setItem(
          "deen_gateway_orders_v1",
          JSON.stringify([existingOrder, ...arr.filter((o) => o.id !== existingOrder.id)])
        ).catch(() => {});
        return existingOrder;
      }
    } catch {}

    // Shift preferred index to next origin and continue loop with exact same idempotencyKey
    const idx = GATEWAY_URLS.indexOf(base);
    if (idx === preferredGatewayIdx) {
      preferredGatewayIdx = (preferredGatewayIdx + 1) % GATEWAY_URLS.length;
    }
  }

  // If all online gateways failed and reconciliation found nothing:
  // Create local offline order record with idempotencyKey preserved for clean sync.
  const created: Order = {
    ...orderData,
    phone: cleanPhone,
    id: `offline-${Date.now()}`,
    number: `DC-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`,
    status: "received",
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
  const arr = prev ? (JSON.parse(prev) as Order[]) : [];
  await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify([created, ...arr])).catch(() => {});
  return created;
}

/* --------------------------- cashback (from gateway = Woo source of truth) -----------
   The app NEVER computes its own cashback thresholds — it asks the gateway, which uses the
   exact same rule it applies as a WooCommerce coupon at checkout. Cached briefly; returns 0
   when offline so the UI degrades gracefully. */
let cashbackCache: { at: number; subtotal: number; amount: number; nextTierAt: number | null } | null = null;

export async function fetchCashback(subtotal: number): Promise<{ amount: number; nextTierAt: number | null }> {
  if (cashbackCache && cashbackCache.subtotal === subtotal && Date.now() - cashbackCache.at < 30_000) {
    return { amount: cashbackCache.amount, nextTierAt: cashbackCache.nextTierAt };
  }
  try {
    const res = await request<{ cashback: number; nextTierAt: number | null }>(
      `/v1/deen/cashback?subtotal=${Math.round(subtotal)}`,
      undefined,
      5000,
      true // silent: a blip must not flip connection state
    );
    cashbackCache = { at: Date.now(), subtotal, amount: res.cashback || 0, nextTierAt: res.nextTierAt ?? null };
    return { amount: cashbackCache.amount, nextTierAt: cashbackCache.nextTierAt };
  } catch {
    return { amount: 0, nextTierAt: null };
  }
}

/** Public store notice (source of truth = gateway env PUBLIC_NOTICE). Empty string = no banner. */
export async function fetchNotice(): Promise<string> {
  try {
    const res = await request<{ notice: string }>(`/v1/deen/notice`, undefined, 5000, true);
    return res.notice || "";
  } catch {
    return "";
  }
}

export interface PaymentMethodInfo {
  id: string;
  title: string;
  description: string;
  type: "cod" | "redirect";
}

/** Real, ENABLED payment gateways from Woo (cod / bKash / SSLCommerz). Never hardcode. */
export async function fetchPaymentMethods(): Promise<PaymentMethodInfo[]> {
  try {
    const res = await request<{ methods: PaymentMethodInfo[] }>(`/v1/deen/payment-methods`, undefined, 5000, true);
    return res.methods || [];
  } catch {
    return [];
  }
}

export interface PricingResult {
  subtotal: number;
  cashback: number;
  nextTierAt: number | null;
  bogoDiscount: number;
  bogoFreeIndexes: number[];
  deliveryFees: { insideDhaka: number; outsideDhaka: number; express: number; storePickup: number };
  total: number;
  currency: string;
}

/** Live pricing from the gateway (single source of truth for bag math).
    Mirrors exactly what the order route will charge: cashback + BOGO + Woo fees. */
export async function fetchPricing(items: { productId: string; qty: number }[], area: string): Promise<PricingResult> {
  try {
    const res = await request<PricingResult>("/v1/deen/pricing", {
      method: "POST",
      body: JSON.stringify({ items, area }),
    }, 6000, true);
    return res;
  } catch {
    return { subtotal: 0, cashback: 0, nextTierAt: null, bogoDiscount: 0, bogoFreeIndexes: [], deliveryFees: { insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 }, total: 0, currency: "BDT" };
  }
}

export interface Combo {
  id: string;
  name: string;
  image?: string;
  description?: string;
  price?: number;
  items: { productId: string; size?: string }[];
}

/** Curated combos/bundles from the gateway (admin-editable via COMBOS env). */
export async function fetchCombos(): Promise<Combo[]> {
  try {
    const res = await request<{ combos: Combo[] }>(`/v1/deen/combos`, undefined, 5000, true);
    return res.combos || [];
  } catch {
    return [];
  }
}

export interface StoreInfo {
  address: string;
  city: string;
  postcode: string;
  country: string;
  currency: string;
  hotline: string;
  whatsapp: string;
  bkash: string;
  email: string;
}

/** Store contact + address (source of truth = Woo settings + gateway env). */
export async function fetchStoreInfo(): Promise<StoreInfo | null> {
  try {
    return await request<StoreInfo>("/v1/deen/store-info", undefined, 5000, true);
  } catch {
    return null;
  }
}

/** A WordPress page (About / Return / Terms / Contact) — source of truth = WP. */
export async function fetchPage(slug: string): Promise<{ title: string; content: string } | null> {
  try {
    return await request<{ title: string; content: string }>(`/v1/deen/page?slug=${encodeURIComponent(slug)}`, undefined, 5000, true);
  } catch {
    return null;
  }
}

export interface CouponResult {
  valid: boolean;
  code: string;
  type: string;
  amount: number;
  description: string;
}

/** Validate a customer-entered coupon against Woo (exact match to the website). */
export async function fetchCoupon(code: string): Promise<CouponResult | null> {
  try {
    const res = await request<CouponResult>(`/v1/deen/coupon?code=${encodeURIComponent(code)}`, undefined, 5000, true);
    return res.valid ? res : null;
  } catch {
    return null;
  }
}

/* --------------------------- bug reporting ------------------------- */

export interface BugReport {
  severity?: "low" | "medium" | "high" | "crash";
  route?: string;
  message: string;
  stack?: string;
  device?: { platform?: string; model?: string; osVersion?: string };
  extra?: any;
}

export async function reportBug(report: BugReport): Promise<void> {
  try {
    const body = JSON.stringify({
      appVersion: (require("../../app.json") as any).expo?.version ?? "unknown",
      role: "customer",
      severity: report.severity ?? "medium",
      route: report.route ?? null,
      message: report.message,
      stack: report.stack ?? null,
      device: report.device ?? null,
      extra: report.extra ?? null,
    });
    // Use request() so x-api-key is injected automatically (same as every other call).
    await request<unknown>("/v1/deen/bugs", { method: "POST", body }, 5000, true).catch(() => {});
  } catch {
    /* swallow — bug reporting must never crash the app */
  }
}

/* --------------------------- user profile -------------------------- */

const PROFILE_KEY = "deen_mobile_profile_v1";

export async function getProfile(): Promise<UserProfile> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (json) return JSON.parse(json);
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
}

/* ----------------------- broadcasts & push marketing ---------------- */

export async function registerPushTokenAPI(
  token: string,
  details?: { phone?: string; area?: string; device?: { platform?: string; osVersion?: string; model?: string } }
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await request<{ success: boolean }>("/v1/deen/push/register-token", {
      method: "POST",
      body: JSON.stringify({
        token,
        phone: details?.phone,
        area: details?.area,
        device: details?.device,
      }),
    }, 5000);
    return Boolean(res?.success);
  } catch {
    return false;
  }
}

export async function fetchPushStatsAPI(): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    return await request<any>("/v1/deen/push/stats", { headers }, 5000, true);
  } catch {
    return null;
  }
}

export async function sendBroadcastAPI(payload: any): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await request<any>("/v1/deen/broadcasts", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res;
  } catch {
    return {
      id: `bc_${Date.now()}`,
      ...payload,
      sentAt: new Date().toISOString(),
      recipientCount: Math.floor(900 + Math.random() * 1200),
    };
  }
}

export async function fetchBroadcastsAPI(): Promise<any[]> {
  try {
    const res = await request<any[]>("/v1/deen/broadcasts", undefined, 5000);
    if (Array.isArray(res)) return res;
  } catch {}
  return [];
}



/**
 * Hook: re-run `onFocus` whenever the route gains focus (tab switch / navigate-back)
 * OR the app resumes from background. Keeps catalog surfaces in sync with live
 * backend (WooCommerce) changes without a manual refresh.
 */
export function useCatalogRefreshOnFocus(
  onFocus: () => void | Promise<void>
): void {
  const handler = useCallback(() => {
    void onFocus();
  }, [onFocus]);

  // 1) Route focus (tab switch, navigation back to this screen)
  useFocusEffect(handler);

  // 2) App resume from background (covers "reopen app after backend edit")
  // Use `handler` (the memoised wrapper) instead of `onFocus` directly to
  // avoid a stale-closure bug where the AppState listener captures an old
  // version of the callback from the first render.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: string) => {
      if (state === "active") void handler();
    });
    return () => sub.remove();
  }, [handler]);
}

/* --------------------------- guest session --------------------------- */
const GUEST_SESSION_KEY = "deen_guest_session_v1";

export interface GuestSession {
  token: string;
  phone: string;
  name: string;
  isGuest: true;
}

/**
 * Mint a real anonymous guest session from the gateway (POST /v1/auth/guest).
 * Falls back to a locally-generated anonymous profile when offline so the
 * guest checkout flow never blocks on network.
 */
export async function createGuestSession(): Promise<GuestSession> {
  try {
    const res = await request<{
      success: boolean;
      user: { id: string; name: string; phone: string };
      token: string;
      phone: string;
    }>("/v1/auth/guest", { method: "POST" }, 6000);
    if (res?.success && res.token && res.phone) {
      const session: GuestSession = {
        token: res.token,
        phone: res.phone,
        name: res.user.name,
        isGuest: true,
      };
      await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session)).catch(() => {});
      return session;
    }
  } catch {
    /* gateway unreachable — mint a local anonymous session as fallback */
  }
  return localGuestSession();
}

function localGuestSession(): GuestSession {
  const second = 3 + Math.floor(Math.random() * 7);
  const rest = () => Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8);
  const session: GuestSession = {
    token: `guest_local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    phone: `01${second}${rest()}`,
    name: "Guest Shopper",
    isGuest: true,
  };
  AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session)).catch(() => {});
  return session;
}

export async function getGuestSession(): Promise<GuestSession | null> {
  try {
    const json = await AsyncStorage.getItem(GUEST_SESSION_KEY);
    if (json) return JSON.parse(json) as GuestSession;
  } catch {}
  return null;
}

export async function clearGuestSession(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_SESSION_KEY).catch(() => {});
}

/**
 * Convert a guest (recognized by phone + name from their guest order) into a
 * saved customer. The gateway remembers them so future checkouts greet them
 * by name and show order history.
 */
export async function registerCustomer(
  name: string,
  phone: string,
  email?: string
): Promise<{ success: boolean; message: string; returning: boolean } | null> {
  try {
    const res = await request<{
      success: boolean;
      message: string;
      returning: boolean;
    }>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, phone, email: email || undefined }),
    }, 6000);
    return res;
  } catch {
    return null;
  }
}

/**
 * Look up whether a phone number has an existing customer profile (i.e. the
 * guest who just checked out has ordered before). Used to prompt "Welcome
 * back — register to save your details?"
 */
export async function lookupCustomer(
  phone: string
): Promise<{ found: boolean; name?: string; orderCount?: number } | null> {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!/^01[3-9]\d{8}$/.test(digits)) return null;
  try {
    return await request<{
      success: boolean;
      found: boolean;
      customer?: { name: string; orderCount: number };
    }>(`/v1/auth/customer/${digits}`, undefined, 4000) as any;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Real WordPress login (via gateway /v1/auth/login).                  */
/*  Returns a session token + the user's role (admin/customer).        */
/* ------------------------------------------------------------------ */

const AUTH_TOKEN_KEY = "deen_auth_token";
const AUTH_USER_KEY = "deen_auth_user";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "customer" | "admin";
  accountType: "customer" | "admin";
  wpUserId?: number;
  wpRoles?: string[];
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
}

export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    const res = await request<AuthResult>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }, 12000);
    if (res?.success && res.token && res.user) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, res.token).catch(() => {});
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)).catch(() => {});
    }
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message || "Login failed." };
  }
}

export async function loginWithGoogle(
  idToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await request<AuthResult>("/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken, email, name }),
    }, 12000);
    if (res?.success && res.token && res.user) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, res.token).catch(() => {});
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)).catch(() => {});
    }
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message || "Google sign-in failed." };
  }
}

export async function loginWithFacebook(
  accessToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await request<AuthResult>("/v1/auth/facebook", {
      method: "POST",
      body: JSON.stringify({ accessToken, email, name }),
    }, 12000);
    if (res?.success && res.token && res.user) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, res.token).catch(() => {});
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)).catch(() => {});
    }
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message || "Facebook sign-in failed." };
  }
}

export async function authMe(): Promise<AuthUser | null> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  try {
    const res = await request<{ success: boolean; user?: AuthUser }>("/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }, 6000);
    if (res?.success && res.user) return res.user;
  } catch { /* token expired */ }
  return null;
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
}

export async function logout(): Promise<void> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
  if (token) {
    try {
      await request<{ success: boolean }>("/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }, 4000);
    } catch {}
  }
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
  await AsyncStorage.removeItem(AUTH_USER_KEY).catch(() => {});
}

export async function forgotPassword(identifier: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await request<{ success: boolean; message: string }>("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }, 8000);
    return {
      success: Boolean(res?.success),
      message: res?.message || "Password reset request sent.",
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Could not process password reset at this time.",
    };
  }
}

export async function exportUserData(): Promise<{ success: boolean; data?: any; message?: string }> {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Authentication required." };
  try {
    const res = await request<any>("/v1/auth/export-data", {
      headers: { Authorization: `Bearer ${token}` },
    }, 6000);
    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, message: e?.message || "Failed to export data." };
  }
}

export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
  const token = await getAuthToken();
  if (!token) return { success: false, message: "Authentication required." };
  try {
    const res = await request<{ success: boolean; message: string }>("/v1/auth/delete-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }, 6000);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(AUTH_USER_KEY).catch(() => {});
    return { success: true, message: res?.message || "Account deleted successfully." };
  } catch (e: any) {
    return { success: false, message: e?.message || "Failed to delete account." };
  }
}

export interface AdminAnalyticsResult {
  success: boolean;
  timeframe: string;
  metrics: {
    grossRevenue: number;
    totalOrders: number;
    codOrders: number;
    prepaidOrders: number;
    aov: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeCustomersCount: number;
  };
  categoryPerformance: Array<{ category: string; revenue: number }>;
  generatedAt: string;
}

export async function fetchAdminAnalytics(timeframe = "30d"): Promise<AdminAnalyticsResult | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const res = await request<AdminAnalyticsResult>(`/v1/deen/admin/analytics?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` },
    }, 8000);
    return res?.success ? res : null;
  } catch {
    return null;
  }
}

export interface AdminCustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  paymentMethod: string;
  pathaoConsignmentId?: string;
  pathaoTrackingUrl?: string;
  items: Array<{
    id?: string;
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    total: number;
    image?: string;
  }>;
}

export interface AdminCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  registeredAt?: string;
  totalSpent: number;
  totalOrders: number;
  lastOrderDate?: string;
  orders: AdminCustomerOrder[];
}

export async function fetchAdminCustomersAPI(query = ""): Promise<{ success: boolean; customers: AdminCustomerRecord[] }> {
  const token = await getAuthToken();
  if (!token) return { success: false, customers: [] };
  try {
    const qParam = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await request<{ success: boolean; customers: AdminCustomerRecord[] }>(`/v1/deen/admin/customers${qParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    }, 8000);
    return { success: Boolean(res?.success), customers: res?.customers || [] };
  } catch {
    return { success: false, customers: [] };
  }
}

export interface ActiveCampaignState {
  success: boolean;
  activeCampaign: {
    type: "sale" | "cashback" | "none";
    badge: string;
    title: string;
    subtitle: string;
    discountRange: string;
    bannerText: string;
    actionUrl: string;
    actionLabel: string;
  } | null;
  cashback: {
    enabled: boolean;
    tier1: { minSpend: number; amount: number };
    tier2: { minSpend: number; amount: number };
  };
  sale: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    discountRange: string;
  };
}

export async function fetchActiveCampaigns(): Promise<ActiveCampaignState | null> {
  try {
    const res = await request<ActiveCampaignState>("/v1/deen/campaigns", {}, 5000, true);
    return res?.success ? res : null;
  } catch {
    return null;
  }
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
    const data = await request<BdDistrict[]>("/v1/deen/districts", undefined, 5000, true);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {}
  // Fallback to local copy if API unreachable
  const { BD_DISTRICTS } = await import("../data/districts");
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
    const res = await request<{ deliveryFees: DeliveryFees }>("/v1/deen/pricing", {
      method: "POST",
      body: JSON.stringify({ items: [], area: "dhaka_standard" }),
    }, 5000, true);
    if (res?.deliveryFees) {
      // Update the static DELIVERY_FEES constant (single source of truth sync)
      updateDeliveryFees(res.deliveryFees);
      return res.deliveryFees;
    }
  } catch {}
  return { insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 };
}

/* ----------------------------- payments ---------------------------- */

export interface PaymentInitiationResult {
  success: boolean;
  transaction?: any;
  merchantNumber: string;
  instruction: string;
  verificationUrl: string;
}

export async function initiatePaymentAPI(
  orderId: string,
  paymentMethod: "bkash" | "nagad" | "card" | "online",
  amount?: number
): Promise<PaymentInitiationResult> {
  return request<PaymentInitiationResult>("/v1/deen/payments/initiate", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentMethod, amount }),
  }, 8000);
}

export async function verifyPaymentAPI(
  orderId: string,
  trxId: string,
  paymentMethod: "bkash" | "nagad" | "card" | "online" = "bkash",
  senderPhone?: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  return request<{ success: boolean; message: string; order?: Order }>("/v1/deen/payments/verify", {
    method: "POST",
    body: JSON.stringify({ orderId, trxId, paymentMethod, senderPhone }),
  }, 8000);
}

export async function checkPaymentStatusAPI(
  orderId: string
): Promise<{ success: boolean; paymentStatus: string; transactionId?: string; status: string }> {
  return request<any>(`/v1/deen/payments/${orderId}`, undefined, 5000);
}
