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
    name: "Store Pickup (Mirpur 12 Outlet)",
    sub: "Ready within 2 hours · Free collection from store",
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
    sku: "DN-JNS-RAW01",
    name: "Heritage Raw Selvedge Denim",
    category: "JEANS",
    price: 2450,
    salePrice: 2150,
    sizes: ["28", "30", "32", "34", "36", "38"],
    images: [
      "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
      "https://image.qwenlm.ai/generated-images/49156066-857e-40e9-bfa2-3c1b6a7a0b38/_result.png",
    ],
    fabric: "13.5 oz 100% Rigid Selvedge Cotton",
    blurb: "Signature redline selvedge denim crafted from deep indigo rope-dyed yarn. Traditional shuttle-loom weave.",
    isNew: true,
  },
  {
    id: "dn-02",
    sku: "DN-JNS-VNT02",
    name: "Vintage Whisker Slim-Taper Jeans",
    category: "JEANS",
    price: 2250,
    sizes: ["28", "30", "32", "34", "36"],
    images: [
      "https://image.qwenlm.ai/generated-images/7d3a0aa4-e392-4934-bc2c-e16067b848c4/_result.png",
      "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
    ],
    fabric: "12 oz 98% Cotton / 2% Elastane Flex",
    blurb: "Artisanal hand-scraped whisker wash with custom copper hardware and contrast tobacco stitching.",
  },
  {
    id: "dn-03",
    sku: "DN-PNJ-IND01",
    name: "Indigo Dobby Heritage Panjabi",
    category: "PANJABI",
    price: 2650,
    salePrice: 2350,
    sizes: ["38", "40", "42", "44", "46"],
    images: [
      "https://image.qwenlm.ai/generated-images/611a91e5-6b58-450f-9fa8-e4b2a3449339/_result.png",
      "https://image.qwenlm.ai/generated-images/81f855d0-9d0d-4560-bf6c-c9d300fbba41/_result.png",
    ],
    fabric: "Pure Indigo Dobby Jacquard Weave",
    blurb: "Festive & casual hybrid panjabi with subtle self-textured indigo geometric weave and engraved buttons.",
    isNew: true,
  },
  {
    id: "dn-04",
    sku: "DN-PNJ-SLT02",
    name: "Slate Indigo Mandarin Kurta",
    category: "PANJABI",
    price: 2150,
    sizes: ["38", "40", "42", "44"],
    images: [
      "https://image.qwenlm.ai/generated-images/81f855d0-9d0d-4560-bf6c-c9d300fbba41/_result.png",
      "https://image.qwenlm.ai/generated-images/611a91e5-6b58-450f-9fa8-e4b2a3449339/_result.png",
    ],
    fabric: "Slub Cotton Chambray",
    blurb: "Minimalist band-collar cut with tailored shoulder yoke and deep side slits for daily ease.",
  },
  {
    id: "dn-05",
    sku: "DN-SHT-WST01",
    name: "Indigo Chambray Western Shirt",
    category: "SHIRT",
    price: 1850,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "https://image.qwenlm.ai/generated-images/9163013b-3136-40e1-bbcb-b1b7470fcf14/_result.png",
      "https://image.qwenlm.ai/generated-images/49156066-857e-40e9-bfa2-3c1b6a7a0b38/_result.png",
    ],
    fabric: "6.5 oz Indigo Chambray Cotton",
    blurb: "Pointed western yokes, pearl snap fasteners, and twin flap chest pockets with selvedge ID at the hem.",
  },
  {
    id: "dn-06",
    sku: "DN-TSH-HVY01",
    name: "240 GSM Heavyweight Indigo Tee",
    category: "T-SHIRT",
    price: 850,
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      "https://image.qwenlm.ai/generated-images/8eeef08a-df99-4d69-be53-6ec2fb1eeafc/_result.png",
      "https://image.qwenlm.ai/generated-images/9163013b-3136-40e1-bbcb-b1b7470fcf14/_result.png",
    ],
    fabric: "240 GSM Combed Ring-Spun Cotton",
    blurb: "Substantial boxy fit tee with reinforced ribbed neck and subtle DEEN heritage woven hem badge.",
  },
  {
    id: "dn-07",
    sku: "DN-POL-STP01",
    name: "Indigo Pique Waffle Polo",
    category: "POLO",
    price: 1350,
    salePrice: 1150,
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      "https://image.qwenlm.ai/generated-images/179ae4ca-9540-424f-9e79-58b29df92a54/_result.png",
      "https://image.qwenlm.ai/generated-images/8eeef08a-df99-4d69-be53-6ec2fb1eeafc/_result.png",
    ],
    fabric: "100% Breathable Pique Waffle Cotton",
    blurb: "Soft-structured polo with tipped ribbed collar and reinforced placket. Perfect for smart-casual wear.",
  },
  {
    id: "dn-08",
    sku: "DN-TRS-CRG01",
    name: "Indigo Ripstop Utility Trousers",
    category: "TROUSERS",
    price: 1950,
    sizes: ["30", "32", "34", "36"],
    images: [
      "https://image.qwenlm.ai/generated-images/1aa1bb4f-b649-43a3-a75d-357ff8a38ec2/_result.png",
      "https://image.qwenlm.ai/generated-images/7d3a0aa4-e392-4934-bc2c-e16067b848c4/_result.png",
    ],
    fabric: "High-Density Cotton Ripstop",
    blurb: "Relaxed ergonomic leg with articulated knee pleats, deep slant pockets, and drawstring ankle cinch.",
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
