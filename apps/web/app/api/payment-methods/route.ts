import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    methods: [
      {
        id: "cod",
        title: "Cash on Delivery",
        description: "Pay in cash when your parcel is delivered at your doorstep.",
        type: "cod",
      },
      {
        id: "bkash-for-woocommerce",
        title: "bKash Online Payment",
        description: "Fast, secure payment via bKash mobile wallet.",
        type: "redirect",
      },
      {
        id: "sslcommerz",
        title: "Cards & Mobile Banking",
        description: "Visa, Mastercard, Nagad, Rocket, and Internet Banking via SSLCommerz.",
        type: "redirect",
      },
    ],
  });
}
