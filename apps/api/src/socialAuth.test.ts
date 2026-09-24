import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import {
  verifyGoogleIdToken,
  verifyFacebookAccessToken,
  facebookAppSecretProof,
  type FetchLike,
} from "./socialAuth.js";

/* ------------------------------------------------------------------ */
/*  Social identity-provider verification tests                        */
/*  Stubbed fetch keeps the security rules testable without network.   */
/* ------------------------------------------------------------------ */

const CLIENT_ID = "1234567890-deen.apps.googleusercontent.com";
const FB_APP_ID = "1083928172948271";
const FB_APP_SECRET = "fb_app_secret_value";
const NOW = 1_700_000_000_000; // fixed clock (seconds: 1_700_000_000)

const FAR_FUTURE = Math.floor(NOW / 1000) + 3600;
const PAST = Math.floor(NOW / 1000) - 60;

function googlePayload(overrides: Record<string, unknown> = {}) {
  return {
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    sub: "110169484474386276334",
    email: "sajid.islam@gmail.com",
    email_verified: "true",
    name: "Sajid Islam",
    picture: "https://lh3.googleusercontent.com/a/avatar",
    exp: String(FAR_FUTURE),
    ...overrides,
  };
}

function stubFetch(handler: (url: string) => { status?: number; body: any }): FetchLike {
  return async (url: string) => {
    const { status = 200, body } = handler(url);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

/* ------------------------------ Google ------------------------------ */

test("google: accepts a token issued for our client and returns the identity", async () => {
  const res = await verifyGoogleIdToken("good.token", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload() })),
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.identity.email, "sajid.islam@gmail.com");
  assert.equal(res.identity.sub, "110169484474386276334");
  assert.equal(res.identity.name, "Sajid Islam");
  assert.equal(res.identity.audChecked, true);
});

test("google: rejects a token minted for a different OAuth client (aud mismatch)", async () => {
  const res = await verifyGoogleIdToken("other.token", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({
      body: googlePayload({ aud: "9999999999-attacker.apps.googleusercontent.com" }),
    })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /different OAuth client/);
});

test("google: skips the audience check (and flags it) when no client id is configured", async () => {
  const res = await verifyGoogleIdToken("good.token", {
    clientId: "",
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ aud: "anything" }) })),
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.identity.audChecked, false);
});

test("google: rejects an expired token", async () => {
  const res = await verifyGoogleIdToken("old.token", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ exp: String(PAST) }) })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /expired/);
});

test("google: rejects an unverified email address", async () => {
  const res = await verifyGoogleIdToken("unverified.token", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ email_verified: "false" }) })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /not verified/);
});

test("google: rejects a foreign issuer", async () => {
  const res = await verifyGoogleIdToken("evil.token", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ iss: "https://accounts.evil.test" }) })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /issuer/);
});

test("google: rejects a token Google itself refuses", async () => {
  const res = await verifyGoogleIdToken("garbage", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ status: 400, body: { error: "invalid_token" } })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /HTTP 400/);
});

test("google: rejects a payload with no subject or no email", async () => {
  const noSub = await verifyGoogleIdToken("x", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ sub: "" }) })),
  });
  assert.equal(noSub.ok, false);

  const noEmail = await verifyGoogleIdToken("x", {
    clientId: CLIENT_ID,
    now: NOW,
    fetchImpl: stubFetch(() => ({ body: googlePayload({ email: "" }) })),
  });
  assert.equal(noEmail.ok, false);
});

test("google: rejects an empty token without calling the provider", async () => {
  let called = false;
  const res = await verifyGoogleIdToken("   ", {
    clientId: CLIENT_ID,
    fetchImpl: stubFetch(() => {
      called = true;
      return { body: googlePayload() };
    }),
  });
  assert.equal(res.ok, false);
  assert.equal(called, false);
});

/* ----------------------------- Facebook ----------------------------- */

function debugBody(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      app_id: FB_APP_ID,
      is_valid: true,
      user_id: "76543210987654321",
      expires_at: FAR_FUTURE,
      scopes: ["email", "public_profile"],
      ...overrides,
    },
  };
}

function profileBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "76543210987654321",
    name: "Sajid Islam",
    email: "Sajid.Islam@Facebook.com",
    picture: { data: { url: "https://scontent.xx.fbcdn.net/avatar.jpg" } },
    ...overrides,
  };
}

function facebookFetch(opts: { debug?: any; profile?: any } = {}) {
  return stubFetch((url) => {
    if (url.includes("/debug_token")) return { body: opts.debug ?? debugBody() };
    return { body: opts.profile ?? profileBody() };
  });
}

test("facebook: accepts a valid token issued to our app", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch(),
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.identity.id, "76543210987654321");
  assert.equal(res.identity.name, "Sajid Islam");
  assert.equal(res.identity.email, "sajid.islam@facebook.com"); // normalized
});

test("facebook: rejects a token issued to a different app", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch({ debug: debugBody({ app_id: "1111111111111111" }) }),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /different app/);
});

test("facebook: rejects a revoked or invalid token", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch({ debug: debugBody({ is_valid: false }) }),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /invalid or revoked/);
});

test("facebook: rejects an expired token", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch({ debug: debugBody({ expires_at: PAST }) }),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /expired/);
});

test("facebook: rejects when the token owner and profile disagree", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch({ profile: profileBody({ id: "99999999999999999" }) }),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /different users/);
});

test("facebook: returns no email when the user withheld the email permission", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: facebookFetch({ profile: profileBody({ email: undefined }) }),
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.identity.email, undefined);
  assert.equal(res.identity.id, "76543210987654321");
});

test("facebook: sends appsecret_proof derived from the app secret", async () => {
  let profileUrl = "";
  const fetchImpl = stubFetch((url) => {
    if (url.includes("/debug_token")) return { body: debugBody() };
    profileUrl = url;
    return { body: profileBody() };
  });

  await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl,
  });

  const expected = createHmac("sha256", FB_APP_SECRET).update("fb.token").digest("hex");
  assert.equal(facebookAppSecretProof("fb.token", FB_APP_SECRET), expected);
  assert.match(profileUrl, new RegExp(`appsecret_proof=${expected}`));
});

test("facebook: refuses to verify without app credentials", async () => {
  const res = await verifyFacebookAccessToken("fb.token", { appId: FB_APP_ID, now: NOW });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /not configured/);
});

test("facebook: surfaces a Graph error envelope instead of trusting the body", async () => {
  const res = await verifyFacebookAccessToken("fb.token", {
    appId: FB_APP_ID,
    appSecret: FB_APP_SECRET,
    now: NOW,
    fetchImpl: stubFetch(() => ({
      status: 400,
      body: { error: { message: "Invalid OAuth access token.", code: 190 } },
    })),
  });
  assert.equal(res.ok, false);
  if (res.ok) return;
  assert.match(res.reason, /HTTP 400/);
});
