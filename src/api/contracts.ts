/* ------------------------------------------------------------------ */
/*  packages/contracts — shared types between every app & the gateway  */
/*  In the real monorepo these are Zod schemas; here they are typed    */
/*  TS contracts that the simulated gateway and both apps obey.        */
/* ------------------------------------------------------------------ */

export type Category = "PACKS" | "SHELTER" | "COOK" | "LIGHT" | "TOOLS" | "APPAREL";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  price: number;
  compareAt?: number;
  stock: number;
  rating: number;
  weight: string;
  material: string;
  tags: string[];
  blurb: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus = "pending" | "processing" | "completed" | "refunded" | "cancelled";
export type Channel = "android" | "web" | "ios";

export interface Order {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  channel: Channel;
  createdAt: string;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  used: number;
  active: boolean;
}

export interface AdminSession {
  email: string;
  role: "admin";
  exp: number;
}

/* ---------------- customers ---------------- */

export type CustomerType = "registered" | "guest";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: CustomerType;
  source: Channel;
  joinedAt: string;
  lastOrderAt?: string;
  orders: number;
  spent: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  address: string;
  items: { productId: string; qty: number }[];
  couponCode?: string;
  channel?: Channel;
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "completed", "refunded", "cancelled"];

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------------ */
/*  Seed data — stands in for the WooCommerce sandbox store            */
/* ------------------------------------------------------------------ */

export const SEED_PRODUCTS: Product[] = [
  { id: "p01", sku: "PK-101", name: "Ridgeline 38L Pack", category: "PACKS", price: 148, compareAt: 172, stock: 24, rating: 4.8, weight: "1.4 kg", material: "420D ripstop nylon", tags: ["multi-day", "frame"], blurb: "Load-lifters, ventilated back panel, rain cover stowed in the base.", active: true },
  { id: "p02", sku: "PK-104", name: "Scree 12L Daypack", category: "PACKS", price: 72, stock: 6, rating: 4.5, weight: "480 g", material: "210D dyneema blend", tags: ["fast-hike", "light"], blurb: "Scramble-ready daypack with helmet carry and twin pole loops.", active: true },
  { id: "p03", sku: "SH-201", name: "Cloudline 2P Tent", category: "SHELTER", price: 289, stock: 9, rating: 4.9, weight: "1.9 kg", material: "20D silnylon fly", tags: ["3-season", "freestanding"], blurb: "Two doors, two vestibules, pitches inner-first in under four minutes.", active: true },
  { id: "p04", sku: "SH-203", name: "Bivy Sack UL", category: "SHELTER", price: 129, stock: 14, rating: 4.3, weight: "410 g", material: "eVent laminate", tags: ["alpine", "solo"], blurb: "Breathable solo shelter for fast, light alpine starts.", active: true },
  { id: "p05", sku: "CK-301", name: "Ember Stove Kit", category: "COOK", price: 84, compareAt: 98, stock: 18, rating: 4.6, weight: "390 g", material: "titanium + steel", tags: ["canister", "simmer"], blurb: "Piezo ignition and a true simmer valve, nests with the 900 ml pot.", active: true },
  { id: "p06", sku: "CK-305", name: "Titan Mug 450", category: "COOK", price: 32, stock: 41, rating: 4.7, weight: "88 g", material: "single-wall titanium", tags: ["ultralight"], blurb: "Boil-and-drink titanium mug with folding handles and volume marks.", active: true },
  { id: "p07", sku: "LT-401", name: "Beacon 400 Lamp", category: "LIGHT", price: 54, stock: 4, rating: 4.4, weight: "120 g", material: "anodized aluminium", tags: ["camp", "rechargeable"], blurb: "400-lumen camp lantern, warm mode, USB-C, hangs from any loop.", active: true },
  { id: "p08", sku: "LT-402", name: "Solstice Headlamp", category: "LIGHT", price: 46, stock: 22, rating: 4.6, weight: "92 g", material: "IPX8 housing", tags: ["450 lm", "red mode"], blurb: "Reactive beam that reads the trail ahead; red mode for camp.", active: true },
  { id: "p09", sku: "TL-501", name: "Traverse Poles", category: "TOOLS", price: 96, stock: 11, rating: 4.5, weight: "510 g / pair", material: "carbon 3-fold", tags: ["cork grip"], blurb: "Flick-lock carbon poles, 110–130 cm, cork grips that mould to you.", active: true },
  { id: "p10", sku: "TL-503", name: "Granite Knife", category: "TOOLS", price: 68, stock: 0, rating: 4.8, weight: "145 g", material: "Scandinavian grind", tags: ["fixed blade"], blurb: "Full-tang trail knife with ferro-rod strike spine and kydex sheath.", active: true },
  { id: "p11", sku: "AP-601", name: "Merino Trail Tee", category: "APPAREL", price: 44, stock: 30, rating: 4.4, weight: "150 g", material: "87% merino / 13% nylon", tags: ["odor-safe"], blurb: "Three-day merino tee with flat seams under pack straps.", active: true },
  { id: "p12", sku: "AP-605", name: "Gale Shell Jacket", category: "APPAREL", price: 196, compareAt: 240, stock: 7, rating: 4.7, weight: "320 g", material: "3L waterproof shell", tags: ["pit zips", "helmet hood"], blurb: "Storm shell that packs into its own chest pocket. 20k/20k rated.", active: true },
];

const daysAgo = (d: number, h = 10) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();

export const SEED_ORDERS: Order[] = [
  { id: "o1", number: "BW-1047", customerName: "Amara Okafor", customerEmail: "amara@trailmail.co", items: [{ productId: "p03", sku: "SH-201", name: "Cloudline 2P Tent", qty: 1, price: 289 }, { productId: "p06", sku: "CK-305", name: "Titan Mug 450", qty: 2, price: 32 }], subtotal: 353, discount: 0, total: 353, status: "pending", channel: "web", createdAt: daysAgo(0, 3) },
  { id: "o2", number: "BW-1046", customerName: "Jonas Lindqvist", customerEmail: "jonas.l@nordmail.se", items: [{ productId: "p01", sku: "PK-101", name: "Ridgeline 38L Pack", qty: 1, price: 148 }], subtotal: 148, discount: 14.8, couponCode: "WELCOME10", total: 133.2, status: "processing", channel: "android", createdAt: daysAgo(1) },
  { id: "o3", number: "BW-1045", customerName: "Priya Raman", customerEmail: "priya.r@summit.io", items: [{ productId: "p12", sku: "AP-605", name: "Gale Shell Jacket", qty: 1, price: 196 }, { productId: "p11", sku: "AP-601", name: "Merino Trail Tee", qty: 2, price: 44 }], subtotal: 284, discount: 0, total: 284, status: "processing", channel: "web", createdAt: daysAgo(2) },
  { id: "o4", number: "BW-1044", customerName: "Marco Delgado", customerEmail: "marco@alpenroute.ch", items: [{ productId: "p09", sku: "TL-501", name: "Traverse Poles", qty: 1, price: 96 }, { productId: "p08", sku: "LT-402", name: "Solstice Headlamp", qty: 1, price: 46 }], subtotal: 142, discount: 0, total: 142, status: "completed", channel: "android", createdAt: daysAgo(4) },
  { id: "o5", number: "BW-1043", customerName: "Hana Sato", customerEmail: "hana.s@yama.jp", items: [{ productId: "p05", sku: "CK-301", name: "Ember Stove Kit", qty: 1, price: 84 }, { productId: "p06", sku: "CK-305", name: "Titan Mug 450", qty: 1, price: 32 }], subtotal: 116, discount: 0, total: 116, status: "completed", channel: "web", createdAt: daysAgo(6) },
  { id: "o6", number: "BW-1042", customerName: "Tomas Berg", customerEmail: "tomas@fjellpost.no", items: [{ productId: "p04", sku: "SH-203", name: "Bivy Sack UL", qty: 1, price: 129 }], subtotal: 129, discount: 20, couponCode: "TRAIL20", total: 109, status: "completed", channel: "android", createdAt: daysAgo(8) },
  { id: "o7", number: "BW-1041", customerName: "Leila Haddad", customerEmail: "leila@wadioutdoors.com", items: [{ productId: "p07", sku: "LT-401", name: "Beacon 400 Lamp", qty: 2, price: 54 }], subtotal: 108, discount: 0, total: 108, status: "refunded", channel: "web", createdAt: daysAgo(10) },
  { id: "o8", number: "BW-1040", customerName: "Chris Yoon", customerEmail: "chris.y@ridgeline.kr", items: [{ productId: "p02", sku: "PK-104", name: "Scree 12L Daypack", qty: 1, price: 72 }, { productId: "p11", sku: "AP-601", name: "Merino Trail Tee", qty: 1, price: 44 }], subtotal: 116, discount: 0, total: 116, status: "completed", channel: "web", createdAt: daysAgo(12) },
];

export const SEED_COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 0, used: 12, active: true },
  { code: "TRAIL20", type: "fixed", value: 20, minSubtotal: 150, used: 4, active: true },
  { code: "SUMMIT15", type: "percent", value: 15, minSubtotal: 0, used: 31, active: false },
];
