import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: "usr_verified",
      name: "Verified Customer",
      username: "customer",
      email: "customer@deencommerce.com",
      role: "customer",
      accountType: "customer",
    },
  });
}
