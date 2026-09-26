import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Product,
  Order,
  DeenCategory,
  DeliveryArea,
  DeliveryOptionKey,
  DeliveryOption,
  PaymentMethod,
  UserProfile,
} from "../types";

export const CASHBACK_TIERS = {
  tier1: { minSpend: 2500, cashback: 500 },
  tier2: { minSpend: 3000, cashback: 700 },
} as const;

export function getCashbackAmount(subtotal: number): number {
  if (subtotal >= CASHBACK_TIERS.tier2.minSpend) return CASHBACK_TIERS.tier2.cashback;
  if (subtotal >= CASHBACK_TIERS.tier1.minSpend) return CASHBACK_TIERS.tier1.cashback;
  return 0;
}

/**
 * Universal HTML entity decoder for product titles & text.
 * Safely decodes WordPress/WooCommerce typographic entities (`&#8217;`, `&#8221;`, `&#038;`, etc.).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    // Apostrophes & Single Quotes
    .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;|&#039;|&apos;/g, "'")
    // Double Quotes
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"')
    // Ampersands
    .replace(/&#038;|&amp;/g, "&")
    // Em dash / En dash
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    // Non-breaking spaces and angle brackets
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const FREE_TEE_THRESHOLD = 2500; // Deprecated backward compat

export const DELIVERY_OPTIONS: Record<DeliveryOptionKey, DeliveryOption> = {
  dhaka_standard: {
    id: "dhaka_standard",
    name: "Home Delivery",
    sub: "2-3 business days · Regular doorstep courier",
    fee: 50,
    estimatedDays: "2-3 Days",
  },
  dhaka_express: {
    id: "dhaka_express",
    name: "Express Home Delivery (Same-Day / 24h)",
    sub: "Within 24 hours · Priority rush delivery in Dhaka",
    fee: 120,
    estimatedDays: "24 Hours",
    badge: "FASTEST",
  },
  outside_standard: {
    id: "outside_standard",
    name: "Home Delivery (Outside Dhaka)",
    sub: "3-5 business days · Steadfast / Pathao home delivery",
    fee: 90,
    estimatedDays: "3-5 Days",
  },
  store_pickup: {
    id: "store_pickup",
    name: "Store Pickup (Dhaka Hub)",
    sub: "Ready within 2 hours · Free collection from Dhaka dispatch hub",
    fee: 0,
    estimatedDays: "Ready in 2h",
    badge: "FREE",
  },
};

export const DELIVERY_FEES: Record<string, number> = {
  dhaka: 50,
  outside: 90,
  dhaka_standard: 50,
  dhaka_express: 120,
  outside_standard: 90,
  store_pickup: 0,
};

/** Update DELIVERY_FEES from API response (single source of truth). */
export function updateDeliveryFees(fees: { insideDhaka: number; outsideDhaka: number; express: number; storePickup: number }): void {
  DELIVERY_FEES.dhaka = fees.insideDhaka;
  DELIVERY_FEES.dhaka_standard = fees.insideDhaka;
  DELIVERY_FEES.outside = fees.outsideDhaka;
  DELIVERY_FEES.outside_standard = fees.outsideDhaka;
  DELIVERY_FEES.dhaka_express = fees.express;
  DELIVERY_FEES.store_pickup = fees.storePickup;
}

export const getDeliveryFee = (area: string | DeliveryArea): number => {
  return DELIVERY_FEES[area] ?? 50;
};

export const bdt = (amount: number | string | null | undefined): string => {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num) || num === null || num === undefined) return "৳0";
  return `৳${num.toLocaleString("en-IN")}`;
};

export const CATEGORIES: DeenCategory[] = [
  "ALL",
  "JEANS",
  "PANJABI",
  "SHIRT",
  "T-SHIRT",
  "POLO",
  "TROUSERS",
  "ACCESSORIES",
];

export const PRODUCTS_CATALOG: Product[] = [
  {
    id: "dn-01",
    sku: "DN-JNS-VNT01",
    name: "DEEN High-End Vintage Wash Jeans – Slim Fit",
    category: "JEANS",
    price: 2200,
    salePrice: 1980,
    regularPrice: 2200,
    salePct: 10,
    sizes: ["28", "30", "32", "34", "36", "38"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Front-600x750.webp",
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Front-600x750.webp",
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Front-600x750.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Front-600x750.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Front-600x750.webp",
    fabric: "13.5 oz 100% Cross Hatch Selvedge Cotton",
    blurb: "Vintage washed denim crafted from deep indigo rope-dyed yarn on traditional shuttle looms.",
    isNew: true,
  },
  {
    id: "dn-02",
    sku: "DN-JKT-SRB01",
    name: "Sorbino Denim Jacket",
    category: "JEANS",
    price: 2200,
    salePrice: 1980,
    regularPrice: 2200,
    salePct: 10,
    sizes: ["S", "M", "L", "XL"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
      "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/09/Sorbino-Denim-Jacket-115-0101-001-2-600x750.webp",
    fabric: "12.5 oz Heavyweight Trucker Denim",
    blurb: "Signature washed trucker denim jacket with customized antique metal shank buttons and dual flap pockets.",
    isNew: true,
  },
  {
    id: "dn-03",
    sku: "DN-PNJ-GLD01",
    name: "DEEN Gold Semi-Formal Panjabi",
    category: "PANJABI",
    price: 2450,
    sizes: ["38", "40", "42", "44", "46"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    fabric: "Pure Cotton Dobby Weave with Hand-Finished Accents",
    blurb: "Celebration & casual hybrid panjabi with self-textured dobby geometric motifs and engraved buttons.",
    isNew: true,
  },
  {
    id: "dn-04",
    sku: "DN-SHT-EXC01",
    name: "DEEN Classic Stripe Executive Formal Shirt",
    category: "SHIRT",
    price: 1850,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
      "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    fabric: "100% High-Count Egyptian Cotton",
    blurb: "Sharp executive silhouette with single-needle tailoring and reinforced collar construction.",
  },
  {
    id: "dn-05",
    sku: "DN-TSH-DRP01",
    name: "DEEN City Code Print Drop Shoulder T-Shirt",
    category: "T-SHIRT",
    price: 890,
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    fabric: "240 GSM Zero-Torque Combed Cotton",
    blurb: "Substantial boxy drop-shoulder tee with anti-curl ribbed neckband and streetwear graphic print.",
  },
  {
    id: "dn-06",
    sku: "DN-POL-SPF01",
    name: "Springfield Polo Shirt",
    category: "POLO",
    price: 1090,
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    fabric: "100% Breathable Pique Cotton Knit",
    blurb: "European lifestyle polo with ribbed collar and placket. DEEN Select curated drop.",
  },
  {
    id: "dn-07",
    sku: "DN-TRS-CARP01",
    name: "Lee Workwear Loose Carpenter Twill",
    category: "TROUSERS",
    price: 1790,
    salePrice: 1253,
    regularPrice: 1790,
    salePct: 30,
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
      "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/09/Lee-Workwear-Loose-Carpenter-Twill-104-0504-001-2-600x750.webp",
    fabric: "Heavyweight Cotton Carpenter Twill",
    blurb: "Loose-fit workwear trousers with utility hammer loop, tool pockets, and triple-needle seam stitching.",
  },
  {
    id: "dn-08",
    sku: "DN-ACC-BLT01",
    name: "DEEN Chocolate Premium Leather Belt",
    category: "ACCESSORIES",
    price: 1150,
    sizes: ["32", "34", "36", "38"],
    images: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    ],
    gallery: [
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    ],
    thumb: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    single: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    full: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    fabric: "100% Full-Grain Vegetable Tanned Leather",
    blurb: "Artisanal handcrafted leather belt with solid brass antiqued buckle. Develops a rich patina over time.",
  },
] as Product[];

const ORDERS_STORAGE_KEY = "deen_mobile_orders_v1";
const PROFILE_STORAGE_KEY = "deen_mobile_profile_v1";

export const GUEST_PROFILE: UserProfile = {
  accountType: "guest",
  isGuest: true,
  role: "customer",
  name: "",
  phone: "",
  address: "",
  area: "dhaka_standard",
  jeansSize: "32",
  topSize: "L",
  pushOrders: true,
  pushPromos: false,
  pushDrops: true,
  pushPersonalized: true,
};

export const DEFAULT_PROFILE: UserProfile = {
  accountType: "guest",
  isGuest: true,
  role: "customer",
  name: "",
  phone: "",
  email: "",
  address: "",
  area: "dhaka_standard",
  deliverySlot: "any",
  deliveryNotes: "",
  jeansSize: "32",
  topSize: "L",
  pushOrders: true,
  pushPromos: false,
  pushDrops: true,
  pushPersonalized: true,
  savedAddresses: [],
};

export const fetchProducts = async (category?: DeenCategory, query?: string): Promise<Product[]> => {
  let list = PRODUCTS_CATALOG;
  if (category && category !== "ALL") {
    list = list.filter((p) => p.category === category);
  }
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
    );
  }
  return list;
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  return PRODUCTS_CATALOG.find((p) => p.id === id);
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const json = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error("Error reading orders:", e);
  }
  return [];
};

export const createOrder = async (orderData: Omit<Order, "id" | "number" | "createdAt" | "status">): Promise<Order> => {
  const existing = await getOrders();
  const nextNumber = `DN-${Math.floor(100000 + Math.random() * 900000)}`;
  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    number: nextNumber,
    status: "received",
    createdAt: new Date().toISOString(),
  };

  const updated = [newOrder, ...existing];
  await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  return newOrder;
};

export const getProfile = async (): Promise<UserProfile> => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error("Error reading profile:", e);
  }
  return DEFAULT_PROFILE;
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};
