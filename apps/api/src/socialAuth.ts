/**
 * Social identity-provider verification (Google OIDC ID tokens, Facebook
 * Graph access tokens).
 *
 * The apps hand the gateway a provider token; the gateway — never the client —
 * decides who the user is. Both verifiers therefore check that the token was
 * minted for OUR OAuth client (Google `aud` / Facebook `app_id`), not merely
 * that the provider still considers it valid. A token issued to any other app
 * is rejected, so a hostile app cannot vouch for a DEEN customer's email.
 *
 * Every verifier is pure I/O against the provider and takes an injectable
 * `fetchImpl` + clock, so the rules are unit-testable offline.
 */
import { createHmac } from "crypto";

export const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  aud: string;
  /** False when GOOGLE_CLIENT_ID is unset, i.e. the audience could not be checked. */
  audChecked: boolean;
}

export interface FacebookIdentity {
  id: string;
  name?: string;
  /** Absent when the user did not grant the `email` permission. */
  email?: string;
  picture?: string;
}

export type VerifyResult<T> = { ok: true; identity: T } | { ok: false; reason: string };

/** Minimal fetch shape so tests can inject a stub without a real network. */
export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

const DEFAULT_TIMEOUT_MS = 6000;

interface JsonResponse {
  ok: boolean;
  status: number;
  body: any;
}

async function getJson(fetchImpl: FetchLike, url: string, timeoutMs: number): Promise<JsonResponse> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const res = await Promise.race([
      fetchImpl(url),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`identity provider timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
        // Never hold the event loop open on a stuck provider.
        (timer as any)?.unref?.();
      }),
    ]);
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: Boolean(res.ok), status: Number(res.status) || 0, body };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Verify a Google ID token (`id_token`) and return the identity it proves.
 * Rejects tokens with a wrong audience/issuer, an expired `exp`, or an
 * unverified email — all of which are attacker-controllable otherwise.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  opts: { clientId?: string; fetchImpl?: FetchLike; now?: number; timeoutMs?: number }
): Promise<VerifyResult<GoogleIdentity>> {
  const token = String(idToken || "").trim();
  if (!token) return { ok: false, reason: "Missing Google ID token." };

  const fetchImpl = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const now = opts.now ?? Date.now();
  const clientId = String(opts.clientId || "").trim();

  let res: JsonResponse;
  try {
    res = await getJson(
      fetchImpl,
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    );
  } catch (err) {
    return { ok: false, reason: `Google token verification failed: ${(err as Error).message}` };
  }

  if (!res.ok || !res.body) {
    return { ok: false, reason: `Google rejected the ID token (HTTP ${res.status}).` };
  }

  const payload = res.body;
  const sub = String(payload.sub || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const issuer = String(payload.iss || "").trim();
  const aud = String(payload.aud || "").trim();
  // tokeninfo serialises this as the string "true"; Google's JSON libraries use a boolean.
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";
  const expSec = Number(payload.exp || 0);

  if (!sub) return { ok: false, reason: "Google ID token has no subject (sub)." };
  if (!email) return { ok: false, reason: "Google ID token did not include an email address." };
  if (!issuer) return { ok: false, reason: "Google ID token is missing its issuer." };
  if (!GOOGLE_ISSUERS.includes(issuer)) return { ok: false, reason: "Google ID token has an unexpected issuer." };
  if (!emailVerified) return { ok: false, reason: "Google account email is not verified." };
  if (!expSec) return { ok: false, reason: "Google ID token has no expiry." };
  if (expSec * 1000 <= now) return { ok: false, reason: "Google ID token has expired." };
  if (clientId && aud !== clientId) {
    return { ok: false, reason: "Google ID token was issued for a different OAuth client." };
  }

  return {
    ok: true,
    identity: {
      sub,
      email,
      name: payload.name || payload.given_name || undefined,
      picture: payload.picture || undefined,
      aud,
      audChecked: Boolean(clientId),
    },
  };
}

/** Facebook's appsecret_proof: HMAC-SHA256 of the access token keyed by the app secret. */
export function facebookAppSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

/**
 * Verify a Facebook user access token and return the identity it proves.
 *
 * Graph `/me` alone accepts a token minted for ANY app, so ownership is
 * established first with `debug_token`, which reports the issuing `app_id`.
 * The profile call then carries `appsecret_proof` so Facebook knows the
 * request really came from this server.
 */
export async function verifyFacebookAccessToken(
  accessToken: string,
  opts: { appId?: string; appSecret?: string; fetchImpl?: FetchLike; now?: number; timeoutMs?: number }
): Promise<VerifyResult<FacebookIdentity>> {
  const token = String(accessToken || "").trim();
  if (!token) return { ok: false, reason: "Missing Facebook access token." };

  const appId = String(opts.appId || "").trim();
  const appSecret = String(opts.appSecret || "").trim();
  if (!appId || !appSecret) {
    return { ok: false, reason: "Facebook app credentials are not configured on the gateway." };
  }

  const fetchImpl = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const now = opts.now ?? Date.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let debugRes: JsonResponse;
  let profileRes: JsonResponse;
  try {
    debugRes = await getJson(
      fetchImpl,
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}` +
        `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
      timeoutMs
    );
    const data = debugRes.body?.data;
    if (!debugRes.ok || !data) {
      return { ok: false, reason: `Facebook rejected the access token (HTTP ${debugRes.status}).` };
    }
    if (data.is_valid !== true) {
      return { ok: false, reason: "Facebook access token is invalid or revoked." };
    }
    if (String(data.app_id || "") !== appId) {
      return { ok: false, reason: "Facebook access token was issued for a different app." };
    }
    const expiresAt = Number(data.expires_at || 0);
    if (expiresAt > 0 && expiresAt * 1000 <= now) {
      return { ok: false, reason: "Facebook access token has expired." };
    }

    profileRes = await getJson(
      fetchImpl,
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)` +
        `&appsecret_proof=${facebookAppSecretProof(token, appSecret)}` +
        `&access_token=${encodeURIComponent(token)}`,
      timeoutMs
    );
  } catch (err) {
    return { ok: false, reason: `Facebook token verification failed: ${(err as Error).message}` };
  }

  const profile = profileRes.body;
  if (!profileRes.ok || !profile?.id) {
    return { ok: false, reason: `Facebook profile lookup failed (HTTP ${profileRes.status}).` };
  }

  const userId = String(profile.id);
  // debug_token already told us which user owns the token — the two must agree.
  const debugUserId = String((debugRes.body as any)?.data?.user_id || "");
  if (debugUserId && debugUserId !== userId) {
    return { ok: false, reason: "Facebook token and profile identify different users." };
  }

  return {
    ok: true,
    identity: {
      id: userId,
      name: profile.name || undefined,
      email: profile.email ? String(profile.email).trim().toLowerCase() : undefined,
      picture: profile.picture?.data?.url || undefined,
    },
  };
}
