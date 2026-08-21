import { useEffect, useState } from "react";
import { CATEGORIES, productById } from "./data";

/* ------------------------------------------------------------------ */
/*  Category cover photos, fetched from the WooCommerce catalog.       */
/*                                                                     */
/*  We ask the shop's WooCommerce site for its product-category list   */
/*  (Store API first, then the public REST v3 shape) and pull each     */
/*  category's cover image. The catalog can be slow, auth-walled or    */
/*  CORS-shy, so every category also has a bundled studio cover that   */
/*  renders instantly; a live WooCommerce photo fades in over it when  */
/*  the request succeeds.                                              */
/* ------------------------------------------------------------------ */

const WOO_BASES = ["https://deencommerce.bd"];
const WOO_PATHS = [
  "/wp-json/wc/store/v1/products/categories",
  "/wp-json/wc/v3/products/categories?per_page=100",
];

type WooCat = { name?: string; image?: { src?: string } | null };

/** Bundled covers used whenever the catalog can't be reached. */
const FALLBACK_COVERS: Record<string, string> = {
  footwear:
    "https://image.qwenlm.ai/generated-images/615c3010-ee9f-4568-8c72-e2146a1dcb03/_result.png",
  apparel:
    "https://image.qwenlm.ai/generated-images/9b8e4e09-7316-4fae-aade-0630c5a01ab4/_result.png",
  bags: "https://image.qwenlm.ai/generated-images/71a341e6-2bb7-4b22-a72d-c899f821e2e3/_result.png",
  audio:
    "https://image.qwenlm.ai/generated-images/8215e32a-23b2-47fe-af65-00f8e2eecbc4/_result.png",
  accessories: productById("p-watch")?.img ?? "",
  home: productById("p-mugs")?.img ?? "",
};

export const fallbackCover = (slug: string) => FALLBACK_COVERS[slug] ?? "";

let cache: Promise<Record<string, string>> | null = null;

async function tryEndpoint(
  base: string,
  path: string,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const res = await fetch(base + path, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("Unexpected payload");
  const out: Record<string, string> = {};
  for (const c of json as WooCat[]) {
    const name = (c.name ?? "").trim().toLowerCase();
    const src = c.image?.src;
    if (!name || !src) continue;
    const cat = CATEGORIES.find(
      (k) =>
        name === k.name.toLowerCase() ||
        name.includes(k.name.toLowerCase()) ||
        k.name.toLowerCase().includes(name),
    );
    if (cat) out[cat.slug] = src;
  }
  if (Object.keys(out).length === 0) throw new Error("No matching categories");
  return out;
}

export function fetchWooCovers(): Promise<Record<string, string>> {
  if (!cache) {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 4500);
    cache = (async () => {
      for (const base of WOO_BASES) {
        for (const path of WOO_PATHS) {
          try {
            return await tryEndpoint(base, path, ctrl.signal);
          } catch {
            /* try the next endpoint */
          }
        }
      }
      return {};
    })().finally(() => window.clearTimeout(timer));
  }
  return cache;
}

export function useWooCovers() {
  const [live, setLive] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    let on = true;
    fetchWooCovers().then((m) => {
      if (!on) return;
      setLive(m);
      setDone(true);
    });
    return () => {
      on = false;
    };
  }, []);

  const coverFor = (slug: string) => live[slug] ?? fallbackCover(slug);
  const isLive = (slug: string) => Boolean(live[slug]);

  return { coverFor, isLive, done };
}
