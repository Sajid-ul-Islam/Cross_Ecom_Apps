import type { FastifyInstance } from "fastify";
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
    const { name, phone, address, area, payment, items } = body;
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
    const delivery = area === "outside" ? 130 : 70;
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
      name: String(name).trim(),
      phone: digits,
      address: String(address).trim(),
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
    orders.unshift(order);
    return reply.code(201).send(order);
  });

  /* ---- list orders (public: by phone) ---- */
  app.get("/v1/deen/orders", async (req, reply) => {
    const phone = (req.query as any).phone as string | undefined;
    let list = orders;
    if (phone) {
      const digits = phone.replace(/[^0-9]/g, "");
      list = list.filter((o) => o.phone === digits);
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
}
