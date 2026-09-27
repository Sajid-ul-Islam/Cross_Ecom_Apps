import type { Metadata } from "next";
import Link from "next/link";
import { fetchCategories, fetchCategoryCovers } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import CategoryBentoShowcase from "@/components/CategoryBentoShowcase";

export const metadata: Metadata = {
  title: "All Categories & Collections | DEEN Official Store",
  description:
    "Explore DEEN's complete category directory: raw selvedge denim, Cuban collar shirts, heritage panjabis, zero-torque tees, and curated international drops.",
};

export default async function CategoriesPage() {
  const [remoteCovers, categoriesList] = await Promise.all([
    fetchCategoryCovers(),
    fetchCategories(),
  ]);

  const primaryCategories = [
    "SALE",
    "TRENDING",
    "NEW_ARRIVALS",
    "JEANS",
    "SHIRT",
    "T-SHIRT",
    "TROUSERS",
    "PANJABI",
    "DEEN_SELECT",
    "VALUE_PACKS",
    "ACCESSORIES",
    "OTHERS",
  ];

  const displayCategories = primaryCategories.map((catKey) => {
    const info = getCategoryInfo(catKey, remoteCovers);
    const countObj = categoriesList.find((c) => c.category.toUpperCase() === catKey);
    return {
      key: catKey,
      label: info.title,
      subtitle: info.subtitle,
      img: info.coverImage,
      badge: info.metaBadge,
      count: countObj?.count,
      initialOrientation: info.orientation,
      initialAspectRatio: info.aspectRatio,
    };
  });

  return (
    <div className="container" style={{ paddingBottom: 60, paddingTop: 20 }}>
      {/* ── Breadcrumb & Category Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--sub)", marginBottom: 12 }}>
          <Link href="/" style={{ color: "var(--sub)", textDecoration: "none" }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 700 }}>Categories</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Apparel Categories & Drops
            </h1>
            <p style={{ color: "var(--sub)", fontSize: 14, margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
              Handcrafted selvedge denim, Cuban collar shirts, heritage dobby panjabis & curated international labels — all engineered for Bangladesh.
            </p>
          </div>

          <Link
            href="/shop"
            className="btn btn-outline"
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Browse Full Catalog ({categoriesList.reduce((acc, c) => acc + c.count, 0)} Items) →
          </Link>
        </div>
      </div>

      {/* ── Dynamic Bento Category Showcase ── */}
      <CategoryBentoShowcase categories={displayCategories} />

      {/* ── Trust & Delivery Banner ── */}
      <div
        style={{
          marginTop: 40,
          padding: "24px 28px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>🚚</span>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800 }}>Nationwide Delivery</h4>
            <p style={{ margin: 0, fontSize: 12, color: "var(--sub)", lineHeight: 1.4 }}>
              ৳50 Dhaka metro (24–48h) · ৳90 outside Dhaka (3–5 days). Delivered safely to your door.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>🔄</span>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800 }}>7-Day Size Exchange</h4>
            <p style={{ margin: 0, fontSize: 12, color: "var(--sub)", lineHeight: 1.4 }}>
              Hassle-free doorstep size swap across Bangladesh if the fit isn&apos;t 100% perfect.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800 }}>100% Authentic Quality</h4>
            <p style={{ margin: 0, fontSize: 12, color: "var(--sub)", lineHeight: 1.4 }}>
              240+ GSM combed cotton, authentic cross-hatch warp/weft denim, and bespoke craftsmanship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
