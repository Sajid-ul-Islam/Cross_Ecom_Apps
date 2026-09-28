/* ------------------------------------------------------------------ */
/*  Payment Provider Verification (server-to-server).                  */
/*                                                                     */
/*  Roadmap P2-1: never trust a client-submitted transaction ID.       */
/*  Settlement is confirmed by querying the payment provider DIRECTLY  */
/*  (SSLCommerz Order Validation API / bKash tokenized checkout),      */
/*  then — and only then — the gateway marks the Woo order paid via    */
/*  updateWooOrderPayment(). If the provider is not configured, the    */
/*  caller keeps its current safe behaviour (nothing is auto-trusted). */
/*                                                                     */
/*  Contracts per official docs:                                       */
/*  • SSLCommerz Validation API (GET, format=json):                    */
/*      https://<sandbox|securepay>.sslcommerz.com/validator/api/      */
/*        validationserverAPI.php?val_id=…&store_id=…&store_passwd=…   */
/*    Success = status "VALID" | "VALIDATED" AND currency_amount       */
/*    matching the order total AND risk_level === 0.                   */
/*  • SSLCommerz IPN signature (per official WooCommerce plugin):      */
/*      MD5 of sorted "key=value" pairs joined by "&" — keys ordered   */
/*      lexicographically, values raw (no URL-encoding).              */
/*  • bKash tokenized checkout: /tokenized/checkout/execute (grant),   */
/*    then /tokenized/checkout/general/search/transactionInfo (status) */
/* ------------------------------------------------------------------ */

import { createHash, timingSafeEqual } from "crypto";

const TIMEOUT_MS = 6_000;
const MAX_RETRIES = 2;
const PROVIDER_BASE_DELAY_MS = 200;

export interface SslCommerzValidation {
  status: "VALIDATED"; // normalized: VALID or VALIDATED from the provider
  rawStatus: string;
  tranId: string;
  valId: string;
  /** Provider-reported paid amount in the store currency. */
  amount: number;
  bankTranId?: string;
  cardType?: string;
  riskLevel?: number;
}

export interface VerificationInput {
  provider: "sslcommerz" | "bkash";
  /** SSLCommerz val_id (preferred) or bKash paymentID / trxID. */
  reference: string;
  /** Optional customer trxId for bKash search fallback. */
  trxId?: string;
  /** Authoritative order total (BDT) the settlement must match. */
  amount: number;
  /** Expected merchant tran_id — SSLCommerz must echo it back. */
  expectedTranId?: string;
}

export interface VerificationResult {
  verified: boolean;
  /** Machine-readable reason when not verified. */
  reason?:
    | "NOT_CONFIGURED"
    | "PROVIDER_ERROR"
    | "NOT_SETTLED"
    | "AMOUNT_MISMATCH"
    | "TRANSACTION_MISMATCH"
    | "RISKY_TRANSACTION";
  message?: string;
  validation?: SslCommerzValidation;
  trxId?: string;
}

export function isPaymentsProviderConfigured(): boolean {
  return Boolean(
    (process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWD) ||
      (process.env.BKASH_APP_KEY && process.env.BKASH_APP_SECRET && process.env.BKASH_USERNAME && process.env.BKASH_PASSWORD)
  );
}

/* ---------------- jittered retry (repo standard) ---------------- */

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // Retry transport/5xx failures only; 4xx is a deterministic answer.
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        lastErr = new Error(`Provider responded ${res.status}`);
      } else {
        return res;
      }
    } catch (e) {
      lastErr = e;
    }
    if (attempt < MAX_RETRIES) {
      const baseDelay = PROVIDER_BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, baseDelay + jitter));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider unreachable");
}

function toNumber(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/* ---------------------- SSLCommerz ------------------------- */

function sslcommerzBase(): string {
  // Live by default; sandbox only when explicitly opted in.
  return process.env.SSLCOMMERZ_MODE === "sandbox"
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";
}

async function validateSslCommerz(input: VerificationInput): Promise<VerificationResult> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWD;
  if (!storeId || !storePasswd) {
    return { verified: false, reason: "NOT_CONFIGURED" };
  }

  const url =
    `${sslcommerzBase()}/validator/api/validationserverAPI.php` +
    `?val_id=${encodeURIComponent(input.reference)}` +
    `&store_id=${encodeURIComponent(storeId)}` +
    `&store_passwd=${encodeURIComponent(storePasswd)}` +
    `&v=1&format=json`;

  let res: Response;
  try {
    res = await fetchWithRetry(url);
  } catch (e) {
    return { verified: false, reason: "PROVIDER_ERROR", message: (e as Error).message };
  }
  if (!res.ok) {
    return { verified: false, reason: "PROVIDER_ERROR", message: `Validation API responded ${res.status}` };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { verified: false, reason: "PROVIDER_ERROR", message: "Malformed validation response" };
  }

  const rawStatus = String(data?.status ?? "");
  const amount = toNumber(data?.currency_amount ?? data?.amount);
  const tranId = String(data?.tran_id ?? "");
  const riskLevel = toNumber(data?.risk_level) ?? 0;

  if (rawStatus !== "VALID" && rawStatus !== "VALIDATED") {
    return { verified: false, reason: "NOT_SETTLED", message: `Provider status: ${rawStatus || "unknown"}` };
  }
  if (input.expectedTranId && tranId && tranId !== input.expectedTranId) {
    return { verified: false, reason: "TRANSACTION_MISMATCH", message: "Validation tran_id does not match the order." };
  }
  if (amount == null || Math.abs(amount - input.amount) > 0.01) {
    return { verified: false, reason: "AMOUNT_MISMATCH", message: "Settled amount differs from the order total." };
  }
  if (riskLevel !== 0) {
    return { verified: false, reason: "RISKY_TRANSACTION", message: `Provider flagged risk_level=${riskLevel}.` };
  }

  return {
    verified: true,
    validation: {
      status: "VALIDATED",
      rawStatus,
      tranId,
      valId: String(data?.val_id ?? input.reference),
      amount,
      bankTranId: data?.bank_tran_id ? String(data.bank_tran_id) : undefined,
      cardType: data?.card_type ? String(data.card_type) : undefined,
      riskLevel,
    },
    trxId: tranId || undefined,
  };
}

/** Verify the SSLCommerz IPN signature (MD5 of sorted k=v pairs joined by "&"). */
export function verifySslCommerzIpnSignature(payload: Record<string, string>): boolean {
  const { verify_sign, verify_key, ...rest } = payload;
  if (!verify_sign || !verify_key) return false;
  const keys = String(verify_key).split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return false;
  const parts: string[] = [];
  for (const k of keys.sort()) {
    const v = rest[k];
    if (v === undefined) return false;
    parts.push(`${k}=${v}`);
  }
  const expected = createHash("md5").update(parts.join("&")).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(verify_sign).toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------- bKash --------------------------- */

async function bkashGrantToken(): Promise<string | null> {
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;
  if (!appKey || !appSecret || !username || !password) return null;

  const res = await fetchWithRetry(`${process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta"}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username,
      password,
      "X-APP-Key": appKey,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });
  if (!res.ok) throw new Error(`bKash grant token failed: ${res.status}`);
  const data = await res.json();
  return data?.id_token ? String(data.id_token) : null;
}

async function verifyBkash(input: VerificationInput): Promise<VerificationResult> {
  if (!isPaymentsProviderConfigured()) {
    return { verified: false, reason: "NOT_CONFIGURED" };
  }

  let token: string | null;
  try {
    token = await bkashGrantToken();
  } catch (e) {
    return { verified: false, reason: "PROVIDER_ERROR", message: (e as Error).message };
  }
  if (!token) return { verified: false, reason: "NOT_CONFIGURED" };

  const base = process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta";
  const query = async (body: Record<string, unknown>): Promise<any> => {
    const res = await fetchWithRetry(`${base}/tokenized/checkout/general/search/transactionInfo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token!,
        "X-APP-Key": process.env.BKASH_APP_KEY!,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`bKash query failed: ${res.status}`);
    return res.json();
  };

  try {
    // Prefer paymentID (exact), fall back to trxID search.
    let data: any = null;
    if (input.reference) {
      try {
        data = await query({ paymentID: input.reference });
      } catch {
        data = null;
      }
    }
    if ((!data || data?.transactionStatus === undefined) && input.trxId) {
      data = await query({ trxID: input.trxId });
    }

    const trxId = String(data?.trxID ?? input.trxId ?? "");
    const amount = toNumber(data?.amount);
    const status = String(data?.transactionStatus ?? "");

    if (status !== "Completed") {
      return { verified: false, reason: "NOT_SETTLED", message: `bKash status: ${status || "unknown"}`, trxId: trxId || undefined };
    }
    if (amount == null || Math.abs(amount - input.amount) > 0.01) {
      return { verified: false, reason: "AMOUNT_MISMATCH", trxId: trxId || undefined };
    }

    return { verified: true, trxId: trxId || undefined };
  } catch (e) {
    return { verified: false, reason: "PROVIDER_ERROR", message: (e as Error).message };
  }
}

/* ----------------------- facade ---------------------------- */

export async function verifyPaymentSettlement(input: VerificationInput): Promise<VerificationResult> {
  if (input.provider === "sslcommerz") return validateSslCommerz(input);
  return verifyBkash(input);
}
