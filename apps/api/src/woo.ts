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
  images: {
    src: string;
    thumbnail?: string;
    woocommerce_single?: string;
    sizes?: string | Record<string, { source_url?: string }>;
  }[];
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

function getFit(p: WooProduct): string | undefined {
  // Fit is a WooCommerce product CATEGORY (e.g. "SLIM FIT", "REGULAR FIT", "STRAIGHT FIT"),
  // NOT a product attribute. Derive it from the category names (single source of truth).
  const fitCat = (p.categories || []).find((c) => /fit/i.test(c.name || ""));
  if (!fitCat) return undefined;
  const m = (fitCat.name || "").match(/(\w+)\s*fit/i);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : undefined;
}

function mapWooToDeen(p: WooProduct): DeenProduct | null {
  // Skip draft/pending products — customers should never see them
  if (p.status && p.status !== "publish" && p.status !== "private") return null;
  const catNames = p.categories.map((c) => c.name);
  const category = mapCategory(catNames);
  const sizes = getSizes(p);
  const pct = parseDiscountPct(catNames);
  const current = Number(p.price) || 0;
  const regular = p.regular_price ? Number(p.regular_price) : pct ? Math.round(current / (1 - pct / 100)) : undefined;
  const salePrice = p.on_sale && p.sale_price ? Number(p.sale_price) : p.on_sale ? current : undefined;
  // Pick the right Woo/WP size per surface. `src` = full original (heavy);
  // `thumbnail` = WP-generated small (grid), `woocommerce_single` = medium (PDP).
  // All three are Woo-sourced — we never host or generate images.
  const pickImg = (i: (typeof p.images)[number]) => ({
    full: i.src,
    single: i.woocommerce_single || i.src,
    thumb: i.thumbnail || i.woocommerce_single || i.src,
  });
  const picks = (p.images || []).map(pickImg).filter((x) => x.full);
  const imgs = [picks[0]?.full ?? "", picks[1]?.full ?? picks[0]?.full ?? ""] as [string, string];
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
    gallery: picks.map((x) => x.full),
    thumb: picks[0]?.thumb ?? imgs[0] ?? "",
    single: picks[0]?.single ?? imgs[0] ?? "",
    full: picks[0]?.full ?? imgs[0] ?? "",
    fabric,
    fit: getFit(p),
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

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 6000;
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
        const baseDelay = 200 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 150);
        await new Promise((r) => setTimeout(r, baseDelay + jitter));
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

export async function wooFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  return wooFetchResilient(path, params);
}

/** GET to the WordPress core REST API (wp/v2) — for pages, media, etc.
    Source of truth for CMS content (About / Return / Terms). */
export async function wpFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  if (Date.now() < cbOpenUntil) throw new Error("Woo circuit breaker open");
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wp/v2/${path}`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const MAX_RETRIES = 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`WP ${res.status}`);
      return (await res.json()) as any;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        const baseDelay = 200 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 100);
        await new Promise((r) => setTimeout(r, baseDelay + jitter));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("wpFetch failed");
}

/** POST to WooCommerce REST API (used by the webhook auto-provisioner). */
export async function wooPost<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
  if (Date.now() < cbOpenUntil) throw new Error("Woo circuit breaker open");
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/${path}`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  const MAX_RETRIES = 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const rb = await res.text().catch(() => "");
        throw new Error(`Woo POST ${path} failed: ${res.status} ${rb.slice(0, 120)}`);
      }
      lastWooSuccessAt = Date.now();
      cbFailures = 0;
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (err instanceof Error && /failed: [45]/.test(err.message)) break;
      if (attempt < MAX_RETRIES) {
        const baseDelay = 200 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 100);
        await new Promise((r) => setTimeout(r, baseDelay + jitter));
        continue;
      }
    }
  }
  lastWooErrorAt = Date.now();
  cbFailures += 1;
  if (cbFailures >= CB_THRESHOLD) cbOpenUntil = Date.now() + CB_COOLDOWN_MS;
  throw lastErr instanceof Error ? lastErr : new Error("Woo POST failed");
}

/* Invalidate the catalog cache (called by the Woo webhook when a product
   is created/updated/deleted). The next listing request re-fetches from Woo
   immediately, so price/discount/new-product changes show in seconds. */
export function invalidateCatalogCache(): void {
  catalogCache = null;
  catalogWarming = null;
}

/* Invalidate a single product's size/price variations (product_variation.* topics). */
export function invalidateVariationCache(productId?: string): void {
  if (productId) variationCache.delete(String(productId));
  else variationCache.clear();
}

/* Invalidate category covers (when a category image changes) + the derived stats. */
export function invalidateCoverCache(): void {
  coverCache = null;
}

export function invalidateStats(): void {
  // Stats are derived from the catalog + sales report; busting catalog is enough,
  // but we expose this for order/customer topics that change sales numbers.
  // (No separate stats cache today; left as a hook for future memoization.)
}

export async function fetchWooProducts(opts?: { status?: string }): Promise<DeenProduct[]> {
  // When fetching a specific status (e.g. admin wants drafts), bypass cache
  const statusFilter = opts?.status || "publish";
  if (!opts?.status && catalogCache && Date.now() - catalogCache.at < CACHE_TTL_MS) return catalogCache.data;
  if (!opts?.status && catalogWarming) return catalogWarming;

  const loader = async () => {
    const out: DeenProduct[] = [];
    const perPage = 100;
    for (let page = 1; page <= 10; page++) {
      const batch = (await wooFetch("products", { status: statusFilter, per_page: String(perPage), page: String(page) })) as WooProduct[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const p of batch) {
        const d = mapWooToDeen(p);
        if (d) out.push(d);
      }
      if (batch.length < perPage) break;
    }
    return out;
  };

  // For default (publish-only) calls, use shared cache
  if (!opts?.status) {
    catalogWarming = loader();
    try {
      const result = await catalogWarming;
      catalogCache = { at: Date.now(), data: result };
      catalogWarming = null;
      return result;
    } catch (e) {
      catalogWarming = null;
      throw e;
    }
  }

  // Admin requested a specific status (draft, etc.) — no caching
  return loader();
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

export async function pushWooOrder(order: unknown): Promise<{ id: number; number: string; paymentUrl?: string }> {
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
  const j = (await r.json()) as { id: number; number?: string; payment_url?: string };
  // Woo's `number` is the human-facing order number (e.g. "1042").
  // `payment_url` is the hosted payment page (bKash/SSLCommerz) the customer
  // must open to actually pay — only present for non-COD gateways.
  return { id: j.id, number: String(j.number ?? j.id), paymentUrl: j.payment_url };
}

export interface DeenPaymentMethod {
  /** Woo gateway id, e.g. "cod", "bkash-for-woocommerce", "sslcommerz". Send this as `payment` when creating an order. */
  id: string;
  title: string;
  description: string;
  /** "cod" = pay on delivery (no redirect). "redirect" = open payment_url to pay (bKash/SSLCommerz). */
  type: "cod" | "redirect";
}

/** Source of truth: real, ENABLED payment gateways from WooCommerce.
    The app MUST render exactly these — never hardcode payment options. */
export async function fetchWooPaymentMethods(): Promise<DeenPaymentMethod[]> {
  if (!wooHealthy()) return [];
  const list = (await wooFetch("payment_gateways", { per_page: "50" })) as any[];
  const out: DeenPaymentMethod[] = [];
  for (const g of list || []) {
    if (!g.enabled) continue;
    const id = String(g.id || "");
    if (!id) continue;
    // Map known methods to a type the app understands.
    const type: "cod" | "redirect" = id === "cod" ? "cod" : "redirect";
    out.push({
      id,
      title: String(g.title || g.method_title || id),
      description: String(g.description || ""),
      type,
    });
  }
  return out;
}

/**
 * Source of truth for delivery fees = WooCommerce shipping zones.
 * Admin edits these in WP (WooCommerce → Settings → Shipping) and the app
 * reflects the change with NO app rebuild.
 * Returns the flat_rate cost for Inside Dhaka / Outside Dhaka (store pickup = 0).
 */
export interface ShippingFees {
  insideDhaka: number;
  outsideDhaka: number;
  storePickup: number; // always 0
}

export async function getShippingFees(): Promise<ShippingFees> {
  const fallback: ShippingFees = { insideDhaka: 50, outsideDhaka: 90, storePickup: 0 };
  if (!wooHealthy()) return fallback;
  try {
    const zones = (await wooFetch("shipping/zones", { per_page: "50" })) as any[];
    let insideDhaka = fallback.insideDhaka;
    let outsideDhaka = fallback.outsideDhaka;
    for (const z of zones || []) {
      const name = String(z.name || "").toLowerCase();
      const methods = (await wooFetch(`shipping/zones/${z.id}/methods`, { per_page: "50" })) as any[];
      const flat = (methods || []).find((m) => m.method_id === "flat_rate" && m.enabled !== false);
      const cost = flat?.settings?.cost?.value ?? flat?.settings?.cost?.default;
      const num = cost != null ? Number(String(cost).replace(/[^\d.]/g, "")) : NaN;
      if (isNaN(num)) continue;
      if (name.includes("inside dhaka") || name.includes("dhaka")) insideDhaka = num;
      else if (name.includes("outside")) outsideDhaka = num;
    }
    return { insideDhaka, outsideDhaka, storePickup: 0 };
  } catch {
    return fallback;
  }
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

/**
 * Find an existing WooCommerce order matching an idempotency key or customer phone.
 * Queries WooCommerce to reconcile orders across process restarts and gateway failovers.
 */
export async function findWooOrderByKey(
  idempotencyKey: string,
  phone?: string
): Promise<{ id: number; number: string; paymentUrl?: string; total?: number; status?: string } | null> {
  if (!wooHealthy() || (!idempotencyKey && !phone)) return null;
  try {
    const params: Record<string, string> = { per_page: "10" };
    if (phone) params.search = phone;
    const orders = (await wooFetch("orders", params)) as any[];
    if (Array.isArray(orders)) {
      for (const o of orders) {
        const meta = Array.isArray(o.meta_data) ? o.meta_data : [];
        const matchKey = meta.find(
          (m: any) =>
            (m.key === "_idempotency_key" && String(m.value) === String(idempotencyKey)) ||
            (m.key === "_natural_idempotency_key" && String(m.value) === String(idempotencyKey))
        );
        if (matchKey) {
          return {
            id: o.id,
            number: String(o.number || o.id),
            paymentUrl: o.payment_url,
            total: Number(o.total) || 0,
            status: o.status,
          };
        }
      }
    }
  } catch (e) {
    console.error("[woo] findWooOrderByKey failed:", (e as Error).message);
  }
  return null;
}

/**
 * Finds an existing WooCommerce customer by email or creates a new customer via WC REST API.
 * Attaches social provider ID in customer meta_data without touching WordPress core files.
 */
export async function findOrCreateWooCustomer(params: {
  email: string;
  name: string;
  provider: "google" | "facebook";
  providerId: string;
  avatarUrl?: string;
}): Promise<{ id: number; email: string; name: string; username: string; isNew: boolean }> {
  const { email, name, provider, providerId, avatarUrl } = params;
  const cleanEmail = email.trim().toLowerCase();

  if (wooHealthy()) {
    try {
      // 1. Search WooCommerce for existing customer by email
      const existing = (await wooFetch("customers", { email: cleanEmail, per_page: "1" })) as any[];
      if (Array.isArray(existing) && existing.length > 0) {
        const c = existing[0];
        return {
          id: c.id,
          email: c.email || cleanEmail,
          name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || name,
          username: c.username || cleanEmail.split("@")[0],
          isNew: false,
        };
      }

      // 2. Create new WooCommerce customer via REST API
      const parts = name.trim().split(" ");
      const firstName = parts[0] || name.trim() || "Customer";
      const lastName = parts.slice(1).join(" ") || "";
      const baseUsername = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

      const newCustomer = await wooPost("customers", {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        username,
        meta_data: [
          { key: `_social_${provider}_id`, value: providerId },
          { key: `_social_auth_provider`, value: provider },
          ...(avatarUrl ? [{ key: "_social_avatar_url", value: avatarUrl }] : []),
        ],
      });

      return {
        id: newCustomer.id,
        email: newCustomer.email || cleanEmail,
        name: `${newCustomer.first_name || firstName} ${newCustomer.last_name || lastName}`.trim(),
        username: newCustomer.username || username,
        isNew: true,
      };
    } catch (err) {
      console.error(`[woo] findOrCreateWooCustomer failed:`, (err as Error).message);
    }
  }

  // Fallback if WooCommerce is in seed/offline mode
  const fallbackId = Math.floor(5000 + Math.random() * 5000);
  return {
    id: fallbackId,
    email: cleanEmail,
    name,
    username: cleanEmail.split("@")[0],
    isNew: true,
  };
}

/* -------------------- WordPress / store sourcing -------------------- */

/** Store address + basic settings from Woo (WP source of truth).
    Admin edits these in WP → app reflects them with no rebuild. */
export async function getStoreSettings(): Promise<{
  address: string;
  city: string;
  postcode: string;
  country: string;
  currency: string;
}> {
  try {
    const settings = (await wooFetch("settings/general")) as Array<{ id: string; value: string }>;
    const pick = (id: string) => settings.find((s) => s.id === id)?.value ?? "";
    return {
      address: [pick("woocommerce_store_address"), pick("woocommerce_store_address_2")]
        .filter(Boolean)
        .join(", "),
      city: pick("woocommerce_store_city"),
      postcode: pick("woocommerce_store_postcode"),
      country: pick("woocommerce_default_country"),
      currency: pick("woocommerce_currency") || "BDT",
    };
  } catch {
    return { address: "", city: "", postcode: "", country: "BD", currency: "BDT" };
  }
}

/** A published WordPress page (About / Return / Terms / Contact), rendered HTML.
    Source of truth = WP. Admin edits the page → app updates with no rebuild. */
export async function getPage(slug: string): Promise<{ title: string; content: string } | null> {
  try {
    const pages = (await wpFetch(`pages?slug=${encodeURIComponent(slug)}&per_page=1&_fields=title,content`)) as Array<{
      title?: { rendered?: string };
      content?: { rendered?: string };
    }>;
    const p = pages[0];
    if (!p) return null;
    return {
      title: (p.title?.rendered || "").replace(/<[^>]+>/g, "").trim(),
      content: p.content?.rendered || "",
    };
  } catch {
    return null;
  }
}

/** Validate a coupon code against Woo (exact match to the website's behavior).
    Returns the discount to apply, or null if invalid/expired. Mirrors what the
    live site does when a customer enters a code at checkout. */
export async function getCouponByCode(code: string): Promise<{
  code: string;
  type: string;
  amount: number;
  description: string;
} | null> {
  const clean = String(code || "").trim();
  if (!clean) return null;
  try {
    const list = (await wooFetch(`coupons?code=${encodeURIComponent(clean)}&per_page=1`)) as Array<{
      code: string;
      discount_type: string;
      amount: string | number;
      description?: string;
      date_expires?: string | null;
    }>;
    const c = list.find((x) => x.code.toLowerCase() === clean.toLowerCase());
    if (!c) return null;
    // respect expiry
    if (c.date_expires) {
      const exp = new Date(c.date_expires).getTime();
      if (!isNaN(exp) && exp < Date.now()) return null;
    }
    return {
      code: c.code,
      type: c.discount_type,
      amount: Number(c.amount) || 0,
      description: c.description || "",
    };
  } catch {
    return null;
  }
}
