import Link from "next/link";
import { fetchProducts, fetchCampaigns, fetchCategoryCovers, fetchCategories, fetchOutlets, bdt } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড | Official Online Store",
  description: "DEEN is an empathetic lifestyle e-commerce denim and apparel brand based in Bangladesh.",
};

const HERO_IMAGE =
  "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg";

export default async function HomePage() {
  const [featured, newArrivals, campaign, remoteCovers, categoriesList, outletsList] = await Promise.all([
    fetchProducts({ per_page: 8, sort: "price-desc" }),
    fetchProducts({ per_page: 4, sort: "new" }),
    fetchCampaigns(),
    fetchCategoryCovers(),
    fetchCategories(),
    fetchOutlets(),
  ]);

  const isCashback = campaign?.cashback?.enabled;
  const activePromo = campaign?.activeCampaign;

  // Curate display categories from REST API + standard catalog
  const primaryCategories = ["JEANS", "SHIRT", "PANJABI", "T-SHIRT", "POLO", "TROUSERS"];
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
    };
  });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড" />
        </div>
        <div className="hero__overlay" />
        <div className="hero__content">
          <div className="hero__badge">
            <span>✦</span>
            <span>দেশের প্রথম ডেনিম ব্র্যান্ড · DEEN</span>
          </div>
          <p className="hero__tagline">Empathetic Men&apos;s Lifestyle Fashion in Bangladesh</p>
          <h1 className="hero__title">
            Raw Washed.<br />Selvedge Heritage.
          </h1>
          <p className="hero__sub">
            From vintage slim-fit denim to Cuban collar shirts and heavyweight cotton — every piece
            is engineered for premium comfort, structure, and endurance.
          </p>
          <div className="hero__actions">
            <Link href="/shop" className="btn btn-primary btn-lg">
              Shop Collection →
            </Link>
            <Link href="/shop?category=JEANS" className="btn btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(8px)" }}>
              Explore Denim
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Dynamic Campaign Offer from REST API ─────────────────── */}
        {isCashback ? (
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)",
              borderRadius: "var(--radius)",
              padding: "22px 30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 48,
              border: "1px solid rgba(240, 185, 82, 0.3)",
            }}
          >
            <div>
              <p style={{ color: "#f0b952", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>
                🔥 LIMITED-TIME CASHBACK CAMPAIGN
              </p>
              <p style={{ color: "#fff", fontSize: 17, fontWeight: 900, marginBottom: 2 }}>
                Get ৳{campaign.cashback.tier1?.amount ?? 500} Cashback on {bdt(campaign.cashback.tier1?.minSpend ?? 2500)}+ · ৳{campaign.cashback.tier2?.amount ?? 700} Cashback on {bdt(campaign.cashback.tier2?.minSpend ?? 3000)}+
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Applied automatically at checkout on all denim, shirts, and menswear.
              </p>
            </div>
            <Link href="/shop" className="btn btn-sm" style={{ background: "#f0b952", color: "#000", fontWeight: 800, flexShrink: 0 }}>
              Shop &amp; Save →
            </Link>
          </div>
        ) : activePromo ? (
          <div
            style={{
              background: "linear-gradient(135deg, #181124 0%, #2a1b4e 50%, #3e1f47 100%)",
              borderRadius: "var(--radius)",
              padding: "22px 30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 48,
              border: "1px solid rgba(244, 95, 92, 0.4)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ background: "var(--crimson)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>
                  {activePromo.badge}
                </span>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                  OFFICIAL STORE CAMPAIGN
                </span>
              </div>
              <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 2 }}>
                {activePromo.title}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                {activePromo.subtitle}
              </p>
            </div>
            <Link href={activePromo.actionUrl || "/shop"} className="btn btn-sm btn-primary" style={{ fontWeight: 800, flexShrink: 0, padding: "10px 18px" }}>
              {activePromo.actionLabel || "Explore Sale"} →
            </Link>
          </div>
        ) : null}

        {/* ── Category Showcase (Dynamic REST API Category Covers) ───────────────────────────────── */}
        <section className="section">
          <div className="section__header">
            <div>
              <h2 className="section__title">Shop by Category</h2>
              <p className="section__sub">Explore our artisanal collection crafted in Bangladesh</p>
            </div>
            <Link href="/shop" className="section__link">See all →</Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {displayCategories.map((cat) => (
              <Link
                key={cat.key}
                href={`/shop?category=${cat.key}`}
                style={{
                  position: "relative",
                  height: 250,
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  display: "block",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                  className="cat-img"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(10,15,30,0.85) 0%, rgba(10,15,30,0.2) 60%, transparent 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 16,
                  }}
                >
                  <div>
                    <span style={{ color: "var(--denim-stitch)", fontSize: 9, fontWeight: 800, letterSpacing: 0.8, background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>
                      {cat.badge}
                    </span>
                    <p style={{ color: "#fff", fontSize: 16, fontWeight: 900, letterSpacing: 0.3, lineHeight: 1.2 }}>{cat.label}</p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 }}>
                      Shop Collection {cat.count ? `(${cat.count})` : ""} →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <style>{`.cat-img:hover { transform: scale(1.06); }`}</style>
        </section>

        {/* ── Featured Products ─────────────────────────── */}
        <section className="section">
          <div className="section__header">
            <div>
              <h2 className="section__title">Best Sellers</h2>
              <p className="section__sub">Our most-loved pieces</p>
            </div>
            <Link href="/shop" className="section__link">View all →</Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ── Trust Bar ────────────────────────────────── */}
        <section style={{ marginBottom: 60 }}>
          <div className="trust-bar">
            {[
              {
                icon: "🚚",
                title: "Fast Delivery",
                desc: "Dhaka in 24–48h (৳50) · All of Bangladesh in 3–5 days (৳90)",
              },
              {
                icon: "✅",
                title: "Authentic Quality",
                desc: "240+ GSM fabrics, Japanese-grade denim, artisanal stitching",
              },
              {
                icon: "🔄",
                title: "Easy Returns",
                desc: "Not satisfied? Return within 3 days — no questions asked",
              },
            ].map((t) => (
              <div key={t.title} className="trust-item">
                <span className="trust-item__icon">{t.icon}</span>
                <div>
                  <p className="trust-item__title">{t.title}</p>
                  <p className="trust-item__desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── New Arrivals ──────────────────────────────── */}
        {newArrivals.length > 0 && (
          <section className="section">
            <div className="section__header">
              <div>
                <h2 className="section__title">New Arrivals</h2>
                <p className="section__sub">Just landed in store</p>
              </div>
            </div>
            <div className="product-grid">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── 4 Physical Outlets Section ─────────────────── */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "40px 36px",
            marginBottom: 60,
          }}
        >
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <p style={{ color: "var(--brand)", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
              VISIT DEEN IN PERSON
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
              Our 4 Physical Outlets & Showrooms
            </h2>
            <p style={{ color: "var(--sub)", fontSize: 14, maxWidth: 600, margin: "0 auto" }}>
              Experience the fabric, try on selvedge denim, and get free store pickup from any of our 4 official retail locations across Bangladesh.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {outletsList.map((outlet) => {
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.mapQuery || outlet.address)}`;
              return (
                <div
                  key={outlet.id || outlet.name}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: 0.5,
                          background: outlet.pickup ? "var(--indigo-light)" : "var(--border)",
                          color: outlet.pickup ? "var(--indigo)" : "var(--sub)",
                          padding: "3px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {outlet.tag || (outlet.pickup ? "FLAGSHIP SHOWROOM & STORE PICKUP" : "REGIONAL SHOWROOM")}
                      </span>
                      {outlet.pickup && (
                        <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>✓ Free Pickup</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
                      {outlet.name}
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 10 }}>
                      📍 {outlet.address}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                      🕒 {outlet.hours}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--indigo)", fontWeight: 700 }}>
                      📞 Hotline: <a href={`tel:${outlet.phone}`} style={{ color: "var(--indigo)", textDecoration: "none" }}>{outlet.phone}</a>
                    </p>
                  </div>

                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "8px 12px",
                      textDecoration: "none",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    📍 GET DIRECTIONS (GOOGLE MAPS)
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
