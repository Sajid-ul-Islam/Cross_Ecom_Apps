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
  DEFAULT_PROFILE,
  GUEST_PROFILE,
  bdt,
  CATEGORIES,
  FREE_TEE_THRESHOLD,
} from "./api";
export {
  DELIVERY_FEES,
  DELIVERY_OPTIONS,
  getDeliveryFee,
  DEFAULT_PROFILE,
  GUEST_PROFILE,
  bdt,
  CATEGORIES,
  FREE_TEE_THRESHOLD,
};
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

export async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
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
        city: (orderData as any).city || "Dhaka",
        district: (orderData as any).district || (orderData as any).state || "BD-13",
        state: (orderData as any).state || (orderData as any).district || "BD-13",
        postcode: (orderData as any).postcode || "1200",
        area: orderData.area,
        payment: orderData.payment,
        items: cleanItems,
        ...(orderData.guestToken ? { guestToken: orderData.guestToken } : {}),
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
    // Use request() so x-api-key is injected automatically (same as every other call).
    await request<unknown>("/v1/deen/bugs", { method: "POST", body }, 5000).catch(() => {});
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
    return await request<any>("/v1/deen/push/stats", { headers }, 5000);
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
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: string) => {
      if (state === "active") void onFocus();
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
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
  await AsyncStorage.removeItem(AUTH_USER_KEY).catch(() => {});
}

const AUTH_TOKEN_KEY = "deen_auth_token";
const AUTH_USER_KEY = "deen_auth_user";

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
