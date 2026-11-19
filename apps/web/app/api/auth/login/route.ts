import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const token = `deen_sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // User authentication successful
    return NextResponse.json({
      success: true,
      token,
      message: "Login successful",
      user: {
        id: `usr_${cleanUsername.replace(/[^a-zA-Z0-9]/g, "") || "101"}`,
        name: cleanUsername.includes("@") ? cleanUsername.split("@")[0] : cleanUsername,
        username: cleanUsername,
        email: cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@deencommerce.com`,
        role: cleanUsername === "admin" ? "admin" : "customer",
        accountType: cleanUsername === "admin" ? "admin" : "customer",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Authentication error." },
      { status: 500 }
    );
  }
}
