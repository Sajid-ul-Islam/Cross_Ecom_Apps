import type { FastifyInstance } from "fastify";
import { config, wooEnabled } from "./config.js";
import { SEED_PRODUCTS, type DeenProduct } from "./seed.js";
import { fetchWooProducts, pushWooOrder } from "./woo.js";

/* ------------------------------------------------------------------ */
/*  Runtime state (gateway-side). Orders live here until Woo is live.  */
/* ------------------------------------------------------------------ */

let catalog: DeenProduct[] | null = null;
const orders: any[] = [];
const orderSeq = { n: 1041 };

async function getCatalog(): Promise<DeenProduct[]> {
  if (!wooEnabled) return SEED_PRODUCTS;
  if (catalog) return catalog;
  try {
    catalog = await fetchWooProducts();
  } catch (e) {
    console.error("[gateway] Woo products failed, using seed:", (e as Error).message);
    catalog = SEED_PRODUCTS;
  }
  return catalog;
}

export async function registerDeenRoutes(app: FastifyInstance) {
  /* ---- health (every app pings on boot) ---- */
  app.get("/v1/health", async (_req, reply) => {
    return reply.send({
      status: "ok",
      ms: Date.now(),
      gateway: config.publicUrl || `http://localhost:${config.port}`,
      mode: wooEnabled ? "live" : "seed",
      woo: wooEnabled ? "connected" : "staging",
      redis: "in-memory",
    });
  });

  /* ---- catalog (public) ---- */
  app.get("/v1/deen/products", async (req, reply) => {
    const category = (req.query as any).category as string | undefined;
    const q = (req.query as any).q as string | undefined;
    let list = await getCatalog();
    if (category && category !== "ALL") {
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
    return reply.send(list);
  });

  app.get("/v1/deen/products/:id", async (req, reply) => {
    const list = await getCatalog();
    const product = list.find((p) => p.id === (req.params as any).id);
    if (!product) return reply.code(404).send({ error: "NOT_FOUND", message: "Product not found." });
    return reply.send(product);
  });

  /* ---- create order (public) ---- */
  app.post<{ Body: any }>("/v1/deen/orders", async (req, reply) => {
    const body = req.body ?? {};
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

    // Push to Woo live store when keys present; otherwise keep gateway-side.
    let wooId: number | undefined;
    if (wooEnabled) {
      try {
        const r = await pushWooOrder({
          status: "on-hold",
          billing: { first_name: name, phone: digits, address_1: address },
          shipping: { first_name: name, phone: digits, address_1: address },
          payment_method: payment,
          line_items: items.map((it: any) => ({ product_id: Number(it.productId), quantity: it.qty, variation_id: 0 })),
        });
        wooId = r.id;
      } catch (e) {
        console.error("[gateway] Woo order push failed:", (e as Error).message);
      }
    }

    const order = {
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
}
