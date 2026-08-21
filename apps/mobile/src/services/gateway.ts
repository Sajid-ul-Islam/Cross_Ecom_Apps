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
import {
  PRODUCTS_CATALOG,
  DELIVERY_FEES,
  DEFAULT_PROFILE,
  bdt,
  CATEGORIES,
  FREE_TEE_THRESHOLD,
} from "./api";
import { getBundledProducts } from "./catalog";
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
  gatewayApiKey?: string;
};

/** Default to Render live gateway */
const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps.onrender.com";

/** Base URL of the middle gateway. Override per-build in app.json `extra.gatewayUrl`. */
export const GATEWAY_URL = (extra.gatewayUrl || DEFAULT_GATEWAY_URL).replace(/\/$/, "");
const API_KEY = extra.gatewayApiKey || "";

export const isGatewayConfigured = Boolean(GATEWAY_URL);

export type ConnectionState = "online" | "offline";
let connection: ConnectionState = "online";
const listeners: Array<(state: ConnectionState) => void> = [];

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

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    };
    if (API_KEY) headers["x-api-key"] = API_KEY;

    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gateway returned ${res.status}: ${body.slice(0, 200)}`);
    }

    setConnection("online");
    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    setConnection("offline");
    throw err;
  }
}

/* ----------------------------- catalog ----------------------------- */

function applyFilters(list: Product[], category?: DeenCategory, query?: string): Product[] {
  let out = list || [];
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
  try {
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.set("category", category);
    if (query && query.trim()) params.set("q", query.trim());
    if (sort) params.set("sort", sort);
    const qs = params.toString();

    // 1) Fetch live from gateway
    const list = await request<Product[]>(`/v1/deen/products${qs ? `?${qs}` : ""}`, undefined, 6000);
    if (Array.isArray(list) && list.length > 0) {
      if (!category && !query && !sort) {
        AsyncStorage.setItem("deen_gateway_products_v1", JSON.stringify(list)).catch(() => {});
      }
      return list;
    }
  } catch (e) {
    // Network or timeout failure — fallback gracefully
  }

  // 2) Fallback to cached products in AsyncStorage
  try {
    const cached = await AsyncStorage.getItem("deen_gateway_products_v1");
    if (cached) {
      const parsed = JSON.parse(cached) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = applyFilters(parsed, category, query);
        return sort ? sortProductsLocal(filtered, sort) : filtered;
      }
    }
  } catch {}

  // 3) Fallback to bundled snapshot
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
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const list = await request<Order[]>(`/v1/deen/orders${qs}`, undefined, 6000);
    if (Array.isArray(list)) {
      await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify(list)).catch(() => {});
      return list;
    }
  } catch {}

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

export async function createOrder(
  orderData: Omit<Order, "id" | "number" | "createdAt" | "status">
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

  try {
    const created = await request<Order>("/v1/deen/orders", {
      method: "POST",
      body: JSON.stringify({
        name: orderData.name.trim(),
        phone: cleanPhone,
        address: orderData.address.trim(),
        area: orderData.area,
        payment: orderData.payment,
        items: cleanItems,
      }),
    }, 10000);

    // Update local cache
    const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
    const arr = prev ? (JSON.parse(prev) as Order[]) : [];
    await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify([created, ...arr])).catch(() => {});
    return created;
  } catch (e: any) {
    // If offline or gateway error, create local order so shopper data is never lost
    const created: Order = {
      ...orderData,
      phone: cleanPhone,
      id: `offline-${Date.now()}`,
      number: `DC-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "received",
      createdAt: new Date().toISOString(),
    };
    const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
    const arr = prev ? (JSON.parse(prev) as Order[]) : [];
    await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify([created, ...arr])).catch(() => {});
    return created;
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
    await fetch(`${GATEWAY_URL}/v1/deen/bugs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
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

export { DELIVERY_FEES, bdt, CATEGORIES, FREE_TEE_THRESHOLD };
