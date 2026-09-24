import Fuse from "fuse.js";
import { ProductCard } from "./types";
import { getBundledProducts, resolveProductImage } from "./api";
import { searchProducts as wooSearchProducts } from "./woo";
import synonymsData from "./synonyms.json";
import { normalizeLower } from "./normalize";

interface SynonymMap {
  products: Record<string, string[]>;
  colors: Record<string, string[]>;
}

const synonyms = synonymsData as SynonymMap;

/**
 * Expands raw user query by appending canonical English terms for any matched Banglish/Bangla synonyms.
 * e.g. "sharter dam koto" -> "sharter dam koto shirt শার্ট"
 */
export function expandQueryWithSynonyms(query: string): string {
  if (!query) return "";
  const normalized = normalizeLower(query);
  const words = normalized.split(/[^a-zA-Z0-9\u0980-\u09FF]+/).filter(Boolean);
  const addedTerms = new Set<string>();

  for (const word of words) {
    // Check product categories
    for (const [canonical, variants] of Object.entries(synonyms.products)) {
      if (canonical.toLowerCase() === word || variants.some((v) => v.toLowerCase() === word)) {
        addedTerms.add(canonical);
        variants.slice(0, 3).forEach((v) => addedTerms.add(v));
      }
    }

    // Check color terms
    for (const [canonical, variants] of Object.entries(synonyms.colors)) {
      if (canonical.toLowerCase() === word || variants.some((v) => v.toLowerCase() === word)) {
        addedTerms.add(canonical);
        variants.slice(0, 2).forEach((v) => addedTerms.add(v));
      }
    }
  }

  if (addedTerms.size === 0) return query;
  return `${query} ${Array.from(addedTerms).join(" ")}`;
}

/**
 * Returns canonical product synonym terms and variants for words present in the query.
 */
export function getSynonymKeywords(query: string): string[] {
  if (!query) return [];
  const normalized = normalizeLower(query);
  const words = normalized.split(/[^a-zA-Z0-9\u0980-\u09FF]+/).filter(Boolean);
  const terms: string[] = [];

  for (const word of words) {
    for (const [canonical, variants] of Object.entries(synonyms.products)) {
      if (canonical.toLowerCase() === word || variants.some((v) => v.toLowerCase() === word)) {
        terms.push(canonical);
        variants.forEach((v) => terms.push(v));
      }
    }
  }
  return Array.from(new Set(terms));
}

/**
 * Builds and caches a Fuse.js index over the catalog products.
 */
let fuseInstance: Fuse<ProductCard> | null = null;
let cachedCatalogLength = 0;

function getFuseIndex(): Fuse<ProductCard> {
  const bundled = getBundledProducts();
  if (!fuseInstance || bundled.length !== cachedCatalogLength) {
    const cards: ProductCard[] = bundled.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.salePrice ?? p.price,
      regularPrice: p.regularPrice ?? p.price,
      salePrice: p.salePrice,
      image: resolveProductImage(p.images?.[0] || ""),
      permalink: `/product/${p.id}`,
      in_stock: p.stockStatus !== "outofstock",
      sizes: p.sizes,
      category: p.category,
      sku: p.sku,
    }));

    fuseInstance = new Fuse(cards, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "category", weight: 0.25 },
        { name: "sku", weight: 0.15 },
        { name: "sizes", weight: 0.1 },
      ],
      threshold: 0.45,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
    });
    cachedCatalogLength = bundled.length;
  }
  return fuseInstance;
}

/**
 * Matches products using Fuse.js fuzzy matching with synonym expansion,
 * falling back to or merging with live WooCommerce search.
 */
export async function matchProducts(rawQuery: string, limit = 5): Promise<ProductCard[]> {
  const clean = rawQuery.trim();
  if (!clean) return [];

  const fuse = getFuseIndex();
  const matchedCards: ProductCard[] = [];
  const seenIds = new Set<string>();

  const addItems = (items: ProductCard[]) => {
    for (const item of items) {
      const idStr = String(item.id);
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        matchedCards.push(item);
      }
      if (matchedCards.length >= limit) break;
    }
  };

  // 1. Try exact/fuzzy search with the raw clean query
  const directResults = fuse.search(clean);
  addItems(directResults.map((r) => r.item));

  // 2. If needed, try individual word tokens (e.g. for "Selvedge Jeans", try "Jeans")
  if (matchedCards.length < limit) {
    const words = clean.split(/\s+/).filter((w) => w.length >= 3);
    for (const w of words) {
      if (matchedCards.length >= limit) break;
      const res = fuse.search(w);
      addItems(res.map((r) => r.item));
    }
  }

  // 3. If needed, expand synonyms (e.g. "shart" -> "shirt", "pant" -> "jeans", "পাঞ্জাবি" -> "panjabi")
  if (matchedCards.length < limit) {
    const synTerms = getSynonymKeywords(clean);
    for (const term of synTerms) {
      if (matchedCards.length >= limit) break;
      const res = fuse.search(term);
      addItems(res.map((r) => r.item));
    }
  }

  // 4. Fallback / Merge with WooCommerce search API
  if (matchedCards.length < limit) {
    try {
      const wooResults = await wooSearchProducts(clean, limit);
      addItems(wooResults);
    } catch (err) {
      console.warn("[bot-productMatch] Woo search fallback warning:", err);
    }
  }

  return matchedCards.slice(0, limit);
}
