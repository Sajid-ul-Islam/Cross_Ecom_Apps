import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GATEWAY_URLS = [
  "https://cross-ecom-apps-4b4n.onrender.com",
  "https://cross-ecom-apps.onrender.com",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Authenticate credentials against WordPress / WooCommerce via live gateway
    for (const gwUrl of GATEWAY_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`${gwUrl}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUsername, password }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          return NextResponse.json(
            {
              success: false,
              message: data?.message || "Invalid username or password.",
            },
            { status: 401 }
          );
        }

        if (res.ok && data?.success) {
          return NextResponse.json({
            success: true,
            token: data.token,
            message: data.message || "Login successful",
            user: data.user,
          });
        }
      } catch {
        // Try next gateway if connection timed out
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach store authentication server. Please check your connection and try again.",
      },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Authentication error." },
      { status: 500 }
    );
  }
}
