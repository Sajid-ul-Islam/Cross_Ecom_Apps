/**
 * Security & compliance helpers (Data/Security/Compliance tier).
 * - Structured audit logging with PII redaction (never log passwords/tokens/PII).
 * - Per-API-key / per-IP rate limiting to stop abuse.
 * - PII helpers (masking, minimization).
 */

/* --------------------------- audit logging --------------------------- */
/* All sensitive operations (auth, orders, account changes) go through here.
   Logs are redacted: no passwords, tokens, or full PII. */
type AuditEvent = {
  ts: string;
  action: string;
  ok: boolean;
  actor?: string; // masked phone / username, never raw PII
  meta?: Record<string, unknown>;
};

const auditLog: AuditEvent[] = [];
const AUDIT_MAX = 5000;

export function audit(action: string, ok: boolean, actor?: string, meta?: Record<string, unknown>) {
  const evt: AuditEvent = { ts: new Date().toISOString(), action, ok, actor, meta };
  auditLog.push(evt);
  if (auditLog.length > AUDIT_MAX) auditLog.shift();
  // Console line is also redacted (actor already masked by callers).
  console.log(`[audit] ${evt.ts} ${ok ? "OK " : "FAIL"} ${action}${actor ? ` actor=${actor}` : ""}`);
}

export function getAuditLog() {
  return auditLog.slice(-200); // last 200 for dashboards/debug
}

/* --------------------------- PII redaction --------------------------- */
export function maskPhone(phone?: string): string {
  if (!phone) return "";
  const d = phone.replace(/[^0-9]/g, "");
  if (d.length < 5) return "****";
  return `${d.slice(0, 3)}****${d.slice(-3)}`;
}

export function redactToken(token?: string): string {
  if (!token) return "";
  return token.length > 8 ? `${token.slice(0, 4)}…${token.slice(-4)}` : "****";
}

/* --------------------------- rate limiting --------------------------- */
/* Sliding-window per key (api-key or IP). Replaces the old IP-only limiter. */
const rlStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;

export function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function rateLimitKeyFor(req: { headers: Record<string, any>; socket?: any }): string {
  const apiKey = (req.headers["x-api-key"] as string) || "";
  if (apiKey) return `key:${apiKey.slice(0, 12)}`;
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
}
