import type { FastifyInstance } from "fastify";
import { promises as fs } from "fs";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import { config, wooEnabled, pathaoEnabled } from "./config.js";
import {
  audit,
  maskPhone,
  redactToken,
  checkRateLimit,
  rateLimitKeyFor,
} from "./security.js";
import { SEED_PRODUCTS, type DeenProduct } from "./seed.js";
import {
  fetchWooProducts,
  fetchWooVariations,
  fetchWooStats,
  fetchWooCategoryList,
  fetchWooCategoryImages,
  wooStatus,
  pushWooOrder,
  updateWooOrderPayment,
  wooHealthy,
  invalidateCatalogCache,
  invalidateVariationCache,
  invalidateCoverCache,
  invalidateStats,
  wooPost,
  wooFetch,
  fetchWooPaymentMethods,
  getShippingFees,
  getStoreSettings,
  getPage,
  getCouponByCode,
} from "./woo.js";
import {
  getPathaoToken,
  getPathaoTrackingInfo,
  getFreshPathaoTracking,
  getCachedPathaoTracking,
  getPathaoStores,
  getPathaoCities,
  getPathaoZones,
  getPathaoAreas,
  createPathaoOrder,
} from "./pathao.js";

/* ------------------------------------------------------------------ */
/*  JSON Schema validation (Fastify native AJV) — SEC-6 / request hardening */
/*  Fastify validates the body before the handler runs and returns      */
/*  400 FST_ERR_VALIDATION for malformed payloads automatically.       */
/* ------------------------------------------------------------------ */
const ORDER_BODY_SCHEMA = {
  body: {
    type: "object",
    required: ["name", "phone", "address", "items"],
    properties: {
      name:       { type: "string", minLength: 1, maxLength: 100 },
      lastName:   { type: "string", maxLength: 100 },
      phone:      { type: "string", minLength: 9, maxLength: 20 },
      email:      { type: "string", format: "email", maxLength: 254 },
      address:    { type: "string", minLength: 8, maxLength: 500 },
      area:       { type: "string", enum: ["dhaka", "outside", "outside_standard", "dhaka_express", "store_pickup", "pickup"] },
      city:       { type: "string", maxLength: 100 },
      district:   { type: "string", maxLength: 100 },
      state:      { type: "string", maxLength: 20 },
      postcode:   { type: "string", maxLength: 10 },
      payment:    { type: "string", enum: ["cod", "bkash", "nagad", "card", "online", "bkash-for-woocommerce", "sslcommerz"] },
      trxId:      { type: "string", maxLength: 60 },
      coupon:     { type: "string", maxLength: 60 },
      guestToken: { type: "string", maxLength: 80 },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: {
          type: "object",
          required: ["productId", "qty"],
          properties: {
            productId:   { type: "string" },
            variationId: { type: "number" },
            size:        { type: "string", maxLength: 20 },
            qty:         { type: "integer", minimum: 1, maximum: 50 },
          },
        },
      },
    },
    additionalProperties: true, // allow extra fields for forward compat
  },
};

const LOGIN_BODY_SCHEMA = {
  body: {
    type: "object",
    properties: {
      username:   { type: "string", maxLength: 200 },
      identifier: { type: "string", maxLength: 200 },
      email:      { type: "string", maxLength: 254 },
      password:   { type: "string", minLength: 1, maxLength: 200 },
    },
    additionalProperties: false,
  },
};

const REGISTER_BODY_SCHEMA = {
  body: {
    type: "object",
    required: ["name", "phone"],
    properties: {
      name:  { type: "string", minLength: 2, maxLength: 100 },
      phone: { type: "string", minLength: 9, maxLength: 20 },
      email: { type: "string", format: "email", maxLength: 254 },
    },
    additionalProperties: false,
  },
};

const PUSH_TOKEN_SCHEMA = {
  body: {
    type: "object",
    required: ["token"],
    properties: {
      token:  { type: "string", minLength: 10, maxLength: 300 },
      phone:  { type: "string", maxLength: 20 },
      area:   { type: "string", maxLength: 50 },
      device: {
        type: "object",
        properties: {
          platform:  { type: "string", maxLength: 50 },
          osVersion: { type: "string", maxLength: 50 },
          model:     { type: "string", maxLength: 100 },
        },
      },
    },
    additionalProperties: true,
  },
};

const BROADCAST_BODY_SCHEMA = {
  body: {
    type: "object",
    required: ["title", "body"],
    properties: {
      title:       { type: "string", minLength: 3, maxLength: 150 },
      body:        { type: "string", minLength: 5, maxLength: 500 },
      type:        { type: "string", enum: ["PROMO", "RESTOCK", "BROADCAST", "ORDER"] },
      audience:    { type: "string", enum: ["ALL", "REGISTERED", "GUEST", "DHAKA_ONLY", "OUTSIDE_DHAKA"] },
      promoCode:   { type: "string", maxLength: 30 },
      actionUrl:   { type: "string", maxLength: 200 },
      actionLabel: { type: "string", maxLength: 50 },
      bannerImage: { type: "string", maxLength: 500 },
      sentBy:      { type: "string", maxLength: 50 },
    },
    additionalProperties: true,
  },
};

const PAYMENT_INIT_SCHEMA = {
  body: {
    type: "object",
    required: ["orderId", "paymentMethod"],
    properties: {
      orderId:       { type: "string", minLength: 1, maxLength: 100 },
      paymentMethod: { type: "string", enum: ["bkash", "nagad", "card", "online"] },
      amount:        { type: "number", minimum: 1 },
      customerPhone: { type: "string", maxLength: 20 },
      customerName:  { type: "string", maxLength: 100 },
    },
    additionalProperties: true,
  },
};

const PAYMENT_VERIFY_SCHEMA = {
  body: {
    type: "object",
    required: ["orderId", "trxId"],
    properties: {
      orderId:       { type: "string", minLength: 1, maxLength: 100 },
      trxId:         { type: "string", minLength: 4, maxLength: 60 },
      paymentMethod: { type: "string", enum: ["bkash", "nagad", "card", "online"] },
      senderPhone:   { type: "string", maxLength: 20 },
    },
    additionalProperties: true,
  },
};

const orderSeq = { n: 1041 };
const orders: any[] = [];

/**
 * Canonical WooCommerce Bangladesh state codes (BD-01 .. BD-64).
 * The live site stores orders with `state: "BD-11"` etc., NOT the district
 * name. We must mirror that exactly so app-placed orders are indistinguishable
 * from website-placed ones.
 */
// NOTE: kept byte-identical to apps/mobile/src/data/districts.ts (the app's
// authoritative list, sourced from the live site's WooCommerce BG state codes —
// verified BD-11 = Cox's Bazar against a real website order). Both must stay in
// sync so app-placed orders use the exact same state codes as website orders.
export const BD_STATES: { code: string; name: string }[] = [
  { code: "BD-13", name: "Dhaka" },
  { code: "BD-10", name: "Chattogram" },
  { code: "BD-18", name: "Gazipur" },
  { code: "BD-40", name: "Narayanganj" },
  { code: "BD-60", name: "Sylhet" },
  { code: "BD-54", name: "Rajshahi" },
  { code: "BD-27", name: "Khulna" },
  { code: "BD-06", name: "Barishal" },
  { code: "BD-55", name: "Rangpur" },
  { code: "BD-34", name: "Mymensingh" },
  { code: "BD-08", name: "Cumilla" },
  { code: "BD-11", name: "Cox's Bazar" },
  { code: "BD-03", name: "Bogura" },
  { code: "BD-05", name: "Bagerhat" },
  { code: "BD-01", name: "Bandarban" },
  { code: "BD-02", name: "Barguna" },
  { code: "BD-07", name: "Bhola" },
  { code: "BD-04", name: "Brahmanbaria" },
  { code: "BD-09", name: "Chandpur" },
  { code: "BD-12", name: "Chuadanga" },
  { code: "BD-14", name: "Dinajpur" },
  { code: "BD-15", name: "Faridpur" },
  { code: "BD-16", name: "Feni" },
  { code: "BD-19", name: "Gaibandha" },
  { code: "BD-17", name: "Gopalganj" },
  { code: "BD-20", name: "Habiganj" },
  { code: "BD-21", name: "Jamalpur" },
  { code: "BD-22", name: "Jashore" },
  { code: "BD-25", name: "Jhalokati" },
  { code: "BD-23", name: "Jhenaidah" },
  { code: "BD-24", name: "Joypurhat" },
  { code: "BD-29", name: "Khagrachhari" },
  { code: "BD-26", name: "Kishoreganj" },
  { code: "BD-28", name: "Kurigram" },
  { code: "BD-30", name: "Kushtia" },
  { code: "BD-31", name: "Lakshmipur" },
  { code: "BD-32", name: "Lalmonirhat" },
  { code: "BD-36", name: "Madaripur" },
  { code: "BD-37", name: "Magura" },
  { code: "BD-33", name: "Manikganj" },
  { code: "BD-39", name: "Meherpur" },
  { code: "BD-38", name: "Moulvibazar" },
  { code: "BD-35", name: "Munshiganj" },
  { code: "BD-48", name: "Naogaon" },
  { code: "BD-43", name: "Narail" },
  { code: "BD-42", name: "Narsingdi" },
  { code: "BD-44", name: "Natore" },
  { code: "BD-45", name: "Nawabganj (Chapai)" },
  { code: "BD-41", name: "Netrokona" },
  { code: "BD-46", name: "Nilphamari" },
  { code: "BD-47", name: "Noakhali" },
  { code: "BD-49", name: "Pabna" },
  { code: "BD-52", name: "Panchagarh" },
  { code: "BD-51", name: "Patuakhali" },
  { code: "BD-50", name: "Pirojpur" },
  { code: "BD-53", name: "Rajbari" },
  { code: "BD-56", name: "Rangamati" },
  { code: "BD-58", name: "Satkhira" },
  { code: "BD-62", name: "Shariatpur" },
  { code: "BD-57", name: "Sherpur" },
  { code: "BD-59", name: "Sirajganj" },
  { code: "BD-61", name: "Sunamganj" },
  { code: "BD-63", name: "Tangail" },
  { code: "BD-64", name: "Thakurgaon" },
];

const BD_STATE_BY_NAME: Record<string, string> = Object.fromEntries(
  BD_STATES.map((s) => [s.name.toLowerCase(), s.code])
);

/** Normalize a district input to the canonical WooCommerce `BD-XX` state code. */
export function normalizeState(input?: string): string {
  if (!input) return "BD-13"; // Dhaka default
  const v = String(input).trim();
  if (/^BD-\d{2}$/i.test(v)) return v.toUpperCase();
  const lower = v.toLowerCase().replace(/\s+/g, " ");
  return BD_STATE_BY_NAME[lower] ?? "BD-13";
}

async function loadOrders(): Promise<void> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      orders.push(...parsed);
    }
  } catch {
    /* first run or corrupt - start empty */
  }
}

function saveOrders(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
    } catch {
      /* ignore */
    }
  })();
}

/* ------------------------------------------------------------------ */
/*  Registered customers converted from guest checkouts.              */
/*  Lightweight in-memory customer directory keyed by BD phone.       */
/*  A guest who places an order and then registers is "remembered"    */
/*  so on return we can greet them by name and show order history.    */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Customer directory persisted to disk (survives gateway restarts).     */
/*  In-memory map + on-disk JSON write-back; load on startup, save on     */
/*  every mutation. A read-only filesystem silently degrades to in-memory. */
/* ------------------------------------------------------------------ */
const DATA_DIR = process.env.DATA_DIR || "/tmp/deen_gateway_data";
const CUSTOMERS_FILE      = `${DATA_DIR}/customers.json`;
const ORDERS_FILE         = `${DATA_DIR}/orders.json`;
const AUTH_SESSIONS_FILE  = `${DATA_DIR}/auth_sessions.json`;
const GUEST_SESSIONS_FILE = `${DATA_DIR}/guest_sessions.json`;
const PUSH_TOKENS_FILE    = `${DATA_DIR}/push_tokens.json`;
const BROADCASTS_FILE     = `${DATA_DIR}/broadcasts.json`;
const PAYMENTS_FILE       = `${DATA_DIR}/payments.json`;

/* ------------------------------------------------------------------ */
/*  Payment Transactions persistence (bKash · Nagad · Card)          */
/* ------------------------------------------------------------------ */
export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber?: string;
  wooId?: number;
  amount: number;
  paymentMethod: "bkash" | "nagad" | "card" | "online";
  customerPhone?: string;
  customerName?: string;
  status: "INITIATED" | "PENDING_VERIFICATION" | "COMPLETED" | "FAILED" | "CANCELLED";
  trxId?: string;
  senderPhone?: string;
  gatewayRef?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

const paymentTransactions = new Map<string, PaymentTransaction>();

async function loadPayments(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(PAYMENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Array<[string, PaymentTransaction]>;
    for (const [id, tx] of parsed) {
      paymentTransactions.set(id, tx);
    }
    console.log(`[gateway] Loaded ${paymentTransactions.size} payment transactions from disk.`);
  } catch {
    /* first run or empty */
  }
}

function savePayments(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = JSON.stringify([...paymentTransactions.entries()], null, 2);
      await fs.writeFile(PAYMENTS_FILE, data, "utf-8");
    } catch {
      /* ignore */
    }
  })();
}

/* ------------------------------------------------------------------ */
/*  Push tokens & Broadcast delivery engine (Expo Push API).           */
/* ------------------------------------------------------------------ */
export interface PushTokenRecord {
  token: string;
  phone?: string;
  area?: string;
  device?: { platform?: string; osVersion?: string; model?: string };
  registeredAt: string;
  lastSeenAt: string;
}

const pushTokens = new Map<string, PushTokenRecord>();

async function loadPushTokens(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(PUSH_TOKENS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Array<[string, PushTokenRecord]>;
    for (const [token, record] of parsed) {
      pushTokens.set(token, record);
    }
    console.log(`[gateway] Loaded ${pushTokens.size} push device tokens from disk.`);
  } catch {
    /* first run or empty */
  }
}

function savePushTokens(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = JSON.stringify([...pushTokens.entries()], null, 2);
      await fs.writeFile(PUSH_TOKENS_FILE, data, "utf-8");
    } catch {
      /* ignore */
    }
  })();
}

const broadcasts: any[] = [
  {
    id: "bc_init_1",
    title: "🔥 Flash Sale: 20% OFF Raw Selvedge Denim",
    body: "Use promo code DEEN20 at checkout to claim 20% discount on all artisanal Japanese-grade rigid jeans.",
    type: "PROMO",
    audience: "ALL",
    promoCode: "DEEN20",
    actionUrl: "/category/JEANS",
    actionLabel: "Shop Selvedge Jeans",
    sentAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    sentBy: "Admin",
    recipientCount: 1420,
  },
  {
    id: "bc_init_2",
    title: "📣 Mirpur 12 Flagship Outlet Now Open for Pickups",
    body: "Select 'Store Pickup' at checkout to collect your orders free of charge from Ramzannesa Super Market, Mirpur 12.",
    type: "BROADCAST",
    audience: "DHAKA_ONLY",
    actionUrl: "/(tabs)/profile",
    actionLabel: "View Outlet Details",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    sentBy: "Admin",
    recipientCount: 890,
  },
];

async function loadBroadcasts(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(BROADCASTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      broadcasts.length = 0;
      broadcasts.push(...parsed);
      console.log(`[gateway] Loaded ${broadcasts.length} broadcasts from disk.`);
    }
  } catch {
    /* start with initial broadcasts */
  }
}

function saveBroadcasts(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(BROADCASTS_FILE, JSON.stringify(broadcasts, null, 2), "utf-8");
    } catch {
      /* ignore */
    }
  })();
}

/**
 * Dispatches real push notifications to Expo Push API endpoint.
 * Supports batching in chunks of 100 according to Expo guidelines.
 */
async function sendExpoPushNotifications(messages: Array<{
  to: string;
  title: string;
  body: string;
  data?: any;
  sound?: "default";
  badge?: number;
}>): Promise<{ sent: number; failed: number }> {
  if (!messages || messages.length === 0) return { sent: 0, failed: 0 };
  const valid = messages.filter((m) => m.to && (m.to.startsWith("ExponentPushToken[") || m.to.startsWith("ExpoPushToken[")));
  if (valid.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const chunks: typeof valid[] = [];
  for (let i = 0; i < valid.length; i += 100) {
    chunks.push(valid.slice(i, i + 100));
  }

  let sent = 0;
  let failed = 0;
  for (const chunk of chunks) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        console.warn(`[gateway] Expo push returned status ${res.status}`);
      }
    } catch (err) {
      failed += chunk.length;
      console.warn("[gateway] Push delivery error:", (err as Error).message);
    }
  }
  return { sent, failed };
}

/* ------------------------------------------------------------------ */
/*  Auth session store — persisted to disk (survives restarts).         */
/*  TTL: 30 days. Pruned on every load so stale tokens self-expire.     */
/* ------------------------------------------------------------------ */
const AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const authSessions = new Map<string, any>();

async function loadAuthSessions(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(AUTH_SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Array<[string, any]>;
    const cutoff = Date.now() - AUTH_SESSION_TTL_MS;
    for (const [token, session] of parsed) {
      if ((session.createdAt ?? 0) > cutoff) {
        authSessions.set(token, session);
      }
    }
    console.log(`[gateway] Loaded ${authSessions.size} auth sessions from disk.`);
  } catch {
    /* first run or corrupt file — start empty */
  }
}

function saveAuthSessions(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = JSON.stringify([...authSessions.entries()], null, 2);
      await fs.writeFile(AUTH_SESSIONS_FILE, data, "utf-8");
    } catch {
      /* ignore — in-memory copy stays authoritative */
    }
  })();
}

const customersByPhone: Record<string, { name: string; phone: string; email?: string; registeredAt: string; orderCount: number }> = {};

async function loadCustomers(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(CUSTOMERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      Object.assign(customersByPhone, parsed);
    }
  } catch {
    /* first run or corrupt file - start empty */
  }
}

function saveCustomers(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customersByPhone, null, 2), "utf-8");
    } catch {
      /* ignore - in-memory copy stays authoritative */
    }
  })();
}

function recordGuestPurchase(phone: string, name: string): void {
  const key = phone;
  if (customersByPhone[key]) {
    customersByPhone[key].orderCount += 1;
  } else {
    customersByPhone[key] = {
      name: name.trim(),
      phone,
      registeredAt: new Date().toISOString(),
      orderCount: 1,
    };
  }
  saveCustomers();
}

function isRegisteredCustomer(phone: string): boolean {
  return Boolean(customersByPhone[phone.replace(/[^0-9]/g, "")]);
}

/* ------------------------------------------------------------------ */
/*  Anonymous guest sessions — persisted to disk.                       */
/*  TTL: 7 days. Pruned on load so old anonymous tokens self-expire.    */
/* ------------------------------------------------------------------ */
const GUEST_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const guestSessions: Array<{
  token: string;
  phone: string;
  name: string;
  createdAt: number;
  orderId?: number;
}> = [];

async function loadGuestSessions(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(GUEST_SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as typeof guestSessions;
    const cutoff = Date.now() - GUEST_SESSION_TTL_MS;
    const live = parsed.filter((s) => s.createdAt > cutoff);
    guestSessions.push(...live);
    console.log(`[gateway] Loaded ${live.length} guest sessions from disk.`);
  } catch {
    /* first run or corrupt file — start empty */
  }
}

function saveGuestSessions(): void {
  void (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      // Only persist recent sessions (prune before write)
      const cutoff = Date.now() - GUEST_SESSION_TTL_MS;
      const live = guestSessions.filter((s) => s.createdAt > cutoff);
      await fs.writeFile(GUEST_SESSIONS_FILE, JSON.stringify(live, null, 2), "utf-8");
    } catch {
      /* ignore */
    }
  })();
}

function mintGuestSession(): (typeof guestSessions)[number] {
  // Random BD mobile — 01[3-9]XXXXXXXXX, but anonymized (not tied to a person)
  const second = 3 + Math.floor(Math.random() * 7); // 3-9
  const rest = () => Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8);
  const phone = `01${second}${rest()}`;
  const token = `guest_${randomUUID()}`;
  const session = {
    token,
    phone,
    name: "Guest Shopper",
    createdAt: Date.now(),
  };
  guestSessions.push(session);
  // Bound the in-memory store (defensive)
  if (guestSessions.length > 5000) guestSessions.shift();
  saveGuestSessions();
  return session;
}

/* ------------------------------------------------------------------ */
/*  Runtime catalog cache (gateway-side).                              */
/* ------------------------------------------------------------------ */

async function getCatalog(): Promise<DeenProduct[]> {
  if (!wooEnabled) return SEED_PRODUCTS;
  try {
    return await fetchWooProducts();
  } catch (e) {
    console.error("[gateway] Woo products failed, using seed:", (e as Error).message);
    return SEED_PRODUCTS;
  }
}

function sortProducts(list: DeenProduct[], sort: string): DeenProduct[] {
  const arr = [...list];
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

export async function registerDeenRoutes(app: FastifyInstance) {
  /* Stash the raw request body (string) on the request so the Woo webhook can verify
     the HMAC signature over the EXACT bytes Woo sent. Harmless for all other JSON routes. */
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, bodyStr, done) => {
    try {
      (req as any).rawBody = typeof bodyStr === "string" ? bodyStr : String(bodyStr ?? "");
      done(null, bodyStr ? JSON.parse(String(bodyStr)) : undefined);
    } catch (e) {
      done(e as Error, undefined);
    }
  });

  /* ---- load persisted data on startup ---- */
  await loadCustomers();
  await loadOrders();
  await loadAuthSessions();
  await loadGuestSessions();
  await loadPushTokens();
  await loadBroadcasts();
  await loadPayments();

  /* ---- catalog (filter + search + sort) ---- */
  app.get("/v1/deen/products", async (req, reply) => {
    const category = (req.query as any).category as string | undefined;
    const q = (req.query as any).q as string | undefined;
    const sort = (req.query as any).sort as string | undefined;
    // Customers never see out-of-stock products. Opt-in only (admin/debug).
    const includeOOS = (req.query as any).includeOOS === "1" || (req.query as any).includeOOS === "true";
    let list = await getCatalog();
    if (!includeOOS) {
      list = list.filter((p) => (p.stockStatus || "instock") !== "outofstock");
    }
    if (category && category !== "ALL" && category !== "OTHER") {
      list = list.filter((p) => p.category === category);
    }
    if (q && q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          p.fabric.toLowerCase().includes(s)
      );
    }
    if (sort) list = sortProducts(list, sort);
    return reply.send(list);
  });

  /* ---- full snapshot (for bundling into the app as offline catalog) ---- */
  /* Excludes out-of-stock so the bundled/offline base matches the live
     customer view (no OOS products shown to customers anywhere). */
  app.get("/v1/deen/snapshot", async (_req, reply) => {
    const list = (await getCatalog()).filter(
      (p) => (p.stockStatus || "instock") !== "outofstock"
    );
    return reply.send({
      generatedAt: new Date().toISOString(),
      count: list.length,
      products: list,
    });
  });

  /* ---- single product (with real variations) ---- */
  app.get("/v1/deen/products/:id", async (req, reply) => {
    const list = await getCatalog();
    const product = list.find((p) => p.id === (req.params as any).id);
    if (!product) return reply.code(404).send({ error: "NOT_FOUND", message: "Product not found." });

    let variations: any[] = [];
    if (wooEnabled) {
      try {
        variations = await fetchWooVariations(product.id);
      } catch {
        variations = [];
      }
    }
    return reply.send({ ...product, variations });
  });

  /* ---- analytics: store + sales + category + top sellers (admin only) ---- */
  app.get("/v1/deen/stats", async (req, reply) => {
    // REM-1: admin Bearer token required — leaks business intelligence in live mode.
    const statsToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    const statsSession = statsToken ? authSessions.get(statsToken) : null;
    if (!statsSession || statsSession.role !== "admin") {
      return reply.code(403).send({ error: "FORBIDDEN", message: "Admin access required to view store analytics." });
    }
    if (!wooEnabled) {
      return reply.send({
        mode: "seed",
        store: { totalProducts: SEED_PRODUCTS.length, onSale: 0, outOfStock: 0, avgPrice: 0 },
        sales: { period: "—", totalSales: 0, netSales: 0, orders: 0, items: 0, newCustomers: 0, shipping: 0, series: [] },
        categories: [],
        topSellers: [],
        updatedAt: new Date().toISOString(),
      });
    }
    try {
      const stats = await fetchWooStats();
      return reply.send({ mode: "live", ...stats });
    } catch (e) {
      return reply.code(502).send({ error: "WOO_STATS_FAILED", message: (e as Error).message });
    }
  });

  /* ---- categories with counts (derived from live catalog) ---- */
  app.get("/v1/deen/categories", async (_req, reply) => {
    try {
      const cats = await fetchWooCategoryList();
      return reply.send(cats);
    } catch {
      return reply.send([]);
    }
  });

  /* ---- category cover images (source of truth: WooCommerce products/categories) ---- */
  /* Returns { category: imageUrl } where imageUrl is the real WordPress media
     URL from Woo. The app uses these as covers and only falls back to the
     bundled deencommerce.com URLs when Woo is unreachable. */
  app.get("/v1/deen/category-covers", async (_req, reply) => {
    try {
      const covers = await fetchWooCategoryImages();
      return reply.send(covers);
    } catch {
      return reply.send({});
    }
  });

  /* ---- centralized error model (R4) ---- */
  /* Every endpoint should return this shape so the app can decide:
     retry (retryable) vs contact-support vs offline. */
  function deenError(reply: any, status: number, code: string, message: string, retryable = false) {
    return reply.code(status).send({ error: code, message, retryable });
  }

  /* ---- health (R1): reports gateway + Woo backend status ---- */
  /* The app uses `woo` to show cached-catalog banners and never a hard error. */
  async function healthPayload() {
    const woo = wooStatus();
    return {
      ok: true,
      gateway: "ok" as const,
      woo,
      mode: config.apiKey ? "keyed" : "open",
      timestamp: new Date().toISOString(),
    };
  }
  app.get("/health", async (_req, reply) => reply.send(await healthPayload()));
  app.get("/v1/health", async (_req, reply) => reply.send(await healthPayload()));

  /* ---- WooCommerce webhook: real-time catalog cache bust ----
     Configure in WP Admin → WooCommerce → Settings → Advanced → Webhooks:
       Topic: Product created / updated / deleted / restored
               (also product_variation.* for size-level price/stock changes)
       Delivery URL: <gateway>/v1/deen/webhook/woo
       Secret: must equal the WEBHOOK_SECRET env var below.
     Woo signs each payload: X-WC-Webhook-Signature = base64(HMAC-SHA256(raw_body, secret)).
     We verify it, then invalidate the catalog cache so the next app request re-fetches
     from Woo immediately (new product / price / discount shows in seconds, not 5 min). */
  app.post("/v1/deen/webhook/woo", async (req, reply) => {
    const secret = config.webhookSecret ?? "";
    const topic = (req.headers["x-wc-webhook-topic"] as string) || "unknown";
    const body = (req.body || {}) as any;

    const verify = () => {
      if (!secret) return true; // dev mode: no secret configured
      const sigHeader = (req.headers["x-wc-webhook-signature"] as string) || "";
      const raw = (req as any).rawBody || "";
      const expected = createHmac("sha256", secret).update(raw).digest("base64");
      const a = Buffer.from(sigHeader);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    };

    if (!verify()) {
      audit("woo_webhook", false, "REJECTED bad signature");
      return reply.code(401).send({ error: "BAD_SIGNATURE" });
    }

    // Topic-aware, surgical cache busting — only invalidate what actually changed.
    const pid = body?.id ? String(body.id) : undefined;
    if (topic.startsWith("product_variation")) {
      invalidateVariationCache(pid);
    } else if (topic.startsWith("product")) {
      invalidateCatalogCache();
      if (pid) invalidateVariationCache(pid);
    } else if (topic.startsWith("category")) {
      invalidateCoverCache();
      invalidateCatalogCache();
    } else if (topic.startsWith("order") || topic.startsWith("customer")) {
      invalidateStats();
    }

    audit("woo_webhook", true, `cache busted (topic: ${topic})`);
    return reply.code(200).send({ ok: true, verified: true, topic });
  });

  /* ---- cashback (SINGLE SOURCE OF TRUTH) ----
     The exact same rule the gateway uses when building the WooCommerce coupon at
     checkout. The app MUST read this instead of computing its own thresholds, so the
     displayed cashback always matches what Woo actually deducts. */
  function calculateCashback(subtotal: number): { amount: number; tier: number; nextTierAt: number | null } {
    if (subtotal >= 3000) return { amount: 700, tier: 2, nextTierAt: null };
    if (subtotal >= 2500) return { amount: 500, tier: 1, nextTierAt: 3000 };
    return { amount: 0, tier: 0, nextTierAt: 2500 };
  }

  /* ---- BOGO (buy 2+ same category → cheapest is free) ----
     Mirrors the live site: per category, when >=2 items are in the bag, the
     single lowest-priced item becomes ৳0. Returns the total BOGO discount and
     which line indices are free (so the app can show the strikethrough). */
  function calculateBogo(lines: { category?: string; unit: number; qty?: number }[]): {
    discount: number;
    freeIndexes: number[];
  } {
    const byCat = new Map<string, number[]>();
    lines.forEach((l, i) => {
      const cat = l.category || "OTHER";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(i);
    });
    let discount = 0;
    const freeIndexes: number[] = [];
    for (const idxs of byCat.values()) {
      if (idxs.length < 2) continue; // need 2+ in the same category
      // cheapest line is free (its full unit price * qty)
      let cheapest = idxs[0];
      for (const i of idxs) if ((lines[i].unit) < (lines[cheapest].unit)) cheapest = i;
      const qty = lines[cheapest].qty ?? 1;
      discount += lines[cheapest].unit * qty;
      freeIndexes.push(cheapest);
    }
    return { discount, freeIndexes };
  }
  app.get("/v1/deen/cashback", async (req, reply) => {
    const subtotal = Number((req.query as any).subtotal ?? 0) || 0;
    const cb = calculateCashback(subtotal);
    return reply.send({
      subtotal,
      cashback: cb.amount,
      tier: cb.tier,
      nextTierAt: cb.nextTierAt,
      currency: "BDT",
      note: "Applied automatically as a WooCommerce coupon at checkout.",
    });
  });

  /* ---- live pricing preview (source of truth for bag math) ----
     App sends its cart; gateway returns subtotal, cashback, BOGO discount +
     which line indexes are free, and delivery fees. Mirrors exactly what the
     order route will charge, so the bag and checkout never disagree. */
  app.post<{ Body: any }>("/v1/deen/pricing", async (req, reply) => {
    const body = req.body as any;
    const items = Array.isArray(body?.items) ? body.items : [];
    const area = String(body?.area || "dhaka_standard");
    const rawCoupon = String(body?.coupon || "").trim();
    const couponInfo = rawCoupon ? await getCouponByCode(rawCoupon) : null;
    const list = await getCatalog();
    const lines = items.map((it: any) => {
      const prod = list.find((x: any) => x.id === it.productId);
      const unit = prod ? (prod.salePrice ?? prod.price) : Number(it.unit ?? 0);
      return { productId: it.productId, qty: Number(it.qty ?? 1), unit, category: prod?.category };
    });
    const subtotal = lines.reduce((s: number, l: any) => s + l.unit * l.qty, 0);
    const cashback = calculateCashback(subtotal).amount;
    const bogo = calculateBogo(lines);
    const couponDiscount = couponInfo
      ? (couponInfo.type === "percent"
          ? Math.round((subtotal * couponInfo.amount) / 100)
          : Math.min(couponInfo.amount, subtotal))
      : 0;
    const fees = await getShippingFees();
    const delivery =
      area === "outside" || area === "outside_standard"
        ? fees.outsideDhaka
        : area === "dhaka_express"
        ? fees.insideDhaka + config.expressSurcharge
        : area === "store_pickup" || area === "pickup"
        ? 0
        : fees.insideDhaka;
    return reply.send({
      subtotal,
      cashback,
      nextTierAt: calculateCashback(subtotal).nextTierAt,
      bogoDiscount: bogo.discount,
      bogoFreeIndexes: bogo.freeIndexes,
      couponCode: couponInfo?.code || null,
      couponDiscount,
      deliveryFees: { insideDhaka: fees.insideDhaka, outsideDhaka: fees.outsideDhaka, express: fees.insideDhaka + config.expressSurcharge, storePickup: 0 },
      total: Math.max(0, subtotal - cashback - bogo.discount - couponDiscount) + delivery,
      currency: "BDT",
    });
  });

  app.post("/v1/deen/webhook/woo/register", async (req, reply) => {
    // One-call setup: provisions the WooCommerce webhooks that keep the app real-time.
    // No need to click in WP Admin. Re-run anytime; duplicate webhooks are skipped.
    if (!wooHealthy()) return reply.code(503).send({ error: "WOO_DISABLED" });
    const secret = config.webhookSecret ?? "";
    if (!secret) return reply.code(400).send({ error: "SET_WEBHOOK_SECRET", message: "Set WEBHOOK_SECRET env on the gateway first." });

    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["host"] as string) || config.publicUrl || "";
    const base = (config.publicUrl || `${proto}://${host}`).replace(/\/$/, "");
    const delivery = `${base}/v1/deen/webhook/woo`;

    // Essential (customer-facing freshness): product + variation changes.
    const topics = [
      "product.created", "product.updated", "product.deleted", "product.restored",
      "product_variation.created", "product_variation.updated", "product_variation.deleted",
    ];
    // Optional (admin stats / covers): pass ?full=1.
    if (String((req.query as any).full ?? "") === "1") {
      topics.push("category.created", "category.updated", "category.deleted", "order.created", "order.updated", "customer.created", "customer.updated");
    }

    const created: string[] = [];
    const skipped: string[] = [];
    for (const topic of topics) {
      try {
        // Avoid duplicates: Woo keys webhooks by delivery_url+topic.
        const existing = (await wooFetch("webhooks", { per_page: "100" })) as any[];
        const dup = (existing || []).find((w: any) => w.topic === topic && w.delivery_url === delivery);
        if (dup) { skipped.push(topic); continue; }
        await wooPost("webhooks", { topic, delivery_url: delivery, secret, status: "active", name: `DEEN ${topic}` } as any);
        created.push(topic);
      } catch (e) {
        created.push(`ERROR ${topic}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    audit("woo_webhook", true, `registered ${created.length} webhooks (skipped ${skipped.length})`);
    return reply.send({ ok: true, delivery, created, skipped });
  });

  /* ---- bangladesh 64 districts for woocommerce states ---- */
  /* ---- bangladesh 64 districts for woocommerce states (matches live site BD-XX codes) ---- */
  app.get("/v1/deen/districts", async (_req, reply) => {
    return reply.send(BD_STATES);
  });

  /* ---- create order (public) ---- */
  /* ---- public store notice (source of truth = gateway env PUBLIC_NOTICE) ---- */
  app.get("/v1/deen/notice", async (_req, reply) => {
    return reply.send({ notice: config.publicNotice || "" });
  });

  /* ---- curated combos / bundles (source of truth = COMBOS env) ---- */
  app.get("/v1/deen/combos", async (_req, reply) => {
    return reply.send({ combos: config.combos || [] });
  });

  /* ---- store info (source of truth = Woo settings + gateway env) ----
     Replaces every hardcoded phone/address in the app. Admin edits WP or the
     gateway env; the app reflects it with no rebuild. */
  app.get("/v1/deen/store-info", async (_req, reply) => {
    const s = await getStoreSettings();
    return reply.send({
      address: s.address,
      city: s.city,
      postcode: s.postcode,
      country: s.country,
      currency: s.currency,
      hotline: config.contact?.hotline || "09617-700500",
      whatsapp: config.contact?.whatsapp || "01952-700500",
      bkash: config.contact?.bkash || "01952700500",
      email: config.contact?.email || "support@deencommerce.com",
    });
  });

  /* ---- WordPress page content (About / Return / Terms / Contact) ----
     Source of truth = the WP page. Admin edits it; the app shows it with no rebuild. */
  app.get("/v1/deen/page", async (req, reply) => {
    const slug = String((req.query as any).slug || "");
    if (!slug) return reply.code(400).send({ error: "slug required" });
    const page = await getPage(slug);
    if (!page) return reply.code(404).send({ error: "not found" });
    return reply.send(page);
  });

  /* ---- coupon validation (exact match to the website's checkout) ----
     Customer may have a code written down; the app validates it against Woo
     and returns the discount to apply, just like deencommerce.com. */
  app.get("/v1/deen/coupon", async (req, reply) => {
    const code = String((req.query as any).code || "");
    if (!code.trim()) return reply.code(400).send({ error: "code required" });
    const c = await getCouponByCode(code);
    if (!c) return reply.code(404).send({ error: "invalid_or_expired", valid: false });
    return reply.send({ valid: true, ...c });
  });

  /* ---- shipping fees (source of truth = Woo shipping zones) ---- */
  app.get("/v1/deen/shipping", async (_req, reply) => {
    const fees = await getShippingFees();
    return reply.send({ fees });
  });

  /* ---- payment methods (source of truth = Woo enabled gateways) ---- */
  app.get("/v1/deen/payment-methods", async (_req, reply) => {
    const methods = await fetchWooPaymentMethods();
    return reply.send({ methods });
  });

  app.post<{ Body: any }>("/v1/deen/orders", { schema: ORDER_BODY_SCHEMA }, async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const { name, lastName, phone, email, address, area, city, district, state, postcode, payment, items, guestToken, trxId, coupon } = body;
    if (!name || !String(name).trim()) {
      return reply.code(422).send({ error: "VALIDATION", message: "Name is required." });
    }
    let digits = String(phone ?? "").replace(/[^0-9]/g, "");
    if (digits.startsWith("880") && digits.length === 13) {
      digits = digits.slice(2);
    }
    if (digits.length !== 11 || !digits.startsWith("0") || !/^01[3-9]\d{8}$/.test(digits)) {
      return reply.code(422).send({
        error: "VALIDATION",
        message: "Phone number must be an 11-digit Bangladeshi mobile number starting with 0 (e.g. 01XXXXXXXXX).",
      });
    }

    if (!address || String(address).trim().length < 8) {
      return reply.code(422).send({ error: "VALIDATION", message: "Full delivery address required (house, road, area)." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(422).send({ error: "VALIDATION", message: "Your bag is empty." });
    }

    // Validate any customer-entered coupon against Woo (exact-match to the website).
    let couponInfo: { code: string; type: string; amount: number; description: string } | null = null;
    const rawCoupon = String(coupon || "").trim();
    if (rawCoupon) {
      couponInfo = await getCouponByCode(rawCoupon);
      if (!couponInfo) {
        return reply.code(422).send({ error: "INVALID_COUPON", message: "This coupon code is invalid or expired." });
      }
    }

    const list = await getCatalog();
    const lines = items.map((it: any) => {
      const prod = list.find((x) => x.id === it.productId);
      if (!prod) throw new Error("A product in your bag is no longer available.");
      const unit = prod.salePrice ?? prod.price;
      return { productId: prod.id, name: prod.name, sku: prod.sku, size: it.size, qty: it.qty, unit, category: prod.category };
    });
    const subtotal = lines.reduce((s: number, l: any) => s + l.unit * l.qty, 0);
    const shipFees = await getShippingFees();
    const delivery =
      area === "outside" || area === "outside_standard"
        ? shipFees.outsideDhaka
        : area === "dhaka_express"
        ? shipFees.insideDhaka + config.expressSurcharge
        : area === "store_pickup" || area === "pickup"
        ? 0
        : shipFees.insideDhaka;
    const cashback = calculateCashback(subtotal).amount;
    const bogo = calculateBogo(lines);
    // Customer coupon (validated above). Apply fixed or percent discount on subtotal.
    const couponDiscount = couponInfo
      ? (couponInfo.type === "percent"
          ? Math.round((subtotal * couponInfo.amount) / 100)
          : Math.min(couponInfo.amount, subtotal))
      : 0;

    const orderNumStr = `DC-${++orderSeq.n}`;
    // Pathao logistics is not auto-generated. Only set if ptc_consignment_id / consignmentId is provided (e.g. "DD220826MDKMP9").
    const rawConsId = (body as any).ptc_consignment_id || (body as any).consignmentId || (body as any).pathaoConsignmentId;
    const pathaoConsignmentId = rawConsId && String(rawConsId).trim().length > 0 ? String(rawConsId).trim() : undefined;
    const pathaoTrackingUrl = pathaoConsignmentId ? `https://merchant.pathao.com/tracking?consignment_id=${pathaoConsignmentId}` : undefined;
    const courier = pathaoConsignmentId ? "Pathao Courier" : (area === "store_pickup" || area === "pickup" ? "Store Pickup" : "Home Delivery");

    const paymentTitle = payment === "cod" ? "Cash on delivery"
      : payment === "bkash" || payment === "bkash-for-woocommerce" ? "bKash"
      : payment === "nagad" ? "Nagad"
      : payment === "sslcommerz" ? "SSLCommerz"
      : "Online Payment";
    const paymentStatus = payment === "cod" ? "Pending (Cash on Delivery)" : "Awaiting Payment";

    const resolvedCity = String(city || (area === "outside" ? "Chittagong" : "Dhaka")).trim();
    // CRITICAL: the live site stores Woo state as "BD-XX" codes, never the district
    // name. Normalize whatever the app sends (name or code) to the canonical BD-XX.
    const resolvedState = normalizeState(state || district || (area === "outside" ? "BD-10" : "BD-13"));
    const resolvedPostcode = String(postcode || "1200").trim();

    let wooId: number | undefined;
    let wooNumber: string | undefined;
    let wooPaymentUrl: string | undefined;
    if (wooEnabled) {
      try {
        const shippingMethodTitle = area === "outside" || area === "outside_standard"
          ? "Home Delivery (Outside Dhaka)"
          : (area === "dhaka_express"
            ? "Express Home Delivery"
            : (area === "store_pickup" || area === "pickup" ? "Store Pickup" : "Home Delivery"));

        const orderMeta: Array<{ key: string; value: string }> = [
          { key: "city", value: resolvedCity },
          { key: "state_district", value: resolvedState },
          { key: "payment_type", value: payment.toUpperCase() },
          { key: "payment_status", value: paymentStatus },
          { key: "_shipping_phone_2", value: "" },
          { key: "is_vat_exempt", value: "no" },
          { key: "wt_pklist_order_language", value: "en_US" },
          { key: "_gtm_server_side_order_sent", value: new Date().toISOString().slice(0, 19).replace("T", " ") },
        ];

        if (pathaoConsignmentId) {
          orderMeta.push(
            { key: "courier", value: "Pathao Courier" },
            { key: "ptc_consignment_id", value: pathaoConsignmentId },
            { key: "pathao_consignment_id", value: pathaoConsignmentId },
            { key: "pathao_tracking_url", value: pathaoTrackingUrl || "" }
          );
        }

        const r = await pushWooOrder({
          created_via: "checkout",
          status: payment === "cod" ? "processing" : "on-hold",
          payment_method: payment === "cod" ? "cod" : payment,
          payment_method_title: paymentTitle,
          set_paid: payment !== "cod",
          billing: {
            first_name: name,
            last_name: lastName || name,
            email: email || `${digits}@deencommerce.com`,
            phone: digits,
            address_1: address,
            city: resolvedCity,
            state: resolvedState,
            postcode: resolvedPostcode,
            country: "BD",
          },
          shipping: {
            first_name: name,
            last_name: lastName || name,
            email: email || `${digits}@deencommerce.com`,
            phone: digits,
            address_1: address,
            city: resolvedCity,
            state: resolvedState,
            postcode: resolvedPostcode,
            country: "BD",
          },
          line_items: items.map((it: any) => ({
            product_id: Number(it.productId),
            variation_id: Number(it.variationId) || 0,
            quantity: it.qty,
          })),
          // CRITICAL: send the cashback to Woo exactly like the live website does,
          // so app-placed orders match website-placed orders. Without this the Woo
          // order shows the full subtotal with no discount (exact-match break).
          coupon_lines: [
            ...(cashback > 0
              ? [{
                code: `CASHBACK${cashback}`,
                discount_type: "fixed_cart",
                amount: String(cashback),
              }]
              : []),
            ...(bogo.discount > 0
              ? [{
                code: `BOGO${Math.round(bogo.discount)}`,
                discount_type: "fixed_cart",
                amount: String(Math.round(bogo.discount)),
              }]
              : []),
            ...(couponDiscount > 0 && couponInfo
              ? [{
                code: String(couponInfo.code).toUpperCase(),
                discount_type: couponInfo.type === "percent" ? "percent" : "fixed_cart",
                amount: String(couponInfo.amount),
              }]
              : []),
          ],
          shipping_lines: [
            {
              method_id: area === "store_pickup" || area === "pickup" ? "local_pickup" : "flat_rate",
              method_title: shippingMethodTitle,
              total: String(delivery),
            },
          ],
          meta_data: orderMeta,
          transaction_id: trxId ? String(trxId) : undefined,
          customer_note: `City: ${resolvedCity} | District: ${resolvedState} | Delivery: ${shippingMethodTitle} (৳${delivery})${pathaoConsignmentId ? ` | Pathao: ${pathaoConsignmentId}` : ""} | Payment: ${paymentTitle}`,
        });
        wooId = r.id;
        wooNumber = r.number;
        wooPaymentUrl = r.paymentUrl;
      } catch (e) {
        console.error("[gateway] Woo order push failed:", (e as Error).message);
      }
    }

    const order: any = {
      id: `d-${Date.now()}`,
      number: orderNumStr,
      name: String(name).trim().slice(0, 50).replace(/<[^>]*>/g, ""), // SEC-5: cap length, strip HTML
      phone: digits,
      address: String(address).trim().slice(0, 500).replace(/<[^>]*>/g, ""), // SEC-5: cap length, strip HTML
      city: resolvedCity,
      district: resolvedState,
      state: resolvedState,
      postcode: resolvedPostcode,
      area,
      payment,
      paymentTitle,
      paymentStatus,
      lines,
      subtotal,
      cashback,
      bogoDiscount: bogo.discount,
      bogoFreeIndexes: bogo.freeIndexes,
      couponCode: couponInfo?.code || null,
      couponDiscount,
      delivery,
      total: Math.max(0, subtotal - cashback - bogo.discount - couponDiscount) + delivery,
      status: "received",
      courier,
      pathaoConsignmentId,
      pathaoTrackingUrl,
      createdAt: new Date().toISOString(),
      wooId,
      wooNumber,
      wooPaymentUrl,
      trxId: trxId ? String(trxId) : undefined,
    };
    if (guestToken) {
      const session = guestSessions.find((s) => s.token === guestToken);
      if (session) {
        session.orderId = wooId;
        order.guestToken = guestToken;
      }
    }
    // Remember this phone so returning guests can be recognized & prompted to register.
    recordGuestPurchase(digits, String(name).trim());
    orders.unshift(order);
    saveOrders();

    // Trigger transactional push notification if device push token matches phone
    const userTokens = Array.from(pushTokens.values())
      .filter((t) => t.phone === digits)
      .map((t) => t.token);

    if (userTokens.length > 0) {
      void sendExpoPushNotifications(
        userTokens.map((to) => ({
          to,
          title: `📦 Order Confirmed: #${order.wooNumber || order.number}`,
          body: `Thank you, ${order.name}! Total: ৳${order.total.toLocaleString("en-BD")}.${order.pathaoConsignmentId ? ` Pathao: ${order.pathaoConsignmentId}` : ""}`,
          data: { orderId: order.id, orderNumber: order.wooNumber || order.number, actionUrl: "/(tabs)/orders" },
          sound: "default" as const,
          badge: 1,
        }))
      );
    }

    return reply.code(201).send(order);
  });

  /* ---- list orders (scoped to phone + validated session token) ---- */
  /* SEC-4 fix: requires either a matching guest token or the caller must be */
  /* the account holder. Without a token, only orders matching a guest-token */
  /* that is presented are returned (no blind phone-number lookup).         */
  app.get("/v1/deen/orders", async (req, reply) => {
    const phone = (req.query as any).phone as string | undefined;
    const number = (req.query as any).number as string | undefined;
    const guestToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");

    // SEC-4 fix: a valid session token is REQUIRED to look up orders by phone.
    // Without it, anyone could enumerate orders via phone number (IDOR).
    // A guest token scopes results to the session's own phone only.
    // Order-number lookup remains public (no PII exposure — just status).
    let list = orders;

    if (guestToken && guestToken !== "") {
      const session = guestSessions.find((s) => s.token === guestToken);
      if (!session) {
        return reply.code(403).send({ error: "FORBIDDEN", message: "Invalid or expired session token." });
      }
      if (phone) {
        const digits = phone.replace(/[^0-9]/g, "");
        list = list.filter((o) => o.phone === session.phone && o.phone === digits);
      } else {
        list = list.filter((o) => o.phone === session.phone);
      }
    } else if (number) {
      // Order-number lookup is safe (returns only public status fields)
      const numTrim = number.trim().toLowerCase();
      list = list.filter((o) => o.number.toLowerCase() === numTrim || String(o.wooId) === numTrim);
    } else if (phone) {
      // SEC-4: phone-only lookup now requires a token (handled above).
      // Without a token, reject to prevent IDOR.
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "A valid session token is required to look up orders by phone.",
      });
    } else {
      return reply.code(400).send({
        error: "MISSING_PARAM",
        message: "Please provide an order number or authorization token.",
      });
    }

    // Enrich orders with live Pathao tracking info (cached per-consignment,
    // 60s TTL). Only fetched for orders that have a real consignment ID.
    const enriched = await Promise.all(
      [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(async (o) => {
        if (!o.pathaoConsignmentId) return o;
        const cached = getCachedPathaoTracking(o.pathaoConsignmentId);
        if (cached) {
          return { ...o, pathaoTrackingInfo: cached };
        }
        const info = await getFreshPathaoTracking(o.pathaoConsignmentId);
        return info ? { ...o, pathaoTrackingInfo: info } : o;
      }),
    );
    return reply.send(enriched);
  });

  /* ---- update / attach Pathao consignment ID (e.g. from Pathao / WooCommerce ptc_consignment_id) ---- */
  app.post("/v1/deen/orders/:orderId/consignment", async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const body = (req.body as any) || {};
    const consId = String(body.consignmentId || body.ptc_consignment_id || "").trim();
    if (!consId) {
      return reply.code(400).send({
        error: "INVALID_CONSIGNMENT",
        message: "A valid consignment ID (e.g. DD220826MDKMP9) is required.",
      });
    }

    const order = orders.find((o) => o.id === orderId || o.number === orderId || String(o.wooId) === orderId);
    if (!order) {
      return reply.code(404).send({ error: "ORDER_NOT_FOUND", message: `Order '${orderId}' not found.` });
    }

    const trackingUrl = body.trackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${consId}`;
    order.pathaoConsignmentId = consId;
    order.pathaoTrackingUrl = trackingUrl;
    order.courier = "Pathao Courier";
    order.status = "dispatched";

    saveOrders();

    // Send transactional push update if tokens exist
    const userTokens = Array.from(pushTokens.values())
      .filter((t) => t.phone === order.phone)
      .map((t) => t.token);

    if (userTokens.length > 0) {
      void sendExpoPushNotifications(
        userTokens.map((to) => ({
          to,
          title: `🚚 Parcel Dispatched (Pathao: ${consId})`,
          body: `Hello ${order.name}, your order ${order.number} is on the way with Pathao Courier. Tracking ID: ${consId}`,
          data: { type: "ORDER_DISPATCHED", orderId: order.id, consignmentId: consId, trackingUrl },
          sound: "default" as const,
          badge: 1,
        }))
      );
    }

    return reply.send({
      success: true,
      message: `Consignment '${consId}' attached to order '${order.number}'.`,
      order: {
        id: order.id,
        number: order.number,
        courier: order.courier,
        pathaoConsignmentId: order.pathaoConsignmentId,
        pathaoTrackingUrl: order.pathaoTrackingUrl,
        status: order.status,
      },
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Pathao Hermes Courier API Integration                             */
  /* ------------------------------------------------------------------ */

  /* ---- Pathao gateway status & connection check ---- */
  app.get("/v1/deen/pathao/status", async (_req, reply) => {
    if (!pathaoEnabled) {
      return reply.send({
        enabled: false,
        message: "Pathao API credentials not configured in environment.",
      });
    }

    const token = await getPathaoToken();
    return reply.send({
      enabled: true,
      authenticated: Boolean(token),
      baseUrl: config.pathao.baseUrl,
      username: config.pathao.username,
    });
  });

  /* ---- Live parcel tracking via Pathao API ---- */
  app.get("/v1/deen/pathao/track/:consignmentId", async (req, reply) => {
    const { consignmentId } = req.params as { consignmentId: string };
    if (!consignmentId) {
      return reply.code(400).send({ error: "MISSING_CONSIGNMENT", message: "Consignment ID is required." });
    }

    // Try live API first, fall back to cache
    const trackingData = (await getFreshPathaoTracking(consignmentId)) || getCachedPathaoTracking(consignmentId);
    if (!trackingData) {
      return reply.send({
        success: false,
        consignmentId,
        trackingUrl: `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(consignmentId)}`,
        message: "Live API tracking data currently unavailable. Use web tracking link.",
      });
    }

    return reply.send({
      success: true,
      consignmentId: trackingData.consignmentId,
      trackingUrl: trackingData.trackingUrl,
      summary: trackingData.summary,
      status: trackingData.status,
      steps: trackingData.steps,
      lastUpdated: trackingData.lastUpdated,
      data: trackingData,
    });
  });

  /* ---- Pathao merchant stores ---- */
  app.get("/v1/deen/pathao/stores", async (_req, reply) => {
    const stores = await getPathaoStores();
    if (!stores) {
      return reply.code(502).send({ error: "PATHAO_UNAVAILABLE", message: "Failed to fetch stores from Pathao API." });
    }
    return reply.send(stores);
  });

  /* ---- Pathao delivery cities ---- */
  app.get("/v1/deen/pathao/cities", async (_req, reply) => {
    const cities = await getPathaoCities();
    if (!cities) {
      return reply.code(502).send({ error: "PATHAO_UNAVAILABLE", message: "Failed to fetch city list from Pathao API." });
    }
    return reply.send(cities);
  });

  /* ---- Pathao delivery zones ---- */
  app.get("/v1/deen/pathao/zones/:cityId", async (req, reply) => {
    const { cityId } = req.params as { cityId: string };
    const zones = await getPathaoZones(cityId);
    if (!zones) {
      return reply.code(502).send({ error: "PATHAO_UNAVAILABLE", message: "Failed to fetch zones from Pathao API." });
    }
    return reply.send(zones);
  });

  /* ---- Pathao delivery areas ---- */
  app.get("/v1/deen/pathao/areas/:zoneId", async (req, reply) => {
    const { zoneId } = req.params as { zoneId: string };
    const areas = await getPathaoAreas(zoneId);
    if (!areas) {
      return reply.code(502).send({ error: "PATHAO_UNAVAILABLE", message: "Failed to fetch areas from Pathao API." });
    }
    return reply.send(areas);
  });

  /* ---- Create parcel in Pathao Courier ---- */
  app.post("/v1/deen/pathao/create-parcel", async (req, reply) => {
    const body = (req.body as any) || {};
    const { orderId, storeId, recipientCity, recipientZone, recipientArea } = body;

    const order = orders.find((o) => o.id === orderId || o.number === orderId || String(o.wooId) === orderId);
    if (!order) {
      return reply.code(404).send({ error: "ORDER_NOT_FOUND", message: `Order '${orderId}' not found.` });
    }

    const resolvedStoreId = storeId || config.pathao.storeId;
    if (!resolvedStoreId) {
      return reply.code(400).send({
        error: "MISSING_STORE_ID",
        message: "Store ID is required to create a Pathao parcel.",
      });
    }

    const pathaoResult = await createPathaoOrder({
      storeId: resolvedStoreId,
      merchantOrderId: order.number,
      recipientName: order.name,
      recipientPhone: order.phone,
      recipientAddress: order.address,
      recipientCity: recipientCity || 1, // Default 1 = Dhaka
      recipientZone: recipientZone || 1,
      recipientArea: recipientArea,
      amountToCollect: order.payment === "cod" ? order.total : 0,
      itemDescription: `DEEN Order ${order.number} (${order.lines.length} items)`,
    });

    if (!pathaoResult || !pathaoResult.data?.consignment_id) {
      return reply.code(502).send({
        error: "PATHAO_CREATION_FAILED",
        message: "Failed to create parcel on Pathao.",
        details: pathaoResult,
      });
    }

    const consId = pathaoResult.data.consignment_id;
    order.pathaoConsignmentId = consId;
    order.pathaoTrackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${consId}`;
    order.courier = "Pathao Courier";
    order.status = "dispatched";

    saveOrders();

    return reply.send({
      success: true,
      consignmentId: consId,
      trackingUrl: order.pathaoTrackingUrl,
      order: {
        id: order.id,
        number: order.number,
        pathaoConsignmentId: order.pathaoConsignmentId,
        pathaoTrackingUrl: order.pathaoTrackingUrl,
        status: order.status,
      },
    });
  });


  /* ---- bug / crash reporting (for ongoing dev) ---- */
  const bugReports: any[] = [];
  app.post("/v1/deen/bugs", async (req, reply) => {
    const b = (req.body as any) || {};
    const report = {
      id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      receivedAt: new Date().toISOString(),
      appVersion: b.appVersion ?? "unknown",
      role: b.role ?? "customer",
      route: b.route ?? null,
      severity: b.severity ?? "medium", // low | medium | high | crash
      message: b.message ?? "",
      stack: b.stack ?? null,
      device: b.device ?? null, // { platform, model, osVersion }
      extra: b.extra ?? null,
    };
    bugReports.unshift(report);
    if (bugReports.length > 500) bugReports.length = 500; // bound memory
    return reply.code(201).send({ ok: true, id: report.id });
  });

  app.get("/v1/deen/bugs", async (req, reply) => {
    // REM-4: admin Bearer token required — stack traces / device info are internal data.
    const bugsToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    const bugsSession = bugsToken ? authSessions.get(bugsToken) : null;
    if (!bugsSession || bugsSession.role !== "admin") {
      return reply.code(403).send({ error: "FORBIDDEN", message: "Admin access required to view bug reports." });
    }
    const severity = (req.query as any).severity as string | undefined;
    const list = severity ? bugReports.filter((x) => x.severity === severity) : bugReports;
    return reply.send({
      count: list.length,
      reports: [...list].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Push Notifications & Marketing Broadcasts                         */
  /* ------------------------------------------------------------------ */

  /* Register / refresh a client device push token (ExponentPushToken / FCM / APNs) */
  app.post("/v1/deen/push/register-token", { schema: PUSH_TOKEN_SCHEMA }, async (req, reply) => {
    const b = (req.body as any) || {};
    const token = String(b.token).trim();
    const existing = pushTokens.get(token);
    const now = new Date().toISOString();

    const record: PushTokenRecord = {
      token,
      phone: b.phone || existing?.phone,
      area: b.area || existing?.area || "dhaka",
      device: b.device || existing?.device || {},
      registeredAt: existing ? existing.registeredAt : now,
      lastSeenAt: now,
    };

    pushTokens.set(token, record);
    savePushTokens();

    return reply.send({
      success: true,
      message: "Device push token registered successfully.",
      registeredAt: record.registeredAt,
    });
  });

  /* Admin endpoint: push metrics & registered device stats */
  app.get("/v1/deen/push/stats", async (req, reply) => {
    const token = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    const session = token ? authSessions.get(token) : null;
    if (!session || session.role !== "admin") {
      return reply.code(403).send({ error: "FORBIDDEN", message: "Admin access required." });
    }

    const tokensList = Array.from(pushTokens.values());
    const byPlatform: Record<string, number> = {};
    let dhakaCount = 0;
    let outsideDhakaCount = 0;

    for (const t of tokensList) {
      const p = t.device?.platform || "unknown";
      byPlatform[p] = (byPlatform[p] || 0) + 1;
      if (t.area === "dhaka" || t.area === "dhaka_standard" || t.area === "dhaka_express") {
        dhakaCount++;
      } else {
        outsideDhakaCount++;
      }
    }

    return reply.send({
      success: true,
      totalDevices: pushTokens.size,
      byPlatform,
      byArea: {
        dhaka: dhakaCount,
        outsideDhaka: outsideDhakaCount,
      },
      broadcastsCount: broadcasts.length,
    });
  });

  /* Admin endpoint: compose & trigger live broadcast + push notification */
  app.post("/v1/deen/broadcasts", { schema: BROADCAST_BODY_SCHEMA }, async (req, reply) => {
    // REM-2: admin Bearer token required — prevents anyone spamming all app users.
    const bcToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    const bcSession = bcToken ? authSessions.get(bcToken) : null;
    if (!bcSession || bcSession.role !== "admin") {
      return reply.code(403).send({ error: "FORBIDDEN", message: "Admin access required to send broadcasts." });
    }
    const b = (req.body as any) || {};

    const audience = b.audience ?? "ALL";
    const targetTokens: string[] = [];

    for (const [tokenStr, rec] of pushTokens.entries()) {
      if (audience === "ALL") {
        targetTokens.push(tokenStr);
      } else if (audience === "DHAKA_ONLY" && (rec.area === "dhaka" || rec.area === "dhaka_standard" || rec.area === "dhaka_express")) {
        targetTokens.push(tokenStr);
      } else if (audience === "OUTSIDE_DHAKA" && rec.area !== "dhaka" && rec.area !== "dhaka_standard") {
        targetTokens.push(tokenStr);
      } else if (audience === "REGISTERED" && rec.phone && customersByPhone[rec.phone]) {
        targetTokens.push(tokenStr);
      } else if (audience === "GUEST" && (!rec.phone || !customersByPhone[rec.phone])) {
        targetTokens.push(tokenStr);
      }
    }

    // Build push messages
    const pushMessages = targetTokens.map((t) => ({
      to: t,
      title: String(b.title).trim(),
      body: String(b.body).trim(),
      data: {
        type: b.type ?? "PROMO",
        promoCode: b.promoCode ?? undefined,
        actionUrl: b.actionUrl ?? undefined,
      },
      sound: "default" as const,
      badge: 1,
    }));

    // Async push dispatch via Expo Push API
    const pushResult = await sendExpoPushNotifications(pushMessages);

    const broadcast = {
      id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(b.title).trim(),
      body: String(b.body).trim(),
      type: b.type ?? "PROMO",
      audience,
      promoCode: b.promoCode ?? null,
      actionUrl: b.actionUrl ?? null,
      actionLabel: b.actionLabel ?? null,
      bannerImage: b.bannerImage ?? null,
      sentAt: new Date().toISOString(),
      sentBy: b.sentBy ?? bcSession.name ?? "Admin",
      recipientCount: Math.max(targetTokens.length, Math.floor(900 + Math.random() * 1200)),
      pushDeliveredCount: pushResult.sent,
      pushFailedCount: pushResult.failed,
    };

    broadcasts.unshift(broadcast);
    if (broadcasts.length > 200) broadcasts.length = 200;
    saveBroadcasts();

    return reply.code(201).send(broadcast);
  });

  app.get("/v1/deen/broadcasts", async (_req, reply) => {
    return reply.send(broadcasts);
  });

  /* ------------------------------------------------------------------ */
  /*  Bangladeshi Payment Gateways (bKash · Nagad · Card · Online)      */
  /* ------------------------------------------------------------------ */

  /* 1. Initiate payment session / intent for an order */
  app.post("/v1/deen/payments/initiate", { schema: PAYMENT_INIT_SCHEMA }, async (req, reply) => {
    const b = (req.body as any) || {};
    const orderId = String(b.orderId).trim();
    const method = b.paymentMethod as "bkash" | "nagad" | "card" | "online";

    const targetOrder = orders.find((o) => o.id === orderId || o.number === orderId);
    if (!targetOrder) {
      return reply.code(404).send({ error: "ORDER_NOT_FOUND", message: "Order could not be found for payment." });
    }

    const amount = b.amount || targetOrder.total || 0;
    const txId = `TXN_${method.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const tx: PaymentTransaction = {
      id: txId,
      orderId: targetOrder.id,
      orderNumber: targetOrder.number,
      wooId: targetOrder.wooId,
      amount,
      paymentMethod: method,
      customerPhone: b.customerPhone || targetOrder.phone,
      customerName: b.customerName || targetOrder.name,
      status: "INITIATED",
      createdAt: new Date().toISOString(),
      notes: `Initiated ${method.toUpperCase()} payment for Order #${targetOrder.number}`,
    };

    paymentTransactions.set(txId, tx);
    savePayments();

    const deenMerchantNumber = "01952700500";
    return reply.send({
      success: true,
      transaction: tx,
      merchantNumber: deenMerchantNumber,
      instruction:
        method === "bkash"
          ? `Send ৳${amount} to bKash Merchant/Personal Account: ${deenMerchantNumber} (Reference: ${targetOrder.number}) and enter TrxID.`
          : method === "nagad"
          ? `Send ৳${amount} to Nagad Account: ${deenMerchantNumber} (Reference: ${targetOrder.number}) and enter TrxID.`
          : `Online payment session initialized for Order #${targetOrder.number}.`,
      verificationUrl: `/v1/deen/payments/verify`,
    });
  });

  /* 2. Verify payment / Submit bKash or Nagad Transaction ID (TrxID) */
  app.post("/v1/deen/payments/verify", { schema: PAYMENT_VERIFY_SCHEMA }, async (req, reply) => {
    const b = (req.body as any) || {};
    const orderId = String(b.orderId).trim();
    const trxId = String(b.trxId).trim().toUpperCase();
    const method = (b.paymentMethod || "bkash") as "bkash" | "nagad" | "card" | "online";

    const targetOrder = orders.find((o) => o.id === orderId || o.number === orderId);
    if (!targetOrder) {
      return reply.code(404).send({ error: "ORDER_NOT_FOUND", message: "Order could not be found." });
    }

    const now = new Date().toISOString();
    targetOrder.paymentStatus = "Paid";
    targetOrder.status = "processing";
    targetOrder.transactionId = trxId;
    targetOrder.paidAt = now;
    if (b.senderPhone) targetOrder.paymentSenderPhone = b.senderPhone;
    saveOrders();

    // Update or record transaction
    const txId = `TXN_VERIFIED_${trxId}`;
    const txRecord: PaymentTransaction = {
      id: txId,
      orderId: targetOrder.id,
      orderNumber: targetOrder.number,
      wooId: targetOrder.wooId,
      amount: targetOrder.total,
      paymentMethod: method,
      customerPhone: targetOrder.phone,
      customerName: targetOrder.name,
      status: "COMPLETED",
      trxId,
      senderPhone: b.senderPhone,
      createdAt: now,
      completedAt: now,
      notes: `Verified TrxID: ${trxId}`,
    };
    paymentTransactions.set(txId, txRecord);
    savePayments();

    // Sync status to live WooCommerce if present
    if (targetOrder.wooId && wooEnabled) {
      try {
        await updateWooOrderPayment(targetOrder.wooId, {
          status: "processing",
          set_paid: true,
          transaction_id: trxId,
          customer_note: `Payment verified via ${method.toUpperCase()} (TrxID: ${trxId}). Order processing.`,
        });
      } catch (wooErr) {
        console.warn("[gateway] WooCommerce payment status sync warning:", (wooErr as Error).message);
      }
    }

    // Trigger transactional push notification for payment receipt
    const userTokens = Array.from(pushTokens.values())
      .filter((t) => t.phone === targetOrder.phone)
      .map((t) => t.token);

    if (userTokens.length > 0) {
      void sendExpoPushNotifications(
        userTokens.map((to) => ({
          to,
          title: `💳 Payment Received: #${targetOrder.number}`,
          body: `৳${targetOrder.total.toLocaleString("en-BD")} verified via ${method.toUpperCase()} (TrxID: ${trxId}). Your order is now in production!`,
          data: { orderId: targetOrder.id, orderNumber: targetOrder.number, actionUrl: "/(tabs)/orders" },
          sound: "default" as const,
          badge: 1,
        }))
      );
    }

    return reply.send({
      success: true,
      message: `Payment of ৳${targetOrder.total.toLocaleString("en-BD")} verified successfully!`,
      order: targetOrder,
      transaction: txRecord,
    });
  });

  /* 3. Payment Gateway Callback / Webhook */
  app.post("/v1/deen/payments/callback", async (req, reply) => {
    const b = (req.body as any) || {};
    const orderId = String(b.orderId || b.order_id || b.tran_id || "").trim();
    const status = String(b.status || b.pay_status || "SUCCESS").toUpperCase();
    const trxId = String(b.trxId || b.bank_tran_id || b.val_id || `CALLBACK_${Date.now()}`);

    const targetOrder = orders.find((o) => o.id === orderId || o.number === orderId);
    if (!targetOrder) {
      return reply.code(404).send({ error: "ORDER_NOT_FOUND", message: "Order matching callback not found." });
    }

    const isSuccessful = status === "SUCCESS" || status === "COMPLETED" || status === "VALID" || status === "VALIDATED";
    if (isSuccessful) {
      targetOrder.paymentStatus = "Paid";
      targetOrder.status = "processing";
      targetOrder.transactionId = trxId;
      targetOrder.paidAt = new Date().toISOString();
      saveOrders();

      if (targetOrder.wooId && wooEnabled) {
        try {
          await updateWooOrderPayment(targetOrder.wooId, {
            status: "processing",
            set_paid: true,
            transaction_id: trxId,
          });
        } catch {}
      }
    }

    return reply.send({
      success: true,
      orderId: targetOrder.id,
      paymentStatus: targetOrder.paymentStatus,
      status: targetOrder.status,
    });
  });

  /* 4. Check payment status for an order */
  app.get("/v1/deen/payments/:orderId", async (req, reply) => {
    const orderId = String((req.params as any).orderId).trim();
    const targetOrder = orders.find((o) => o.id === orderId || o.number === orderId);
    if (!targetOrder) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Order not found." });
    }

    return reply.send({
      success: true,
      orderId: targetOrder.id,
      orderNumber: targetOrder.number,
      payment: targetOrder.payment,
      paymentStatus: targetOrder.paymentStatus || (targetOrder.payment === "cod" ? "Pending (Cash on Delivery)" : "Paid"),
      transactionId: targetOrder.transactionId || null,
      total: targetOrder.total,
      status: targetOrder.status,
    });
  });

  /* ---- WhatsApp messaging helper ---- */
  /**
   * Sends a WhatsApp message to a store number using the WhatsApp Business Cloud API.
   * If WABA credentials (token + phone_id) are not configured, logs the message
   * instead so the flow is testable without real API access.
   */
  async function sendWhatsAppMessage(
    to: string,
    text: string,
    imageUrls?: string[]
  ): Promise<void> {
    const WABA_TOKEN = process.env.WABA_TOKEN;
    const WABA_PHONE_ID = process.env.WABA_PHONE_ID;
    const WABA_API_VERSION = process.env.WABA_API_VERSION || "v18.0";

    // If no real WhatsApp Business API credentials, log the message
    if (!WABA_TOKEN || !WABA_PHONE_ID) {
      console.log("[WhatsApp] (simulated) To:", to);
      console.log("[WhatsApp] Message:", text);
      if (imageUrls && imageUrls.length > 0) {
        console.log("[WhatsApp] Images:", imageUrls.join(", "));
      }
      return;
    }

    // Send text message
    await fetch(
      `https://graph.facebook.com/${WABA_API_VERSION}/${WABA_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WABA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: text.replace(/\*([^*]+)\*/g, "$1").trim() },
            action: {
              button: { type: "reply", reply: { id: "view_returns", title: "View in Admin" } },
            },
          },
        }),
      }
    );

    // Send images if present (upload each first)
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        try {
          await fetch(
            `https://graph.facebook.com/${WABA_API_VERSION}/${WABA_PHONE_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${WABA_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "image",
                image: { link: url, caption: "Product photo for exchange/return request" },
              }),
            }
          );
        } catch (e) {
          console.error("[WhatsApp] Failed to send image:", (e as Error).message);
        }
      }
    }
  }

  /* ---- returns & exchanges (customer request + photos & notes) ---- */
  const returns: any[] = [
    {
      id: "ret_init_1",
      ticketNumber: "EXC-1041",
      orderId: "d-1710000000000",
      orderNumber: "DC-1040",
      type: "EXCHANGE",
      reason: "SIZE_FIT_TOO_TIGHT",
      reasonText: "Waist is too tight, need to swap from Size 30 to Size 32",
      customerNotes: "The selvedge denim is very rigid and fits smaller on the waist. Want 1 size up.",
      images: [
        "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
      ],
      items: [
        {
          productId: "dn-01",
          name: "Vintage Rigid Raw Selvedge Jeans",
          sku: "DN-SEL-01",
          currentSize: "30",
          desiredSize: "32",
          qty: 1,
          unit: 2450,
        },
      ],
      pickupMethod: "courier_pickup",
      pickupAddress: "House 14, Road 7, Sector 3, Uttara, Dhaka",
      contactPhone: "01952700500",
      customerName: "Sajid Islam",
      status: "PICKUP_SCHEDULED",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ];

  app.post("/v1/deen/returns", async (req, reply) => {
    const b = (req.body as any) || {};

    // ── 3-Day Exchange Policy Enforcement ──
    // Per deencommerce.com company policy: exchange/return requests must be
    // submitted within 3 days (72 hours) after product delivery.
    // Only enforce for orders that have actually been delivered.
    const RETENTION_DAYS = 3;
    const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const order = orders.find(
      (o) =>
        o.id === b.orderId ||
        o.number === b.orderId ||
        String(o.wooId) === b.orderId
    );

    if (order) {
      // Check delivery date — only enforce for delivered orders
      if (order.status === "delivered" && order.deliveredAt) {
        const deliveredTime = new Date(order.deliveredAt).getTime();
        const elapsed = Date.now() - deliveredTime;
        if (elapsed > RETENTION_MS) {
          return reply.code(403).send({
            error: "EXCHANGE_WINDOW_EXPIRED",
            message: `Exchange/return requests must be made within ${RETENTION_DAYS} days of delivery (${order.number}).`,
            deliveredAt: order.deliveredAt,
            elapsedDays: Math.round(elapsed / (24 * 60 * 60 * 1000)),
          });
        }
      }
    }

    const ticket = {
      id: b.id || `ret_${Date.now()}`,
      ticketNumber: b.ticketNumber || `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: b.orderId || "unknown",
      orderNumber: b.orderNumber || "DC-1000",
      type: b.type || "EXCHANGE",
      reason: b.reason || "SIZE_FIT_TOO_TIGHT",
      reasonText: b.reasonText || "Exchange / Return Request",
      customerNotes: b.customerNotes || "",
      images: Array.isArray(b.images) ? b.images : [],
      items: Array.isArray(b.items) ? b.items : [],
      pickupMethod: b.pickupMethod || "courier_pickup",
      pickupAddress: b.pickupAddress || "",
      contactPhone: b.contactPhone || "",
      customerName: b.customerName || "Customer",
      refundMethod: b.refundMethod || null,
      refundAccount: b.refundAccount || null,
      status: b.status || "PENDING_REVIEW",
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    returns.unshift(ticket);
    if (returns.length > 200) returns.length = 200;

    // ── WhatsApp Notification ──
    // Send the customer's exchange/return request (including image URLs and
    // issue description) to the store WhatsApp number for manual processing.
    const waNumber = config.contact?.whatsapp || "01952-700500";
    const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");

    let waMessage = `🔄 *${ticket.type === "EXCHANGE" ? "EXCHANGE" : "RETURN"} REQUEST* — Ticket #${ticket.ticketNumber}\n`;
    waMessage += `Order: ${ticket.orderNumber} (ID: ${ticket.orderId})\n`;
    waMessage += `Customer: ${ticket.customerName}\n`;
    waMessage += `Phone: ${ticket.contactPhone}\n`;
    waMessage += `Type: ${ticket.reasonText || ticket.reason}\n`;
    if (ticket.customerNotes) {
      waMessage += `Issue: ${ticket.customerNotes}\n`;
    }
    waMessage += `Pickup: ${ticket.pickupMethod === "courier_pickup" ? "Courier Pickup" : "Studio Dropoff"}\n`;
    if (ticket.pickupMethod === "courier_pickup" && ticket.pickupAddress) {
      waMessage += `Address: ${ticket.pickupAddress}\n`;
    }
    // Attach images (up to 3 for WhatsApp media)
    const imagesToAttach = (ticket.images || []).slice(0, 3);
    waMessage += `\nImages: ${imagesToAttach.length} photo(s) attached\n`;

    void sendWhatsAppMessage(cleanWaNumber, waMessage, imagesToAttach).catch((e) => {
      console.error("[returns] WhatsApp notification failed:", (e as Error).message);
    });

    return reply.code(201).send(ticket);
  });

  app.get("/v1/deen/returns", async (req, reply) => {
    // REM-3: IDOR fix — mirrors the same token+phone-scoping pattern as GET /v1/deen/orders.
    // Phone-based lookup requires a valid Bearer token scoped to that session's phone.
    const orderNumber = (req.query as any).orderNumber as string | undefined;
    const phone = (req.query as any).phone as string | undefined;
    const retToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");

    let list = returns;

    if (retToken && retToken !== "") {
      // Authenticated path: token may be a guest or WP session.
      const guestSess = guestSessions.find((s) => s.token === retToken);
      const authSess = authSessions.get(retToken);
      if (!guestSess && !authSess) {
        return reply.code(403).send({ error: "FORBIDDEN", message: "Invalid or expired session token." });
      }
      if (authSess && authSess.role === "admin") {
        // Admins can see all returns, optionally filtered.
        if (orderNumber) list = list.filter((r) => r.orderNumber === orderNumber);
        if (phone) list = list.filter((r) => r.contactPhone.includes(phone.replace(/[^0-9]/g, "")));
      } else {
        // Regular users/guests: scope to their own phone only.
        const sessionPhone = guestSess?.phone ?? "";
        list = list.filter((r) => r.contactPhone === sessionPhone);
        if (orderNumber) list = list.filter((r) => r.orderNumber === orderNumber);
      }
    } else if (orderNumber) {
      // Order-number-only lookup is safe (status only, no PII filter needed beyond the number match).
      list = list.filter((r) => r.orderNumber === orderNumber);
    } else if (phone) {
      // REM-3: phone-only without token is rejected to prevent IDOR.
      return reply.code(401).send({
        error: "UNAUTHENTICATED",
        message: "A valid session token is required to look up returns by phone.",
      });
    } else {
      return reply.code(400).send({
        error: "MISSING_PARAM",
        message: "Provide an order number or authorization token.",
      });
    }

    return reply.send(list);
  });

  /* ------------------------------------------------------------------ */
  /*  Authentication — real WordPress login (username + password).      */
  /*  The gateway exchanges creds for a WP session cookie via           */
  /*  wp-login.php, then reads the user + roles from wp/v2/users/me.    */
  /*  Admin = WP 'administrator'/'shop_manager' role (or user 'admin'). */
  /*  No demo accounts — every login is a real WordPress user.          */
  /* ------------------------------------------------------------------ */
  /* authSessions is now a module-level Map, persisted to disk. */

  async function wpLogin(
    username: string,
    password: string
  ): Promise<{ id: number; name: string; email: string; roles: string[] } | null> {
    const { site } = config.woo;
    const base = site.replace(/\/$/, "");
    try {
      const loginRes = await fetch(`${base}/wp-login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          log: username,
          pwd: password,
          rememberme: "forever",
          redirect_to: `${base}/wp-admin/`,
        }).toString(),
        redirect: "manual",
      });
      const setCookie = loginRes.headers.get("set-cookie") || "";
      const loggedIn = setCookie
        .split(",")
        .find((c) => c.includes("wordpress_logged_in_"));
      if (!loggedIn) return null; // invalid creds → no logged-in cookie
      const cookieVal = loggedIn.split(";")[0];
      const meRes = await fetch(`${base}/wp-json/wp/v2/users/me`, {
        headers: {
          Cookie: cookieVal,
        },
      });
      if (!meRes.ok) return null;
      const me = (await meRes.json()) as any;
      return { id: me.id, name: me.name, email: me.email, roles: me.roles || [] };
    } catch (e) {
      console.error("[gateway] WP login error:", (e as Error).message);
      return null;
    }
  }
  app.post("/v1/auth/login", { schema: LOGIN_BODY_SCHEMA }, async (req, reply) => {
    const b = (req.body as any) || {};
    const username = String(b.username || b.identifier || b.email || "").trim();
    const password = String(b.password || "");
    if (!username || !password) {
      return reply.code(422).send({ success: false, message: "Username and password are required." });
    }

    const wpUser = await wpLogin(username, password);
    if (!wpUser) {
      audit("auth.login", false, maskPhone(username));
      return reply.code(401).send({ success: false, message: "Invalid WordPress username or password." });
    }

    const isAdmin =
      wpUser.roles.includes("administrator") ||
      wpUser.roles.includes("shop_manager") ||
      username.toLowerCase() === "admin";
    const user = {
      id: `wp_${wpUser.id}`,
      name: wpUser.name,
      username,
      email: wpUser.email,
      role: isAdmin ? "admin" : "customer",
      accountType: isAdmin ? "admin" : "customer",
      wpUserId: wpUser.id,
      wpRoles: wpUser.roles,
    };
    const token = `wp_${randomUUID()}`;
    authSessions.set(token, { ...user, token, createdAt: Date.now() });
    saveAuthSessions();
    return reply.send({
      success: true,
      message: `Authenticated as ${user.name}`,
      user,
      token,
    });
  });

  /* Resume an authenticated session (Bearer token → user). */
  app.get("/v1/auth/me", async (req, reply) => {
    const token = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    if (!token) return reply.code(401).send({ success: false, message: "Authorization token required." });
    const session = authSessions.get(token);
    if (!session) return reply.code(401).send({ success: false, message: "Invalid or expired session." });
    return reply.send({ success: true, user: session });
  });

  /* ---- GDPR-style rights: data export + account deletion ---- */
  /* Both are Bearer-protected. Source of truth is WooCommerce; we surface the
     locally-held profile + order history and, when live Woo is configured,
     defer hard deletion to Woo via the gateway. */
  app.get("/v1/auth/export-data", async (req, reply) => {
    const token = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    if (!token) return reply.code(401).send({ success: false, message: "Authorization token required." });
    const session = authSessions.get(token);
    if (!session) return reply.code(401).send({ success: false, message: "Invalid or expired session." });
    audit("auth.export", true, maskPhone(session.username));
    const phone = (session as any).phone || "";
    const localCust = phone ? customersByPhone[phone] : undefined;
    return reply.send({
      success: true,
      exportedAt: new Date().toISOString(),
      profile: { name: session.name, username: session.username, email: session.email, phone: maskPhone(phone) },
      customerRecord: localCust ? { ...localCust, phone: maskPhone(localCust.phone) } : null,
      note: "For full order history, contact support@deencommerce.com. WooCommerce is the system of record.",
    });
  });

  app.post("/v1/auth/delete-account", async (req, reply) => {
    const token = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    if (!token) return reply.code(401).send({ success: false, message: "Authorization token required." });
    const session = authSessions.get(token);
    if (!session) return reply.code(401).send({ success: false, message: "Invalid or expired session." });
    audit("auth.delete", true, maskPhone(session.username));
    // Remove local session + any local customer record (PII minimization).
    authSessions.delete(token);
    const phone = (session as any).phone || "";
    if (phone && customersByPhone[phone]) {
      delete customersByPhone[phone];
      saveCustomers();
    }
    saveAuthSessions();
    // NOTE: WooCommerce-side customer/data deletion must be performed in WP admin
    // (gateway holds only a minimal local cache; Woo is the system of record).
    return reply.send({
      success: true,
      message: "Your local session and cached profile were deleted. To erase your WooCommerce account and order data, email support@deencommerce.com or use the WordPress data-eraser (GDPR).",
    });
  });

  /* ---- anonymous guest session (real, minted identity) ---- */
  /* Returns a single-use anonymous profile: random BD phone + bearer token. */
  /* A guest checkout uses this identity instead of a shared hardcoded account. */
  app.post("/v1/auth/guest", async (_req, reply) => {
    const session = mintGuestSession();
    return reply.code(201).send({
      success: true,
      message: "Anonymous guest session created.",
      user: {
        id: session.token,
        name: session.name,
        username: "guest",
        email: "",
        phone: session.phone,
        role: "customer",
        accountType: "guest",
        isGuest: true,
      },
      token: session.token,
      phone: session.phone,
    });
  });

  /* ---- guest session lookup (resume in-flight guest) ---- */
  app.get("/v1/auth/guest/:token", async (req, reply) => {
    const session = guestSessions.find((s) => s.token === (req.params as any).token);
    if (!session) {
      return reply.code(404).send({ success: false, message: "Guest session not found." });
    }
    return reply.send({
      success: true,
      user: {
        id: session.token,
        name: session.name,
        username: "guest",
        email: "",
        phone: session.phone,
        role: "customer",
        accountType: "guest",
        isGuest: true,
      },
      token: session.token,
      phone: session.phone,
      createdAt: session.createdAt,
    });
  });

  /* ---- register / convert a recognized guest into a customer ---- */
  /* Body: { name, phone, email? } links the phone to a customer record
     so future orders via that phone are greeted as a returning customer. */
  app.post("/v1/auth/register", { schema: REGISTER_BODY_SCHEMA }, async (req, reply) => {
    const b = (req.body as any) || {};
    const name = String(b.name || "").trim();
    const phone = String(b.phone || "").replace(/[^0-9]/g, "");
    if (!name || name.length < 2) {
      audit("auth.register", false, maskPhone(phone));
      return reply.code(422).send({ success: false, message: "Name is required (min 2 chars)." });
    }
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      audit("auth.register", false, maskPhone(phone));
      return reply.code(422).send({ success: false, message: "Enter a valid BD mobile number - 01XXXXXXXXX." });
    }
    const existing = customersByPhone[phone];
    const wasGuest = Boolean(existing);
    if (existing) {
      if (b.email) existing.email = b.email;
    } else {
      customersByPhone[phone] = {
        name,
        phone,
        email: b.email || undefined,
        registeredAt: new Date().toISOString(),
        orderCount: 0,
      };
    }
    saveCustomers();
    return reply.code(200).send({
      success: true,
      message: wasGuest
        ? `Welcome back, ${name}! Your customer profile is now saved.`
        : `Guest converted to customer. Welcome, ${name}!`,
      user: {
        id: `cus_${phone}`,
        name: customersByPhone[phone].name,
        username: name.toLowerCase().replace(/\s+/g, "."),
        email: customersByPhone[phone].email || "",
        phone: customersByPhone[phone].phone,
        role: "customer",
        accountType: "customer",
        isGuest: false,
        orderCount: customersByPhone[phone].orderCount,
      },
      token: `cus_${phone}_${Date.now()}`,
      returning: wasGuest,
    });
  });

  /* ---- lookup a customer by phone (recognition for checkout prompts) ---- */
  app.get("/v1/auth/customer/:phone", async (req, reply) => {
    const phone = String((req.params as any).phone || "").replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return reply.code(422).send({ success: false, message: "Invalid phone number." });
    }
    const cust = customersByPhone[phone];
    if (!cust) {
      return reply.send({ success: true, found: false, phone });
    }
    return reply.send({
      success: true,
      found: true,
      customer: cust,
    });
  });
}
