/**
 * DEEN-BI Multi-Tier Background Caching Engine
 *
 * Provides sub-millisecond BI analytics responses by combining:
 * 1. L1 In-Memory Fast Cache with TTL
 * 2. L2 Persistent Disk Snapshots (zero cold-start delay on gateway boot)
 * 3. Non-blocking Stale-While-Revalidate background calculation worker
 * 4. Single-Flight request deduplication (prevents calculation storms)
 */

import { promises as fs } from "fs";
import path from "path";
import { config } from "./config.js";

export interface CacheEntry<T> {
  data: T;
  computedAt: number;
  expiresAt: number;
  computeDurationMs: number;
}

const DATA_DIR = process.env.DATA_DIR || "/tmp/deen_gateway_data";
const DEFAULT_TTL_MS = config.ttl.biMs; // S1 env-overridable (default 10 min)

class BiCacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private singleFlightLocks = new Map<string, Promise<any>>();
  private backgroundWorkerStarted = false;
  private workerInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes cache by loading warm disk snapshots.
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const diskFiles = await fs.readdir(DATA_DIR).catch(() => []);
      for (const file of diskFiles) {
        if (file.endsWith("_snapshot.json")) {
          const key = file.replace("_snapshot.json", "");
          try {
            const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
            const entry = JSON.parse(raw);
            if (entry && entry.data) {
              this.memoryCache.set(key, entry);
            }
          } catch {
            // Ignore corrupted disk snapshot
          }
        }
      }
      console.log(`[biCache] Loaded ${this.memoryCache.size} warm snapshots from disk.`);
    } catch (err) {
      console.warn("[biCache] Could not load disk snapshots:", (err as Error).message);
    }
  }

  /**
   * Get cached data or calculate with single-flight deduplication and stale-while-revalidate.
   */
  async getOrCompute<T>(
    key: string,
    calculator: () => Promise<T>,
    options?: { ttlMs?: number; forceFresh?: boolean }
  ): Promise<{ data: T; hit: boolean; ageSeconds: number; computeDurationMs: number }> {
    const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
    const now = Date.now();
    const existing = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    // 1. Return fresh in-memory hit
    if (!options?.forceFresh && existing && now < existing.expiresAt) {
      return {
        data: existing.data,
        hit: true,
        ageSeconds: Math.round((now - existing.computedAt) / 1000),
        computeDurationMs: existing.computeDurationMs,
      };
    }

    // 2. Stale-While-Revalidate: If stale data exists and not forced, return stale data immediately and revalidate in background
    if (!options?.forceFresh && existing && !this.singleFlightLocks.has(key)) {
      // Trigger non-blocking background revalidation
      void this.computeAndStore(key, calculator, ttl);
      return {
        data: existing.data,
        hit: true,
        ageSeconds: Math.round((now - existing.computedAt) / 1000),
        computeDurationMs: existing.computeDurationMs,
      };
    }

    // 3. Single-Flight Deduplication: If already calculating this exact key, reuse the in-flight Promise
    const inFlight = this.singleFlightLocks.get(key);
    if (inFlight) {
      const data = await inFlight;
      return {
        data,
        hit: false,
        ageSeconds: 0,
        computeDurationMs: 0,
      };
    }

    // 4. Synchronously compute, cache in memory and write to disk
    const result = await this.computeAndStore(key, calculator, ttl);
    return {
      data: result.data,
      hit: false,
      ageSeconds: 0,
      computeDurationMs: result.computeDurationMs,
    };
  }

  /**
   * Computes fresh result, updates L1 memory cache and persists L2 disk snapshot.
   */
  private async computeAndStore<T>(key: string, calculator: () => Promise<T>, ttlMs: number): Promise<CacheEntry<T>> {
    const startTime = Date.now();
    const computationPromise = (async () => {
      try {
        const data = await calculator();
        const duration = Date.now() - startTime;
        const entry: CacheEntry<T> = {
          data,
          computedAt: Date.now(),
          expiresAt: Date.now() + ttlMs,
          computeDurationMs: duration,
        };

        // Update L1 Memory Cache
        this.memoryCache.set(key, entry);

        // Update L2 Disk Snapshot asynchronously
        void this.persistToDisk(key, entry);

        return data;
      } finally {
        this.singleFlightLocks.delete(key);
      }
    })();

    this.singleFlightLocks.set(key, computationPromise);
    await computationPromise;
    return this.memoryCache.get(key)!;
  }

  /**
   * Persist cache entry to disk for instant boot recovery.
   */
  private async persistToDisk(key: string, entry: CacheEntry<any>): Promise<void> {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = path.join(DATA_DIR, `${safeKey}_snapshot.json`);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(entry), "utf-8");
    } catch {
      // Non-critical background disk write failure
    }
  }

  /**
   * Start recurring background warming worker.
   */
  startBackgroundWorker(task: () => Promise<void>, intervalMs: number = 5 * 60 * 1000): void {
    if (this.backgroundWorkerStarted) return;
    this.backgroundWorkerStarted = true;

    // Run first warm-up after 10 seconds of startup
    setTimeout(() => {
      void task().catch((err) => console.warn("[biCache] Warm-up error:", (err as Error).message));
    }, 10_000);

    // Then schedule recurring cron every intervalMs
    this.workerInterval = setInterval(() => {
      void task().catch((err) => console.warn("[biCache] Background worker error:", (err as Error).message));
    }, intervalMs);

    // Prevent interval from keeping process alive on shutdown
    if (this.workerInterval.unref) {
      this.workerInterval.unref();
    }
  }

  /**
   * Explicitly invalidate cache entries matching prefix or all.
   */
  invalidate(prefix?: string): void {
    if (!prefix) {
      this.memoryCache.clear();
      return;
    }
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const biCache = new BiCacheService();
