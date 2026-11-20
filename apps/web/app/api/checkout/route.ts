import { NextResponse } from "next/server";

const WOO_SITE_URL = process.env.WOO_SITE_URL || "https://deencommerce.com";
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || "";
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || "";

export const dynamic = "force-dynamic";

/**
 * Direct WooCommerce Checkout & Order Creation Route (Zero Fastify / Zero Render dependency).
 * Direct to WordPress/WooCommerce REST API v3 with paymentUrl generation for In-App PaymentDrawer.
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "VALIDATION", message: "Invalid JSON request payload.", status: 400 },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "VALIDATION", message: "Order details are required.", status: 400 },
      { status: 400 }
    );
  }

  const {
    name,
    phone,
    email,
    address,
    city,
    district,
    state,
    postcode,
    area,
    payment,
    items,
    lines,
    subtotal,
    delivery,
    total,
    coupon,
    customerNote,
    deliveryNotes,
    shipping,
  } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Customer name and phone number are required.", status: 400 },
      { status: 400 }
    );
  }

  const cleanPhone = String(phone).replace(/[^0-9]/g, "").slice(-11);
  const orderLines = items || lines || [];

  // If live WooCommerce credentials are provided, post directly to Woo REST API
  if (WOO_CONSUMER_KEY && WOO_CONSUMER_SECRET) {
    try {
      const wooUrl = new URL(`${WOO_SITE_URL.replace(/\/$/, "")}/wp-json/wc/v3/orders`);
      wooUrl.searchParams.set("consumer_key", WOO_CONSUMER_KEY);
      wooUrl.searchParams.set("consumer_secret", WOO_CONSUMER_SECRET);

      const wooPayload = {
        payment_method: payment || "cod",
        payment_method_title: payment === "cod" ? "Cash on Delivery (COD)" : "Online Payment (bKash/Cards)",
        set_paid: false,
        customer_note: customerNote || deliveryNotes || "",
        billing: {
          first_name: name,
          phone: cleanPhone,
          email: email || `${cleanPhone}@deencommerce.com`,
          address_1: address || "Dhaka, Bangladesh",
          city: city || "Dhaka",
          state: state || district || "BD-13",
          postcode: postcode || "1200",
          country: "BD",
        },
        shipping: shipping || {
          first_name: name,
          phone: cleanPhone,
          address_1: address || "Dhaka, Bangladesh",
          city: city || "Dhaka",
          state: state || district || "BD-13",
          postcode: postcode || "1200",
          country: "BD",
        },
        line_items: orderLines.map((it: any) => ({
          product_id: Number(it.productId || it.product_id),
          variation_id: it.variationId || it.variation_id ? Number(it.variationId || it.variation_id) : undefined,
          quantity: Number(it.qty || it.quantity || 1),
        })),
        shipping_lines: [
          {
            method_id: area === "outside" ? "outside_dhaka" : "flat_rate",
            method_title: area === "outside" ? "Outside Dhaka Delivery" : "Dhaka Home Delivery",
            total: String(delivery ?? 50),
          },
        ],
      };

      const wooRes = await fetch(wooUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wooPayload),
        signal: AbortSignal.timeout(15_000),
      });

      if (wooRes.ok) {
        const wooData = await wooRes.json();
        const orderKey = wooData.order_key || `wc_order_${Date.now()}`;
        const paymentUrl =
          wooData.payment_url ||
          `${WOO_SITE_URL}/checkout/order-pay/${wooData.id}/?pay_for_order=true&key=${encodeURIComponent(orderKey)}`;

        return NextResponse.json({
          id: wooData.id,
          number: String(wooData.number || wooData.id),
          wooId: wooData.id,
          wooNumber: String(wooData.number || wooData.id),
          status: wooData.status || "processing",
          total: Number(wooData.total || total),
          delivery: Number(delivery ?? 50),
          payment: payment || "cod",
          paymentTitle: wooData.payment_method_title,
          paymentUrl: payment !== "cod" ? paymentUrl : undefined,
          orderKey,
          pathaoConsignmentId: wooData.meta_data?.find((m: any) => m.key === "ptc_consignment_id")?.value,
        });
      } else {
        const errText = await wooRes.text().catch(() => "");
        console.error("[checkout/route] Woo error response:", wooRes.status, errText);
        return NextResponse.json(
          {
            error: "ORDER_UNCONFIRMED",
            message: "We could not confirm the order with WooCommerce. Please verify and try again.",
            status: 502,
          },
          { status: 502 }
        );
      }
    } catch (err: any) {
      console.error("[checkout/route] Woo network/timeout exception:", err);
      return NextResponse.json(
        {
          error: "ORDER_UNCONFIRMED",
          message: "Upstream order creation timed out. Please check your order history before retrying.",
          status: 502,
        },
        { status: 502 }
      );
    }
  }

  // Upstream WooCommerce credentials not configured on server
  return NextResponse.json(
    {
      error: "GATEWAY_UNAVAILABLE",
      message: "Order processing is temporarily unavailable. Upstream credentials are not configured.",
      status: 502,
    },
    { status: 502 }
  );
}
