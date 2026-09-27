import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "VALIDATION", message: "Invalid JSON request.", status: 400 }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "VALIDATION", message: "Order details are required.", status: 400 }, { status: 400 });
  }
  const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || body.idempotencyKey;
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 200) {
    return NextResponse.json({ error: "VALIDATION", message: "A checkout key is required.", status: 400 }, { status: 400 });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey };
  const key = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY;
  if (key) headers["x-api-key"] = key;
  const authorization = req.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://cross-ecom-apps-4b4n.onrender.com";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/deen/orders`, {
      method: "POST", headers, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "ORDER_UNCONFIRMED", message: "We could not confirm the order. Check order status before trying again.", status: 502 }, { status: 502 });
  }
}
