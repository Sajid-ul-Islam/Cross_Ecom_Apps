import Link from "next/link";
import { fetchProducts, fetchCampaigns, fetchCategoryCovers, fetchCategories, fetchOutlets, fetchHeroBanner, fetchSectionBanners, bdt } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import SectionOfferBanner from "@/components/SectionOfferBanner";

export const metadata = {
  title: "DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড",
  description: "DEEN is an empathetic lifestyle e-commerce denim and apparel brand based in Bangladesh.",
};

export default async function HomePage() {
  const [
    featured,
    newArrivals,
    jeansProducts,
    shirtsProducts,
    panjabiProducts,
    campaign,
    remoteCovers,
    categoriesList,
    outletsList,
    heroBanner,
    sectionBanners,
  ] = await Promise.all([
    fetchProducts({ per_page: 8 }),
    fetchProducts({ per_page: 4, sort: "new" }),
    fetchProducts({ category: "JEANS", per_page: 4 }),
    fetchProducts({ category: "SHIRT", per_page: 4 }),
    fetchProducts({ category: "PANJABI", per_page: 4 }),
    fetchCampaigns(),
    fetchCategoryCovers(),
    fetchCategories(),
    fetchOutlets(),
    fetchHeroBanner(),
    fetchSectionBanners(),
  ]);

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
      {/* ── Dynamic Hero Slideshow from Live API ─────────── */}
      <HeroSlider bannerData={heroBanner} />

      <div className="container">
        {/* ── Dynamic Campaign Offer from REST API ─────────────────── */}
        {activePromo ? (
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

        {/* ── Featured Products / Best Sellers ──────────── */}
        <section className="section">
          <div className="section__header">
            <div>
              <h2 className="section__title">Best Sellers & High Demand</h2>
              <p className="section__sub">Our most-loved pieces, deeply stocked and tailored for comfort</p>
            </div>
            <Link href="/shop" className="section__link">View all →</Link>
          </div>
          <div className="product-grid">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ── Section Offer Banner 1: Selvedge Denim Campaign ── */}
        {sectionBanners[0] && (
          <SectionOfferBanner banner={sectionBanners[0]} />
        )}

        {/* ── Artisanal Denim Collection ────────────────── */}
        {jeansProducts.length > 0 && (
          <section className="section">
            <div className="section__header">
              <div>
                <h2 className="section__title">Artisanal Selvedge Denim</h2>
                <p className="section__sub">Woven on vintage shuttle looms with deep rope-dyed indigo</p>
              </div>
              <Link href="/shop?category=JEANS" className="section__link">Explore All Denim →</Link>
            </div>
            <div className="product-grid">
              {jeansProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Section Offer Banner 2: Summer Shirts Campaign ── */}
        {sectionBanners[1] && (
          <SectionOfferBanner banner={sectionBanners[1]} />
        )}

        {/* ── Cuban Collar & Resort Shirts ────────────────── */}
        {shirtsProducts.length > 0 && (
          <section className="section">
            <div className="section__header">
              <div>
                <h2 className="section__title">Cuban Collar & Casual Shirts</h2>
                <p className="section__sub">High-density lightweight textures engineered for Bangladesh&apos;s humid weather</p>
              </div>
              <Link href="/shop?category=SHIRT" className="section__link">Shop All Shirts →</Link>
            </div>
            <div className="product-grid">
              {shirtsProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Section Offer Banner 3: Heritage Panjabi Campaign ── */}
        {sectionBanners[2] && (
          <SectionOfferBanner banner={sectionBanners[2]} />
        )}

        {/* ── Signature Panjabi Collection ───────────────── */}
        {panjabiProducts.length > 0 && (
          <section className="section">
            <div className="section__header">
              <div>
                <h2 className="section__title">Heritage Panjabi Collection</h2>
                <p className="section__sub">Pure cotton dobby, bespoke embroidery & timeless elegance</p>
              </div>
              <Link href="/shop?category=PANJABI" className="section__link">View All Panjabis →</Link>
            </div>
            <div className="product-grid">
              {panjabiProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Section Offer Banner 4: Breathable Casuals ── */}
        {sectionBanners[3] && (
          <SectionOfferBanner banner={sectionBanners[3]} />
        )}

        {/* ── Trust Bar ────────────────────────────────── */}
        <section style={{ marginBottom: 40, marginTop: 20 }}>
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
