import { config } from "./config.js";
import type { DeenProduct, DeenCategory } from "./seed.js";

/* ------------------------------------------------------------------ */
/*  WooCommerce REST v3 client.                                        */
/*  The consumer key/secret live ONLY here (server-side).              */
/*  Falls back to seed data when keys are absent.                      */
/* ------------------------------------------------------------------ */

interface WooProduct {
  id: number;
  sku: string;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: string;
  stock_status?: string;
  average_rating?: string;
  rating_count?: number;
  categories: { name: string }[];
  images: { src: string }[];
  description?: string;
  short_description?: string;
  attributes?: { name: string; options?: string[] | string }[];
  meta_data?: { key: string; value: string }[];
}

/** Real product-type categories we surface in the shop (filters promo tags). */
const CATEGORY_WHITELIST: DeenCategory[] = [
  "JEANS",
  "PANJABI",
  "SHIRT",
  "T-SHIRT",
  "TROUSERS",
  "POLO",
  "ACCESSORIES",
];

function parseDiscountPct(cats: string[]): number {
  let pct = 0;
  for (const c of cats) {
    const m = /(\d+)\s*%\s*OFF/i.exec(c);
    if (m) pct = Math.max(pct, Number(m[1]));
  }
  return pct;
}

function mapCategory(cats: string[]): DeenCategory | "OTHER" {
  const upper = cats.map((c) => c.trim().toUpperCase());
  for (const c of CATEGORY_WHITELIST) {
    if (upper.includes(c)) return c;
  }
  // fallbacks for known aliases
  if (upper.some((c) => c.includes("SHIRT") && c.includes("CASUAL"))) return "SHIRT";
  if (upper.some((c) => c.includes("T-SHIRT") || c.includes("TEE"))) return "T-SHIRT";
  if (upper.some((c) => c.includes("PANJABI"))) return "PANJABI";
  if (upper.some((c) => c.includes("JEANS"))) return "JEANS";
  if (upper.some((c) => c.includes("TROUSER") || c.includes("CHINO"))) return "TROUSERS";
  if (upper.some((c) => c.includes("POLO"))) return "POLO";
  if (upper.some((c) => c.includes("ACCESS") || c.includes("BAG") || c.includes("BELT") || c.includes("WATER") || c.includes("MASK"))) return "ACCESSORIES";
  return "OTHER";
}

function getSizes(p: WooProduct): string[] {
  const attr = p.attributes?.find((a) => (a.name || "").toLowerCase().includes("size"));
  if (!attr) return ["OS"];
  const opts = attr.options;
  const raw = Array.isArray(opts) ? opts : [opts];
  return raw.map((o) => String(o).trim()).filter(Boolean);
}

function mapWooToDeen(p: WooProduct): DeenProduct | null {
  const catNames = p.categories.map((c) => c.name);
  const category = mapCategory(catNames);
  const sizes = getSizes(p);
  const pct = parseDiscountPct(catNames);
  const current = Number(p.price) || 0;
  const regular = p.regular_price ? Number(p.regular_price) : pct ? Math.round(current / (1 - pct / 100)) : undefined;
  const salePrice = p.on_sale && p.sale_price ? Number(p.sale_price) : p.on_sale ? current : undefined;
  const imgs = (p.images || []).map((i) => i.src).filter(Boolean);
  const fabric = p.meta_data?.find((m) => m.key.toLowerCase() === "fabric")?.value ?? "";
  return {
    id: String(p.id),
    sku: p.sku,
    name: p.name,
    category,
    price: current,
    salePrice,
    regularPrice: regular,
    salePct: pct,
    sizes,
    images: [imgs[0] ?? "", imgs[1] ?? imgs[0] ?? ""] as [string, string],
    gallery: imgs,
    fabric,
    stockStatus: (p.stock_status as DeenProduct["stockStatus"]) ?? "instock",
    rating: Number(p.average_rating) || 0,
    ratingCount: Number(p.rating_count) || 0,
    blurb: (p.short_description || p.description || "").replace(/<[^>]+>/g, "").slice(0, 220) ?? "",
  };
}

/* ----------------------------- caching ----------------------------- */
/* Woo rate-limits; cache the catalog for 5 min so stats + listings    */
/* are cheap after the first warm-up.                                  */
const CACHE_TTL_MS = 5 * 60 * 1000;
let catalogCache: { at: number; data: DeenProduct[] } | null = null;
let catalogWarming: Promise<DeenProduct[]> | null = null;
let coverCache: { at: number; data: Record<string, string> } | null = null;

export function wooHealthy(): boolean {
  return Boolean(config.woo.consumerKey && config.woo.consumerSecret);
}

/* --------------------- Woo resilience (R2) --------------------- */
/* Track last successful Woo contact so /health can report
   ok | degraded | down without a live call. */
let lastWooSuccessAt = 0;
let lastWooErrorAt = 0;
const WOO_DEGRADED_AFTER_MS = 5 * 60 * 1000; // no success in 5 min -> degraded

export function wooStatus(): "ok" | "degraded" | "down" {
  if (!wooHealthy()) return "down";
  if (lastWooSuccessAt === 0) return "ok"; // never tried (seed mode)
  const sinceSuccess = Date.now() - lastWooSuccessAt;
  if (sinceSuccess > WOO_DEGRADED_AFTER_MS) return "degraded";
  return "ok";
}

/* Circuit breaker: while "open", fail fast instead of hammering a struggling
   Woo. Opens after N consecutive failures, half-opens after a cooldown. */
let cbFailures = 0;
let cbOpenUntil = 0;
const CB_THRESHOLD = 5;
const CB_COOLDOWN_MS = 30_000;

export function wooFetchWithBreaker<T = any>(path: string, params: Record<string, string> = {}): Promise<T> {
  return wooFetchResilient<T>(path, params);
}

async function wooFetchResilient<T = any>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (Date.now() < cbOpenUntil) {
    throw new Error("Woo circuit breaker open — fast-failing to protect backend");
  }
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 8000;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Woo ${path} failed: ${res.status} ${body.slice(0, 120)}`);
      }
      const json = (await res.json()) as T;
      // success — reset breaker + record health
      lastWooSuccessAt = Date.now();
      cbFailures = 0;
      return json;
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      // Don't retry 4xx (auth/param errors) — only network/timeouts/5xx.
      if (!isAbort && err instanceof Error && /failed: [45]/.test(err.message)) {
        break;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
    }
  }
  // failure — trip breaker if needed
  lastWooErrorAt = Date.now();
  cbFailures += 1;
  if (cbFailures >= CB_THRESHOLD) {
    cbOpenUntil = Date.now() + CB_COOLDOWN_MS;
    cbFailures = 0;
  }
  throw lastErr instanceof Error ? lastErr : new Error("Woo fetch failed");
}

async function wooFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  return wooFetchResilient(path, params);
}

export async function fetchWooProducts(): Promise<DeenProduct[]> {
  if (catalogCache && Date.now() - catalogCache.at < CACHE_TTL_MS) return catalogCache.data;
  if (catalogWarming) return catalogWarming;

  catalogWarming = (async () => {
    const out: DeenProduct[] = [];
    const perPage = 100;
    for (let page = 1; page <= 10; page++) {
      const batch = (await wooFetch("products", { per_page: String(perPage), page: String(page) })) as WooProduct[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const p of batch) {
        const d = mapWooToDeen(p);
        if (d) out.push(d);
      }
      if (batch.length < perPage) break;
    }
    catalogCache = { at: Date.now(), data: out };
    catalogWarming = null;
    return out;
  })();

  try {
    return await catalogWarming;
  } catch (e) {
    catalogWarming = null;
    throw e;
  }
}

/** Per-product variations (real size → stock + price) for the detail screen. */
const variationCache = new Map<string, { at: number; data: { id: number; size: string; stock: string; price: number; regular: number }[] }>();
export async function fetchWooVariations(productId: string): Promise<
  { id: number; size: string; stock: string; price: number; regular: number }[]
> {
  const cached = variationCache.get(productId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
  const raw = (await wooFetch(`products/${productId}/variations`, { per_page: "50" })) as any[];
  const data = raw.map((v) => ({
    id: v.id,
    size: (v.attributes || []).map((a: any) => a.option).join(" ") || "OS",
    stock: v.stock_status ?? "instock",
    price: Number(v.price) || 0,
    regular: Number(v.regular_price) || 0,
  }));
  variationCache.set(productId, { at: Date.now(), data });
  return data;
}

/* ----------------------------- analytics --------------------------- */

export interface DeenStats {
  updatedAt: string;
  store: { totalProducts: number; onSale: number; outOfStock: number; avgPrice: number };
  sales: { period: string; totalSales: number; netSales: number; orders: number; items: number; newCustomers: number; shipping: number; series: { date: string; sales: number; orders: number; customers: number }[] };
  categories: { category: string; count: number }[];
  topSellers: { productId: number; name: string; itemsSold: number; revenue: number }[];
}

export async function fetchWooStats(): Promise<DeenStats> {
  const catalog = await fetchWooProducts();
  const salesReport = (await wooFetch("reports/sales", { period: "month" })) as any[];

  const today = new Date();
  const periodLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const latest = salesReport[salesReport.length - 1] ?? {};
  let totalSales = 0, netSales = 0, orders = 0, items = 0, newCustomers = 0, shipping = 0;
  const series: DeenStats["sales"]["series"] = [];
  for (const [date, v] of Object.entries<any>(latest.totals ?? {})) {
    totalSales += Number(v.sales) || 0;
    netSales += Number(v.net_sales ?? v.sales) || 0;
    orders += Number(v.orders) || 0;
    items += Number(v.items) || 0;
    newCustomers += Number(v.customers) || 0;
    shipping += Number(v.shipping) || 0;
    series.push({ date, sales: Number(v.sales) || 0, orders: Number(v.orders) || 0, customers: Number(v.customers) || 0 });
  }

  const catCounts = new Map<string, number>();
  let onSale = 0, outOfStock = 0, priceSum = 0;
  for (const p of catalog) {
    catCounts.set(p.category, (catCounts.get(p.category) ?? 0) + 1);
    if (p.salePrice) onSale++;
    if (p.stockStatus === "outofstock") outOfStock++;
    priceSum += p.price;
  }
  const categories = [...catCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

  // Top sellers: the live reports/products endpoint is often disabled; fall back
  // to a curated "best of" from the live catalog (highest discount + in stock).
  let topSellers: DeenStats["topSellers"] = [];
  try {
    const topReport = (await wooFetch("reports/products", { period: "month", per_page: "10" })) as any[];
    topSellers = (topReport || []).map((t) => ({
      productId: Number(t.product_id),
      name: String(t.product_name),
      itemsSold: Number(t.items_sold) || 0,
      revenue: Number(t.total) || 0,
    }));
  } catch {
    topSellers = catalog
      .filter((p) => p.stockStatus !== "outofstock")
      .sort((a, b) => (b.salePct ?? 0) - (a.salePct ?? 0))
      .slice(0, 8)
      .map((p) => ({ productId: Number(p.id), name: p.name, itemsSold: 0, revenue: 0 }));
  }

  return {
    updatedAt: new Date().toISOString(),
    store: { totalProducts: catalog.length, onSale, outOfStock, avgPrice: catalog.length ? Math.round(priceSum / catalog.length) : 0 },
    sales: { period: periodLabel, totalSales, netSales, orders, items, newCustomers, shipping, series },
    categories,
    topSellers,
  };
}

export async function fetchWooCategoryList(): Promise<{ category: string; count: number }[]> {
  const catalog = await fetchWooProducts();
  const catCounts = new Map<string, number>();
  for (const p of catalog) catCounts.set(p.category, (catCounts.get(p.category) ?? 0) + 1);
  return [...catCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

/**
 * Source of truth for category cover images: WooCommerce's
 * `products/categories` endpoint, which carries each category's real
 * WordPress media `image.src`. The app is a thin client — covers must
 * originate from Woo/WordPress, never hardcoded or third-party hosts.
 * Returns a map keyed by DeenCategory name -> cover image URL.
 */
export async function fetchWooCategoryImages(): Promise<Record<string, string>> {
  if (coverCache && Date.now() - coverCache.at < CACHE_TTL_MS) return coverCache.data;
  const out: Record<string, string> = {};
  if (!wooHealthy()) return out;
  try {
    const cats = (await wooFetch("products/categories", {
      per_page: "100",
      hide_empty: "false",
    })) as Array<{ name: string; image?: { src?: string } | null }>;
    for (const c of cats || []) {
      const mapped = mapCategory([c.name]);
      if (mapped === "OTHER") continue;
      const src = c.image?.src;
      if (src && !out[mapped]) out[mapped] = src;
    }
  } catch (e) {
    console.error("[woo] category images failed:", (e as Error).message);
  }
  coverCache = { at: Date.now(), data: out };
  return out;
}

export async function pushWooOrder(order: unknown): Promise<{ id: number }> {
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/orders`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    throw new Error(`Woo order create failed: ${r.status} ${errBody.slice(0, 200)}`);
  }
  return (await r.json()) as { id: number };
}

export async function updateWooOrderPayment(
  wooId: number,
  data: {
    status?: "processing" | "completed" | "on-hold" | "cancelled" | "failed";
    set_paid?: boolean;
    transaction_id?: string;
    customer_note?: string;
  }
): Promise<{ id: number; status: string }> {
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/orders/${wooId}`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  const r = await fetch(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    throw new Error(`Woo order update failed: ${r.status} ${errBody.slice(0, 200)}`);
  }
  return (await r.json()) as { id: number; status: string };
}


