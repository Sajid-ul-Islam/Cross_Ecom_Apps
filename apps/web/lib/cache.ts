/**
 * DEEN Web Client-Side Cache Layer (v2 — Multi-Layer)
 *
 * Provides TTL-based caching with stale-while-revalidate, multi-layer storage
 * (L1 in-memory Map → L2 localStorage → L3 cookies for auth tokens), and
 * server-driven version invalidation.
 *
 * Design:
 * - L1 (Memory): Instant reads, no serialization overhead, auto-pruned at 500 entries
 * - L2 (localStorage): Persists across page reloads, ~5MB budget
 * - L3 (Cookies): Auth tokens shared with server for cross-platform identity
 * - Stale-While-Revalidate: Return stale data immediately, refresh in background
 * - Every cached entry stores { data, cachedAt, version, etag? }
 * - Server-driven cache-version invalidation for coordinated bust
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  version: string;
  etag?: string;
}

interface CacheConfig {
  /** Maximum L1 (memory) entries before pruning */
  maxMemoryEntries: number;
  /** Enable stale-while-revalidate (return stale, refresh in background) */
  staleWhileRevalidate: boolean;
  /** Maximum localStorage budget in bytes (~5MB) */
  maxStorageBytes: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxMemoryEntries: 500,
  staleWhileRevalidate: true,
  maxStorageBytes: 4 * 1024 * 1024, // 4MB safety margin under 5MB
};

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
  if (memoryCache.size >= DEFAULT_CONFIG.maxMemoryEntries) {
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
/*  L2: localStorage Persistence                                       */
/* ------------------------------------------------------------------ */

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // Storage full — try to prune old entries
    pruneStorage();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Remove oldest 10% of deen_cache_ entries when storage is full */
function pruneStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const entries: { key: string; ts: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("deen_cache_")) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            entries.push({ key: k, ts: parsed.cachedAt || 0 });
          }
        } catch {
          entries.push({ key: k, ts: 0 });
        }
      }
    }
    // Sort oldest first, remove 10%
    entries.sort((a, b) => a.ts - b.ts);
    const toRemove = Math.max(1, Math.ceil(entries.length * 0.1));
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      localStorage.removeItem(entries[i].key);
    }
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  L3: Cookie Helpers (auth tokens, guest sessions)                   */
/* ------------------------------------------------------------------ */

function setCookie(name: string, value: string, maxAgeMs: number): void {
  if (typeof document === "undefined") return;
  try {
    const maxAge = Math.floor(maxAgeMs / 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=; max-age=0; path=/`;
  } catch {}
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
  apiFetchFn: (url: string) => Promise<Response>
): Promise<boolean> {
  const now = Date.now();
  if (now - lastVersionCheck < TTL.VERSION_CHECK) {
    return false;
  }

  try {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://cross-ecom-apps-4b4n.onrender.com";
    const res = await apiFetchFn(`${API_URL}/v1/deen/cache-version`);
    if (!res.ok) return false;
    const data = await res.json();
    const serverVersion = String(data.version);
    lastVersionCheck = now;
    safeSet(VERSION_CHECK_KEY, String(now));

    if (localVersion && serverVersion !== localVersion) {
      localVersion = serverVersion;
      safeSet(VERSION_KEY, serverVersion);
      return true; // signal: re-fetch needed
    }

    localVersion = serverVersion;
    safeSet(VERSION_KEY, serverVersion);
    return false;
  } catch {
    return false;
  }
}

/** Load persisted version on startup (client-side only). */
export function loadCacheVersion(): void {
  if (typeof window === "undefined") return;
  const v = safeGet(VERSION_KEY);
  if (v) localVersion = v;
  const c = safeGet(VERSION_CHECK_KEY);
  if (c) lastVersionCheck = Number(c) || 0;
}

/* ------------------------------------------------------------------ */
/*  Core cache read/write (multi-layer)                                */
/* ------------------------------------------------------------------ */

function cacheKey(namespace: string, key: string): string {
  return `deen_cache_${namespace}_${key}`;
}

/**
 * Read a cached value from L1 (memory) → L2 (localStorage).
 * Returns null if missing, expired, or version-mismatched.
 */
export function cacheGet<T>(namespace: string, key: string, ttlMs: number): T | null {
  const fullKey = cacheKey(namespace, key);

  // L1: Memory (instant)
  const memEntry = memoryGet(fullKey);
  if (memEntry) {
    const age = Date.now() - memEntry.cachedAt;
    if (age <= ttlMs && (!localVersion || memEntry.version === localVersion)) {
      return memEntry.data;
    }
    // Expired or stale — still return if stale-while-revalidate is on
    if (DEFAULT_CONFIG.staleWhileRevalidate && age <= ttlMs * 2) {
      return memEntry.data;
    }
  }

  // L2: localStorage (persistent)
  const raw = safeGet(fullKey);
  if (!raw) return null;
  try {
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
 * Write a value to both L1 (memory) and L2 (localStorage) with current
 * timestamp and version.
 */
export function cacheSet<T>(namespace: string, key: string, data: T): void {
  const fullKey = cacheKey(namespace, key);
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    version: localVersion || "init",
  };

  // L1: Memory
  memorySet(fullKey, entry);

  // L2: localStorage
  safeSet(fullKey, JSON.stringify(entry));
}

/**
 * Remove a specific cached entry from both layers.
 */
export function cacheRemove(namespace: string, key: string): void {
  const fullKey = cacheKey(namespace, key);
  memoryDelete(fullKey);
  safeRemove(fullKey);
}

/**
 * Clear all cached entries for a namespace from both layers.
 */
export function cacheClearNamespace(namespace: string): void {
  const prefix = `deen_cache_${namespace}_`;

  // L1: Memory
  memoryClearPrefix(prefix);

  // L2: localStorage
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => safeRemove(k));
  } catch {}
}

/**
 * Clear ALL cached entries from both layers.
 */
export function cacheClearAll(): void {
  // L1: Memory
  memoryCache.clear();

  // L2: localStorage
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("deen_cache_")) keys.push(k);
    }
    keys.forEach((k) => safeRemove(k));
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
 * @param revalidateInBackground - Optional callback to handle background revalidation
 */
export async function fetchOrCache<T>(
  namespace: string,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  revalidateInBackground?: (data: T) => void
): Promise<T> {
  const fullKey = cacheKey(namespace, key);

  // L1/L2: Try cache first (synchronous read — fast)
  const cached = cacheGet<T>(namespace, key, ttlMs);
  if (cached !== null) return cached;

  // Check for stale data (within 2x TTL) for stale-while-revalidate
  if (DEFAULT_CONFIG.staleWhileRevalidate) {
    const staleData = getStaleData<T>(namespace, key, ttlMs);
    if (staleData !== null) {
      // Return stale data immediately, refresh in background
      if (revalidateInBackground) {
        revalidateInBackground(staleData);
      }
      // Fire-and-forget background refresh
      fetcher()
        .then((fresh) => cacheSet(namespace, key, fresh))
        .catch(() => {});
      return staleData;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  cacheSet(namespace, key, data);
  return data;
}

/**
 * Get stale data (past TTL but within 2x) for stale-while-revalidate.
 */
function getStaleData<T>(namespace: string, key: string, ttlMs: number): T | null {
  const fullKey = cacheKey(namespace, key);

  // Check L1 first
  const memEntry = memoryGet(fullKey);
  if (memEntry) {
    const age = Date.now() - memEntry.cachedAt;
    if (age <= ttlMs * 2 && (!localVersion || memEntry.version === localVersion)) {
      return memEntry.data;
    }
  }

  // Check L2
  const raw = safeGet(fullKey);
  if (!raw) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;
    if (age <= ttlMs * 2 && (!localVersion || entry.version === localVersion)) {
      memorySet(fullKey, entry); // promote to L1
      return entry.data;
    }
  } catch {}
  return null;
}

/* ------------------------------------------------------------------ */
/*  Cookie-based Auth Token Management (Cross-Platform Identity)       */
/* ------------------------------------------------------------------ */

const AUTH_TOKEN_KEY = "deen_auth_token";
const AUTH_COOKIE_KEY = "deen_auth_token";
const GUEST_COOKIE_KEY = "deen_guest_token";

/**
 * Save auth token to both localStorage and cookie.
 * Cookie enables server-side session identification for cross-platform sync.
 */
export function saveAuthToken(token: string): void {
  safeSet(AUTH_TOKEN_KEY, token);
  setCookie(AUTH_COOKIE_KEY, token, TTL.AUTH_TOKEN);
}

/**
 * Get auth token from localStorage first, then cookie fallback.
 */
export function getAuthToken(): string | null {
  const fromStorage = safeGet(AUTH_TOKEN_KEY);
  if (fromStorage) return fromStorage;
  return getCookie(AUTH_COOKIE_KEY);
}

/**
 * Clear auth token from all storage layers.
 */
export function clearAuthToken(): void {
  safeRemove(AUTH_TOKEN_KEY);
  removeCookie(AUTH_COOKIE_KEY);
}

/**
 * Save guest session token to both localStorage and cookie.
 */
export function saveGuestToken(token: string): void {
  const key = "deen_web_guest_token";
  safeSet(key, token);
  setCookie(GUEST_COOKIE_KEY, token, TTL.GUEST_SESSION);
}

/**
 * Get guest session token from localStorage first, then cookie fallback.
 */
export function getGuestToken(): string | null {
  const key = "deen_web_guest_token";
  const fromStorage = safeGet(key);
  if (fromStorage) return fromStorage;
  return getCookie(GUEST_COOKIE_KEY);
}

/**
 * Clear guest token from all storage layers.
 */
export function clearGuestToken(): void {
  safeRemove("deen_web_guest_token");
  removeCookie(GUEST_COOKIE_KEY);
}
