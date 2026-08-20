/* ------------------------------------------------------------------ */
/*  DEEN — deencommerce.com                                            */
/*  দেশের প্রথম ডেনিম ব্র্যান্ড · Bangladesh's first denim brand          */
/*                                                                     */
/*  Catalog mirrored from the live WooCommerce store, served through   */
/*  the simulated middle API layer (Woo REST v3 in production).        */
/*  Prices in ৳ BDT. Payments: COD · bKash · Nagad.                    */
/* ------------------------------------------------------------------ */

export type DeenCategory = "JEANS" | "PANJABI" | "SHIRT" | "T-SHIRT" | "TROUSERS" | "POLO" | "ACCESSORIES";

export interface DeenProduct {
  id: string;
  sku: string;
  name: string;
  category: DeenCategory;
  price: number;
  salePrice?: number;
  sizes: string[];
  images: [string, string];
  fabric: string;
  blurb: string;
  isNew?: boolean;
}

export interface DeenCartItem {
  productId: string;
  size: string;
  qty: number;
}

export type DeenPayment = "cod" | "bkash" | "nagad";
export type DeenArea = "dhaka" | "outside";
export type DeenOrderStatus = "received" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface DeenOrderLine {
  productId: string;
  name: string;
  sku: string;
  size: string;
  qty: number;
  unit: number;
  gift?: boolean;
}

export interface DeenOrder {
  id: string;
  number: string;
  name: string;
  phone: string;
  address: string;
  area: DeenArea;
  payment: DeenPayment;
  lines: DeenOrderLine[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  delivery: number;
  total: number;
  status: DeenOrderStatus;
  createdAt: string;
}

/* ---------------- reviews ---------------- */

export interface DeenReview {
  id: string;
  productId: string;
  name: string;
  stars: number;
  text: string;
  ts: number;
}

/* ---------------- auth session ---------------- */

export interface DeenSession {
  name: string;
  phone: string;
  exp: number;
  provider: "password" | "otp" | "google" | "facebook";
  providers: string[];
  email?: string;
}

export interface DeenProfile {
  name: string;
  phone: string;
  jeansSize: string;
  topSize: string;
  pushOrders: boolean;
  pushPromos: boolean;
}

export const HERO_IMG =
  "https://image.qwenlm.ai/generated-images/6632ddf9-2268-4bf4-aee4-f16c6a71bf78/_result.png";

export const FREE_TEE_THRESHOLD = 3500;
export const DELIVERY_FEES: Record<DeenArea, number> = { dhaka: 70, outside: 130 };

export const bdt = (n: number) => `৳${n.toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ */
/*  live catalog — mirrored from deencommerce.com (WooCommerce)        */
/* ------------------------------------------------------------------ */

const CDN = "https://image.deencommerce.com/wp-content/uploads";

function p(
  id: string,
  sku: string,
  name: string,
  category: DeenCategory,
  price: number,
  salePrice: number | undefined,
  sizes: string[],
  a: string,
  b: string,
  fabric: string,
  blurb: string,
  isNew = false
): DeenProduct {
  return { id, sku, name, category, price, salePrice, sizes, images: [`${CDN}/${a}`, `${CDN}/${b}`], fabric, blurb, isNew };
}

const waist = ["30", "32", "34", "36", "38"];
const tops = ["M", "L", "XL", "2XL", "3XL"];
const panjabi = ["38", "40", "42", "44", "46"];

export const DEEN_CATALOG: DeenProduct[] = [
  // —— JEANS (101-) —— Blue Label collection
  p("j1", "101-0100-149", "High-End Raw Washed Jeans – Slim Fit", "JEANS", 2490, 1743, waist, "2026/07/101-0100-149-Front-760x1100.jpg", "2026/07/101-0100-149-Back-760x1100.jpg", "13.5 oz premium denim, raw wash", "The signature Blue Label jean. Rich raw wash, clean slim silhouette, built to fade with you.", true),
  p("j2", "101-0100-151", "High-End Vintage Wash Jeans – Slim Fit", "JEANS", 2590, 1813, ["32", "34", "36", "38"], "2026/07/101-0100-151-Front-760x1100.jpg", "2026/07/101-0100-151-Back-760x1100.jpg", "13 oz denim, vintage wash", "Broken-in vintage wash with a modern slim cut. Comfortable at the waist, versatile everywhere.", true),
  p("j3", "101-0100-150", "High-End Whisker Faded Jeans – Slim Fit", "JEANS", 2490, undefined, waist, "2026/07/101-0100-150-Front-760x1100.jpg", "2026/07/101-0100-150-Back-760x1100.jpg", "13 oz denim, whisker fade", "Hand-finished whisker fades over a durable slim frame. Casual to smart-casual in one pair.", true),
  p("j4", "101-0200-151", "High-End Whisker Faded Jeans – Regular Fit", "JEANS", 2490, undefined, ["32", "34", "36", "38"], "2026/02/101-0200-151-Front-flat-image-760x1100.jpg", "2026/02/101-0200-151-model-760x1100.jpg", "13 oz denim, whisker fade", "The same whisker fade in an easy regular fit — room where you want it.", true),

  // —— SHIRTS (102-) —— half sleeve, cuban, formal
  p("s1", "102-0301-013", "White Microprint Casual Half Shirt", "SHIRT", 1325, 1060, tops, "2026/06/102-0301-013-Flat-Front-760x1100.jpg", "2026/06/102-0301-013-Close-shot-760x1100.jpg", "Cotton microprint poplin", "Crisp white poplin with a fine microprint. Breathable, sharp, summer-ready.", true),
  p("s2", "102-0301-004", "White Casual Half Shirt", "SHIRT", 1180, 944, tops, "2026/06/102-0301-004-Flat-Front-760x1100.jpg", "2026/06/102-0301-004-Close-shot-760x1100.jpg", "Soft cotton twill", "The everyday white half shirt — clean lines, easy drape.", true),
  p("s3", "102-0301-012", "Grey Blush Casual Half Shirt", "SHIRT", 1450, 1160, ["M", "L"], "2026/05/102-0301-012-Flat-Front-760x1100.jpg", "2026/05/102-0301-012-Close-shot-760x1100.jpg", "Brushed cotton", "A muted grey-blush tone that pairs with everything in your rotation."),
  p("s4", "102-0301-001", "Burgundy Floral Casual Half Shirt", "SHIRT", 1450, 1160, ["M", "L"], "2026/05/102-0301-001-flat-front-760x1100.jpg", "2026/05/102-0301-001-Close-shot-760x1100.jpg", "Cotton floral jacquard", "Deep burgundy floral for evenings that call for something more."),
  p("s5", "102-0302-005", "Tropical Cuban Collar Shirt", "SHIRT", 1180, 944, tops, "2026/05/102-0302-005-Front-760x1100.jpg", "2026/05/102-0302-005-Model-Close-shot-760x1100.jpg", "Light viscose blend", "Summer Cuban Drop — open collar, tropical print, zero effort.", true),
  p("s6", "102-0302-008", "Floral Cuban Collar Shirt", "SHIRT", 1325, 1060, tops, "2026/05/102-0302-008-Front-760x1100.jpg", "2026/05/102-0302-008-Model-Close-shot-760x1100.jpg", "Light viscose blend", "Bold floral over a relaxed camp collar. Built for heat.", true),
  p("s7", "102-0302-006", "Pinstripe Cuban Collar Shirt", "SHIRT", 1325, 1060, tops, "2026/05/102-0302-006-Front-760x1100.jpg", "2026/05/102-0302-006-Model-Close-shot-760x1100.jpg", "Pinstripe cotton blend", "Tailoring energy, summer attitude. Pinstripe cuban that dresses up or down.", true),
  p("s8", "102-0302-001", "Paisley Cuban Collar Shirt", "SHIRT", 1450, 1160, ["M", "L", "XL", "2XL"], "2026/05/102-0302-001-Front-760x1100.jpg", "2026/05/102-0302-001-1-760x1100.webp", "Paisley jacquard cotton", "Classic paisley reworked on a camp collar silhouette."),
  p("s9", "102-0501-002", "Striped Executive Formal Shirt", "SHIRT", 1190, 952, tops, "2026/04/102-0501-002-Flat-Front-n-760x1100.jpg", "2026/04/102-0501-002-close-shot-n-760x1100.jpg", "Easy-iron cotton blend", "Minimal design, maximum impact. Boardroom-grade stripe."),
  p("s10", "102-0501-001", "Striped Executive Formal Shirt", "SHIRT", 1190, 952, tops, "2026/04/102-0501-001-Flat-Front-760x1100.jpg", "2026/04/102-0501-001-close-shot-760x1100.jpg", "Easy-iron cotton blend", "The second stripe of the Executive series — slightly deeper tone."),

  // —— PANJABI (106-) —— 100% breathable cotton jacquard
  p("pn1", "106-0101-132", "Edward Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44", "46"], "2026/08/106-0101-132-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-132-Close-shot-760x1100.jpg", "Cotton jacquard, coconut buttons", "Fine embroidery on breathable cotton jacquard. Regular fit, elegant finish.", true),
  p("pn2", "106-0101-114", "Motif Printed Semi Formal Panjabi", "PANJABI", 2590, 1295, panjabi, "2026/03/106-0101-114-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-114-Model-1-760x1100.jpg", "Printed cotton jacquard", "All-over motif print with coconut buttons — effortless festivity."),
  p("pn3", "106-0101-120", "Paisley Printed Semi Formal Panjabi", "PANJABI", 2490, 1245, panjabi, "2026/03/106-0101-120-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-120-Close-shot-1-760x1100.jpg", "Paisley cotton jacquard", "Timeless paisley, summer-weight weave."),
  p("pn4", "106-0101-134", "Arrowtown Embroidered Panjabi", "PANJABI", 3190, 1595, ["42", "44", "46"], "2026/08/106-0101-134-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-134-close-shot-760x1100.jpg", "Premium embroidered jacquard", "The statement piece of the season — dense embroidery, clean drape.", true),
  p("pn5", "106-0101-111", "Grey Floral Semi Formal Panjabi", "PANJABI", 2490, 1245, panjabi, "2026/03/106-0101-111-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-111-Model-1-760x1100.jpg", "Floral cotton jacquard", "Understated grey floral for daytime occasions."),
  p("pn6", "106-0101-133", "Mocha Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44"], "2026/08/106-0101-133-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-133-close-shot-760x1100.jpg", "Embroidered cotton jacquard", "Warm mocha base with tonal embroidery.", true),
  p("pn7", "106-0101-110", "Green Printed Semi Formal Panjabi", "PANJABI", 2490, 1245, panjabi, "2026/03/106-0101-110-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-110-Model-1-760x1100.jpg", "Printed cotton jacquard", "Deep green print, all-day breathable comfort."),
  p("pn8", "106-0101-131", "Smooth Beige Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44", "46"], "2026/08/106-0101-131-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-131-Model-760x1100.jpg", "Embroidered cotton jacquard", "Soft beige canvas, precise embroidery."),
  p("pn9", "106-0101-135", "White Beige Embroidered Panjabi", "PANJABI", 3190, 1595, ["42", "44", "46"], "2026/03/106-0101-135-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-135-1-760x1100.jpg", "Premium embroidered jacquard", "Ivory-white elegance for the biggest days.", true),

  // —— T-SHIRTS (105-) ——
  p("t1", "105-0201-032", "Full Sleeve White Stripe T-shirt", "T-SHIRT", 728, 364, ["3XL"], "2025/12/105-0201-032-full-sleeve-t-shirt-Model-for-web-760x1100.jpg", "2025/12/105-0201-032-Front-760x1100.jpg", "Combed cotton jersey", "Nautical stripe, full sleeve, easy fit."),
  p("t2", "DCFST024", "Full Sleeve Brown T-shirt – Cotton Blend", "T-SHIRT", 599, 300, ["2XL"], "2024/11/DCFST024-Front-760x1100.webp", "2024/11/DCFST024-Close-760x1100.webp", "Cotton-poly blend", "Earthy brown staple with a soft hand-feel."),
  p("t3", "105-0101-375", "Earth Hemp T-shirt", "T-SHIRT", 590, 472, ["L", "XL", "2XL", "3XL"], "2026/02/105-0101-375-Earth-Hemp-T-shirt-Front-760x1100.jpg", "2026/02/105-0101-375-Earth-Hemp-T-shirt-Back-760x1100.jpg", "Hemp-cotton blend", "Sustainable hemp blend that gets softer every wash."),
  p("t4", "105-0301-005", "Urban Ride Print Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["L"], "2026/03/105-0301-005-Front-760x1100.jpg", "2026/03/105-0301-005-Back-760x1100.jpg", "Heavy 220gsm cotton", "Boxy drop shoulder with an urban back print.", true),
  p("t5", "105-0301-009", "Deep Violet Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["L", "XL", "3XL"], "2026/03/105-0301-009-product-760x1100.jpg", "2026/03/105-0301-009-Back-760x1100.jpg", "Heavy 220gsm cotton", "Deep violet, relaxed drape, clean finish.", true),
  p("t6", "105-0301-008", "Crew Graphic Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["XL", "2XL", "3XL"], "2026/03/105-0301-008-Product-760x1100.jpg", "2026/03/105-0301-008-Back-760x1100.jpg", "Heavy 220gsm cotton", "Crew-neck graphic tee with a streetwear cut."),
  p("t7", "105-0401-005", "Sable Relaxed Graphic Tank Top", "T-SHIRT", 540, 432, ["L"], "2026/03/105-0401-005-web-760x1100.jpg", "2026/03/105-0401-005-model-760x1100.jpg", "Breathable cotton tank", "Sable-toned tank for the hottest months."),
  p("t8", "105-0401-004", "Orlando Relaxed Graphic Tank Top", "T-SHIRT", 640, 512, ["2XL"], "2026/03/105-0401-004-760x1100.jpg", "2026/03/105-0401-004-Model-Image-760x1100.jpg", "Breathable cotton tank", "Orlando graphic, easy summer layering."),
  p("t9", "105-0401-009", "Gravity Relaxed Graphic Tank Top", "T-SHIRT", 590, 472, ["L", "XL"], "2026/03/105-0401-009-760x1100.jpg", "2026/03/105-0401-009-Model-Image-760x1100.jpg", "Breathable cotton tank", "Gravity print, featherweight build."),

  // —— TROUSERS (110-) ——
  p("tr1", "110-0101-010", "Sky Blue Trousers", "TROUSERS", 998, 499, ["M", "L", "XL", "2XL"], "2025/11/sky-blue1-760x1100.jpg", "2025/11/110-0101-010-model-front-760x1100.jpg", "Stretch cotton twill", "Smart-casual chino in a cool sky blue."),
  p("tr2", "110-0101-013", "Maroon Trousers", "TROUSERS", 998, 499, ["L", "XL", "2XL"], "2025/11/meroon-760x1100.jpg", "2025/11/110-0101-013-model-front-760x1100.jpg", "Stretch cotton twill", "Rich maroon twill with a tapered leg."),
  p("tr3", "110-0101-015", "Teal Trousers", "TROUSERS", 998, 499, ["L", "XL", "2XL"], "2025/11/fest-760x1100.jpg", "2025/11/110-0101-015-model-front-760x1100.jpg", "Stretch cotton twill", "Festive teal for looks that stand out."),
  p("tr4", "110-0101-012", "Brown Trousers", "TROUSERS", 998, 499, ["L", "XL"], "2025/11/110-0101-012-Front--760x1100.jpg", "2025/11/110-0101-012-model-front-760x1100.jpg", "Stretch cotton twill", "Classic brown, office to evening."),

  // —— POLO ——
  p("po1", "DCPS112", "Green Stripe Polo Shirt", "POLO", 998, 798, ["L", "2XL"], "2025/05/DCPS112-Front-copy-1-760x1100.webp", "2025/05/DCPS112-Close-copy-1-760x1100.webp", "Piqué cotton", "Club-collar green stripe polo."),

  // —— ACCESSORIES (109-) ——
  p("a1", "109-0101-068", "DEEN Trifold Genuine Leather Wallet", "ACCESSORIES", 849, undefined, ["OS"], "2025/06/Deen-Trifold-Walet-Front-68-copy-760x1100.webp", "2025/06/Deen-Trifold-Walet-Back-68-copy-760x1100.webp", "Genuine leather", "Full-grain trifold, ages beautifully."),
  p("a2", "109-0104-004", "Compact Genuine Leather Card Holder", "ACCESSORIES", 590, undefined, ["OS"], "2026/04/109-0104-004-Front-760x1100.jpg", "2026/04/109-0104-004-Inside-760x1100.jpg", "Genuine leather", "Slim card holder for the minimal pocket.", true),
  p("a3", "109-0201-001", "France World Cup Edition Bottle", "ACCESSORIES", 498, undefined, ["OS"], "2026/06/France-760x1100.jpg", "2026/06/France-760x1100.jpg", "Aluminium, 750 ml", "Match-day aluminium bottle — France edition.", true),
  p("a4", "109-0201-002", "Argentina World Cup Edition Bottle", "ACCESSORIES", 498, undefined, ["OS"], "2026/06/Argentina-1-760x1100.jpg", "2026/06/Argentina-1-760x1100.jpg", "Aluminium, 750 ml", "Match-day aluminium bottle — Argentina edition.", true),
  p("a5", "109-0301-001", "Breathable Face Mask", "ACCESSORIES", 280, undefined, ["OS"], "2025/02/Breathable-Face-Mask-760x1100.webp", "2025/02/Breathable-Face-Mask-2nd-760x1140.webp", "Washable cotton layers", "Reusable, breathable, everyday protection."),
];

export const DEEN_CATEGORIES: DeenCategory[] = ["JEANS", "PANJABI", "SHIRT", "T-SHIRT", "TROUSERS", "POLO", "ACCESSORIES"];

/* ------------------------------------------------------------------ */
/*  gateway telemetry                                                  */
/* ------------------------------------------------------------------ */

export interface DeenRequest {
  id: string;
  ts: number;
  method: string;
  path: string;
  status: number;
  ms: number;
}

const listeners = new Set<(r: DeenRequest) => void>();
export function subscribeDeenApi(cb: (r: DeenRequest) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let seq = 0;
async function req(method: string, path: string, status = 200): Promise<void> {
  const ms = Math.round(160 + Math.random() * 300);
  await new Promise((r) => setTimeout(r, ms));
  const r: DeenRequest = { id: `dn-${++seq}-${Date.now()}`, ts: Date.now(), method, path, status, ms };
  listeners.forEach((l) => l(r));
}

/* ------------------------------------------------------------------ */
/*  persisted state                                                    */
/* ------------------------------------------------------------------ */

const KEYS = { orders: "deen.orders.v1", profile: "deen.profile.v1" };

function load<T>(key: string, fb: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fb;
}
function save(key: string, v: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const SEED_ORDERS: DeenOrder[] = [
  {
    id: "d-seed-1",
    number: "DC-1041",
    name: "Rafiq Hasan",
    phone: "01712345678",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
    area: "dhaka",
    payment: "cod",
    lines: [
      { productId: "j3", name: "High-End Whisker Faded Jeans – Slim Fit", sku: "101-0100-150", size: "32", qty: 1, unit: 2490 },
    ],
    subtotal: 2490,
    discount: 0,
    delivery: 70,
    total: 2560,
    status: "delivered",
    createdAt: daysAgo(9),
  },
];

let orders: DeenOrder[] = load(KEYS.orders, SEED_ORDERS);

export const DEFAULT_PROFILE: DeenProfile = {
  name: "Rafiq Hasan",
  phone: "01712345678",
  jeansSize: "32",
  topSize: "L",
  pushOrders: true,
  pushPromos: false,
};

export function getDeenProfile(): DeenProfile {
  return load(KEYS.profile, DEFAULT_PROFILE);
}
export function saveDeenProfile(p: DeenProfile) {
  save(KEYS.profile, p);
}

/* ------------------------------------------------------------------ */
/*  public API                                                         */
/* ------------------------------------------------------------------ */

export async function deenListProducts(): Promise<DeenProduct[]> {
  await req("GET", "/v1/deen/products");
  return DEEN_CATALOG;
}

export async function deenCreateOrder(payload: {
  name: string;
  phone: string;
  address: string;
  area: DeenArea;
  payment: DeenPayment;
  items: DeenCartItem[];
  couponCode?: string;
}): Promise<DeenOrder> {
  if (!payload.name.trim()) {
    await req("POST", "/v1/deen/orders", 422);
    throw new Error("Name is required.");
  }
  if (!/^01[3-9]\d{8}$/.test(payload.phone.replace(/[^0-9]/g, ""))) {
    await req("POST", "/v1/deen/orders", 422);
    throw new Error("Enter a valid BD mobile number — 01XXXXXXXXX.");
  }
  if (payload.address.trim().length < 12) {
    await req("POST", "/v1/deen/orders", 422);
    throw new Error("Full delivery address required (house, road, area).");
  }
  if (payload.items.length === 0) {
    await req("POST", "/v1/deen/orders", 422);
    throw new Error("Your bag is empty.");
  }

  const lines: DeenOrderLine[] = payload.items.map((it) => {
    const prod = DEEN_CATALOG.find((x) => x.id === it.productId);
    if (!prod) throw new Error("A product in your bag is no longer available.");
    const unit = prod.salePrice ?? prod.price;
    return { productId: prod.id, name: prod.name, sku: prod.sku, size: it.size, qty: it.qty, unit };
  });

  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  if (subtotal >= FREE_TEE_THRESHOLD) {
    lines.push({ productId: "gift-tee", name: "Free Cotton T-shirt · Summer Fest", sku: "GIFT-TEE", size: "—", qty: 1, unit: 0, gift: true });
  }
  const delivery = DELIVERY_FEES[payload.area];

  let discount = 0;
  let couponCode: string | undefined;
  if (payload.couponCode) {
    try {
      const v = await deenValidateCoupon(payload.couponCode, subtotal);
      discount = v.discount;
      couponCode = v.code;
    } catch (e) {
      await req("POST", "/v1/deen/orders", 422);
      throw e;
    }
  }

  await req("POST", "/v1/deen/orders", 201);

  const order: DeenOrder = {
    id: `d-${Date.now()}`,
    number: `DC-${1041 + orders.length}`,
    name: payload.name.trim(),
    phone: (getDeenSession()?.phone ?? payload.phone).trim(),
    address: payload.address.trim(),
    area: payload.area,
    payment: payload.payment,
    lines,
    subtotal,
    discount,
    couponCode,
    delivery,
    total: subtotal - discount + delivery,
    status: "received",
    createdAt: new Date().toISOString(),
  };
  orders = [order, ...orders];
  save(KEYS.orders, orders);
  return order;
}

export async function deenListOrders(): Promise<DeenOrder[]> {
  await req("GET", "/v1/deen/orders?mine=true");
  const s = getDeenSession();
  const owner = s?.phone ?? demoAccount.phone;
  const mine = orders.filter((o) => o.phone === owner);
  return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const PAYMENT_LABELS: Record<DeenPayment, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
};

export const ORDER_FLOW: DeenOrderStatus[] = ["received", "confirmed", "shipped", "delivered"];

/* ------------------------------------------------------------------ */
/*  auth — register / login / session (JWT stand-in, SecureStore)      */
/* ------------------------------------------------------------------ */

interface DeenUserRecord {
  name: string;
  phone: string;
  pass: string;
}

const AKEYS = { users: "deen.users.v1", session: "deen.session.v1" };

const SEED_USERS: DeenUserRecord[] = [{ name: "Rafiq Hasan", phone: "01712345678", pass: "deen123" }];

function users(): DeenUserRecord[] {
  return load(AKEYS.users, SEED_USERS);
}

export function getDeenSession(): DeenSession | null {
  const s = load<DeenSession | null>(AKEYS.session, null);
  if (!s) return null;
  if (s.exp < Date.now()) {
    try {
      window.localStorage.removeItem(AKEYS.session);
    } catch {
      /* ignore */
    }
    return null;
  }
  if (!Array.isArray(s.providers)) {
    s.providers = [s.provider ?? "password"];
  }
  return s;
}

export function deenLogout(): void {
  try {
    window.localStorage.removeItem(AKEYS.session);
  } catch {
    /* ignore */
  }
}

function issueSession(name: string, phone: string, provider: DeenSession["provider"], email?: string): DeenSession {
  const s: DeenSession = { name, phone, exp: Date.now() + 7 * 86400000, provider, providers: [provider], email };
  save(AKEYS.session, s);
  return s;
}

export async function deenLogin(phone: string, pass: string): Promise<DeenSession> {
  await req("POST", "/v1/deen/auth/login");
  const clean = phone.replace(/[^0-9]/g, "");
  const u = users().find((x) => x.phone === clean && x.pass === pass);
  if (!u) throw new Error("No account matches that number and password.");
  return issueSession(u.name, u.phone, "password");
}

export async function deenRegister(name: string, phone: string, pass: string): Promise<DeenSession> {
  await req("POST", "/v1/deen/auth/register", 201);
  const clean = phone.replace(/[^0-9]/g, "");
  if (!/^01[3-9]\d{8}$/.test(clean)) throw new Error("Enter a valid BD mobile number — 01XXXXXXXXX.");
  if (name.trim().length < 2) throw new Error("Please enter your full name.");
  if (pass.length < 4) throw new Error("Password needs at least 4 characters.");
  const all = users();
  if (all.some((x) => x.phone === clean)) throw new Error("That number is already registered — try logging in.");
  const next = [...all, { name: name.trim(), phone: clean, pass }];
  save(AKEYS.users, next);
  return issueSession(name.trim(), clean, "password");
}

export const demoAccount = { phone: "01712345678", pass: "deen123" };

/* ------------------------------------------------------------------ */
/*  phone OTP — code arrives "via SMS" on the device's SMS bus         */
/* ------------------------------------------------------------------ */

const OTPKEY = "deen.otp.v1";

interface OtpRecord {
  code: string;
  exp: number;
}

function otpStore(): Record<string, OtpRecord> {
  return load(OTPKEY, {});
}

export interface DeenSms {
  id: string;
  ts: number;
  phone: string;
  code: string;
}

const smsListeners = new Set<(s: DeenSms) => void>();
export function subscribeDeenSms(cb: (s: DeenSms) => void): () => void {
  smsListeners.add(cb);
  return () => {
    smsListeners.delete(cb);
  };
}

export async function deenSendOtp(phone: string): Promise<void> {
  const clean = phone.replace(/[^0-9]/g, "");
  if (!/^01[3-9]\d{8}$/.test(clean)) {
    await req("POST", "/v1/deen/auth/otp/send", 422);
    throw new Error("Enter a valid BD mobile number — 01XXXXXXXXX.");
  }
  await req("POST", "/v1/deen/auth/otp/send");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const store = otpStore();
  store[clean] = { code, exp: Date.now() + 5 * 60000 };
  save(OTPKEY, store);
  // the code is never returned over HTTP — it is delivered out-of-band via SMS
  window.setTimeout(() => {
    const sms: DeenSms = { id: `sms-${Date.now()}`, ts: Date.now(), phone: clean, code };
    smsListeners.forEach((l) => l(sms));
  }, 1400 + Math.random() * 600);
}

export async function deenVerifyOtp(phone: string, code: string): Promise<DeenSession> {
  await req("POST", "/v1/deen/auth/otp/verify");
  const clean = phone.replace(/[^0-9]/g, "");
  const store = otpStore();
  const rec = store[clean];
  if (!rec) throw new Error("No code was requested for this number — send a new one.");
  if (rec.exp < Date.now()) {
    delete store[clean];
    save(OTPKEY, store);
    throw new Error("That code expired. Request a fresh one.");
  }
  if (rec.code !== code.trim()) throw new Error("That code doesn't match. Check the SMS and try again.");
  delete store[clean];
  save(OTPKEY, store);
  const known = users().find((u) => u.phone === clean);
  return issueSession(known?.name ?? "DEEN Customer", clean, "otp");
}

/* ------------------------------------------------------------------ */
/*  social sign-in — Google & Facebook (OAuth round-trips, simulated)  */
/* ------------------------------------------------------------------ */

export interface SocialAccount {
  provider: "google" | "facebook";
  name: string;
  email: string;
  phone: string;
}

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  { provider: "google", name: "Kai Tanaka", email: "kai.tanaka@gmail.com", phone: "01811112222" },
  { provider: "google", name: "Rafiq Hasan", email: "rafiq.hasan@gmail.com", phone: "01712345678" },
  { provider: "facebook", name: "Rafiq Hasan", email: "rafiq.hasan@facebook.com", phone: "01712345678" },
];

export async function deenSocialLogin(account: SocialAccount): Promise<DeenSession> {
  const existing = getDeenSession();
  if (!existing) {
    await req("POST", `/v1/deen/auth/${account.provider}`, 403);
    throw new Error("Verify your phone first — Google & Facebook link onto a phone-verified account from Profile.");
  }
  await req("POST", `/v1/deen/auth/${account.provider}`);
  return issueSession(account.name, account.phone, account.provider, account.email);
}

/* ------------------------------------------------------------------ */
/*  social account linking (completes a phone-verified profile)        */
/* ------------------------------------------------------------------ */

export async function deenLinkSocial(provider: "google" | "facebook", account: SocialAccount): Promise<DeenSession> {
  await req("POST", `/v1/deen/auth/link/${provider}`);
  const s = getDeenSession();
  if (!s) throw new Error("Sign in with your phone first — then link accounts.");
  const providers = Array.from(new Set([...(s.providers ?? [s.provider]), provider]));
  const next: DeenSession = { ...s, providers, email: s.email ?? account.email };
  save(AKEYS.session, next);
  return next;
}

/* ------------------------------------------------------------------ */
/*  loyalty — 1 point per ৳10 spent on non-cancelled orders            */
/* ------------------------------------------------------------------ */

export const DEEN_TIERS: { name: string; min: number; perk: string }[] = [
  { name: "Bronze", min: 0, perk: "Birthday surprise coupon" },
  { name: "Silver", min: 300, perk: "Free delivery inside Dhaka" },
  { name: "Gold", min: 900, perk: "Early access to new drops" },
  { name: "Platinum", min: 2000, perk: "Dedicated style line + free exchanges" },
];

export function computeLoyalty(list: DeenOrder[]) {
  const active = list.filter((o) => o.status !== "cancelled");
  const points = active.reduce((s, o) => s + Math.floor(o.total / 10), 0);
  let tier = DEEN_TIERS[0];
  for (const t of DEEN_TIERS) if (points >= t.min) tier = t;
  const next = DEEN_TIERS.find((t) => t.min > points) ?? null;
  const progress = next ? Math.min(100, Math.round(((points - tier.min) / (next.min - tier.min)) * 100)) : 100;
  return { points, tier, next, progress };
}

/* ------------------------------------------------------------------ */
/*  coupons                                                            */
/* ------------------------------------------------------------------ */

export interface DeenCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min: number;
  note: string;
}

export const DEEN_COUPONS: DeenCoupon[] = [
  { code: "SUMMER10", type: "percent", value: 10, min: 0, note: "10% off everything" },
  { code: "DEEN100", type: "fixed", value: 100, min: 2000, note: "৳100 off orders over ৳2,000" },
  { code: "DENIM500", type: "fixed", value: 500, min: 5000, note: "৳500 off orders over ৳5,000" },
];

export async function deenValidateCoupon(code: string, subtotal: number): Promise<{ code: string; discount: number }> {
  await req("POST", "/v1/deen/coupons/validate");
  const c = DEEN_COUPONS.find((x) => x.code === code.trim().toUpperCase());
  if (!c) throw new Error(`Code "${code.trim().toUpperCase()}" is not valid.`);
  if (subtotal < c.min) throw new Error(`${c.code} needs a subtotal of ${bdt(c.min)} or more.`);
  const discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { code: c.code, discount };
}

/* ------------------------------------------------------------------ */
/*  order cancellation (before confirmation)                           */
/* ------------------------------------------------------------------ */

export async function deenCancelOrder(id: string): Promise<DeenOrder> {
  await req("POST", "/v1/deen/orders/cancel");
  const o = orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found.");
  if (o.status !== "received") throw new Error("Only orders awaiting confirmation can be cancelled.");
  o.status = "cancelled";
  orders = orders.map((x) => (x.id === id ? { ...o } : x));
  save(KEYS.orders, orders);
  return { ...o };
}

/* ------------------------------------------------------------------ */
/*  reviews                                                            */
/* ------------------------------------------------------------------ */

const RKEY = "deen.reviews.v1";

const SEED_REVIEWS: DeenReview[] = [
  { id: "r1", productId: "j1", name: "Tanvir A.", stars: 5, text: "The raw wash fades beautifully after a month. Best denim in BD, period.", ts: Date.now() - 12 * 86400000 },
  { id: "r2", productId: "j1", name: "Mehedi H.", stars: 4, text: "Slim fit is true to size 32. Fabric feels premium and heavy.", ts: Date.now() - 26 * 86400000 },
  { id: "r3", productId: "j3", name: "Sadia R.", stars: 5, text: "Bought for my husband — the whisker fade looks exactly like the photos.", ts: Date.now() - 8 * 86400000 },
  { id: "r4", productId: "s5", name: "Arif Chowdhury", stars: 5, text: "Wore it to Cox's Bazar. Breathable, and the print gets compliments.", ts: Date.now() - 15 * 86400000 },
  { id: "r5", productId: "s5", name: "Nusrat K.", stars: 4, text: "Great summer shirt. Runs slightly loose — size down if between sizes.", ts: Date.now() - 30 * 86400000 },
  { id: "r6", productId: "pn4", name: "Mahmudul Karim", stars: 5, text: "Wore it on Eid. The embroidery is finer than panjabis twice the price.", ts: Date.now() - 40 * 86400000 },
  { id: "r7", productId: "pn1", name: "Shakil Ahmed", stars: 4, text: "Coconut buttons are a nice touch. Breathable even in June heat.", ts: Date.now() - 19 * 86400000 },
  { id: "r8", productId: "t4", name: "Rakib Hasan", stars: 5, text: "220gsm cotton is thick and holds shape after washes. Want more colours.", ts: Date.now() - 6 * 86400000 },
  { id: "r9", productId: "a1", name: "Fahim S.", stars: 5, text: "Genuine leather, smells great, stitching is solid. Ages well.", ts: Date.now() - 22 * 86400000 },
  { id: "r10", productId: "tr1", name: "Imran Kabir", stars: 4, text: "Sky blue is exactly as pictured. Stretch twill is comfy for office.", ts: Date.now() - 11 * 86400000 },
];

let reviews: DeenReview[] = load(RKEY, SEED_REVIEWS);

export function getDeenReviews(productId: string): DeenReview[] {
  return reviews.filter((r) => r.productId === productId).sort((a, b) => b.ts - a.ts);
}

export function deenAvg(productId: string): { avg: number; count: number } | null {
  const rs = getDeenReviews(productId);
  if (rs.length === 0) return null;
  return { avg: Math.round((rs.reduce((s, r) => s + r.stars, 0) / rs.length) * 10) / 10, count: rs.length };
}

/* ------------------------------------------------------------------ */
/*  live webhooks — the Woo side pushes order status into the gateway  */
/*  (in production: signed POST /v1/webhooks, HMAC-verified, queued)   */
/* ------------------------------------------------------------------ */

export interface DeenOrderStatusEvent {
  orderId: string;
  number: string;
  status: DeenOrderStatus;
  ts: number;
}

const statusListeners = new Set<(e: DeenOrderStatusEvent) => void>();

export function subscribeDeenOrderStatus(cb: (e: DeenOrderStatusEvent) => void): () => void {
  statusListeners.add(cb);
  return () => {
    statusListeners.delete(cb);
  };
}

export function startDeenWebhooks(intervalMs = 18000): () => void {
  const tick = () => {
    const candidate = [...orders]
      .filter((o) => o.status !== "cancelled" && o.status !== "delivered")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (!candidate) return;
    const idx = ORDER_FLOW.indexOf(candidate.status);
    const next = ORDER_FLOW[Math.min(idx + 1, ORDER_FLOW.length - 1)];
    void req("POST", `/v1/webhooks/woo.order · ${candidate.number} → ${next} · HMAC ✓`);
    candidate.status = next;
    orders = orders.map((o) => (o.id === candidate.id ? { ...candidate } : o));
    save(KEYS.orders, orders);
    const e: DeenOrderStatusEvent = { orderId: candidate.id, number: candidate.number, status: next, ts: Date.now() };
    statusListeners.forEach((l) => l(e));
  };
  const t0 = window.setTimeout(tick, 6000);
  const t = window.setInterval(tick, intervalMs);
  return () => {
    window.clearTimeout(t0);
    window.clearInterval(t);
  };
}

/* ------------------------------------------------------------------ */
/*  FCM push engine — promo, drops & personalized nudges               */
/* ------------------------------------------------------------------ */

export interface DeenPush {
  id: string;
  ts: number;
  title: string;
  body: string;
  kind: "price-drop" | "restock" | "new-drop" | "recommendation" | "promo";
  productId?: string;
}

const pushListeners = new Set<(p: DeenPush) => void>();
export function subscribeDeenPush(cb: (p: DeenPush) => void): () => void {
  pushListeners.add(cb);
  return () => {
    pushListeners.delete(cb);
  };
}

let pushSeq = 0;
function emitPush(p: Omit<DeenPush, "id" | "ts">) {
  const push: DeenPush = { ...p, id: `push-${++pushSeq}-${Date.now()}`, ts: Date.now() };
  pushListeners.forEach((l) => l(push));
  void req("POST", "/v1/push/fcm.send", 200);
}

function hash01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h / 997;
}

export function startDeenPush(intervalMs = 24000): () => void {
  const tick = () => {
    // respect the customer's marketing push toggle (order pushes ride the webhook channel)
    const prof = getDeenProfile();
    if (!prof.pushPromos) return;

    const catalog = DEEN_CATALOG;
    const onSale = catalog.filter((p) => p.salePrice);

    let wishlist: string[] = [];
    try {
      wishlist = JSON.parse(window.localStorage.getItem("deen.wishlist.v1") ?? "[]") as string[];
    } catch {
      /* ignore */
    }

    const push = (() => {
      // 1) a saved item just dropped in price
      const wished = onSale.find((p) => wishlist.includes(p.id));
      if (wished && Math.random() < 0.5) {
        return {
          kind: "price-drop" as const,
          title: "Price drop on a saved item",
          body: `${wished.name} is now ${bdt(wished.salePrice!)} — down from ${bdt(wished.price)}.`,
          productId: wished.id,
        };
      }
      // 2) personalized recommendation from the same engine the app uses
      const recs = rankRecommendations(catalog, { wishlist, recents: [], cart: [] }, 1);
      if (recs.length > 0 && Math.random() < 0.6) {
        const r = recs[0];
        return {
          kind: "recommendation" as const,
          title: "Picked for you",
          body: `Because of your style, we think you'll like ${r.name}${r.salePrice ? ` — on sale at ${bdt(r.salePrice)}` : ""}.`,
          productId: r.id,
        };
      }
      // 3) new drop / promo fallback
      const fresh = catalog.filter((p) => !p.salePrice);
      const nd = fresh[Math.floor(hash01(String(pushSeq)) * fresh.length)];
      return Math.random() < 0.5 && nd
        ? { kind: "new-drop" as const, title: "New in store", body: `${nd.name} just landed — ${bdt(nd.price)}.`, productId: nd.id }
        : { kind: "promo" as const, title: "Summer Fest is live", body: `Free cotton tee on every order over ${bdt(FREE_TEE_THRESHOLD)}. While stock lasts.` };
    })();

    emitPush(push);
  };

  const t0 = window.setTimeout(tick, 9000);
  const t = window.setInterval(tick, intervalMs);
  return () => {
    window.clearTimeout(t0);
    window.clearInterval(t);
  };
}

/* ------------------------------------------------------------------ */
/*  recommendation engine — affinity scoring from customer signals     */
/* ------------------------------------------------------------------ */

export function rankRecommendations(
  catalog: DeenProduct[],
  signals: { wishlist: string[]; recents: string[]; cart: DeenCartItem[] },
  count = 4
): DeenProduct[] {
  const score = new Map<string, number>();
  const affinity = new Map<DeenCategory, number>();

  const bump = (cat: DeenCategory, w: number) => affinity.set(cat, (affinity.get(cat) ?? 0) + w);

  signals.wishlist.forEach((id) => {
    const p = catalog.find((x) => x.id === id);
    if (p) bump(p.category, 3);
  });
  signals.recents.forEach((id) => {
    const p = catalog.find((x) => x.id === id);
    if (p) bump(p.category, 2);
  });
  signals.cart.forEach((it) => {
    const p = catalog.find((x) => x.id === it.productId);
    if (p) bump(p.category, 1.5);
  });

  for (const p of catalog) {
    const excluded = signals.wishlist.includes(p.id) || signals.cart.some((c) => c.productId === p.id);
    if (excluded) continue;
    let s = affinity.get(p.category) ?? 0;
    if (p.salePrice) s += 1.6; // sale momentum
    if (p.isNew) s += 0.8; // fresh drop boost
    s += hash01(p.id) * 0.9; // stable variety
    score.set(p.id, s);
  }

  return [...catalog]
    .filter((p) => score.has(p.id))
    .sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0))
    .slice(0, count);
}

export async function deenAddReview(productId: string, name: string, stars: number, text: string): Promise<DeenReview> {
  await req("POST", "/v1/deen/reviews", 201);
  if (stars < 1 || stars > 5) throw new Error("Pick a star rating.");
  if (text.trim().length < 5) throw new Error("Write a few words about the product.");
  const review: DeenReview = {
    id: `r-${Date.now()}`,
    productId,
    name: name.trim() || "DEEN customer",
    stars,
    text: text.trim(),
    ts: Date.now(),
  };
  reviews = [review, ...reviews];
  save(RKEY, reviews);
  return review;
}
