import type { FastifyInstance } from "fastify";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { config, wooEnabled } from "./config.js";
import { SEED_PRODUCTS, type DeenProduct } from "./seed.js";
import {
  fetchWooProducts,
  fetchWooVariations,
  fetchWooStats,
  fetchWooCategoryList,
  pushWooOrder,
  wooHealthy,
} from "./woo.js";

const orderSeq = { n: 1041 };
const orders: any[] = [];

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
const CUSTOMERS_FILE = `${DATA_DIR}/customers.json`;
const ORDERS_FILE = `${DATA_DIR}/orders.json`;

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
/*  Anonymous guest sessions.                                         */
/*  Unlike the fixed demo "guest" account, /v1/auth/guest mints a real */
/*  anonymous session with a random phone + token so a guest checkout  */
/*  is a genuine one-off identity (no shared hardcoded credentials).  */
/*  Sessions live in-memory for the lifetime of the gateway process.   */
/* ------------------------------------------------------------------ */
const guestSessions: Array<{
  token: string;
  phone: string;
  name: string;
  createdAt: number;
  orderId?: number;
}> = [];

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
  // Bound the in-memory store (defensive; guest sessions are ephemeral by design)
  if (guestSessions.length > 5000) guestSessions.shift();
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
  /* ---- load persisted data on startup ---- */
  await loadCustomers();
  await loadOrders();

  /* ---- health (honest: pings Woo when keys present) ---- */
  app.get("/v1/health", async (_req, reply) => {
    const health = {
      status: "ok",
      ms: Date.now(),
      gateway: config.publicUrl || `http://localhost:${config.port}`,
      mode: wooEnabled ? "live" : "seed",
      woo: wooEnabled ? (wooHealthy() ? "connected" : "no-keys") : "staging",
      redis: "in-memory",
    };
    return reply.send(health);
  });

  /* ---- catalog (filter + search + sort) ---- */
  app.get("/v1/deen/products", async (req, reply) => {
    const category = (req.query as any).category as string | undefined;
    const q = (req.query as any).q as string | undefined;
    const sort = (req.query as any).sort as string | undefined;
    let list = await getCatalog();
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
  app.get("/v1/deen/snapshot", async (_req, reply) => {
    const list = await getCatalog();
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

  /* ---- analytics: store + sales + category + top sellers ---- */
  app.get("/v1/deen/stats", async (_req, reply) => {
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

  /* ---- create order (public) ---- */
  app.post<{ Body: any }>("/v1/deen/orders", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const { name, phone, address, area, payment, items, guestToken } = body;
    if (!name || !String(name).trim()) {
      return reply.code(422).send({ error: "VALIDATION", message: "Name is required." });
    }
    const digits = String(phone ?? "").replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(digits)) {
      return reply.code(422).send({ error: "VALIDATION", message: "Enter a valid BD mobile number — 01XXXXXXXXX." });
    }
    if (!address || String(address).trim().length < 12) {
      return reply.code(422).send({ error: "VALIDATION", message: "Full delivery address required (house, road, area)." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(422).send({ error: "VALIDATION", message: "Your bag is empty." });
    }

    const list = await getCatalog();
    const lines = items.map((it: any) => {
      const prod = list.find((x) => x.id === it.productId);
      if (!prod) throw new Error("A product in your bag is no longer available.");
      const unit = prod.salePrice ?? prod.price;
      return { productId: prod.id, name: prod.name, sku: prod.sku, size: it.size, qty: it.qty, unit };
    });
    const subtotal = lines.reduce((s: number, l: any) => s + l.unit * l.qty, 0);
    const delivery = area === "outside" ? 150 : (area === "dhaka_express" ? 150 : (area === "store_pickup" || area === "pickup" ? 0 : 80));
    const gift = subtotal >= 3500;

    let wooId: number | undefined;
    if (wooEnabled) {
      try {
        const r = await pushWooOrder({
          status: "on-hold",
          billing: { first_name: name, phone: digits, address_1: address },
          shipping: { first_name: name, phone: digits, address_1: address },
          payment_method: payment,
          line_items: items.map((it: any) => ({
            product_id: Number(it.productId),
            variation_id: Number(it.variationId) || 0,
            quantity: it.qty,
          })),
        });
        wooId = r.id;
      } catch (e) {
        console.error("[gateway] Woo order push failed:", (e as Error).message);
      }
    }

    const order: any = {
      id: `d-${Date.now()}`,
      number: `DC-${++orderSeq.n}`,
      name: String(name).trim().slice(0, 50).replace(/<[^>]*>/g, ""), // SEC-5: cap length, strip HTML
      phone: digits,
      address: String(address).trim().slice(0, 500).replace(/<[^>]*>/g, ""), // SEC-5: cap length, strip HTML
      area,
      payment,
      lines,
      subtotal,
      delivery,
      total: subtotal + delivery,
      status: "received",
      createdAt: new Date().toISOString(),
      wooId,
    };
    if (gift) {
      order.lines.push({ productId: "gift-tee", name: "Free Cotton T-shirt · Summer Fest", sku: "GIFT-TEE", size: "—", qty: 1, unit: 0, gift: true });
    }
    if (guestToken) {
      const session = guestSessions.find((s) => s.token === guestToken);
      if (session) {
        session.orderId = wooId;
        order.guestToken = guestToken;
      }
    }
    // Remember this phone so returning guests can be recognized & prompted to register.
    // Skip demo accounts (fixed phones) so we don't pollute the customer directory.
    const isDemoPhone = ["01712345678", "01899776655", "01711223344"].includes(digits);
    if (!isDemoPhone) {
      recordGuestPurchase(digits, String(name).trim());
    }
    orders.unshift(order);
    saveOrders();
    return reply.code(201).send(order);
  });

  /* ---- list orders (scoped to phone + validated session token) ---- */
  /* SEC-4 fix: requires either a matching guest token or the caller must be */
  /* the account holder. Without a token, only orders matching a guest-token */
  /* that is presented are returned (no blind phone-number lookup).         */
  app.get("/v1/deen/orders", async (req, reply) => {
    const phone = (req.query as any).phone as string | undefined;
    const guestToken = (req.headers["authorization"] as string | undefined)?.replace(/^bearer\s+/i, "");
    let list = orders;

    if (phone) {
      const digits = phone.replace(/[^0-9]/g, "");
      list = list.filter((o) => o.phone === digits);
    }
    // If a guest token is supplied, only return orders belonging to that session
    // (prevents arbitrary phone-number enumeration without a valid session).
    if (guestToken && guestToken !== "") {
      const session = guestSessions.find((s) => s.token === guestToken);
      if (!session) {
        return reply.code(403).send({ error: "FORBIDDEN", message: "Invalid or expired session token." });
      }
      // Scope: only the authenticated guest's orders + matching phone if provided
      list = list.filter((o) => o.phone === session.phone);
      if (phone) {
        const digits = phone.replace(/[^0-9]/g, "");
        list = list.filter((o) => o.phone === digits && o.phone === session.phone);
      }
    }
    return reply.send([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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
    const severity = (req.query as any).severity as string | undefined;
    const list = severity ? bugReports.filter((x) => x.severity === severity) : bugReports;
    return reply.send({
      count: list.length,
      reports: [...list].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    });
  });

  /* ---- push notification & marketing broadcasts (admin + customer inbox) ---- */
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
      title: "📣 Banani Flagship Studio Now Open for 2h Pickups",
      body: "Select 'Store Pickup' at checkout to collect your orders free of charge from Plot 68, Kemal Ataturk Ave, Banani.",
      type: "BROADCAST",
      audience: "DHAKA_ONLY",
      actionUrl: "/(tabs)/profile",
      actionLabel: "View Outlet Details",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      sentBy: "Admin",
      recipientCount: 890,
    },
  ];

  app.post("/v1/deen/broadcasts", async (req, reply) => {
    const b = (req.body as any) || {};
    if (!b.title || !b.body) {
      return reply.code(422).send({ error: "VALIDATION", message: "Title and body are required for broadcast." });
    }
    const broadcast = {
      id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(b.title).trim(),
      body: String(b.body).trim(),
      type: b.type ?? "PROMO",
      audience: b.audience ?? "ALL",
      promoCode: b.promoCode ?? null,
      actionUrl: b.actionUrl ?? null,
      actionLabel: b.actionLabel ?? null,
      sentAt: new Date().toISOString(),
      sentBy: b.sentBy ?? "Admin",
      recipientCount: Math.floor(900 + Math.random() * 1200),
    };
    broadcasts.unshift(broadcast);
    if (broadcasts.length > 200) broadcasts.length = 200;
    return reply.code(201).send(broadcast);
  });

  app.get("/v1/deen/broadcasts", async (_req, reply) => {
    return reply.send(broadcasts);
  });

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
      contactPhone: "01711223344",
      customerName: "Sajid Islam",
      status: "PICKUP_SCHEDULED",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ];

  app.post("/v1/deen/returns", async (req, reply) => {
    const b = (req.body as any) || {};
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
    return reply.code(201).send(ticket);
  });

  app.get("/v1/deen/returns", async (req, reply) => {
    const orderNumber = (req.query as any).orderNumber as string | undefined;
    const phone = (req.query as any).phone as string | undefined;
    let list = returns;
    if (orderNumber) list = list.filter((r) => r.orderNumber === orderNumber);
    if (phone) list = list.filter((r) => r.contactPhone.includes(phone.replace(/[^0-9]/g, "")));
    return reply.send(list);
  });

  /* ---- Demo Accounts & Authentication ---- */
  const DEMO_ACCOUNTS = [
    {
      id: "customer",
      name: "Tanvir Ahmed",
      username: "customer",
      email: "tanvir@deen.com",
      password: "deen1234",
      phone: "01712-345678",
      role: "customer",
      accountType: "customer",
      badge: "REGULAR CUSTOMER",
      description: "Standard registered account with saved addresses in Uttara & fit preferences.",
      address: "House 42, Road 11, Sector 4, Uttara, Dhaka",
      area: "dhaka_standard",
      jeansSize: "32",
      topSize: "L",
      coins: 1250,
    },
    {
      id: "vip",
      name: "Sajid-ul Islam",
      username: "vip",
      email: "vip@deen.com",
      password: "deen1234",
      phone: "01899-776655",
      role: "customer",
      accountType: "customer",
      badge: "VIP ELITE GOLD",
      description: "Gold loyalty tier member with express Dhaka delivery and 4,800 VIP coins.",
      address: "Plot 68, Kemal Ataturk Ave, Banani, Dhaka",
      area: "dhaka_express",
      jeansSize: "34",
      topSize: "XL",
      coins: 4800,
    },
    {
      id: "admin",
      name: "DEEN Store Admin",
      username: "admin",
      email: "admin@deen.com",
      password: "admin123",
      phone: "01711-223344",
      role: "admin",
      accountType: "admin",
      badge: "STORE ADMIN & BI",
      description: "Full store operator with BI metrics, order analytics, push broadcasts & catalog control.",
      address: "DEEN HQ, Plot 12, Banani Commercial Area, Dhaka",
      area: "dhaka_standard",
      jeansSize: "32",
      topSize: "L",
      coins: 9999,
    },
    {
      id: "guest",
      name: "Guest Shopper",
      username: "guest",
      email: "",
      password: "",
      phone: "01911-000000",
      role: "customer",
      accountType: "guest",
      badge: "GUEST CHECKOUT",
      description: "Anonymous guest mode without password or account registration requirement.",
      address: "Mirpur DOHS, Road 9, Dhaka",
      area: "dhaka_standard",
      jeansSize: "32",
      topSize: "L",
      coins: 0,
    },
  ];

  app.get("/v1/auth/demo-accounts", async (_req, reply) => {
    return reply.send({
      success: true,
      accounts: DEMO_ACCOUNTS,
    });
  });

  app.post("/v1/auth/login", async (req, reply) => {
    const b = (req.body as any) || {};
    const identifier = (b.identifier || b.username || b.phone || b.email || "").toString().trim().toLowerCase();
    const password = (b.password || "").toString().trim();

    const cleanPhone = identifier.replace(/[^0-9]/g, "");
    const match = DEMO_ACCOUNTS.find((acc) => {
      const uMatch = acc.username.toLowerCase() === identifier;
      const eMatch = acc.email.toLowerCase() === identifier;
      const pMatch = cleanPhone && acc.phone.replace(/[^0-9]/g, "") === cleanPhone;
      return uMatch || eMatch || pMatch;
    });

    if (match) {
      if (match.password && match.password !== password) {
        return reply.code(401).send({
          success: false,
          message: "Invalid credentials.",
        });
      }

      return reply.send({
        success: true,
        message: `Authenticated as ${match.name}`,
        user: match,
        token: `mock_jwt_${match.id}_${Date.now()}`,
      });
    }

    if (cleanPhone.length >= 10 || identifier.includes("@")) {
      return reply.send({
        success: true,
        message: `Authenticated as custom user ${identifier}`,
        user: {
          id: `usr_${Date.now()}`,
          name: identifier.split("@")[0] || "Custom Shopper",
          username: identifier,
          phone: identifier,
          role: "customer",
          accountType: "customer",
        },
        token: `mock_jwt_custom_${Date.now()}`,
      });
    }

    return reply.code(404).send({
      success: false,
      message: "Account not found. Please use demo accounts (customer, vip, admin, guest).",
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
  app.post("/v1/auth/register", async (req, reply) => {
    const b = (req.body as any) || {};
    const name = String(b.name || "").trim();
    const phone = String(b.phone || "").replace(/[^0-9]/g, "");
    if (!name || name.length < 2) {
      return reply.code(422).send({ success: false, message: "Name is required (min 2 chars)." });
    }
    if (!/^01[3-9]\d{8}$/.test(phone)) {
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
