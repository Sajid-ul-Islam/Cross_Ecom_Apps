import { Session, SessionStore, Lang, BotState } from "./types";

interface SessionRecord {
  session: Session;
  expiresAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SESSIONS = 10000;

/**
 * In-Memory implementation of SessionStore with TTL and bounded LRU-like pruning.
 */
export class InMemorySessionStore implements SessionStore {
  private store = new Map<string, SessionRecord>();

  constructor(private ttlMs: number = SESSION_TTL_MS) {}

  private pruneExpired(): void {
    const now = Date.now();
    this.store.forEach((record, id) => {
      if (record.expiresAt < now) {
        this.store.delete(id);
      }
    });
  }

  public get(id: string): Session | null {
    const record = this.store.get(id);
    if (!record) return null;

    if (record.expiresAt < Date.now()) {
      this.store.delete(id);
      return null;
    }

    // Refresh TTL on active access
    record.expiresAt = Date.now() + this.ttlMs;
    record.session.updatedAt = Date.now();
    return record.session;
  }

  public set(id: string, data: Session): void {
    if (this.store.size >= MAX_SESSIONS) {
      this.pruneExpired();
      if (this.store.size >= MAX_SESSIONS) {
        // Evict oldest session
        const firstKey = this.store.keys().next().value;
        if (firstKey) this.store.delete(firstKey);
      }
    }

    this.store.set(id, {
      session: data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public clear(id: string): void {
    this.store.delete(id);
  }
}

/**
 * Creates a brand-new blank session object.
 */
export function createNewSession(id: string, lang: Lang = "en"): Session {
  const now = Date.now();
  return {
    id,
    lang,
    state: "IDLE",
    slots: {},
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Global singleton instance
export const sessionStore: SessionStore = new InMemorySessionStore();
