/* ------------------------------------------------------------------ */
/* BazarBox — domain data, fees, zones and time helpers (Asia/Dhaka)   */
/* ------------------------------------------------------------------ */

export type Product = {
  id: string;
  name: string;
  cat: string;
  price: number;
  img: string;
  tag?: string;
  blurb: string;
};

export type CartMap = Record<string, number>;

export type DeliveryMethod = "standard" | "sameday";
export type OrderStatus = "confirmed" | "packed" | "in-transit" | "delivered";

export type OrderItem = { id: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  placedAt: number;
  customer: string;
  phone: string;
  area: string;
  inside: boolean;
  method: DeliveryMethod;
  fee: number;
  prepaid: boolean;
  txn?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
};

export type ExchangeStatus = "pickup-scheduled" | "in-review" | "swapped";

export type Exchange = {
  id: string;
  orderId: string;
  createdAt: number;
  items: { name: string; qty: number }[];
  reason: string;
  note: string;
  photos: string[];
  area: string;
  inside: boolean;
  fee: number;
  payMethod: "online" | "cash";
  txn?: string;
  status: ExchangeStatus;
};

/* ---------------------------- fees ---------------------------- */

export const FEES = {
  stdIn: 60,
  stdOut: 130,
  exIn: 50,
  exOut: 90,
  sameDay: 120,
  cutoffHour: 12,
} as const;

/* ---------------------------- zones ---------------------------- */

export const ZONES_INSIDE = [
  "Dhanmondi",
  "Gulshan 1 & 2",
  "Banani",
  "Baridhara",
  "Uttara",
  "Mirpur",
  "Mohammadpur",
  "Shyamoli",
  "Bashundhara R/A",
  "Motijheel",
  "Old Dhaka (Lalbagh)",
  "Badda",
  "Khilgaon",
  "Tejgaon",
  "Cantonment",
  "Keraniganj (Dhaka side)",
];

export const ZONES_OUTSIDE = [
  "Savar",
  "Gazipur",
  "Tongi",
  "Narayanganj",
  "Chattogram",
  "Cox's Bazar",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Cumilla",
  "Mymensingh",
  "Barishal",
  "Rangpur",
  "Elsewhere in Bangladesh",
];

export const isInside = (area: string) => ZONES_INSIDE.includes(area);

export const REASONS = [
  "Received wrong item",
  "Item damaged in delivery",
  "Size / fit issue",
  "Missing parts or accessories",
  "Different from photos",
  "Quality not as expected",
];

/* --------------------------- catalog --------------------------- */

const IMG = (u: string) => u;

export const IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%230e3d2e'/%3E%3Cpath d='M40 22 56 30v16L40 54 24 46V30z' fill='none' stroke='%23ffc531' stroke-width='2.5'/%3E%3Cpath d='M24 30l16 8 16-8M40 38v16' stroke='%23ffc531' stroke-width='2.5' fill='none'/%3E%3C/svg%3E";

export const PRODUCTS: Product[] = [
  {
    id: "p-sneakers",
    name: "Ember Runner Sneakers",
    cat: "Footwear",
    price: 2450,
    img: IMG("https://image.qwenlm.ai/generated-images/78c9e7bf-0e71-48b5-b657-3fb1fa721e0d/_result.png"),
    tag: "Bestseller",
    blurb: "Knit upper, gum sole, built for footpath chaos.",
  },
  {
    id: "p-backpack",
    name: "Mustard Canvas Pack",
    cat: "Bags",
    price: 1850,
    img: IMG("https://image.qwenlm.ai/generated-images/88b1a7b0-f80c-48ea-a4c8-c25b2154e958/_result.png"),
    blurb: "Waxed canvas, brass buckles, 18L of daily carry.",
  },
  {
    id: "p-headphones",
    name: "Charcoal ANC Headphones",
    cat: "Audio",
    price: 3200,
    img: IMG("https://image.qwenlm.ai/generated-images/1a9dd89d-5148-40b2-af1d-f1cdafe814ab/_result.png"),
    tag: "New",
    blurb: "38h battery, noise-cancelling, rickshaw-proof.",
  },
  {
    id: "p-watch",
    name: "Olive Field Watch",
    cat: "Accessories",
    price: 4500,
    img: IMG("https://image.qwenlm.ai/generated-images/f40ce2f0-5cb2-4854-8202-42bfbe022660/_result.png"),
    blurb: "Nylon strap, cream dial, 5 ATM. On time, always.",
  },
  {
    id: "p-jersey",
    name: "Emerald Home Jersey",
    cat: "Apparel",
    price: 1250,
    img: IMG("https://image.qwenlm.ai/generated-images/254089a5-4526-4b18-be7d-73133046c1d7/_result.png"),
    blurb: "Breathable chevron knit. Match-day ready.",
  },
  {
    id: "p-mugs",
    name: "Speckled Stoneware Mugs ×2",
    cat: "Home",
    price: 950,
    img: IMG("https://image.qwenlm.ai/generated-images/a849d971-e600-4d95-b54c-c021bfe36781/_result.png"),
    blurb: "Hand-glazed pair. Cha tastes better in these.",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/* ------------------------ status + flow ------------------------ */

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "in-transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
];

export const statusIndex = (s: OrderStatus) =>
  STATUS_STEPS.findIndex((x) => x.key === s);

/* --------------------- Dhaka clock helpers --------------------- */

export function dhakaClock(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const h24 = get("hour") % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    h24,
    m: get("minute"),
    s: get("second"),
    str: `${String(h12).padStart(2, "0")}:${String(get("minute")).padStart(2, "0")}:${String(get("second")).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`,
  };
}

export const beforeCutoff = () => dhakaClock().h24 < FEES.cutoffHour;

/** Milliseconds until the next 12:00 noon in Dhaka. */
export function msToCutoff() {
  const c = dhakaClock();
  const nowS = c.h24 * 3600 + c.m * 60 + c.s;
  let diff = FEES.cutoffHour * 3600 - nowS;
  if (diff <= 0) diff += 86400;
  return diff * 1000;
}

export function fmtHMS(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* --------------------------- misc --------------------------- */

export const fmt = (n: number) => "\u09F3" + n.toLocaleString("en-IN");

export const uid = (p: string) =>
  `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const txnId = () =>
  "TXN-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export const etaFor = (method: DeliveryMethod, inside: boolean) =>
  method === "sameday"
    ? "Tonight, 6–10 PM"
    : inside
      ? "24–48 hours"
      : "2–4 days";

/** Session-only photo previews, keyed by exchange id. */
export const photoStore = new Map<string, { name: string; url: string }[]>();

/* ------------------------ live feed ------------------------ */

export const FEED: string[] = [
  "Rider Arif picked up BB-10482 in Dhanmondi",
  "BB-10461 delivered — signed at the gate, Gulshan 2",
  "Van 3 left the warehouse — 18 parcels aboard",
  "Same-day BB-10477 handed to rider, Mirpur 10",
  "Exchange EX-3104 approved — swap shipped to Uttara",
  "BB-10490 crossed Airport Road — 40 min out",
  "COD \u09F33,260 collected in Mohammadpur",
  "Prepaid order jumped the queue — packing now",
  "BB-10455 out for delivery in Banani",
  "Rider Tanvir on a chai break — as is tradition",
];

/* ------------------------ seed data ------------------------ */

export function seedOrders(): Order[] {
  const now = Date.now();
  return [
    {
      id: "BB-10501",
      placedAt: now - 2 * 3600_000,
      customer: "Nusrat Jahan",
      phone: "01712345678",
      area: "Mirpur",
      inside: true,
      method: "standard",
      fee: FEES.stdIn,
      prepaid: false,
      items: [{ id: "p-jersey", name: "Emerald Home Jersey", price: 1250, qty: 2 }],
      subtotal: 2500,
      total: 2560,
      status: "confirmed",
    },
    {
      id: "BB-10496",
      placedAt: now - 26 * 3600_000,
      customer: "Nusrat Jahan",
      phone: "01712345678",
      area: "Uttara",
      inside: true,
      method: "standard",
      fee: FEES.stdIn,
      prepaid: true,
      txn: "TXN-7G2H91",
      items: [{ id: "p-headphones", name: "Charcoal ANC Headphones", price: 3200, qty: 1 }],
      subtotal: 3200,
      total: 3260,
      status: "in-transit",
    },
    {
      id: "BB-10482",
      placedAt: now - 3 * 86400_000,
      customer: "Nusrat Jahan",
      phone: "01712345678",
      area: "Dhanmondi",
      inside: true,
      method: "standard",
      fee: FEES.stdIn,
      prepaid: false,
      items: [
        { id: "p-sneakers", name: "Ember Runner Sneakers", price: 2450, qty: 1 },
        { id: "p-mugs", name: "Speckled Stoneware Mugs ×2", price: 950, qty: 1 },
      ],
      subtotal: 3400,
      total: 3460,
      status: "delivered",
    },
  ];
}

export function seedExchanges(): Exchange[] {
  return [
    {
      id: "EX-3107",
      orderId: "BB-10482",
      createdAt: Date.now() - 2 * 86400_000,
      items: [{ name: "Speckled Stoneware Mugs ×2", qty: 1 }],
      reason: "Item damaged in delivery",
      note: "One mug arrived with a chipped rim, courier box was crushed on one corner.",
      photos: ["mug-chip.jpg", "crushed-box.jpg"],
      area: "Dhanmondi",
      inside: true,
      fee: FEES.exIn,
      payMethod: "online",
      txn: "TXN-44QZ10",
      status: "swapped",
    },
  ];
}
