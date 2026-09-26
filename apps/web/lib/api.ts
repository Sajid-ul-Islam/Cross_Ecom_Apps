// API client — reads NEXT_PUBLIC_API_URL or defaults to live Render gateway (Zero config needed on Vercel)
export const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps-4b4n.onrender.com";
export const BACKUP_GATEWAY_URL = "https://cross-ecom-apps.onrender.com";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_GATEWAY_URL;

/** Shared gateway key — sent as x-api-key on every request. */
const DEFAULT_GATEWAY_API_KEY = "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";
const GATEWAY_API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || DEFAULT_GATEWAY_API_KEY;

/**
 * Safe fetch wrapper that includes x-api-key and automatically fails over
 * to the backup gateway ONLY for idempotent GET requests.
 * Mutating writes (POST/PUT/DELETE) use explicit two-phase reconciliation.
 */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

  const isGet = !init?.method || init.method.toUpperCase() === "GET";

  try {
    const res = await fetch(input, { ...init, headers });
    if (!res.ok && isGet && input.startsWith(DEFAULT_GATEWAY_URL)) {
      // If primary returned 502/503 (Render cold start) on a GET, failover to backup gateway
      const backupUrl = input.replace(DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL);
      const backupRes = await fetch(backupUrl, { ...init, headers }).catch(() => null);
      if (backupRes && backupRes.ok) return backupRes;
    }
    return res;
  } catch (err) {
    if (isGet && input.startsWith(DEFAULT_GATEWAY_URL)) {
      const backupUrl = input.replace(DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL);
      return fetch(backupUrl, { ...init, headers });
    }
    throw err;
  }
}

const GUEST_TOKEN_KEY = "deen_web_guest_token";

/**
 * Returns a guest session token from localStorage, if present.
 * SEC-4 sync: the orders endpoint now requires a valid session token.
 */
function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Ensures a guest session token exists, minting one from the gateway if needed.
 * Falls back to null (orders will use cache) if the gateway is unreachable.
 */
async function ensureGuestToken(): Promise<string | null> {
  const existing = getGuestToken();
  if (existing) return existing;
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/guest`, {
      method: "POST",
    });
    if (!res.ok) return null;
    const data: { token?: string } = await res.json();
    if (data.token) {
      localStorage.setItem(GUEST_TOKEN_KEY, data.token);
      return data.token;
    }
  } catch {
    // network offline — no token, orders will use cache
  }
  return null;
}

export async function fetchOrders(phone?: string): Promise<OrderResult[]> {
  try {
    const token = await ensureGuestToken();
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const res = await apiFetch(`${API_URL}/v1/deen/orders${qs}`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface Variation {
  id: number;
  size: string;
  stock: string;
  price: number;
  regular: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  segment?: "collection" | "select";
  brand?: string;
  price: number;
  salePrice?: number;
  regularPrice?: number;
  salePct?: number;
  sizes: string[];
  images: [string, string];
  gallery?: string[];
  fabric?: string;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  rating: number;
  ratingCount: number;
  blurb?: string;
  description?: string;
  slug?: string;
  tags?: string[];
  isNew?: boolean;
  variations?: Variation[];
  /** Live WooCommerce sub-category names (e.g. "Regular Fit", "Slim Fit", "Drop Shoulder"). */
  wooSubCategories?: string[];
}

/**
 * Resolves strictly in-stock sizes for a product.
 * Omits any size whose variation stock status is 'outofstock'.
 * Returns an empty array if the product itself is out of stock.
 */
export function getInStockSizes(product: Product | null | undefined): string[] {
  if (!product || (product.stockStatus || "instock") === "outofstock") {
    return [];
  }

  if (Array.isArray(product.variations) && product.variations.length > 0) {
    const inStock = product.variations
      .filter((v) => {
        const s = String(v.stock || "instock").toLowerCase();
        return s !== "outofstock" && s !== "out-of-stock";
      })
      .map((v) => String(v.size || "").trim())
      .filter(Boolean);
    if (inStock.length > 0) {
      return Array.from(new Set(inStock));
    }
  }

  return (product.sizes || []).map((s) => String(s || "").trim()).filter(Boolean);
}

export interface OrderLine {
  productId: string;
  variationId?: number;
  size: string;
  qty: number;
}

export interface OrderPayload {
  name: string;
  phone: string;
  address: string;
  area: string;
  payment: string;
  items: OrderLine[];
  email?: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
  deliverySlot?: string;
  deliveryNotes?: string;
  customerNote?: string;
  coupon?: string;
  isGuestOrder?: boolean;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  guestToken?: string;
  idempotencyKey?: string;
  trxId?: string;
}

export interface OrderResult {
  id: string;
  number: string;
  wooId?: number;
  wooNumber?: string;
  paymentUrl?: string;
  orderKey?: string;
  total: number;
  subtotal: number;
  delivery: number;
  status: string;
  payment: string;
  paymentTitle?: string;
  createdAt: string;
  idempotencyKey?: string;
  name?: string;
  phone?: string;
  address?: string;
  pathaoConsignmentId?: string;
  pathaoTrackingUrl?: string;
  /** Live Pathao tracking info embedded by the gateway when consignmentId exists. */
  pathaoTrackingInfo?: {
    consignmentId: string;
    summary: string;
    status: string;
    steps: Array<{
      timestamp: string;
      status: string;
      label: string;
      location?: string;
      completed: boolean;
      current: boolean;
    }>;
    trackingUrl: string;
    lastUpdated: string;
  };
  lines?: { name: string; size: string; qty: number; unit: number; gift?: boolean }[];
}

import catalogSnapshot from "./catalog.snapshot.json";

/**
 * Canonical product image resolver:
 * Converts relative paths, HTTP urls, and protocol-relative URLs into high-speed HTTPS CDN urls.
 */
export function resolveProductImage(src?: string, fallback?: string): string {
  if (!src || typeof src !== "string" || src.trim().length === 0) {
    return fallback || "https://deencommerce.com/wp-content/uploads/2026/05/jeans-1.jpg";
  }
  let clean = src.trim();
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("/")) return `https://deencommerce.com${clean}`;
  if (clean.startsWith("http://")) return clean.replace("http://", "https://");
  return clean;
}

/**
 * Fetches real-time updated images and gallery for a product directly from REST API.
 */
export async function fetchProductImages(id: string): Promise<{
  images: [string, string];
  gallery: string[];
  thumb: string;
  single: string;
  full: string;
} | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/images/product/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

export function getBundledProducts(): Product[] {
  const data = catalogSnapshot as unknown as { products?: Product[] } | Product[];
  const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
  return list.map(sanitizeProduct);
}

function applyLocalFilters(
  products: Product[],
  category?: string,
  search?: string,
  sort?: string,
  segment?: string
): Product[] {
  // Always filter out out-of-stock and draft products for customers
  let list = [...products].filter(
    (p) => (p.stockStatus || "instock") !== "outofstock"
  );

  // Segment filtering (collection vs select)
  const normSegment = (segment || "").toLowerCase();
  if (normSegment === "select" || normSegment === "deen-select" || normSegment === "deen_select") {
    list = list.filter((p) => p.segment === "select");
  } else if (normSegment === "collection" || normSegment === "deen-collection" || normSegment === "deen_collection") {
    list = list.filter((p) => p.segment === "collection" || !p.segment);
  }

  if (category && category !== "ALL") {
    const cat = category.toUpperCase().replace(/[- ]/g, "_");
    if (cat === "DEEN_SELECT" || cat === "SELECT") {
      list = list.filter((p) => p.segment === "select");
    } else if (cat === "DEEN_COLLECTION" || cat === "COLLECTION") {
      list = list.filter((p) => p.segment === "collection" || !p.segment);
    } else {
      list = list.filter((p) => {
        const pCat = (p.category || "").toUpperCase();
        if (cat === "JEANS") return pCat.includes("JEAN") || pCat.includes("DENIM");
        if (cat === "SHIRT") return pCat.includes("SHIRT") && !pCat.includes("T-SHIRT");
        if (cat === "T-SHIRT") return pCat.includes("T-SHIRT") || pCat.includes("TEE");
        if (cat === "PANJABI") return pCat.includes("PANJABI") || pCat.includes("PUNJABI");
        if (cat === "POLO") return pCat.includes("POLO");
        if (cat === "TROUSERS") return pCat.includes("TROUSER") || pCat.includes("PANT") || pCat.includes("CHINO");
        if (cat === "COMBO") return pCat.includes("COMBO") || (p.tags && p.tags.some((t) => t.toUpperCase().includes("COMBO")));
        return pCat.includes(cat);
      });
    }
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (q.includes("select") && p.segment === "select") ||
        (q.includes("collection") && (p.segment === "collection" || !p.segment))
    );
  }

  if (sort) {
    if (sort === "price-asc") list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    else if (sort === "price-desc") list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "new") list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
  }

  return list;
}

export const WORDPRESS_SITE_URL = "https://deencommerce.com";

function parseDiscountPct(cats: string[]): number {
  let pct = 0;
  for (const c of cats) {
    const m = /(\d+)\s*%\s*OFF/i.exec(c);
    if (m) pct = Math.max(pct, Number(m[1]));
  }
  return pct;
}

function mapStoreCategory(catNames: string[]): string {
  const upper = catNames.map((c) => c.trim().toUpperCase());
  for (const c of ["JEANS", "PANJABI", "SHIRT", "T-SHIRT", "TROUSERS", "POLO", "ACCESSORIES"]) {
    if (upper.includes(c)) return c;
  }
  if (upper.some((c) => c.includes("SHIRT") && !c.includes("T-SHIRT") && !c.includes("POLO"))) return "SHIRT";
  if (upper.some((c) => c.includes("T-SHIRT") || c.includes("TEE"))) return "T-SHIRT";
  if (upper.some((c) => c.includes("PANJABI") || c.includes("PUNJABI"))) return "PANJABI";
  if (upper.some((c) => c.includes("JEAN") || c.includes("DENIM"))) return "JEANS";
  if (upper.some((c) => c.includes("TROUSER") || c.includes("CHINO") || c.includes("PANT"))) return "TROUSERS";
  if (upper.some((c) => c.includes("POLO"))) return "POLO";
  if (upper.some((c) => c.includes("ACCESS") || c.includes("BAG") || c.includes("BELT") || c.includes("WALLET"))) return "ACCESSORIES";
  return "OTHER";
}

/**
 * Universal HTML entity decoder for product titles & text.
 * Safely decodes WordPress/WooCommerce typographic entities (`&#8217;`, `&#8221;`, `&#038;`, etc.).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  let s = str
    .replace(/&amp;#/g, "&#")
    .replace(/&#8211;?/g, "–")
    .replace(/&#8212;?/g, "—")
    .replace(/&#8216;?/g, "'")
    .replace(/&#8217;?/g, "'")
    .replace(/&#8220;?/g, '"')
    .replace(/&#8221;?/g, '"')
    .replace(/&#8230;?/g, "…")
    .replace(/&#038;?/g, "&")
    .replace(/&#039;?/g, "'")
    .replace(/&#39;?/g, "'")
    .replace(/&#(\d+);?/g, (_, dec) => {
      try {
        const code = Number(dec);
        return code ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code ? String.fromCharCode(code) : _;
      } catch {
        return _;
      }
    })
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();

  // If numeric or named entities remain (e.g. double-encoded), do one more pass
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

export function sanitizeProduct<T extends Partial<Product>>(p: T): T {
  if (!p) return p;
  return {
    ...p,
    ...(p.name ? { name: decodeHtmlEntities(p.name) } : {}),
    ...(p.blurb ? { blurb: decodeHtmlEntities(p.blurb) } : {}),
    ...(p.description ? { description: decodeHtmlEntities(p.description) } : {}),
  };
}

export function mapStoreProductToWeb(p: any): Product {
  const regularPrice = p.prices?.regular_price ? Number(p.prices.regular_price) : undefined;
  const salePrice = p.prices?.sale_price ? Number(p.prices.sale_price) : undefined;
  const currentPrice = Number(p.prices?.price) || salePrice || regularPrice || 0;
  const onSale = Boolean(p.on_sale && regularPrice && salePrice && regularPrice > salePrice);
  const catNames = (p.categories || []).map((c: any) => c.name);
  const category = mapStoreCategory(catNames);
  const isSelect = (p.categories || []).some(
    (c: any) =>
      c.id === 1281 ||
      c.parent === 1281 ||
      /deen\s*select/i.test(c.name || "") ||
      /deen-select/i.test(c.slug || "")
  );
  const segment: "collection" | "select" = isSelect ? "select" : "collection";
  const pct = onSale && regularPrice && salePrice
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : parseDiscountPct(catNames);

  const sizeAttr = (p.attributes || []).find((a: any) => /size|মাপ/i.test(a.name));
  const sizes = sizeAttr?.terms ? sizeAttr.terms.map((t: any) => t.name) : ["30", "32", "34", "36", "38"];

  const imgs = (p.images || []).map((img: any) => resolveProductImage(img.src || img.thumbnail || "")).filter(Boolean);
  const primaryImg = imgs[0] || "https://deencommerce.com/wp-content/uploads/2026/05/jeans-1.jpg";
  const secondaryImg = imgs[1] || primaryImg;

  const cleanName = decodeHtmlEntities(p.name || "");
  const brand = /springfield/i.test(cleanName)
    ? "Springfield"
    : /lefties/i.test(cleanName)
    ? "Lefties"
    : /pull\s*&?\s*bear/i.test(cleanName)
    ? "Pull & Bear"
    : /zara/i.test(cleanName)
    ? "Zara"
    : isSelect
    ? "DEEN Select"
    : "DEEN";

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
    salePct: pct || undefined,
    sizes: sizes.length > 0 ? sizes : ["M", "L", "XL"],
    images: [primaryImg, secondaryImg],
    gallery: imgs.length > 0 ? imgs : [primaryImg],
    fabric: "Premium Fabric",
    stockStatus: p.is_in_stock ? "instock" : "outofstock",
    rating: Number(p.average_rating) || 4.9,
    ratingCount: Number(p.review_count) || 12,
    blurb: decodeHtmlEntities((p.short_description || p.description || "").replace(/<[^>]+>/g, "").slice(0, 220)) || "Authentic DEEN design crafted in Bangladesh.",
    description: decodeHtmlEntities(p.description || p.short_description || ""),
    slug: p.slug || "",
    isNew: catNames.some((c: string) => /new/i.test(c)),
    wooSubCategories: wooSubCategories.length > 0 ? wooSubCategories : undefined,
  };
}

/**
 * Direct public WooCommerce Store API fallback for Web (no API key required).
 */
export async function fetchDirectStoreProductsWeb(perPage = 100): Promise<Product[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    // On web client, if browser CORS is an issue, we query the internal Next.js route /api/products
    const targetUrl = typeof window !== "undefined"
      ? `/api/products?per_page=${perPage}`
      : `${WORDPRESS_SITE_URL}/wp-json/wc/store/v1/products?per_page=${perPage}`;
    const res = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 },
    } as any);
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const raw = await res.json();
    if (Array.isArray(raw)) {
      return raw.map(mapStoreProductToWeb);
    }
  } catch {}
  return [];
}

/**
 * Keeps the primary Render gateway warm during active browser sessions.
 * Pings /health every 4 minutes so the server doesn't spin down while a user is browsing.
 */
export function startWebGatewayKeepAlive(intervalMs = 4 * 60 * 1000): () => void {
  if (typeof window === "undefined") return () => {};
  const ping = () => {
    fetch(`${DEFAULT_GATEWAY_URL}/health`, { mode: "no-cors" }).catch(() => {});
  };
  ping();
  const timer = setInterval(ping, intervalMs);
  return () => clearInterval(timer);
}

/**
 * Fetches products from live Fastify Gateway REST API with automatic failover,
 * direct WordPress Store API fallback, and offline-first bundled catalog snapshot.
 */
export async function fetchProducts(params?: {
  category?: string;
  segment?: string;
  search?: string;
  sort?: string;
  per_page?: number;
}): Promise<Product[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.category && params.category !== "ALL")
      qs.set("category", params.category);
    if (params?.segment && params.segment !== "all")
      qs.set("segment", params.segment);
    if (params?.search) {
      qs.set("search", params.search);
      qs.set("q", params.search);
    }
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.per_page) qs.set("per_page", String(params.per_page));

    const res = await apiFetch(
      `${API_URL}/v1/deen/products${qs.toString() ? "?" + qs.toString() : ""}`,
      { next: { revalidate: 60, tags: ["catalog", "products"] } }
    );
    if (res.ok) {
      const data: Product[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data
          .filter((p) => (p.stockStatus || "instock") !== "outofstock")
          .map(sanitizeProduct);
      }
    }
  } catch {
    // Primary and backup Render gateways failed or timed out
  }

  // Tier 2: Direct WordPress WooCommerce Store API fallback
  try {
    const directWp = await fetchDirectStoreProductsWeb(params?.per_page || 100);
    if (Array.isArray(directWp) && directWp.length > 0) {
      const filtered = applyLocalFilters(
        directWp,
        params?.category,
        params?.search,
        params?.sort,
        params?.segment
      ).map(sanitizeProduct);
      if (params?.per_page && params.per_page > 0) {
        return filtered.slice(0, params.per_page);
      }
      return filtered;
    }
  } catch {}

  // Tier 3: Graceful fallback to bundled catalog snapshot
  const fallback = applyLocalFilters(
    getBundledProducts(),
    params?.category,
    params?.search,
    params?.sort,
    params?.segment
  ).map(sanitizeProduct);
  if (params?.per_page && params.per_page > 0) {
    return fallback.slice(0, params.per_page);
  }
  return fallback;
}

/**
 * Fetches single product details with real variations from the REST API gateway,
 * with direct WordPress Store API fallback and bundled snapshot backup.
 */
export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 60, tags: ["catalog", `product-${id}`] },
    });
    if (res.ok) {
      const product = await res.json();
      if (product && product.id) return sanitizeProduct(product);
    }
  } catch {
    // Network or timeout failure — fallback
  }

  // Tier 2: Direct WP Store API fallback if id is numeric
  if (/^\d+$/.test(id)) {
    try {
      const targetUrl = typeof window !== "undefined"
        ? `/api/products?id=${encodeURIComponent(id)}`
        : `${WORDPRESS_SITE_URL}/wp-json/wc/store/v1/products/${encodeURIComponent(id)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(targetUrl, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const raw = await res.json();
        if (raw && raw.id) return sanitizeProduct(mapStoreProductToWeb(raw));
      }
    } catch {}
  }

  // Fallback to snapshot search by ID or slug
  const all = getBundledProducts();
  const found = all.find((p) => String(p.id) === String(id) || p.slug === id);
  return found ? sanitizeProduct(found) : null;
}

/**
 * Fetches live category counts from the REST API gateway, with Store API fallback.
 */
export async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/categories`, {
      next: { revalidate: 300, tags: ["categories"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Direct WP Store API fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${WORDPRESS_SITE_URL}/wp-json/wc/store/v1/products/categories?per_page=100`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 300 },
      } as any);
      clearTimeout(timeoutId);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped = raw
            .filter((c: any) => c.name && c.count > 0)
            .map((c: any) => ({ category: String(c.name).toUpperCase(), count: Number(c.count) || 0 }));
          if (mapped.length > 0) return mapped;
        }
      }
    } catch {}
  }

  // Fallback: derive categories from bundled snapshot
  const bundled = getBundledProducts();
  const counts: Record<string, number> = {};
  bundled.forEach((p) => {
    const cat = p.category || "OTHER";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

/**
 * Fetches live category cover image URLs from WooCommerce REST API.
 */
export async function fetchCategoryCovers(): Promise<Record<string, string>> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/category-covers`, {
      next: { revalidate: 300, tags: ["covers", "categories"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") return data;
    }
  } catch {}
  return {};
}

export interface BankOffer {
  id: string;
  bankName: string;
  cardType: string;
  discount: string;
  discountPct: number;
  maxDiscount: number;
  minSpend: number;
  couponCode: string;
  badge: string;
  validTill: string;
  description: string;
  logoText: string;
  color: string;
}

export interface RotatingCampaignItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
}

export interface ActiveCampaignState {
  success: boolean;
  activeCampaign: {
    type: "sale" | "cashback" | "none";
    badge: string;
    title: string;
    subtitle: string;
    discountRange?: string;
    bannerText?: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null;
  cashback: {
    enabled: boolean;
    tier1?: { minSpend: number; amount: number };
    tier2?: { minSpend: number; amount: number };
  };
  sale: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    discountRange: string;
  };
  bankOffers?: BankOffer[];
  rotatingCampaigns?: RotatingCampaignItem[];
  festivalGreeting?: {
    active: boolean;
    id: string;
    name: string;
    motif: string;
    titlebarText: string;
    title: string;
    subtitle: string;
    greeting: string;
    themePrimary: string;
    themeSecondary: string;
    actionLabel: string;
    actionUrl: string;
  };
}

export interface BdDistrict {
  code: string;
  name: string;
}

/**
 * Fetches 64 Bangladesh districts from REST API (/v1/deen/districts).
 * Single source of truth — matches WooCommerce BD-XX state codes.
 */
export async function fetchDistricts(): Promise<BdDistrict[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/districts`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data: BdDistrict[] = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  // Fallback to local copy if API unreachable
  const { BD_DISTRICTS } = await import("@/lib/districts");
  return BD_DISTRICTS;
}

export interface DeliveryFees {
  insideDhaka: number;
  outsideDhaka: number;
  express: number;
  storePickup: number;
}

/**
 * Fetches live delivery fees from REST API (GET /v1/deen/shipping).
 * Single source of truth — mirrors WooCommerce shipping zones + express surcharge
 * (inside-Dhaka flat rate + gateway EXPRESS_SURCHARGE). Admin fee edits in WP
 * propagate with no app rebuild.
 */
export async function fetchDeliveryFees(): Promise<DeliveryFees> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/shipping`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const f = data?.fees;
      if (f && typeof f.insideDhaka === "number") {
        return {
          insideDhaka: f.insideDhaka,
          outsideDhaka: f.outsideDhaka,
          express: typeof f.express === "number" ? f.express : f.insideDhaka + 70,
          storePickup: f.storePickup ?? 0,
        };
      }
    }
  } catch {}
  // Gateway unreachable — mirror the gateway's own default zone costs.
  return { insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 };
}

export interface HeroSlide {
  id: string;
  desktop: string;
  mobile: string;
  badge: string;
  title: string;
  headline: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
  videoUrl?: string;
}

export interface HeroBannerState {
  desktop: string;
  mobile: string;
  title: string;
  tagline: string;
  subtitle: string;
  actionUrl: string;
  actionLabel: string;
  slides: HeroSlide[];
}

const DEFAULT_BANNER_SLIDES: HeroSlide[] = [
  {
    id: "slide_denim_video",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    badge: "দেশের প্রথম ডেনিম ব্র্যান্ড · DEEN",
    title: "Raw Washed. Selvedge Heritage.",
    headline: "ARTISANAL INDIGO & CROSS HATCH DENIM",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo & Artisanal Precision.",
    actionUrl: "/shop?category=JEANS",
    actionLabel: "Explore Denim Collection →",
  },
  {
    id: "slide_clearance_video",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_1920x8401.mp4",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    badge: "NEW SEASON DROP · 2026",
    title: "Cuban Collar & Dobby Jacquards.",
    headline: "BREATHABLE RESORT & CASUAL SHIRTS",
    subtitle: "High-density lightweight textures engineered specifically for Bangladesh's humid weather.",
    actionUrl: "/shop?category=SHIRT",
    actionLabel: "Shop Summer Shirts →",
  },
  {
    id: "slide_web_motion_video",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/06/web-motion-banner.mp4",
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/06/Mobile-Banner-Web.mp4",
    badge: "DEEN MOTION · 2026",
    title: "Modern Lifestyle & Motion.",
    headline: "CONTEMPORARY RESORT & CASUAL LIVING",
    subtitle: "Lightweight tailoring engineered for modern lifestyle and effortless mobility.",
    actionUrl: "/shop",
    actionLabel: "Explore New Arrivals →",
  },
  {
    id: "slide_official_cover_image",
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

export async function fetchHeroBanner(): Promise<HeroBannerState> {
  const fallback: HeroBannerState = {
    desktop: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    mobile: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    title: "দেশের প্রথম ডেনিম ব্র্যান্ড",
    tagline: "Empathetic Men's Lifestyle Fashion in Bangladesh",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo & Artisanal Precision",
    actionUrl: "/shop",
    actionLabel: "Explore Collection",
    slides: DEFAULT_BANNER_SLIDES,
  };

  try {
    const res = await apiFetch(`${API_URL}/v1/deen/hero-banner`, {
      next: { revalidate: 300, tags: ["hero", "banner"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.desktop) {
        if (Array.isArray(data.slides)) {
          // Strictly reject any product photos or non-cover media
          data.slides = data.slides.filter((s: HeroSlide) => {
            if (s.videoUrl && s.videoUrl.endsWith(".mp4")) return true;
            if (!s.desktop) return false;
            const url = s.desktop.toLowerCase();
            if (url.includes("600x750") || url.includes("product") || url.includes("front") || url.includes("back") || url.includes("model")) {
              return false;
            }
            return true;
          });
        }
        if (!data.slides || data.slides.length === 0) {
          data.slides = DEFAULT_BANNER_SLIDES;
        }
        return data;
      }
    }
  } catch {}
  return fallback;
}

/* ------------------------------------------------------------------ */
/*  Social Feed & Shoppable Reels (Instagram / Facebook / Deen UGC)   */
/* ------------------------------------------------------------------ */

export interface SocialAccountInfo {
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  handle: string;
  communityCount: string;
}

export interface SocialStory {
  id: string;
  title: string;
  image: string;
  hasUnseen?: boolean;
  actionUrl: string;
}

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  category?: string;
  image: string;
}

export interface SocialReel {
  id: string;
  title: string;
  author: string;
  platform: "instagram" | "facebook" | "tiktok";
  poster: string;
  videoUrl?: string;
  caption: string;
  likes: number;
  views: string;
  comments: number;
  permalink: string;
  taggedProduct?: TaggedProduct;
}

export interface SocialFeedData {
  officialAccounts: SocialAccountInfo;
  stories: SocialStory[];
  reels: SocialReel[];
}

export const DEFAULT_SOCIAL_FEED: SocialFeedData = {
  officialAccounts: {
    facebook: "https://www.facebook.com/deencommerce",
    instagram: "https://www.instagram.com/deencommerce/?hl=en",
    linkedin: "https://www.linkedin.com/company/deencommerce",
    whatsapp: "https://wa.me/8801952700500",
    handle: "@deencommerce",
    communityCount: "125,000+ Patrons Across Bangladesh",
  },
  stories: [
    {
      id: "story_1",
      title: "Raw Selvedge",
      image: "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
      hasUnseen: true,
      actionUrl: "/shop?category=JEANS",
    },
    {
      id: "story_2",
      title: "Heritage Panjabi",
      image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Stone-Embroidered-Panjabi-106-0101-136-Front.webp",
      hasUnseen: true,
      actionUrl: "/shop?category=PANJABI",
    },
    {
      id: "story_3",
      title: "Oxford Shirts",
      image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Flanel-Shirt-102-0302-041-Front.webp",
      hasUnseen: false,
      actionUrl: "/shop?category=SHIRT",
    },
    {
      id: "story_4",
      title: "Dhaka Studio",
      image: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
      hasUnseen: false,
      actionUrl: "/shop",
    },
  ],
  reels: [
    {
      id: "reel_selvedge_autumn",
      title: "Raw Selvedge Denim Craftsmanship",
      author: "@deencommerce",
      platform: "instagram",
      poster: "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
      videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4",
      caption: "Every fold speaks dedication. 100% shuttle-loom woven raw selvedge with signature red-line ID. Engineered to fade with your daily journey. 👖✨ #DeenDenim #RawSelvedge #MadeInBangladesh",
      likes: 1842,
      views: "24.5K",
      comments: 96,
      permalink: "https://www.instagram.com/deencommerce/?hl=en",
      taggedProduct: {
        id: "14164",
        name: "Springfield Polo Shirt",
        price: 1090,
        regularPrice: 1090,
        category: "POLO",
        image: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
      },
    },
    {
      id: "reel_season_clearance",
      title: "End of Season Showcase",
      author: "@deencommerce",
      platform: "facebook",
      poster: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Stone-Embroidered-Panjabi-106-0101-136-Front.webp",
      videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_1920x8401.mp4",
      caption: "Artisanal tailoring, lightweight resort shirts & raw denim engineered for Bangladesh. Catch the season clearance drop! ⚡ #DeenCommerce #BangladeshDenim",
      likes: 2430,
      views: "38.2K",
      comments: 142,
      permalink: "https://www.facebook.com/deencommerce",
      taggedProduct: {
        id: "14157",
        name: "Springfield Classic Shirt",
        price: 1090,
        regularPrice: 1090,
        category: "SHIRT",
        image: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
      },
    },
    {
      id: "reel_oxford_shirt",
      title: "Classic Oxford Weave - Work to Weekend",
      author: "@deencommerce",
      platform: "instagram",
      poster: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Flanel-Shirt-102-0302-041-Front.webp",
      caption: "Heavyweight pin-point Oxford weave. Mother-of-pearl buttons and tailored relaxed fit for Dhaka's climate. 👔 #DeenTailoring #OxfordShirt",
      likes: 1290,
      views: "19.4K",
      comments: 68,
      permalink: "https://www.instagram.com/deencommerce/?hl=en",
      taggedProduct: {
        id: "103",
        name: "Premium Tailored Oxford Shirt",
        price: 1750,
        regularPrice: 1950,
        category: "SHIRT",
        image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Checkmate-Executive-Formal-Shirt-102-0501-005-Front.webp",
      },
    },
    {
      id: "reel_summer_half_sleeve",
      title: "Breathable Heavyweight 240 GSM Tees",
      author: "@deencommerce",
      platform: "instagram",
      poster: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Essential-Black-T-shirt-105-0101-380-Front.webp",
      caption: "Structured drop-shoulder silhouette in 100% combed compact cotton. Minimalist essential for daily wear. ⚡ #DeenStudio #DailyApparel",
      likes: 1520,
      views: "22.1K",
      comments: 74,
      permalink: "https://www.instagram.com/deencommerce/?hl=en",
      taggedProduct: {
        id: "104",
        name: "240 GSM Heavyweight Drop-Shoulder Tee",
        price: 850,
        regularPrice: 990,
        category: "T-SHIRT",
        image: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Warm-Spice-T-shirt-105-0101-377-Front.webp",
      },
    },
  ],
};

export async function fetchSocialFeed(): Promise<SocialFeedData> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/social/feed`, {
      next: { revalidate: 300, tags: ["social", "feed"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.stories && data?.reels) {
        return data;
      }
    }
  } catch {}
  return DEFAULT_SOCIAL_FEED;
}

export interface SectionBannerItem {
  id: string;
  title: string;
  image: string;
  category: string;
  actionUrl: string;
}

const FALLBACK_SECTION_BANNERS: SectionBannerItem[] = [
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

export async function fetchSectionBanners(): Promise<SectionBannerItem[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/section-banners`, {
      next: { revalidate: 300, tags: ["section", "banners"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  return FALLBACK_SECTION_BANNERS;
}

/**
 * Fetches live campaign status and bank offers from REST API (/v1/deen/campaigns).
 */
export async function fetchCampaigns(): Promise<ActiveCampaignState | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/campaigns`, {
      cache: "no-store",
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/**
 * Fetches active bank card discounts and payment offers (/v1/deen/offers).
 */
export async function fetchBankOffers(): Promise<BankOffer[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/offers`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.bankOffers) return data.bankOffers;
    }
  } catch {}
  return [];
}

/**
 * Fetches calculated cashback from REST API (/v1/deen/cashback).
 * Returns 0 if the offer is disabled on the gateway.
 */
export async function fetchCashback(subtotal: number): Promise<{ amount: number; nextTierAt: number | null }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/cashback?subtotal=${Math.round(subtotal)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return { amount: data.cashback || 0, nextTierAt: data.nextTierAt ?? null };
    }
  } catch {}
  return { amount: 0, nextTierAt: null };
}

/**
 * Fetches live store metadata from REST API (/v1/deen/store-info).
 */
export async function fetchStoreInfo(): Promise<{
  name: string;
  description: string;
  currency: string;
  phone: string;
  email: string;
  hotline: string;
  whatsapp: string;
} | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/store-info`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/**
 * Reconcile order across gateway instances by idempotencyKey or phone (Two-Phase Reconciliation).
 */
export async function reconcileOrder(
  idempotencyKey: string,
  phone?: string
): Promise<{ reconciled: boolean; order?: OrderResult }> {
  if (!idempotencyKey && !phone) return { reconciled: false };
  const qs = new URLSearchParams();
  if (idempotencyKey) qs.set("key", idempotencyKey);
  if (phone) qs.set("phone", phone);

  const origins = Array.from(new Set([API_URL, DEFAULT_GATEWAY_URL, BACKUP_GATEWAY_URL]));

  for (const base of origins) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

      const res = await fetch(`${base}/v1/deen/orders/reconcile?${qs.toString()}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const data = (await res.json()) as { reconciled: boolean; order?: OrderResult };
        if (data && data.reconciled && data.order) {
          return data;
        }
      }
    } catch {
      // Continue checking next gateway
    }
  }
  return { reconciled: false };
}

export async function placeOrder(
  payload: OrderPayload & { idempotencyKey?: string }
): Promise<OrderResult> {
  const token = getGuestToken();
  const cleanPhone = String(payload.phone || "").replace(/[^0-9]/g, "");
  const idempotencyKey =
    payload.idempotencyKey ||
    `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Map delivery option keys to API-accepted area values
  const areaMap: Record<string, string> = {
    dhaka_standard: "dhaka",
    dhaka_express: "dhaka_express",
    outside: "outside",
    outside_standard: "outside_standard",
    store_pickup: "store_pickup",
    pickup: "pickup",
  };

  const orderPayload = {
    ...payload,
    phone: cleanPhone,
    area: areaMap[payload.area || "dhaka_standard"] || payload.area || "dhaka",
    idempotencyKey,
  };

  // When running in the browser, route through the Next.js Route Handler to shield the Gateway API key
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });
      if (res.ok) {
        return (await res.json()) as OrderResult;
      }
      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Order validation failed.");
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes("fetch")) {
        throw err;
      }
      // If Route Handler is unreachable, fall through to direct multi-origin gateway failover
    }
  }

  const origins = Array.from(new Set([API_URL, BACKUP_GATEWAY_URL]));

  let lastError: Error | null = null;

  for (const base of origins) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "x-idempotency-key": idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      if (GATEWAY_API_KEY) headers["x-api-key"] = GATEWAY_API_KEY;

      const res = await fetch(`${base}/v1/deen/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return (await res.json()) as OrderResult;
      }

      // 4xx is definitive validation/client error: DO NOT fail over or retry
      if (res.status >= 400 && res.status < 500) {
        const body = await res.text().catch(() => "");
        let cleanMsg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(body);
          if (parsed.message) cleanMsg = parsed.message;
          else if (parsed.error) cleanMsg = parsed.error;
        } catch {
          if (body) cleanMsg = body.slice(0, 150);
        }
        throw new Error(cleanMsg);
      }

      lastError = new Error(`Gateway returned ${res.status}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isDefinitiveClientError =
        err?.message &&
        !err?.name?.includes("Abort") &&
        !err?.message?.includes("failed") &&
        !err?.message?.includes("timed out") &&
        !err?.message?.includes("Network request") &&
        !err?.message?.includes("Failed to fetch");

      if (isDefinitiveClientError && !err?.message?.startsWith("HTTP 5")) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // ── TWO-PHASE RECONCILIATION ──
    // The request timed out or returned 5xx. DO NOT blindly retry POST.
    // Check if the order was created before trying the backup gateway!
    try {
      const reconciliation = await reconcileOrder(idempotencyKey, cleanPhone);
      if (reconciliation.reconciled && reconciliation.order) {
        return reconciliation.order;
      }
    } catch {}
  }

  throw lastError || new Error("Order placement failed. Please check your connection and try again.");
}

export function bdt(n: number) {
  return "৳" + n.toLocaleString("en-BD");
}

export const CATEGORIES = [
  "ALL",
  "JEANS",
  "SHIRT",
  "PANJABI",
  "T-SHIRT",
  "TROUSERS",
  "POLO",
  "ACCESSORIES",
] as const;
export type Category = (typeof CATEGORIES)[number];

/* ----------------------------- payments ---------------------------- */

export interface DeenPaymentMethod {
  id: string;
  title: string;
  description: string;
  type: "cod" | "redirect";
}

/**
 * Fetches real, enabled payment gateways from WooCommerce via Fastify gateway.
 * Source of truth = live WooCommerce settings.
 */
export async function fetchPaymentMethods(): Promise<DeenPaymentMethod[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/payment-methods`, {
      next: { revalidate: 300, tags: ["payment-methods"] },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.methods) && data.methods.length > 0) {
        return data.methods;
      }
    }
  } catch {}
  return [
    { id: "cod", title: "Cash on delivery", description: "Pay with cash upon delivery.", type: "cod" },
    { id: "bkash-for-woocommerce", title: "bKash", description: "Pay with bKash PGW.", type: "redirect" },
    { id: "sslcommerz", title: "Debit / Credit Card (SSLCommerz)", description: "Pay securely through SSLCommerz.", type: "redirect" },
  ];
}

export async function initiatePayment(
  orderId: string,
  paymentMethod: "bkash" | "card" | "online",
  amount?: number
): Promise<{ success: boolean; transaction?: Record<string, unknown>; merchantNumber: string; instruction: string; verificationUrl: string }> {
  const res = await apiFetch(`${API_URL}/v1/deen/payments/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, paymentMethod, amount }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Payment initiation failed");
  }
  return res.json();
}

export async function verifyPayment(
  orderId: string,
  trxId: string,
  paymentMethod: "bkash" | "card" | "online" = "bkash",
  senderPhone?: string
): Promise<{ success: boolean; message: string; order?: OrderResult }> {
  const res = await apiFetch(`${API_URL}/v1/deen/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, trxId, paymentMethod, senderPhone }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Payment verification failed");
  }
  return res.json();
}

/* --------------------------- Pathao tracking ---------------------------- */

export interface PathaoStep {
  timestamp: string;
  status: string;
  label: string;
  location?: string;
  completed: boolean;
  current: boolean;
}

export interface PathaoTrackingResult {
  success: boolean;
  consignmentId: string;
  summary: string;
  status: string;
  steps: PathaoStep[];
  trackingUrl: string;
  lastUpdated: string;
  message?: string;
}

/**
 * Fetch live Pathao tracking info by consignment ID.
 * Calls GET /v1/deen/pathao/track/:consignmentId on the gateway.
 */
export async function fetchPathaoTracking(consignmentId: string): Promise<PathaoTrackingResult> {
  const cleanId = String(consignmentId || "").trim();
  if (!cleanId) {
    return {
      success: false,
      consignmentId: "",
      summary: "Invalid consignment ID",
      status: "unknown",
      steps: [],
      trackingUrl: "",
      lastUpdated: new Date().toISOString(),
      message: "Consignment ID cannot be empty",
    };
  }
  const res = await apiFetch(`${API_URL}/v1/deen/pathao/track/${encodeURIComponent(cleanId)}`);
  return res.json();
}

/* --------------------------- Social Auth (Google / Facebook) ---------------------------- */

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "customer" | "admin";
  accountType?: "customer" | "admin" | "guest";
  phone?: string;
  wpUserId?: number;
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
  isNewCustomer?: boolean;
}

export async function loginWithGoogle(
  idToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, email, name }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Authentication failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Google sign-in network error." };
  }
}

export async function loginWithFacebook(
  accessToken?: string,
  email?: string,
  name?: string
): Promise<AuthResult> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/facebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, email, name }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Authentication failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Facebook sign-in network error." };
  }
}

export async function loginCustomer(
  identifier: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: any; name?: string; email?: string; role?: string; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Login failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Sign in network error. Please check your connection." };
  }
}

export async function registerCustomer(
  name: string,
  phone: string,
  password: string,
  email?: string
): Promise<{ success: boolean; token?: string; user?: any; name?: string; role?: string; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: phone.trim(),
        name: name.trim(),
        phone: phone.trim(),
        password,
        email: email?.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok && !data.message) {
      return { success: false, message: data.error || `Registration failed (HTTP ${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Registration network error. Please check your connection." };
  }
}

export async function changePassword(payload: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
  identifier?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("deen_web_guest_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await apiFetch(`${API_URL}/v1/auth/change-password`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Password update failed. Please try again." };
  }
}

export async function updateCustomerProfile(profileData: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
}): Promise<{ success: boolean; message: string; profile?: any }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("deen_web_guest_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await apiFetch(`${API_URL}/v1/auth/update-profile`, {
      method: "POST",
      headers,
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to update profile." };
  }
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; code?: string; amount?: number; type?: "fixed" | "percent"; description?: string; message?: string }> {
  try {
    const clean = code.trim().toUpperCase();
    const res = await apiFetch(`${API_URL}/v1/deen/coupon/${encodeURIComponent(clean)}`);
    return await res.json();
  } catch (err: any) {
    return { valid: false, message: "Could not verify coupon." };
  }
}

/* ------------------------- outlets (source of truth = gateway env) ---- */

export interface Outlet {
  id: string;
  name: string;
  tag?: string;
  address: string;
  hours: string;
  phone: string;
  mapQuery?: string;
  pickup?: boolean;
  stockText?: string;
  units?: number;
}

export const DEFAULT_OUTLETS: Outlet[] = [];

/** Fetch physical retail outlets from the gateway. */
export async function fetchOutlets(): Promise<Outlet[]> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/outlets`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.outlets) && data.outlets.length > 0) {
        return data.outlets;
      }
    }
  } catch {}
  return DEFAULT_OUTLETS;
}

/* ------------------------- app settings (business rules) ------------ */

export interface AppSettings {
  cashbackTiers: {
    enabled: boolean;
    tier1: { minSpend: number; cashback: number };
    tier2: { minSpend: number; cashback: number };
  };
  exchangeFees: { insideDhaka: number; outsideDhaka: number };
  freeTeeThreshold: number;
  bogo: { rule: string; minItems: number };
  contact: { hotline: string; whatsapp: string; bkash: string; email: string };
}

/** Fetch app-wide business settings from the gateway. */
export async function fetchAppSettings(): Promise<AppSettings | null> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/settings`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/** Submit a return / exchange request to the gateway. */
export async function submitReturnRequest(payload: {
  orderId: string;
  orderNumber: string;
  phone: string;
  reason: string;
  details: string;
  items: any[];
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error submitting return request." };
  }
}

/* ------------------------- customer comments & reviews ------------ */

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

export interface ProductCommentsResponse {
  productId: number | string;
  comments: ProductComment[];
  count: number;
  averageRating: number;
}

export interface SubmitCommentPayload {
  authorName: string;
  authorEmail?: string;
  content: string;
  rating?: number;
}

export interface SubmitCommentResponse {
  success: boolean;
  comment: ProductComment;
  message: string;
}

/** Fetch published customer comments & reviews for a product. */
export async function fetchProductComments(productId: string | number): Promise<ProductCommentsResponse> {
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/products/${productId}/comments`, {
      cache: "no-store",
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`[api] fetchProductComments failed:`, err);
  }
  return {
    productId,
    comments: [],
    count: 0,
    averageRating: 5,
  };
}

/** Submit a new customer review / comment to WordPress. */
export async function submitProductComment(
  productId: string | number,
  payload: SubmitCommentPayload
): Promise<SubmitCommentResponse> {
  const res = await apiFetch(`${API_URL}/v1/deen/products/${productId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to submit review (HTTP ${res.status})`);
  }
  return await res.json();
}

/* -------- WooCommerce Category Hierarchy (Web) -------- */

export interface WooCategoryNode {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: string | null;
  children: WooCategoryNode[];
}

let _webCategoryTreeCache: { at: number; data: WooCategoryNode[] } | null = null;
const WEB_TREE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the live WooCommerce category tree via the gateway.
 * Used to populate sub-category filter chips in ShopClient.
 */
export async function fetchCategoryTree(): Promise<WooCategoryNode[]> {
  if (_webCategoryTreeCache && Date.now() - _webCategoryTreeCache.at < WEB_TREE_TTL) {
    return _webCategoryTreeCache.data;
  }
  try {
    const res = await apiFetch(`${API_URL}/v1/deen/categories/tree`);
    if (res.ok) {
      const tree = await res.json() as WooCategoryNode[];
      if (Array.isArray(tree) && tree.length > 0) {
        _webCategoryTreeCache = { at: Date.now(), data: tree };
        return tree;
      }
    }
  } catch {}
  return _webCategoryTreeCache?.data ?? [];
}

/**
 * Returns sub-categories for a given top-level category name.
 * e.g. "JEANS" → ["Regular Fit", "Slim Fit"]
 */
export async function fetchSubCategories(categoryName: string): Promise<WooCategoryNode[]> {
  const tree = await fetchCategoryTree();
  const upper = categoryName.toUpperCase().replace(/_/g, " ");

  const aliasMap: Record<string, string[]> = {
    "JEANS": ["JEANS"],
    "T-SHIRT": ["T-SHIRTS", "T-SHIRT"],
    "SHIRT": ["SHIRTS", "SHIRT"],
    "POLO": ["POLO SHIRTS", "POLO"],
    "PANJABI": ["PANJABI"],
    "TROUSERS": ["TROUSERS"],
    "ACCESSORIES": ["ACCESSORIES"],
    "SWEATSHIRTS": ["SWEATSHIRTS"],
    "DEEN_SELECT": ["DEEN SELECT"],
    "DEEN SELECT": ["DEEN SELECT"],
  };
  const aliases = aliasMap[upper] ?? [upper];

  for (const root of tree) {
    const rootUpper = root.name.toUpperCase();
    if (aliases.some((a) => rootUpper === a || rootUpper.includes(a))) {
      return root.children;
    }
  }
  return [];
}


