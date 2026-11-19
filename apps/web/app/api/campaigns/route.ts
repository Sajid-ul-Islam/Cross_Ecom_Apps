import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    cashbackEnabled: false,
    saleEnabled: true,
    saleTitle: "FLAT UP TO 50% OFF",
    saleSubtitle: "Season Clearance: 40%–50% discount on selected artisanal denim & apparel",
    saleBadge: "LIMITED TIME SALE",
    discountRange: "40%–50%",
    activeFestival: "",
  });
}
