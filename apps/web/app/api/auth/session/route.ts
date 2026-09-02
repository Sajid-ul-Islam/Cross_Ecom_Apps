import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "deen_session_token";
const PROFILE_COOKIE_NAME = "deen_user_profile";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  const profileRaw = cookieStore.get(PROFILE_COOKIE_NAME)?.value || null;

  let profile = null;
  if (profileRaw) {
    try {
      profile = JSON.parse(profileRaw);
    } catch {
      profile = null;
    }
  }

  return NextResponse.json({
    authenticated: Boolean(token),
    token,
    profile,
  });
}

export async function POST(req: Request) {
  try {
    const { token, profile } = await req.json();

    const response = NextResponse.json({
      success: true,
      authenticated: Boolean(token),
      profile,
    });

    if (token) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    }

    if (profile) {
      response.cookies.set({
        name: PROFILE_COOKIE_NAME,
        value: JSON.stringify(profile),
        httpOnly: false, // accessible to client for fast name/address auto-fill
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "SESSION_ERROR", message: err?.message || "Failed to set session cookie." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: PROFILE_COOKIE_NAME,
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
