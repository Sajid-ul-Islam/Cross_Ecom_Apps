/**
 * DEEN Gateway client — the ONLY way the mobile app talks to data.
 *
 * The app calls this module; this module calls the middle API gateway
 * (apps/api, Fastify) over HTTPS. The gateway holds the WooCommerce keys,
 * so NO secrets live in the app bundle — only the gateway's base URL.
 *
 * If the network/gateway is unavailable, every reader falls back to the
 * local seed catalog/orders so the storefront always renders.
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

/** Base URL of the middle gateway. Override per-build in app.json `extra.gatewayUrl`. */
export const GATEWAY_URL = (extra.gatewayUrl || "http://10.0.2.2:8787").replace(/\/$/, "");
const API_KEY = extra.gatewayApiKey || "";

/** True when a gateway URL is configured. When false, we stay fully offline. */
export const isGatewayConfigured = Boolean(extra.gatewayUrl);

export type ConnectionState = "online" | "offline";
let connection: ConnectionState = isGatewayConfigured ? "online" : "offline";

export const getConnection = () => connection;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  const res = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/* ----------------------------- catalog ----------------------------- */

import { getBundledProducts } from "./catalog";

function applyFilters(list: Product[], category?: DeenCategory, query?: string): Product[] {
  let out = list;
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

/**
 * Offline-first: returns the BUNDLED catalog instantly so the storefront
 * renders with zero network. Then attempts a background refresh from the
 * gateway; if it succeeds we update the offline cache, otherwise we keep
 * the bundled data. Never throws — always resolves.
 */
export async function fetchProducts(
  category?: DeenCategory,
  query?: string,
  sort?: "price-asc" | "price-desc" | "name-asc" | "new"
): Promise<Product[]> {
  // 1) Instant offline result (bundled snapshot)
  const bundled = applyFilters(getBundledProducts(), category, query);
  const sortedBundled = sort ? sortProductsLocal(bundled, sort) : bundled;

  // 2) Background refresh (fire-and-forget; do not block the UI)
  (async () => {
    try {
      const params = new URLSearchParams();
      if (category && category !== "ALL") params.set("category", category);
      if (query && query.trim()) params.set("q", query.trim());
      if (sort) params.set("sort", sort);
      const qs = params.toString();
      const list = await request<Product[]>(`/v1/deen/products${qs ? `?${qs}` : ""}`);
      connection = "online";
      await AsyncStorage.setItem("deen_gateway_products_v1", JSON.stringify(list)).catch(() => {});
    } catch {
      connection = "offline";
    }
  })();

  return sortedBundled;
}

function sortProductsLocal(list: Product[], sort: string): Product[] {
  const arr = [...list];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    case "price-desc":
      return arr.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? b.price));
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "new":
      return arr.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
    default:
      return arr;
  }
}

export async function fetchStats(): Promise<Stats | null> {
  try {
    const s = await request<Stats>("/v1/deen/stats");
    connection = "online";
    return s;
  } catch {
    connection = "offline";
    return null;
  }
}

export async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    return await request<{ category: string; count: number }[]>("/v1/deen/categories");
  } catch {
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  try {
    const p = await request<Product>(`/v1/deen/products/${id}`);
    connection = "online";
    return p;
  } catch {
    connection = "offline";
    return PRODUCTS_CATALOG.find((p) => p.id === id);
  }
}

/* ------------------------------ orders ----------------------------- */

export async function getOrders(phone?: string): Promise<Order[]> {
  try {
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const list = await request<Order[]>(`/v1/deen/orders${qs}`);
    connection = "online";
    await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify(list)).catch(() => {});
    return list;
  } catch {
    connection = "offline";
    const cached = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
    return cached ? (JSON.parse(cached) as Order[]) : [];
  }
}

export async function createOrder(
  orderData: Omit<Order, "id" | "number" | "createdAt" | "status">
): Promise<Order> {
  try {
    const created = await request<Order>("/v1/deen/orders", {
      method: "POST",
      body: JSON.stringify({
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        area: orderData.area,
        payment: orderData.payment,
        items: orderData.lines.map((l) => ({
        productId: l.productId,
        size: l.size,
        qty: l.qty,
        variationId: (l as any).variationId,
      })),
      }),
    });
    connection = "online";
    // Reflect the server order into the local cache too.
    const prev = await AsyncStorage.getItem("deen_gateway_orders_v1").catch(() => null);
    const arr = prev ? (JSON.parse(prev) as Order[]) : [];
    await AsyncStorage.setItem("deen_gateway_orders_v1", JSON.stringify([created, ...arr])).catch(() => {});
    return created;
  } catch (e) {
    connection = "offline";
    // Offline: persist locally so the order isn't lost; will sync on gateway return.
    const created: Order = {
      ...orderData,
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

/* ------------------------------ profile ---------------------------- */
/* Profile stays device-local (it's the shopper's own preferences).     */

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
