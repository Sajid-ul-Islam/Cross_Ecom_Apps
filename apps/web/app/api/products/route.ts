import { NextResponse } from "next/server";

const WORDPRESS_SITE_URL = "https://deencommerce.com";

export const dynamic = "force-dynamic";

/**
 * Public Next.js Server Route for direct WooCommerce Store API access.
 * Runs on the server runtime so it bypasses browser CORS restrictions completely.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const perPage = searchParams.get("per_page") || "100";
    const page = searchParams.get("page") || "1";

    const targetUrl = id
      ? `${WORDPRESS_SITE_URL}/wp-json/wc/store/v1/products/${encodeURIComponent(id)}`
      : `${WORDPRESS_SITE_URL}/wp-json/wc/store/v1/products?per_page=${encodeURIComponent(perPage)}&page=${encodeURIComponent(page)}`;

    const res = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DEEN-Web-Fallback/1.0",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "UPSTREAM_FAILED", message: `WordPress Store API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "INTERNAL", message: err?.message || "Failed to fetch from WordPress Store API" },
      { status: 502 }
    );
  }
}
