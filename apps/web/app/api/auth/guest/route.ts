import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = `deen_guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return NextResponse.json({
    token,
    role: "guest",
    expiresIn: 7 * 24 * 3600,
  });
}
