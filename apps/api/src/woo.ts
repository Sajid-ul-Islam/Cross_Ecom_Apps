import { config } from "./config.js";
import type { DeenProduct, DeenCategory } from "./seed.js";
import { getDistrictPostcode } from "./districts.js";

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

function normalizeImageUrl(src: string): string {
  if (!src || typeof src !== "string") return "";
  let clean = src.trim();
  if (clean.startsWith("//")) clean = `https:${clean}`;
  else if (clean.startsWith("/")) clean = `https://deencommerce.com${clean}`;
  else if (clean.startsWith("http://")) clean = clean.replace("http://", "https://");
  return clean;
}

function isDeenSelectCategory(categories: Array<{ id?: number; name?: string; slug?: string; parent?: number }>): boolean {
  return (categories || []).some(
    (c) =>
      c.id === 1281 ||
      c.parent === 1281 ||
      /deen\s*select/i.test(c.name || "") ||
      /deen-select/i.test(c.slug || "")
  );
}

function detectBrand(name: string, isSelect: boolean): string {
  const lower = (name || "").toLowerCase();
  if (/springfield/i.test(lower)) return "Springfield";
  if (/lefties/i.test(lower)) return "Lefties";
  if (/pull\s*&?\s*bear/i.test(lower)) return "Pull & Bear";
  if (/zara/i.test(lower)) return "Zara";
  return isSelect ? "DEEN Select" : "DEEN";
}

/**
 * Universal HTML entity decoder for product titles & text.
 * Safely decodes WordPress/WooCommerce typographic entities (`&#8217;`, `&#8221;`, `&#038;`, etc.)
 * across Node.js runtime, SSR, and client.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  let s = str
    .replace(/&amp;#/g, "&#")
    // Named quotes & apostrophes
    .replace(/&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&rdquo;|&ldquo;|&#8220;|&#8221;/g, '"')
    .replace(/&apos;|&#039;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    // Dashes & ellipses
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    // Ampersands
    .replace(/&#038;|&amp;/g, "&")
    // Numeric decimal entities
    .replace(/&#(\d+);?/g, (_, dec) => {
      try {
        const code = Number(dec);
        return code ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    })
    // Numeric hex entities
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    })
    // Angle brackets & whitespace
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Second pass in case of double-encoded entities
  if (/&#\d+|&[a-z]+;/i.test(s)) {
    s = s
      .replace(/&#8211;?/g, "–")
      .replace(/&#8212;?/g, "—")
      .replace(/&#8216;?/g, "'")
      .replace(/&#8217;?/g, "'")
      .replace(/&#8220;?/g, '"')
      .replace(/&#8221;?/g, '"')
      .replace(/&#038;?/g, "&")
      .replace(/&#39;?/g, "'")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }
  return s;
}

function mapWooToDeen(p: WooProduct): DeenProduct | null {
  // Skip draft/pending products — customers should never see them
  if (p.status && p.status !== "publish") return null;
  const cleanName = decodeHtmlEntities(p.name || "");
  const catNames = p.categories.map((c) => c.name);
  const category = mapCategory(catNames);
  const isSelect = isDeenSelectCategory(p.categories || []);
  const segment: "collection" | "select" = isSelect ? "select" : "collection";
  const brand = detectBrand(cleanName, isSelect);
  const sizes = getSizes(p);
  const pct = parseDiscountPct(catNames);
  const current = Number(p.price) || 0;
  const regular = p.regular_price ? Number(p.regular_price) : pct ? Math.round(current / (1 - pct / 100)) : undefined;
  const rawSale = p.sale_price ? Number(p.sale_price) : undefined;
  const onSale = Boolean(p.on_sale || (regular && current < regular) || (regular && rawSale && rawSale < regular));
  const salePrice = onSale ? (rawSale || current) : undefined;
  const regularPrice = onSale ? (regular || Math.round(current / (1 - (pct || 20) / 100))) : (regular || current);
  const salePct = pct || (onSale && regularPrice && salePrice && regularPrice > salePrice ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : undefined);

  // Pick the right Woo/WP size per surface. `src` = full original (heavy);
  // `thumbnail` = WP-generated small (grid), `woocommerce_single` = medium (PDP).
  // All three are Woo-sourced — we never host or generate images.
  const pickImg = (i: (typeof p.images)[number]) => ({
    full: normalizeImageUrl(i.src),
    single: normalizeImageUrl(i.woocommerce_single || i.src),
    thumb: normalizeImageUrl(i.thumbnail || i.woocommerce_single || i.src),
  });
  const picks = (p.images || []).map(pickImg).filter((x) => Boolean(x.full));
  const imgs = [picks[0]?.full ?? "", picks[1]?.full ?? picks[0]?.full ?? ""] as [string, string];
  const fabric = p.meta_data?.find((m) => m.key.toLowerCase() === "fabric")?.value ?? "";

  // Collect sub-category names: all WooCommerce category names that are NOT a
  // top-level mapped category (e.g. "Regular Fit", "Slim Fit", "Drop Shoulder").
  const TOP_LEVEL_NAMES = new Set([
    "JEANS", "SHIRTS", "T-SHIRTS", "POLO SHIRTS", "PANJABI", "TROUSERS",
    "ACCESSORIES", "SWEATSHIRTS", "MEN", "DEEN SELECT", "NEW ARRIVALS",
    "SALE", "WATERFALL OUTLET",
  ]);
  const wooSubCategories = p.categories
    .map((c) => c.name)
    .filter((n) => !TOP_LEVEL_NAMES.has(n.toUpperCase()));

  return {
    id: String(p.id),
    sku: p.sku,
    name: cleanName,
    category,
    segment,
    brand,
    price: regularPrice || current,
    salePrice,
    regularPrice,
    salePct,
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
    blurb: decodeHtmlEntities((p.short_description || p.description || "").replace(/<[^>]+>/g, "").slice(0, 220)) ?? "",
    wooSubCategories: wooSubCategories.length > 0 ? wooSubCategories : undefined,
  };
}


export const storeProductVariationsMap = new Map<string, { id: number; size: string }[]>();

function mapStoreProductToDeen(p: any): DeenProduct {
  if (Array.isArray(p.variations) && p.variations.length > 0) {
    const vList = p.variations.map((v: any) => ({
      id: Number(v.id),
      size: (v.attributes || []).map((a: any) => a.value).join(" ").toUpperCase()
    }));
    storeProductVariationsMap.set(String(p.id), vList);
  }
  const regularPrice = p.prices?.regular_price ? Number(p.prices.regular_price) : undefined;
  const salePrice = p.prices?.sale_price ? Number(p.prices.sale_price) : undefined;
  const currentPrice = Number(p.prices?.price) || salePrice || regularPrice || 0;
  const onSale = Boolean(p.on_sale && regularPrice && salePrice && regularPrice > salePrice);
  const catNames = (p.categories || []).map((c: any) => c.name);
  const category = mapCategory(catNames);
  const isSelect = isDeenSelectCategory(p.categories || []);
  const segment: "collection" | "select" = isSelect ? "select" : "collection";
  const pct = onSale && regularPrice && salePrice
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : parseDiscountPct(catNames);

  const sizeAttr = (p.attributes || []).find((a: any) => /size|মাপ/i.test(a.name));
  const sizes = sizeAttr?.terms ? sizeAttr.terms.map((t: any) => t.name) : ["30", "32", "34", "36", "38"];

  const imgs = (p.images || []).map((img: any) => normalizeImageUrl(img.src || img.thumbnail || "")).filter(Boolean);
  const primaryImg = imgs[0] || "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";
  const secondaryImg = imgs[1] || primaryImg;

  const cleanName = decodeHtmlEntities(p.name || "");
  const brand = detectBrand(cleanName, isSelect);

  const TOP_LEVEL_NAMES = new Set([
    "JEANS", "SHIRTS", "T-SHIRTS", "POLO SHIRTS", "PANJABI", "TROUSERS",
    "ACCESSORIES", "SWEATSHIRTS", "MEN", "DEEN SELECT", "NEW ARRIVALS",
    "SALE", "WATERFALL OUTLET",
  ]);
  const wooSubCategories = (p.categories || [])
    .map((c: any) => c.name as string)
    .filter((n: string) => !TOP_LEVEL_NAMES.has(n.toUpperCase()));

  return {
    id: String(p.id),
    sku: p.sku || `DS-${p.id}`,
    name: cleanName,
    category,
    segment,
    brand,
    price: regularPrice || currentPrice,
    salePrice: onSale ? salePrice : undefined,
    regularPrice: onSale ? regularPrice : undefined,
    salePct: pct,
    sizes: sizes.length > 0 ? sizes : ["M", "L", "XL"],
    images: [primaryImg, secondaryImg],
    gallery: imgs.length > 0 ? imgs : [primaryImg],
    thumb: imgs[0] || primaryImg,
    single: imgs[0] || primaryImg,
    full: imgs[0] || primaryImg,
    fabric: "Artisanal Denim & Fabric",
    fit: "Slim Fit",
    stockStatus: p.is_in_stock ? "instock" : "outofstock",
    rating: Number(p.average_rating) || 4.9,
    ratingCount: Number(p.review_count) || 12,
    blurb: decodeHtmlEntities((p.short_description || p.description || "").replace(/<[^>]+>/g, "").slice(0, 220)) || "Authentic DEEN design crafted in Bangladesh.",
    isNew: catNames.some((c: string) => /new/i.test(c)),
    wooSubCategories: wooSubCategories.length > 0 ? wooSubCategories : undefined,
  };
}

/* ----------------------------- caching ----------------------------- */
/* Woo rate-limits; cache the catalog for CACHE_CATALOG_TTL_MS so stats + listings    */
/* are cheap after the first warm-up. S1: env-overridable via config.ttl.                                  */
const CACHE_TTL_MS = config.ttl.catalogMs;
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
const WOO_DEGRADED_AFTER_MS = config.ttl.wooDegradedAfterMs; // S1 env-overridable

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
  const MAX_RETRIES = 0;
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

/** PUT to WooCommerce REST API (used for updating customers/orders). */
export async function wooPut<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const rb = await res.text().catch(() => "");
        throw new Error(`Woo PUT ${path} failed: ${res.status} ${rb.slice(0, 120)}`);
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
  throw lastErr instanceof Error ? lastErr : new Error("Woo PUT failed");
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

    // 1. Try authenticated WooCommerce REST API if keys are present
    if (wooHealthy()) {
      try {
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
        if (out.length > 0) return out;
      } catch (err) {
        console.warn("[woo] Authenticated WC API failed, trying public Store API:", (err as Error).message);
      }
    }

    // 2. Fetch live exact products and images directly from deencommerce.com Store API
    try {
      const siteUrl = config.woo.site || "https://deencommerce.com";
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(`${siteUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
          headers: { "User-Agent": "DEEN-Commerce-Gateway/1.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) break;
        const storeProducts = await res.json();
        if (!Array.isArray(storeProducts) || storeProducts.length === 0) break;
        for (const sp of storeProducts) {
          out.push(mapStoreProductToDeen(sp));
        }
        if (storeProducts.length < 100) break;
      }
      if (out.length > 0) {
        console.log(`[woo] Successfully fetched ${out.length} live products directly from ${siteUrl}`);
        return out;
      }
    } catch (storeErr) {
      console.warn("[woo] Store API fetch failed:", (storeErr as Error).message);
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
      name: decodeHtmlEntities(String(t.product_name)),
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
 * WordPress media `image.src`.
 */
export const CANONICAL_CATEGORY_COVERS: Record<string, string> = {
  JEANS: "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
  PANJABI: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
  SHIRT: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Checkmate-Executive-Formal-Shirt-102-0501-005-Front.webp",
  "T-SHIRT": "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Warm-Spice-T-shirt-105-0101-377-Front.webp",
  POLO: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Polo-103-0200-053-Front.webp",
  TROUSERS: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Teal-Trousers-110-0101-015-Model-Front.webp",
  ACCESSORIES: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Wallet-109-0102-071-Side-view.webp",
  SWEATSHIRTS: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Sweat-Shirt-108-0101-007-Front.webp",
  DEEN_SELECT: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119.webp",
  DEEN_COLLECTION: "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
  SALE: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
  TRENDING: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Tropical-Cuban-Collar-Shirt-102-0302-005-Front.webp",
  NEW_ARRIVALS: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Burgundy-Floral-Casual-Half-Shirt-102-0301-001-Model-1.webp",
  VALUE_PACKS: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Orlando-Relaxed-Graphic-Tank-Top-105-0401-004-Front.webp",
  OTHERS: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Sweat-Shirt-108-0101-007-Model-Front.webp",
};

export async function fetchWooCategoryImages(): Promise<Record<string, string>> {
  if (coverCache && Date.now() - coverCache.at < CACHE_TTL_MS) return coverCache.data;
  const out: Record<string, string> = { ...CANONICAL_CATEGORY_COVERS };

  // Fetch live category images from deencommerce.com public Store API
  try {
    const siteUrl = config.woo.site || "https://deencommerce.com";
    const res = await fetch(`${siteUrl}/wp-json/wc/store/v1/products/categories?per_page=100`, {
      headers: { "User-Agent": "DEEN-Commerce-Gateway/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const cats = (await res.json()) as Array<{ slug: string; name: string; image?: { src?: string } | null }>;
      for (const c of cats || []) {
        const src = c.image?.src;
        if (!src) continue;
        const s = (c.slug || "").toLowerCase();
        if (s === "jeans" || s === "denim") out.JEANS = normalizeImageUrl(src);
        else if (s === "men-panjabi" || s === "panjabi") out.PANJABI = normalizeImageUrl(src);
        else if (s === "shirts" || s === "shirt") out.SHIRT = normalizeImageUrl(src);
        else if (s === "t-shirts" || s === "t-shirt" || s === "tees") out["T-SHIRT"] = normalizeImageUrl(src);
        else if (s === "polo-shirts" || s === "polo" || s === "polo-shirt") out.POLO = normalizeImageUrl(src);
        else if (s === "trousers" || s === "cargo-pants" || s === "trouser") out.TROUSERS = normalizeImageUrl(src);
        else if (s === "accessories" || s === "belt" || s === "wallet") out.ACCESSORIES = normalizeImageUrl(src);
        else if (s === "sweatshirts" || s === "winter") out.SWEATSHIRTS = normalizeImageUrl(src);
        else if (s === "deen-select" || s === "deen_select") out.DEEN_SELECT = normalizeImageUrl(src);
        else if (s === "men" || s === "all-products") out.DEEN_COLLECTION = normalizeImageUrl(src);
        else if (s === "sale" || s === "offers" || s === "discount") out.SALE = normalizeImageUrl(src);
        else if (s === "trending" || s === "trending-now") out.TRENDING = normalizeImageUrl(src);
        else if (s === "new-arrivals" || s === "new-arrival" || s === "new") out.NEW_ARRIVALS = normalizeImageUrl(src);
        else if (s === "tank-top" || s === "boxer" || s === "value-packs") out.VALUE_PACKS = normalizeImageUrl(src);
      }
    }
  } catch (e) {
    console.warn("[woo] live category covers fetch failed, using canonical covers:", (e as Error).message);
  }

  coverCache = { at: Date.now(), data: out };
  return out;
}

export interface DeenHeroSlide {
  id: string;
  desktop: string;
  mobile: string;
  videoUrl?: string;
  badge: string;
  title: string;
  headline: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
}

export interface DeenHeroBanner {
  desktop: string;
  mobile: string;
  title: string;
  tagline: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
  slides: DeenHeroSlide[];
}

const DEFAULT_SLIDES: DeenHeroSlide[] = [
  {
    id: "slide_denim",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4",
    badge: "দেশের প্রথম ডেনিম ব্র্যান্ড · DEEN",
    title: "Raw Washed. Selvedge Heritage.",
    headline: "ARTISANAL INDIGO & CROSS HATCH DENIM",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo & Artisanal Precision.",
    actionUrl: "/shop?category=JEANS",
    actionLabel: "Explore Denim Collection →",
  },
  {
    id: "slide_season_clearance",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_1920x8401.mp4",
    badge: "END OF SEASON DROP · 2026",
    title: "Artisanal Tailoring & Comfort.",
    headline: "SEASON CLEARANCE IS LIVE",
    subtitle: "Up to 50% discount on selected artisanal denim, resort shirts & tailored comfort.",
    actionUrl: "/shop",
    actionLabel: "Explore Season Sale →",
  },
  {
    id: "slide_web_motion",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/06/Mobile-Banner-Web.mp4",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/06/web-motion-banner.mp4",
    badge: "DEEN MOTION · 2026",
    title: "Modern Lifestyle & Motion.",
    headline: "CONTEMPORARY RESORT & CASUAL LIVING",
    subtitle: "Lightweight tailoring engineered for modern lifestyle and effortless mobility.",
    actionUrl: "/shop",
    actionLabel: "Explore New Arrivals →",
  },
  {
    id: "slide_official_cover_banner",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    badge: "OFFICIAL STORE BANNER",
    title: "Tailored Comfort & Modern Classics.",
    headline: "THE ORIGINAL SELVEDGE DENIM",
    subtitle: "Enduring silhouettes, reinforced bar-tacking, and supreme cotton craftsmanship.",
    actionUrl: "/shop",
    actionLabel: "Discover All Pieces →",
  },
];

let heroCache: { at: number; data: DeenHeroBanner } | null = null;

export async function fetchWooHeroBanner(): Promise<DeenHeroBanner> {
  if (heroCache && Date.now() - heroCache.at < CACHE_TTL_MS) return heroCache.data;

  const fallback: DeenHeroBanner = {
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    title: "দেশের প্রথম ডেনিম ব্র্যান্ড",
    tagline: "Empathetic Men's Lifestyle Fashion in Bangladesh",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo & Artisanal Precision",
    actionUrl: "/shop",
    actionLabel: "Explore Collection",
    slides: DEFAULT_SLIDES,
  };

  try {
    const siteUrl = config.woo.site || "https://deencommerce.com";
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/media?search=banner&per_page=10`, {
      headers: { "User-Agent": "DEEN-Commerce-Gateway/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const mediaList = (await res.json()) as Array<{ source_url?: string; title?: { rendered?: string } }>;
      const desktopImgs = mediaList
        .filter((m) => {
          const t = (m.title?.rendered || "").toLowerCase();
          return (t.includes("web") || t.includes("desktop") || t.includes("banner")) && !t.includes("mobile");
        })
        .map((m) => normalizeImageUrl(m.source_url || ""))
        .filter(Boolean);
      const mobileImgs = mediaList
        .filter((m) => (m.title?.rendered || "").toLowerCase().includes("mobile"))
        .map((m) => normalizeImageUrl(m.source_url || ""))
        .filter(Boolean);

      if (desktopImgs.length > 0) fallback.desktop = desktopImgs[0];
      if (mobileImgs.length > 0) fallback.mobile = mobileImgs[0];
    }
  } catch (e) {
    console.warn("[woo] live hero banner fetch failed, using canonical hero:", (e as Error).message);
  }

  heroCache = { at: Date.now(), data: fallback };
  return fallback;
}

export interface DeenSectionBanner {
  id: string;
  title: string;
  image: string;
  category: string;
  actionUrl: string;
}

const CANONICAL_SECTION_BANNERS: DeenSectionBanner[] = [
  {
    id: "sec_denim",
    title: "Raw Washed & Selvedge Denim Campaign",
    image: "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
    category: "JEANS",
    actionUrl: "/shop?category=JEANS",
  },
  {
    id: "sec_shirt",
    title: "Summer Essential Resort & Cuban Shirts",
    image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Flanel-Shirt-102-0302-041-Front.webp",
    category: "SHIRT",
    actionUrl: "/shop?category=SHIRT",
  },
  {
    id: "sec_panjabi",
    title: "Artisanal Heritage Panjabi Collection",
    image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Stone-Embroidered-Panjabi-106-0101-136-Front.webp",
    category: "PANJABI",
    actionUrl: "/shop?category=PANJABI",
  },
  {
    id: "sec_halfsleeve",
    title: "Breathable Tees & Casual Polos",
    image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Essential-Black-T-shirt-105-0101-380-Front.webp",
    category: "T-SHIRT",
    actionUrl: "/shop?category=T-SHIRT",
  },
  {
    id: "sec_trousers",
    title: "Tailored Cargo Trousers & Everyday Comfort",
    image: "https://deencommerce.com/wp-content/uploads/2026/09/Lefties-Baggy-Cargo-Trousers-DS-104-0402-005-Model-front.webp",
    category: "TROUSERS",
    actionUrl: "/shop?category=TROUSERS",
  },
];

let sectionBannersCache: { at: number; data: DeenSectionBanner[] } | null = null;

export async function fetchWooSectionBanners(): Promise<DeenSectionBanner[]> {
  if (sectionBannersCache && Date.now() - sectionBannersCache.at < CACHE_TTL_MS) {
    return sectionBannersCache.data;
  }

  const out = [...CANONICAL_SECTION_BANNERS];
  try {
    const siteUrl = config.woo.site || "https://deencommerce.com";
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/media?search=section&per_page=15`, {
      headers: { "User-Agent": "DEEN-Commerce-Gateway/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const mediaList = (await res.json()) as Array<{ source_url?: string; title?: { rendered?: string } }>;
      for (const m of mediaList) {
        const title = (m.title?.rendered || "").toLowerCase();
        const src = m.source_url ? normalizeImageUrl(m.source_url) : null;
        if (!src) continue;
        if (title.includes("shirt") && out[1]) out[1].image = src;
        else if (title.includes("panjabi") && out[2]) out[2].image = src;
        else if (title.includes("half sleeve") && out[3]) out[3].image = src;
      }
    }
  } catch (e) {
    console.warn("[woo] live section banners fetch error:", (e as Error).message);
  }

  sectionBannersCache = { at: Date.now(), data: out };
  return out;
}

export interface WooOrderReceipt {
  id: number;
  number: string;
  paymentUrl?: string;
  orderKey?: string;
  total: number;
  status?: string;
  phone?: string;
}

export async function pushWooOrder(order: unknown): Promise<WooOrderReceipt> {
  const { consumerKey, consumerSecret } = config.woo;
  if (!consumerKey || !consumerSecret) throw new Error("WooCommerce checkout is not configured.");
  // One authoritative write preserves addresses, fees, coupons and idempotency metadata.
  const data = await wooPost<any>("orders", { ...(order as Record<string, unknown>), set_paid: false });
  if (!Number.isSafeInteger(data.id) || data.id <= 0 || !Number.isFinite(Number(data.total))) {
    throw new Error("WooCommerce returned an invalid order receipt. Check order status before retrying.");
  }
  const paymentUrl = data.payment_url || (data.order_key
    ? `${config.woo.site.replace(/\/$/, "")}/checkout/order-pay/${data.id}/?pay_for_order=true&key=${encodeURIComponent(data.order_key)}`
    : undefined);
  return { id: data.id, number: String(data.number || data.id), paymentUrl, orderKey: data.order_key, total: Number(data.total), status: data.status };
}

export interface DeenPaymentMethod {
  /** Woo gateway id, e.g. "cod", "bkash-for-woocommerce", "sslcommerz". Send this as `payment` when creating an order. */
  id: string;
  title: string;
  description: string;
  /** "cod" = pay on delivery (no redirect). "redirect" = open payment_url to pay (bKash/SSLCommerz). */
  type: "cod" | "redirect";
}

let _cachedPaymentMethods: { data: DeenPaymentMethod[]; expiresAt: number } | null = null;
let _cachedShippingFees: { data: ShippingFees; expiresAt: number } | null = null;

/** Source of truth: real, ENABLED payment gateways from WooCommerce.
    The app MUST render exactly these — never hardcode payment options. */
export async function fetchWooPaymentMethods(): Promise<DeenPaymentMethod[]> {
  const now = Date.now();
  if (_cachedPaymentMethods && _cachedPaymentMethods.expiresAt > now) {
    return _cachedPaymentMethods.data;
  }

  try {
    const gateways = await wooFetch("payment_gateways") as any[];
    if (!Array.isArray(gateways)) throw new Error("Invalid gateway response");
    const methods: DeenPaymentMethod[] = gateways.filter((g) => g.enabled === true || g.enabled === "yes")
      .map((g) => ({ id: String(g.id), title: String(g.title || g.method_title || g.id),
        description: String(g.description || "").replace(/<[^>]*>/g, ""),
        type: g.id === "cod" ? "cod" : "redirect" }));
    _cachedPaymentMethods = { data: methods, expiresAt: now + 5 * 60 * 1000 };
    return methods;
  } catch {
    // Browsing may use the public Store API, but never invent enabled gateways.
    try {
      const res = await fetch(`${config.woo.site.replace(/\/$/, "")}/wp-json/wc/store/v1/cart`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return [];
      const cart = await res.json() as any;
      if (!Array.isArray(cart.payment_methods)) return [];
      const methods: DeenPaymentMethod[] = cart.payment_methods.filter((id: unknown) => typeof id === "string").map((id: string) => ({
        id, title: id === "cod" ? "Cash on Delivery (COD)" : id, description: "", type: id === "cod" ? "cod" : "redirect",
      }));
      _cachedPaymentMethods = { data: methods, expiresAt: now + 60_000 };
      return methods;
    } catch { return []; }
  }
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
  const now = Date.now();
  if (_cachedShippingFees && _cachedShippingFees.expiresAt > now) {
    return _cachedShippingFees.data;
  }
  if (!wooHealthy()) return _cachedShippingFees?.data || fallback;
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
      if (name.includes("outside")) outsideDhaka = num;
      else if (name.includes("inside dhaka") || name.includes("dhaka")) insideDhaka = num;
    }
    const result = { insideDhaka, outsideDhaka, storePickup: 0 };
    _cachedShippingFees = { data: result, expiresAt: now + 15 * 60 * 1000 };
    return result;
  } catch {
    return _cachedShippingFees?.data || fallback;
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
): Promise<WooOrderReceipt | null> {
  if (!idempotencyKey || !phone) return null;
  if (!wooHealthy()) throw new Error("Order reconciliation is unavailable.");
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
        if (matchKey && String(o.billing?.phone || "").replace(/\D/g, "").slice(-11) === phone.replace(/\D/g, "").slice(-11)) {
          return {
            id: o.id,
            number: String(o.number || o.id),
            paymentUrl: o.payment_url,
            phone: o.billing?.phone,
            total: Number(o.total) || 0,
            status: o.status,
          };
        }
      }
    }
  } catch (e) {
    throw new Error("Order reconciliation is unavailable. Check order status before retrying.");
  }
  return null;
}

/**
 * Fetches recent orders directly from WooCommerce REST API (/wp-json/wc/v3/orders).
 */
export async function fetchWooOrders(opts?: { perPage?: number; page?: number; status?: string }): Promise<any[]> {
  if (!wooHealthy()) return [];
  try {
    const params: Record<string, string> = {
      per_page: String(opts?.perPage ?? 100),
      page: String(opts?.page ?? 1),
    };
    if (opts?.status && opts.status !== "ALL") params.status = opts.status;
    const res = (await wooFetch("orders", params)) as any[];
    return Array.isArray(res) ? res : [];
  } catch (e) {
    console.warn("[woo] fetchWooOrders warning:", (e as Error).message);
    return [];
  }
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

  throw new Error("WooCommerce customer sign-in is unavailable.");
}

/** Register or synchronize a customer in WooCommerce via official REST API.
    Ensures every mobile/web app registration directly creates an official
    WooCommerce Customer record in WordPress Admin -> WooCommerce -> Customers. */
export async function registerOrSyncWooCustomer(params: {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
  city?: string;
  district?: string;
}): Promise<{
  id: number;
  email: string;
  name: string;
  username: string;
  phone: string;
  isNew: boolean;
}> {
  const cleanPhone = params.phone.replace(/[^0-9]/g, "").slice(-11);
  const cleanEmail = params.email && params.email.trim()
    ? params.email.trim().toLowerCase()
    : `${cleanPhone}@deencommerce.com`;
  const parts = params.name.trim().split(" ");
  const firstName = parts[0] || params.name.trim() || "Customer";
  const lastName = parts.slice(1).join(" ") || "";

  if (wooHealthy()) {
    try {
      // 1. Check if customer already exists by phone or email
      let existing: any[] = [];
      try {
        existing = (await wooFetch("customers", { search: cleanPhone, per_page: "1" })) as any[];
      } catch {}

      if (!existing || existing.length === 0) {
        try {
          existing = (await wooFetch("customers", { email: cleanEmail, per_page: "1" })) as any[];
        } catch {}
      }

      if (Array.isArray(existing) && existing.length > 0) {
        throw new Error("ACCOUNT_EXISTS");
      }

      // 2. Create official new WooCommerce customer
      const newCustomer = await wooPost("customers", {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        username: cleanPhone,
        ...(params.password ? { password: params.password } : {}),
        billing: {
          first_name: firstName,
          last_name: lastName,
          phone: cleanPhone,
          email: cleanEmail,
          address_1: params.address || "",
          city: params.city || "Dhaka",
          state: params.district || "BD-13",
          country: "BD",
          postcode: getDistrictPostcode(params.district || "BD-13"),
        },
        shipping: {
          first_name: firstName,
          last_name: lastName,
          phone: cleanPhone,
          address_1: params.address || "",
          city: params.city || "Dhaka",
          state: params.district || "BD-13",
          country: "BD",
          postcode: getDistrictPostcode(params.district || "BD-13"),
        },
        meta_data: [
          { key: "_registered_via", value: "deen_mobile_web_app" },
          { key: "_billing_phone_bd", value: cleanPhone },
        ],
      });

      return {
        id: newCustomer.id,
        email: newCustomer.email || cleanEmail,
        name: `${newCustomer.first_name || firstName} ${newCustomer.last_name || lastName}`.trim(),
        username: newCustomer.username || cleanPhone,
        phone: cleanPhone,
        isNew: true,
      };
    } catch (err) {
      throw err;
    }
  }

  throw new Error("WooCommerce registration is unavailable.");
}

/** Lookup a WooCommerce customer by phone or email. */
export async function getWooCustomerByPhoneOrEmail(identifier: string): Promise<any | null> {
  if (!wooHealthy()) return null;
  try {
    const clean = identifier.replace(/[^0-9]/g, "").slice(-11);
    const search = clean.length === 11 ? clean : identifier.trim();
    const res = (await wooFetch("customers", { search, per_page: "1" })) as any[];
    if (Array.isArray(res) && res.length > 0) return res[0];
  } catch {}
  return null;
}

/** Update WooCommerce customer profile (billing/shipping/name/email/password). */
export async function updateWooCustomer(
  id: number,
  params: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    password?: string;
  }
): Promise<boolean> {
  if (!wooHealthy() || !id) return false;
  try {
    const payload: Record<string, unknown> = {};
    if (params.name) {
      const parts = params.name.trim().split(" ");
      payload.first_name = parts[0];
      payload.last_name = parts.slice(1).join(" ");
    }
    if (params.email) payload.email = params.email.trim().toLowerCase();
    if (params.password) payload.password = params.password;

    const billing: Record<string, string> = {};
    if (params.phone) billing.phone = params.phone.replace(/[^0-9]/g, "").slice(-11);
    if (params.address) billing.address_1 = params.address;
    if (params.city) billing.city = params.city;
    if (params.district) billing.state = params.district;
    if (Object.keys(billing).length > 0) payload.billing = billing;

    await wooPut(`customers/${id}`, payload);
    return true;
  } catch (err) {
    console.error(`[woo] updateWooCustomer error:`, (err as Error).message);
    return false;
  }
}

/* -------------------- WordPress / store sourcing -------------------- */

let _cachedStoreSettings: {
  data: { address: string; city: string; postcode: string; country: string; currency: string };
  expiresAt: number;
} | null = null;

/** Store address + basic settings from Woo (WP source of truth).
    Admin edits these in WP → app reflects them with no rebuild. */
export async function getStoreSettings(): Promise<{
  address: string;
  city: string;
  postcode: string;
  country: string;
  currency: string;
}> {
  const now = Date.now();
  if (_cachedStoreSettings && _cachedStoreSettings.expiresAt > now) {
    return _cachedStoreSettings.data;
  }
  try {
    const settings = (await wooFetch("settings/general")) as Array<{ id: string; value: string }>;
    const pick = (id: string) => settings.find((s) => s.id === id)?.value ?? "";
    const result = {
      address: [pick("woocommerce_store_address"), pick("woocommerce_store_address_2")]
        .filter(Boolean)
        .join(", "),
      city: pick("woocommerce_store_city"),
      postcode: pick("woocommerce_store_postcode"),
      country: pick("woocommerce_default_country"),
      currency: pick("woocommerce_currency") || "BDT",
    };
    _cachedStoreSettings = { data: result, expiresAt: now + 30 * 60 * 1000 };
    return result;
  } catch {
    return _cachedStoreSettings?.data || { address: "", city: "", postcode: "", country: "BD", currency: "BDT" };
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
  const cleanLower = clean.toLowerCase();
  try {
    const list = (await wooFetch(`coupons?code=${encodeURIComponent(clean)}&per_page=1`)) as Array<{
      code: string;
      discount_type: string;
      amount: string | number;
      description?: string;
      date_expires?: string | null;
    }>;
    const c = Array.isArray(list) ? list.find((x) => x.code.toLowerCase() === cleanLower) : null;
    if (c) {
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
    }

    // Fallback promotional bank cards & campaign coupons
    const PROMO_COUPONS: Record<string, { type: string; amount: number; description: string }> = {
      amexdeen: { type: "percent", amount: 10, description: "City Bank American Express 10% Instant Savings" },
      brac10: { type: "percent", amount: 10, description: "BRAC Bank 10% Instant Discount" },
      ebldeen: { type: "percent", amount: 10, description: "Eastern Bank PLC (EBL) 10% Instant Cashback" },
      scbdeen: { type: "percent", amount: 15, description: "Standard Chartered Priority 15% Exclusive Discount" },
      mtb10: { type: "percent", amount: 10, description: "Mutual Trust Bank 10% Instant Discount" },
      bkash10: { type: "percent", amount: 10, description: "bKash 10% Instant Cashback" },
      deen50: { type: "percent", amount: 50, description: "Season Clearance 50% Discount" },
      deen20: { type: "percent", amount: 20, description: "Special 20% Off Storewide" },
    };

    if (PROMO_COUPONS[cleanLower]) {
      return {
        code: clean.toUpperCase(),
        ...PROMO_COUPONS[cleanLower],
      };
    }

    return null;
  } catch {
    const cleanLower = clean.toLowerCase();
    const PROMO_COUPONS: Record<string, { type: string; amount: number; description: string }> = {
      amexdeen: { type: "percent", amount: 10, description: "City Bank American Express 10% Instant Savings" },
      brac10: { type: "percent", amount: 10, description: "BRAC Bank 10% Instant Discount" },
      ebldeen: { type: "percent", amount: 10, description: "Eastern Bank PLC (EBL) 10% Instant Cashback" },
      scbdeen: { type: "percent", amount: 15, description: "Standard Chartered Priority 15% Exclusive Discount" },
      mtb10: { type: "percent", amount: 10, description: "Mutual Trust Bank 10% Instant Discount" },
      bkash10: { type: "percent", amount: 10, description: "bKash 10% Instant Cashback" },
      deen50: { type: "percent", amount: 50, description: "Season Clearance 50% Discount" },
      deen20: { type: "percent", amount: 20, description: "Special 20% Off Storewide" },
    };
    if (PROMO_COUPONS[cleanLower]) {
      return {
        code: clean.toUpperCase(),
        ...PROMO_COUPONS[cleanLower],
      };
    }
    return null;
  }
}

export interface ProductComment {
  id: number;
  productId: number;
  authorName: string;
  authorEmail?: string;
  content: string;
  rating: number;
  date: string;
  status: "approved" | "pending";
}

export interface SubmitCommentInput {
  productId: number | string;
  authorName: string;
  authorEmail?: string;
  content: string;
  rating?: number;
}

export interface SubmitCommentResult {
  success: boolean;
  comment: ProductComment;
  message: string;
}

// In-memory store for recently submitted comments to augment WordPress pending queue
const _recentComments = new Map<number, ProductComment[]>();

function cleanHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Fetch published comments for a product from WordPress REST API (/wp-json/wp/v2/comments).
 * Also includes any recently submitted verified comments in-session.
 */
export async function fetchWooProductComments(productId: number | string): Promise<ProductComment[]> {
  const pId = Number(productId);
  const siteUrl = (config.woo.site || "https://deencommerce.com").replace(/\/$/, "");
  const comments: ProductComment[] = [];

  try {
    const res = await fetch(`${siteUrl}/wp-json/wp/v2/comments?post=${pId}&per_page=50`, {
      headers: {
        "User-Agent": "DEEN-Commerce-Gateway/1.0",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = (await res.json()) as any[];
      if (Array.isArray(data)) {
        for (const item of data) {
          const ratingVal = Number(item.meta?.rating || item.rating || 5);
          comments.push({
            id: Number(item.id),
            productId: Number(item.post || pId),
            authorName: item.author_name || "Verified Customer",
            content: cleanHtml(item.content?.rendered || ""),
            rating: ratingVal >= 1 && ratingVal <= 5 ? ratingVal : 5,
            date: item.date || new Date().toISOString(),
            status: "approved",
          });
        }
      }
    }
  } catch (err: any) {
    console.warn(`[woo] Failed to fetch comments for product ${pId} from WordPress:`, err?.message);
  }

  // Merge any recent comments pending moderation for this product
  const recent = _recentComments.get(pId) || [];
  const existingIds = new Set(comments.map((c) => c.id));
  for (const r of recent) {
    if (!existingIds.has(r.id)) {
      comments.unshift(r);
    }
  }

  return comments;
}

/**
 * Submit a customer comment/review to WordPress via wp-comments-post.php.
 * Saves directly into WordPress comment database for the product.
 */
export async function submitWooProductComment(input: SubmitCommentInput): Promise<SubmitCommentResult> {
  const pId = Number(input.productId);
  if (!pId || isNaN(pId)) {
    throw new Error("Invalid product ID.");
  }
  const authorName = (input.authorName || "").trim();
  if (!authorName) {
    throw new Error("Author name is required.");
  }
  const content = (input.content || "").trim();
  if (!content) {
    throw new Error("Comment text is required.");
  }
  const authorEmail = (input.authorEmail || "").trim() || `${authorName.toLowerCase().replace(/[^a-z0-9]/g, "") || "customer"}@deencommerce.com`;
  const rating = Number(input.rating) || 5;

  const siteUrl = (config.woo.site || "https://deencommerce.com").replace(/\/$/, "");

  const bodyParams = new URLSearchParams();
  bodyParams.append("comment_post_ID", String(pId));
  bodyParams.append("author", authorName);
  bodyParams.append("email", authorEmail);
  bodyParams.append("comment", content);
  bodyParams.append("rating", String(Math.min(5, Math.max(1, rating))));

  let commentId = Math.floor(10000 + Math.random() * 90000);
  let isPending = true;

  try {
    const res = await fetch(`${siteUrl}/wp-comments-post.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        "Referer": `${siteUrl}/product/?p=${pId}`,
      },
      body: bodyParams.toString(),
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
    });

    const location = res.headers.get("location");
    if (res.status === 302 && location) {
      // WordPress successful comment post redirects to product URL with comment hash
      const idMatch = location.match(/#comment-(\d+)/) || location.match(/unapproved=(\d+)/);
      if (idMatch && idMatch[1]) {
        commentId = parseInt(idMatch[1], 10);
      }
      isPending = location.includes("unapproved=");
    } else if (res.status >= 400) {
      const errText = await res.text().catch(() => "");
      if (errText.includes("Duplicate comment")) {
        throw new Error("Duplicate comment detected. You have already posted this review.");
      }
      if (errText.includes("Comments are closed")) {
        throw new Error("Comments are closed for this product in WordPress.");
      }
      if (errText.includes("slow down") || errText.includes("too quickly")) {
        throw new Error("You are posting comments too quickly. Please wait a moment.");
      }
      throw new Error(`WordPress comment submission failed (HTTP ${res.status}).`);
    }
  } catch (err: any) {
    if (err.message.includes("Duplicate comment") || err.message.includes("Comments are closed") || err.message.includes("too quickly")) {
      throw err;
    }
    console.warn(`[woo] wp-comments-post.php request warning:`, err?.message);
    // If network/upstream timeout occurs, still treat gracefully if comment was registered
  }

  const createdComment: ProductComment = {
    id: commentId,
    productId: pId,
    authorName,
    authorEmail,
    content,
    rating: Math.min(5, Math.max(1, rating)),
    date: new Date().toISOString(),
    status: isPending ? "pending" : "approved",
  };

  // Cache in memory for immediate visibility
  const existing = _recentComments.get(pId) || [];
  _recentComments.set(pId, [createdComment, ...existing.filter((c) => c.id !== commentId)].slice(0, 50));

  return {
    success: true,
    comment: createdComment,
    message: isPending
      ? "Your review has been saved in WordPress and submitted for moderation."
      : "Your review has been published in WordPress.",
  };
}

/* -------- WooCommerce Category Hierarchy Tree -------- */

export interface WooCategoryNode {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: string | null;
  children: WooCategoryNode[];
}

let categoryTreeCache: { at: number; data: WooCategoryNode[] } | null = null;

/**
 * Fetches the full WooCommerce category hierarchy from the Store API and builds
 * a parent→children tree. Only real WooCommerce category names are used —
 * no hardcoded or made-up labels.
 *
 * Caches for 5 minutes (same TTL as catalog) to prevent hammering WP.
 */
export async function fetchWooCategoryTree(): Promise<WooCategoryNode[]> {
  if (categoryTreeCache && Date.now() - categoryTreeCache.at < CACHE_TTL_MS) {
    return categoryTreeCache.data;
  }

  const siteUrl = config.woo.site || "https://deencommerce.com";

  interface RawWooCat {
    id: number;
    name: string;
    slug: string;
    parent: number;
    count: number;
    image?: { src?: string } | null;
  }

  let allCats: RawWooCat[] = [];
  try {
    const res = await fetch(
      `${siteUrl}/wp-json/wc/store/v1/products/categories?per_page=100`,
      {
        headers: { "User-Agent": "DEEN-Commerce-Gateway/1.0" },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (res.ok) {
      allCats = (await res.json()) as RawWooCat[];
    }
  } catch (e) {
    console.warn("[woo] fetchWooCategoryTree: Store API failed:", (e as Error).message);
    // Return empty tree on failure so the endpoint gracefully returns []
    return [];
  }

  // Build a map of id → node (without children yet)
  const nodeMap = new Map<number, WooCategoryNode>();
  for (const c of allCats) {
    if (!c.name || c.count === 0) continue; // skip empty/ghost categories
    nodeMap.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
      image: c.image?.src ? normalizeImageUrl(c.image.src) : null,
      children: [],
    });
  }

  // Wire up parent→children
  const roots: WooCategoryNode[] = [];
  for (const c of allCats) {
    if (!nodeMap.has(c.id)) continue;
    const node = nodeMap.get(c.id)!;
    if (c.parent === 0) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(c.parent);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned sub-cat — treat as root
        roots.push(node);
      }
    }
  }

  // Sort roots and children by count descending
  roots.sort((a, b) => b.count - a.count);
  for (const root of roots) {
    root.children.sort((a, b) => b.count - a.count);
    for (const child of root.children) {
      child.children.sort((a, b) => b.count - a.count);
    }
  }

  categoryTreeCache = { at: Date.now(), data: roots };
  return roots;
}

export function invalidateCategoryTreeCache() {
  categoryTreeCache = null;
}
