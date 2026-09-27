// Unit/integration tests must never use a developer's credentials, data, or network.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.NODE_ENV = "test";
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "deen-test-"));
process.env.WOO_SITE_URL = "https://woo.test";
process.env.WOO_CONSUMER_KEY = "test-key";
process.env.WOO_CONSUMER_SECRET = "test-secret";
process.env.SESSION_SIGNING_SECRET = "test-only-session-signing-secret";
process.env.WEBHOOK_SECRET = "test-only-webhook-secret";
process.env.GATEWAY_API_KEY = "";
process.env.PATHAO_CLIENT_ID = "";
process.env.PATHAO_CLIENT_SECRET = "";
process.env.GEMINI_API_KEY = "";
process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.FACEBOOK_APP_ID = "test-app";
process.env.FACEBOOK_APP_SECRET = "test-app-secret";
process.env.SOCIAL_AUTH_ALLOW_UNVERIFIED = "false";
globalThis.fetch = async () => new Response("{}", { status: 503 });
process.on("exit", () => rmSync(process.env.DATA_DIR!, { recursive: true, force: true }));
