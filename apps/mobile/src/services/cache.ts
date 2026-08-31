/**
 * DEEN Client-Side Cache Layer (v2 — Multi-Layer)
 *
 * Provides TTL-based caching with stale-while-revalidate, multi-layer storage
 * (L1 in-memory Map → L2 AsyncStorage), and server-driven version invalidation.
 *
 * Design:
 * - L1 (Memory): Instant reads, no serialization overhead, auto-pruned at 500 entries
 * - L2 (AsyncStorage): Persists across app restarts, crash-safe
 * - Stale-While-Revalidate: Return stale data immediately, refresh in background
 * - Every cached entry stores { data, cachedAt, version }
 * - Server-driven cache-version invalidation for coordinated bust
 *
 * Cross-Platform Identity:
 * - Mobile uses AsyncStorage for auth tokens (equivalent to web's localStorage + cookies)
 * - Both platforms share the same server-side guest session via /v1/auth/guest
 * - Cache version invalidation is synchronized via /v1/deen/cache-version
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  version: string;
}

interface CacheOptions {
  /** Time-to-live in milliseconds. Default: 5 minutes. */
  ttlMs?: number;
  /** Storage key prefix. */
  namespace?: string;
}

/* ------------------------------------------------------------------ */
/*  Default TTLs — different data changes at different rates            */
/* ------------------------------------------------------------------ */

export const TTL = {
  /** Products / catalog — changes rarely, refresh every 5 min */
  CATALOG: 5 * 60 * 1000,
  /** Districts — almost never change, refresh every 30 min */
  DISTRICTS: 30 * 60 * 1000,
  /** Delivery fees — change rarely, refresh every 15 min */
  DELIVERY_FEES: 15 * 60 * 1000,
  /** Campaigns — can toggle, refresh every 2 min */
  CAMPAIGNS: 2 * 60 * 1000,
  /** Categories — change rarely, refresh every 10 min */
  CATEGORIES: 10 * 60 * 1000,
  /** Category covers — change rarely, refresh every 10 min */
  CATEGORY_COVERS: 10 * 60 * 1000,
  /** Store info — change rarely, refresh every 30 min */
  STORE_INFO: 30 * 60 * 1000,
  /** Payment methods — change rarely, refresh every 15 min */
  PAYMENT_METHODS: 15 * 60 * 1000,
  /** Single product — changes rarely, refresh every 5 min */
  PRODUCT: 5 * 60 * 1000,
  /** Orders — user-specific, refresh every 1 min */
  ORDERS: 1 * 60 * 1000,
  /** Cache version probe — check every 30 seconds */
  VERSION_CHECK: 30 * 1000,
  /** Auth tokens — persist for 7 days */
  AUTH_TOKEN: 7 * 24 * 60 * 60 * 1000,
  /** Guest session — persist for 30 days */
  GUEST_SESSION: 30 * 24 * 60 * 60 * 1000,
} as const;

/* ------------------------------------------------------------------ */
/*  L1: In-Memory Cache (fastest reads)                                */
/* ------------------------------------------------------------------ */

const memoryCache = new Map<string, CacheEntry<any>>();
const MAX_MEMORY_ENTRIES = 500;
let memoryHits = 0;
let memoryMisses = 0;

function memoryGet(key: string): CacheEntry<any> | null {
  const entry = memoryCache.get(key);
  if (entry) {
    memoryHits++;
    return entry;
  }
  memoryMisses++;
  return null;
}

function memorySet(key: string, entry: CacheEntry<any>): void {
  // Prune if over limit (LRU-ish: delete oldest)
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    const oldestKey = Array.from(memoryCache.keys())[0];
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, entry);
}

function memoryDelete(key: string): void {
  memoryCache.delete(key);
}

function memoryClearPrefix(prefix: string): void {
  const keysToDelete: string[] = [];
  memoryCache.forEach((_val, key) => {
    if (key.startsWith(prefix)) keysToDelete.push(key);
  });
  keysToDelete.forEach((k) => memoryCache.delete(k));
}

/* ------------------------------------------------------------------ */
/*  Cache Version (server-driven invalidation)                         */
/* ------------------------------------------------------------------ */

const VERSION_KEY = "deen_cache_server_version";
const VERSION_CHECK_KEY = "deen_cache_last_version_check";
let localVersion = "";
let lastVersionCheck = 0;

/**
 * Check if the server's cache version has changed since our last check.
 * Returns true if data should be re-fetched (version changed or first run).
 */
export async function checkCacheVersion(
  gatewayRequest: <T>(path: string) => Promise<T>
): Promise<boolean> {
  const now = Date.now();
  // Don't check more often than every 30 seconds
  if (now - lastVersionCheck < TTL.VERSION_CHECK) {
    return false;
  }

  try {
    const res = await gatewayRequest<{ version: number; updatedAt: string }>(
      "/v1/deen/cache-version"
    );
    const serverVersion = String(res.version);
    lastVersionCheck = now;
    await AsyncStorage.setItem(VERSION_CHECK_KEY, String(now)).catch(() => {});

    if (localVersion && serverVersion !== localVersion) {
      // Server version changed — invalidate all cached data
      localVersion = serverVersion;
      await AsyncStorage.setItem(VERSION_KEY, serverVersion).catch(() => {});
      return true; // signal: re-fetch needed
    }

    localVersion = serverVersion;
    await AsyncStorage.setItem(VERSION_KEY, serverVersion).catch(() => {});
    return false;
  } catch {
    // Can't reach server — use whatever we have cached
    return false;
  }
}

/** Load persisted version on startup. */
export async function loadCacheVersion(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(VERSION_KEY);
    if (v) localVersion = v;
    const c = await AsyncStorage.getItem(VERSION_CHECK_KEY);
    if (c) lastVersionCheck = Number(c) || 0;
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Core cache read/write (multi-layer)                                */
/* ------------------------------------------------------------------ */

function cacheKey(namespace: string, key: string): string {
  return `deen_cache_${namespace}_${key}`;
}

/**
 * Read a cached value from L1 (memory) → L2 (AsyncStorage).
 * Returns null if missing, expired, or version-mismatched.
 */
export async function cacheGet<T>(
  namespace: string,
  key: string,
  ttlMs: number
): Promise<T | null> {
  const fullKey = cacheKey(namespace, key);

  // L1: Memory (instant)
  const memEntry = memoryGet(fullKey);
  if (memEntry) {
    const age = Date.now() - memEntry.cachedAt;
    if (
      age <= ttlMs &&
      (!localVersion || memEntry.version === localVersion)
    ) {
      return memEntry.data;
    }
    // Stale but within 2x TTL — return for stale-while-revalidate
    if (age <= ttlMs * 2 && (!localVersion || memEntry.version === localVersion)) {
      return memEntry.data;
    }
  }

  // L2: AsyncStorage (persistent)
  try {
    const raw = await AsyncStorage.getItem(fullKey);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;
    if (age > ttlMs) return null; // expired
    if (localVersion && entry.version !== localVersion) return null; // stale

    // Promote to L1 memory for faster future reads
    memorySet(fullKey, entry);
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Write a value to both L1 (memory) and L2 (AsyncStorage) with current
 * timestamp and version.
 */
export async function cacheSet<T>(
  namespace: string,
  key: string,
  data: T
): Promise<void> {
  const fullKey = cacheKey(namespace, key);
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    version: localVersion || "init",
  };

  // L1: Memory
  memorySet(fullKey, entry);

  // L2: AsyncStorage
  try {
    await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
  } catch {
    // Storage full or corrupted — silently degrade
  }
}

/**
 * Remove a specific cached entry from both layers.
 */
export async function cacheRemove(
  namespace: string,
  key: string
): Promise<void> {
  const fullKey = cacheKey(namespace, key);
  memoryDelete(fullKey);
  try {
    await AsyncStorage.removeItem(fullKey);
  } catch {}
}

/**
 * Clear all cached entries for a namespace from both layers.
 */
export async function cacheClearNamespace(
  namespace: string
): Promise<void> {
  const prefix = `deen_cache_${namespace}_`;

  // L1: Memory
  memoryClearPrefix(prefix);

  // L2: AsyncStorage
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith(prefix));
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {}
}

/**
 * Clear ALL cached entries from both layers.
 */
export async function cacheClearAll(): Promise<void> {
  // L1: Memory
  memoryCache.clear();

  // L2: AsyncStorage
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith("deen_cache_"));
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Cache Statistics (for debugging)                                   */
/* ------------------------------------------------------------------ */

export function getCacheStats(): {
  memoryEntries: number;
  memoryHits: number;
  memoryMisses: number;
  hitRate: string;
} {
  const total = memoryHits + memoryMisses;
  return {
    memoryEntries: memoryCache.size,
    memoryHits,
    memoryMisses,
    hitRate: total > 0 ? `${((memoryHits / total) * 100).toFixed(1)}%` : "N/A",
  };
}

/* ------------------------------------------------------------------ */
/*  Convenience: fetch-or-cache with stale-while-revalidate            */
/* ------------------------------------------------------------------ */

/**
 * Fetch data with automatic multi-layer caching.
 *
 * - Returns L1/L2 cached data if fresh (instant)
 * - If stale but within 2x TTL, returns stale data + triggers background refresh
 * - If expired or version-mismatched, fetches fresh data synchronously
 *
 * Usage:
 *   const products = await fetchOrCache("catalog", "all", TTL.CATALOG, () =>
 *     request<Product[]>("/v1/deen/products")
 *   );
 */
export async function fetchOrCache<T>(
  namespace: string,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // L1/L2: Try cache first
  const cached = await cacheGet<T>(namespace, key, ttlMs);
  if (cached !== null) return cached;

  // Check for stale data (within 2x TTL) for stale-while-revalidate
  const staleData = await getStaleData<T>(namespace, key, ttlMs);
  if (staleData !== null) {
    // Return stale data immediately, refresh in background
    fetcher()
      .then((fresh) => cacheSet(namespace, key, fresh))
      .catch(() => {});
    return staleData;
  }

  // Fetch fresh data
  const data = await fetcher();
  // Cache it (fire-and-forget, don't block the response)
  cacheSet(namespace, key, data).catch(() => {});
  return data;
}

/**
 * Get stale data (past TTL but within 2x) for stale-while-revalidate.
 */
async function getStaleData<T>(
  namespace: string,
  key: string,
  ttlMs: number
): Promise<T | null> {
  const fullKey = cacheKey(namespace, key);

  // Check L1 first
  const memEntry = memoryGet(fullKey);
  if (memEntry) {
    const age = Date.now() - memEntry.cachedAt;
    if (
      age <= ttlMs * 2 &&
      (!localVersion || memEntry.version === localVersion)
    ) {
      return memEntry.data;
    }
  }

  // Check L2
  try {
    const raw = await AsyncStorage.getItem(fullKey);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;
    if (
      age <= ttlMs * 2 &&
      (!localVersion || entry.version === localVersion)
    ) {
      memorySet(fullKey, entry); // promote to L1
      return entry.data;
    }
  } catch {}
  return null;
}

/* ------------------------------------------------------------------ */
/*  Auth Token Persistence (Cross-Platform Identity)                   */
/* ------------------------------------------------------------------ */

const AUTH_TOKEN_KEY = "deen_auth_token";
const GUEST_SESSION_KEY = "deen_guest_session_v1";

/**
 * Save auth token to AsyncStorage.
 * Mobile uses AsyncStorage (equivalent to web's localStorage + cookies).
 * Both platforms share the same server-side session via /v1/auth/guest.
 */
export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token).catch(() => {});
}

/**
 * Get auth token from AsyncStorage.
 */
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
}

/**
 * Clear auth token from AsyncStorage.
 */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
}

/**
 * Save guest session token to AsyncStorage.
 */
export async function saveGuestToken(token: string): Promise<void> {
  await AsyncStorage.setItem(GUEST_SESSION_KEY, token).catch(() => {});
}

/**
 * Get guest session token from AsyncStorage.
 */
export async function getGuestToken(): Promise<string | null> {
  return AsyncStorage.getItem(GUEST_SESSION_KEY).catch(() => null);
}

/**
 * Clear guest token from AsyncStorage.
 */
export async function clearGuestToken(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_SESSION_KEY).catch(() => {});
}
