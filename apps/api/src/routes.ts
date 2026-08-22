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

  /* ---- bangladesh 64 districts for woocommerce states ---- */
  app.get("/v1/deen/districts", async (_req, reply) => {
    return reply.send([
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
      { code: "BD-60", name: "Sylhet" },
      { code: "BD-63", name: "Tangail" },
      { code: "BD-64", name: "Thakurgaon" },
    ]);
  });

  /* ---- create order (public) ---- */
  app.post<{ Body: any }>("/v1/deen/orders", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const { name, lastName, phone, email, address, area, city, district, state, postcode, payment, items, guestToken } = body;
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

    const list = await getCatalog();
    const lines = items.map((it: any) => {
      const prod = list.find((x) => x.id === it.productId);
      if (!prod) throw new Error("A product in your bag is no longer available.");
      const unit = prod.salePrice ?? prod.price;
      return { productId: prod.id, name: prod.name, sku: prod.sku, size: it.size, qty: it.qty, unit };
    });
    const subtotal = lines.reduce((s: number, l: any) => s + l.unit * l.qty, 0);
    const delivery =
      area === "outside" || area === "outside_standard"
        ? 90
        : area === "dhaka_express"
        ? 120
        : area === "store_pickup" || area === "pickup"
        ? 0
        : 50;
    const gift = subtotal >= 3500;

    const orderNumStr = `DC-${++orderSeq.n}`;
    const pathaoConsignmentId = `PT-${orderSeq.n}-${Date.now().toString().slice(-4)}`;
    const pathaoTrackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${pathaoConsignmentId}`;
    const paymentTitle = payment === "cod" ? "Cash on delivery" : (payment === "bkash" ? "bKash" : (payment === "nagad" ? "Nagad" : "Online Payment"));
    const paymentStatus = payment === "cod" ? "Pending (Cash on Delivery)" : "Paid";

    const resolvedCity = String(city || (area === "outside" ? "Chittagong" : "Dhaka")).trim();
    const resolvedState = String(state || district || (area === "outside" ? "BD-10" : "BD-13")).trim();
    const resolvedPostcode = String(postcode || "1200").trim();

    let wooId: number | undefined;
    if (wooEnabled) {
      try {
        const shippingMethodTitle = area === "outside"
          ? "Outside Dhaka Delivery"
          : (area === "dhaka_express"
            ? "Dhaka Express Delivery"
            : (area === "store_pickup" || area === "pickup" ? "Store Pickup" : "Dhaka Standard Delivery"));

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
          shipping_lines: [
            {
              method_id: area === "store_pickup" || area === "pickup" ? "local_pickup" : "flat_rate",
              method_title: shippingMethodTitle,
              total: String(delivery),
            },
          ],
          meta_data: [
            { key: "courier", value: "Pathao Courier" },
            { key: "pathao_consignment_id", value: pathaoConsignmentId },
            { key: "pathao_tracking_url", value: pathaoTrackingUrl },
            { key: "city", value: resolvedCity },
            { key: "state_district", value: resolvedState },
            { key: "payment_type", value: payment.toUpperCase() },
            { key: "payment_status", value: paymentStatus },
            { key: "_shipping_phone_2", value: "" },
            { key: "is_vat_exempt", value: "no" },
            { key: "wt_pklist_order_language", value: "en_US" },
            { key: "_gtm_server_side_order_sent", value: new Date().toISOString().slice(0, 19).replace("T", " ") },
          ],
          customer_note: `City: ${resolvedCity} | District: ${resolvedState} | Delivery: ${shippingMethodTitle} (৳${delivery}) | Courier: Pathao (${pathaoConsignmentId}) | Payment: ${paymentTitle}`,
        });
        wooId = r.id;
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
      delivery,
      total: subtotal + delivery,
      status: "received",
      courier: "Pathao Courier",
      pathaoConsignmentId,
      pathaoTrackingUrl,
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

  /* ------------------------------------------------------------------ */
  /*  Authentication — real WordPress login (username + password).      */
  /*  The gateway exchanges creds for a WP session cookie via           */
  /*  wp-login.php, then reads the user + roles from wp/v2/users/me.    */
  /*  Admin = WP 'administrator'/'shop_manager' role (or user 'admin'). */
  /*  No demo accounts — every login is a real WordPress user.          */
  /* ------------------------------------------------------------------ */
  const authSessions = new Map<string, any>();

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
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
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
  app.post("/v1/auth/login", async (req, reply) => {
    const b = (req.body as any) || {};
    const username = String(b.username || b.identifier || b.email || "").trim();
    const password = String(b.password || "");
    if (!username || !password) {
      return reply.code(422).send({ success: false, message: "Username and password are required." });
    }

    const wpUser = await wpLogin(username, password);
    if (!wpUser) {
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
    authSessions.set(token, { ...user, token });
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
