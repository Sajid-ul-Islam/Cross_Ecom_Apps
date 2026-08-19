/* ------------------------------------------------------------------ */
/*  apps/api — MIDDLE API LAYER (simulated in-browser)                  */
/*                                                                     */
/*  Every app calls ONLY this module. In the real build this is the    */
/*  Fastify gateway holding the WooCommerce consumer keys; here it     */
/*  enforces the same contract — latency, typed errors, auth, channel  */
/*  tagging and request telemetry — so apps develop against the real   */
/*  interface from day one.                                            */
/* ------------------------------------------------------------------ */

import {
  ApiError,
  SEED_COUPONS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  type AdminSession,
  type CheckoutPayload,
  type Channel,
  type Coupon,
  type Order,
  type OrderStatus,
  type Product,
} from "./contracts";

const KEYS = {
  orders: "bw.orders.v1",
  inventory: "bw.inventory.v1",
  coupons: "bw.coupons.v1",
  session: "bw.session.v1",
  customer: "bw.customer.v1",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }
  return fallback;
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

/* ------------------------------------------------------------------ */
/*  request telemetry — the gateway announces every call it serves     */
/* ------------------------------------------------------------------ */

export interface GatewayEvent {
  id: string;
  ts: number;
  method: string;
  path: string;
  status: number;
  ms: number;
  channel: string;
}

export const seedGatewayEvents: GatewayEvent[] = [
  { id: "seed-1", ts: Date.now() - 46000, method: "GET", path: "/v1/products", status: 200, ms: 341, channel: "web" },
  { id: "seed-2", ts: Date.now() - 21000, method: "GET", path: "/v1/orders", status: 200, ms: 287, channel: "admin" },
  { id: "seed-3", ts: Date.now() - 8000, method: "GET", path: "/v1/health", status: 200, ms: 94, channel: "android" },
];

const listeners = new Set<(e: GatewayEvent) => void>();

export function subscribeGateway(cb: (e: GatewayEvent) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let eventSeq = 0;

async function track(method: string, path: string, channel: string, status = 200): Promise<number> {
  const ms = Math.round(220 + Math.random() * 360);
  await new Promise((r) => setTimeout(r, ms));
  const e: GatewayEvent = {
    id: `gw-${++eventSeq}-${Date.now()}`,
    ts: Date.now(),
    method,
    path,
    status,
    ms,
    channel,
  };
  listeners.forEach((l) => l(e));
  return ms;
}

/* ------------------------------------------------------------------ */
/*  state slices                                                       */
/* ------------------------------------------------------------------ */

interface InventoryOverride {
  stock?: number;
  price?: number;
  active?: boolean;
}

let orders: Order[] = load(KEYS.orders, SEED_ORDERS);
let inventory: Record<string, InventoryOverride> = load(KEYS.inventory, {});
let coupons: Coupon[] = load(KEYS.coupons, SEED_COUPONS);

/* ------------------------------------------------------------------ */
/*  health — every app pings on boot                                   */
/* ------------------------------------------------------------------ */

export async function pingHealth(channel = "android"): Promise<{ status: "ok"; ms: number; redis: string; woo: string }> {
  const ms = await track("GET", "/v1/health", channel);
  return { status: "ok", ms, redis: "connected", woo: "staging" };
}

/* ------------------------------------------------------------------ */
/*  admin auth                                                         */
/* ------------------------------------------------------------------ */

const DEMO_EMAIL = "admin@bridgework.dev";
const DEMO_PASS = "launch-2025";

export async function login(email: string, password: string): Promise<AdminSession> {
  const ok = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASS;
  await track("POST", "/v1/auth/login", "admin", ok ? 200 : 401);
  if (!ok) throw new ApiError("AUTH_FAILED", "Invalid credentials. Gateway rejected the handshake.");
  const session: AdminSession = { email: email.trim().toLowerCase(), role: "admin", exp: Date.now() + 8 * 3600000 };
  save(KEYS.session, session);
  return session;
}

export function logout() {
  window.localStorage.removeItem(KEYS.session);
}

export function getSession(): AdminSession | null {
  const s = load<AdminSession | null>(KEYS.session, null);
  if (!s) return null;
  if (s.exp < Date.now()) {
    window.localStorage.removeItem(KEYS.session);
    return null;
  }
  return s;
}

export const demoCredentials = { email: DEMO_EMAIL, pass: DEMO_PASS };

function requireAdmin() {
  if (!getSession()) throw new ApiError("UNAUTHENTICATED", "No valid admin session.");
}

/* ------------------------------------------------------------------ */
/*  device customer profile (stands in for app auth + SecureStore)     */
/* ------------------------------------------------------------------ */

export interface CustomerProfile {
  name: string;
  email: string;
  device: string;
  push: boolean;
}

export const demoCustomer: CustomerProfile = {
  name: "Kai Tanaka",
  email: "kai@trailmail.co",
  device: "Pixel 8 · Android 15",
  push: true,
};

export function getCustomer(): CustomerProfile {
  return load(KEYS.customer, demoCustomer);
}

export function saveCustomer(c: CustomerProfile): void {
  save(KEYS.customer, c);
}

/* ------------------------------------------------------------------ */
/*  catalog (public)                                                   */
/* ------------------------------------------------------------------ */

export async function listProducts(channel: Channel | "web" = "web"): Promise<Product[]> {
  await track("GET", "/v1/products", channel);
  return SEED_PRODUCTS.map((p) => ({
    ...p,
    stock: inventory[p.id]?.stock ?? p.stock,
    price: inventory[p.id]?.price ?? p.price,
    active: inventory[p.id]?.active ?? p.active,
  })).filter((p) => p.active);
}

export async function listAllProducts(): Promise<Product[]> {
  await track("GET", "/v1/products?scope=all", "admin");
  requireAdmin();
  return SEED_PRODUCTS.map((p) => ({
    ...p,
    stock: inventory[p.id]?.stock ?? p.stock,
    price: inventory[p.id]?.price ?? p.price,
    active: inventory[p.id]?.active ?? p.active,
  }));
}

/* ------------------------------------------------------------------ */
/*  coupons                                                            */
/* ------------------------------------------------------------------ */

function couponMath(c: Coupon, subtotal: number): number {
  const d = c.type === "percent" ? (subtotal * c.value) / 100 : Math.min(c.value, subtotal);
  return Math.round(d * 100) / 100;
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  channel: Channel | "web" = "web"
): Promise<{ code: string; discount: number }> {
  await track("POST", "/v1/coupons/validate", channel);
  const c = coupons.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
  if (!c || !c.active) throw new ApiError("COUPON_INVALID", `Code "${code.trim().toUpperCase()}" is not active.`);
  if (subtotal < c.minSubtotal) {
    throw new ApiError("COUPON_MIN", `Needs a subtotal of $${c.minSubtotal.toFixed(2)} or more.`);
  }
  return { code: c.code, discount: couponMath(c, subtotal) };
}

/* ------------------------------------------------------------------ */
/*  checkout (public)                                                  */
/* ------------------------------------------------------------------ */

export async function createOrder(payload: CheckoutPayload): Promise<Order> {
  const channel: Channel = payload.channel ?? "web";
  if (!payload.customerName.trim() || !payload.customerEmail.includes("@") || !payload.address.trim()) {
    await track("POST", "/v1/orders", channel, 422);
    throw new ApiError("VALIDATION", "Name, valid email and address are required.");
  }
  if (payload.items.length === 0) {
    await track("POST", "/v1/orders", channel, 422);
    throw new ApiError("VALIDATION", "Cart is empty.");
  }

  const products = SEED_PRODUCTS.map((p) => ({
    ...p,
    stock: inventory[p.id]?.stock ?? p.stock,
    price: inventory[p.id]?.price ?? p.price,
  }));

  const items = payload.items.map((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p) throw new ApiError("NOT_FOUND", "Product vanished from catalog.");
    if (it.qty < 1) throw new ApiError("VALIDATION", "Quantity must be at least 1.");
    if (p.stock < it.qty) throw new ApiError("INSUFFICIENT_STOCK", `Only ${p.stock} left of ${p.sku}.`);
    return { productId: p.id, sku: p.sku, name: p.name, qty: it.qty, price: p.price };
  });

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  let discount = 0;
  let couponCode: string | undefined;
  if (payload.couponCode) {
    const c = coupons.find((x) => x.code.toLowerCase() === payload.couponCode!.trim().toLowerCase());
    if (!c || !c.active) {
      await track("POST", "/v1/orders", channel, 422);
      throw new ApiError("COUPON_INVALID", "Coupon is no longer active.");
    }
    if (subtotal < c.minSubtotal) {
      await track("POST", "/v1/orders", channel, 422);
      throw new ApiError("COUPON_MIN", `Coupon needs a subtotal of $${c.minSubtotal.toFixed(2)}.`);
    }
    discount = couponMath(c, subtotal);
    couponCode = c.code;
  }

  await track("POST", "/v1/orders", channel, 201);

  const num = 1040 + orders.length + 1;
  const order: Order = {
    id: `o-${Date.now()}`,
    number: `BW-${num}`,
    customerName: payload.customerName.trim(),
    customerEmail: payload.customerEmail.trim(),
    items,
    subtotal,
    discount,
    couponCode,
    total: Math.round((subtotal - discount) * 100) / 100,
    status: "pending",
    channel,
    createdAt: new Date().toISOString(),
  };

  for (const it of items) {
    const p = products.find((x) => x.id === it.productId)!;
    inventory[p.id] = { ...inventory[p.id], stock: p.stock - it.qty };
  }
  if (couponCode) {
    coupons = coupons.map((c) => (c.code === couponCode ? { ...c, used: c.used + 1 } : c));
    save(KEYS.coupons, coupons);
  }
  save(KEYS.inventory, inventory);
  orders = [order, ...orders];
  save(KEYS.orders, orders);
  return order;
}

export async function listPublicOrders(email: string, channel: Channel | "web" = "web"): Promise<Order[]> {
  await track("GET", "/v1/orders?mine=true", channel);
  return orders.filter((o) => o.customerEmail.toLowerCase() === email.trim().toLowerCase());
}

/* ------------------------------------------------------------------ */
/*  admin: orders                                                      */
/* ------------------------------------------------------------------ */

export async function listOrders(): Promise<Order[]> {
  await track("GET", "/v1/orders", "admin");
  requireAdmin();
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  await track("PATCH", `/v1/orders/${id.slice(0, 8)}`, "admin");
  requireAdmin();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new ApiError("NOT_FOUND", "Order not found.");
  const wasTerminal = order.status === "cancelled" || order.status === "refunded";
  const nowTerminal = status === "cancelled" || status === "refunded";
  order.status = status;
  if (!wasTerminal && nowTerminal) {
    for (const it of order.items) {
      const base = SEED_PRODUCTS.find((p) => p.id === it.productId);
      if (!base) continue;
      const cur = inventory[it.productId]?.stock ?? base.stock;
      inventory[it.productId] = { ...inventory[it.productId], stock: cur + it.qty };
    }
    save(KEYS.inventory, inventory);
  }
  orders = orders.map((o) => (o.id === id ? { ...order } : o));
  save(KEYS.orders, orders);
  return { ...order };
}

/* ------------------------------------------------------------------ */
/*  admin: inventory                                                   */
/* ------------------------------------------------------------------ */

export async function adjustStock(id: string, delta: number): Promise<Product> {
  await track("PATCH", "/v1/inventory/adjust", "admin");
  requireAdmin();
  const base = SEED_PRODUCTS.find((p) => p.id === id);
  if (!base) throw new ApiError("NOT_FOUND", "Product not found.");
  const cur = inventory[id]?.stock ?? base.stock;
  const next = Math.max(0, cur + delta);
  inventory[id] = { ...inventory[id], stock: next };
  save(KEYS.inventory, inventory);
  return { ...base, stock: next, price: inventory[id]?.price ?? base.price, active: inventory[id]?.active ?? base.active };
}

export async function setPrice(id: string, price: number): Promise<Product> {
  await track("PATCH", "/v1/inventory/price", "admin");
  requireAdmin();
  const base = SEED_PRODUCTS.find((p) => p.id === id);
  if (!base) throw new ApiError("NOT_FOUND", "Product not found.");
  if (!Number.isFinite(price) || price <= 0) throw new ApiError("VALIDATION", "Price must be a positive number.");
  inventory[id] = { ...inventory[id], price: Math.round(price * 100) / 100 };
  save(KEYS.inventory, inventory);
  return { ...base, price: inventory[id].price!, stock: inventory[id]?.stock ?? base.stock, active: inventory[id]?.active ?? base.active };
}

export async function setActive(id: string, active: boolean): Promise<Product> {
  await track("POST", "/v1/products/visibility", "admin");
  requireAdmin();
  const base = SEED_PRODUCTS.find((p) => p.id === id);
  if (!base) throw new ApiError("NOT_FOUND", "Product not found.");
  inventory[id] = { ...inventory[id], active };
  save(KEYS.inventory, inventory);
  return { ...base, active, stock: inventory[id]?.stock ?? base.stock, price: inventory[id]?.price ?? base.price };
}

/* ------------------------------------------------------------------ */
/*  admin: coupons                                                     */
/* ------------------------------------------------------------------ */

export async function listCoupons(): Promise<Coupon[]> {
  await track("GET", "/v1/coupons", "admin");
  requireAdmin();
  return [...coupons];
}

export async function createCoupon(code: string, type: "percent" | "fixed", value: number, minSubtotal: number): Promise<Coupon> {
  await track("POST", "/v1/coupons", "admin");
  requireAdmin();
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  if (clean.length < 3) throw new ApiError("VALIDATION", "Code needs at least 3 characters.");
  if (coupons.some((c) => c.code === clean)) throw new ApiError("CONFLICT", `Code ${clean} already exists.`);
  if (!Number.isFinite(value) || value <= 0) throw new ApiError("VALIDATION", "Value must be positive.");
  if (type === "percent" && value > 90) throw new ApiError("VALIDATION", "Percent coupons capped at 90%.");
  const coupon: Coupon = { code: clean, type, value, minSubtotal: Math.max(0, minSubtotal), used: 0, active: true };
  coupons = [coupon, ...coupons];
  save(KEYS.coupons, coupons);
  return coupon;
}

export async function toggleCoupon(code: string): Promise<Coupon> {
  await track("PATCH", `/v1/coupons/${code}`, "admin");
  requireAdmin();
  coupons = coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c));
  save(KEYS.coupons, coupons);
  return coupons.find((c) => c.code === code)!;
}

export async function deleteCoupon(code: string): Promise<void> {
  await track("DELETE", `/v1/coupons/${code}`, "admin");
  requireAdmin();
  coupons = coupons.filter((c) => c.code !== code);
  save(KEYS.coupons, coupons);
}

/* ------------------------------------------------------------------ */
/*  public feed — latest orders, newest first (storefront marquee)     */
/* ------------------------------------------------------------------ */

export async function gatewayFeed(): Promise<{ number: string; channel: string; total: number; status: string }[]> {
  return orders.slice(0, 6).map((o) => ({ number: o.number, channel: o.channel, total: o.total, status: o.status }));
}
