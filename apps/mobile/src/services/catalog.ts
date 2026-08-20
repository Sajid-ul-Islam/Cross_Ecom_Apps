/**
 * Bundled offline catalog — ships inside the app so customers see products
 * IMMEDIATELY on install, with no network. The gateway later refreshes it
 * in the background (see services/gateway.ts fetchProducts).
 *
 * Loaded lazily (require) so the 720 KB JSON is parsed on first use, not at
 * app startup — keeps launch fast.
 */
let cache: any = null;

export function getBundledCatalog(): { generatedAt: string; count: number; products: any[] } {
  if (!cache) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cache = require("./data/catalog.snapshot.json");
  }
  return cache;
}

export function getBundledProducts(): any[] {
  return getBundledCatalog().products ?? [];
}
