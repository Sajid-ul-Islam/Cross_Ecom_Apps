import { config } from "./config.js";
import type { DeenProduct } from "./seed.js";

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
  sale_price: string;
  status: string;
  categories: { name: string }[];
  images: { src: string }[];
  description?: string;
  // We rely on ACF / meta for size + fabric when present.
  meta_data?: { key: string; value: string }[];
}

const CATEGORY_MAP: Record<string, DeenProduct["category"]> = {
  JEANS: "JEANS",
  PANJABI: "PANJABI",
  SHIRT: "SHIRT",
  "T-SHIRT": "T-SHIRT",
  TROUSERS: "TROUSERS",
  POLO: "POLO",
  ACCESSORIES: "ACCESSORIES",
};

function mapWooToDeen(p: WooProduct): DeenProduct | null {
  const catName = (p.categories[0]?.name ?? "").toUpperCase();
  const category = CATEGORY_MAP[catName];
  if (!category) return null; // only map categories we sell
  const sizes = p.meta_data?.find((m) => m.key === "sizes")?.value.split(",").map((s) => s.trim()) ?? ["OS"];
  const fabric = p.meta_data?.find((m) => m.key === "fabric")?.value ?? "";
  const imgs = p.images.slice(0, 2).map((i) => i.src);
  return {
    id: String(p.id),
    sku: p.sku,
    name: p.name,
    category,
    price: Number(p.price) || 0,
    salePrice: p.sale_price ? Number(p.sale_price) : undefined,
    sizes,
    images: [
      imgs[0] ?? "https://image.deencommerce.com/placeholder.jpg",
      imgs[1] ?? imgs[0] ?? "https://image.deencommerce.com/placeholder.jpg",
    ] as [string, string],
    fabric,
    blurb: p.description?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "",
  };
}

export async function fetchWooProducts(): Promise<DeenProduct[]> {
  const { site, consumerKey, consumerSecret } = config.woo;
  const perPage = 100;
  let page = 1;
  const out: DeenProduct[] = [];
  // Paginate up to 10 pages (1000 products) — bounded to avoid runaway loops.
  while (page <= 10) {
    const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/products`);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Woo fetch failed: ${res.status}`);
    const batch = (await res.json()) as WooProduct[];
    if (batch.length === 0) break;
    for (const p of batch) {
      const d = mapWooToDeen(p);
      if (d) out.push(d);
    }
    if (batch.length < perPage) break;
    page++;
  }
  return out;
}

export async function pushWooOrder(order: unknown): Promise<{ id: number }> {
  const { site, consumerKey, consumerSecret } = config.woo;
  const url = new URL(`${site.replace(/\/$/, "")}/wp-json/wc/v3/orders`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(`Woo order create failed: ${res.status}`);
  return (await res.json()) as { id: number };
}
