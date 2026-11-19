import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, password } = body || {};

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Full name and 11-digit phone number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, "").slice(-11);
    if (!cleanPhone.startsWith("01") || cleanPhone.length !== 11) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX)." },
        { status: 400 }
      );
    }

    const token = `deen_sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return NextResponse.json({
      success: true,
      token,
      message: "Account created successfully",
      user: {
        id: `usr_${cleanPhone}`,
        name: String(name).trim(),
        username: cleanPhone,
        email: email ? String(email).trim() : `${cleanPhone}@deencommerce.com`,
        role: "customer",
        accountType: "customer",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Registration failed." },
      { status: 500 }
    );
  }
}
