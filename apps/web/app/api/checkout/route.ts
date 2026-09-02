import { NextResponse } from "next/server";

const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps-4b4n.onrender.com";
const BACKUP_GATEWAY_URL = "https://cross-ecom-apps.onrender.com";
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_GATEWAY_URL;
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idempotencyKey =
      req.headers.get("idempotency-key") ||
      req.headers.get("x-idempotency-key") ||
      body.idempotencyKey ||
      `web_ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const authHeader = req.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "x-idempotency-key": idempotencyKey,
    };

    if (GATEWAY_API_KEY) {
      headers["x-api-key"] = GATEWAY_API_KEY;
    }
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const primaryUrl = `${API_URL}/v1/deen/orders`;
    let res: Response;

    try {
      res = await fetch(primaryUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (err: any) {
      // Primary gateway unreachable — attempt failover
      const backupUrl = `${BACKUP_GATEWAY_URL}/v1/deen/orders`;
      res = await fetch(backupUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to process order through secure checkout route.",
      },
      { status: 500 }
    );
  }
}
