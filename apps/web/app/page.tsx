import Link from "next/link";
import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { bdt } from "@/lib/api";

export const metadata = {
  title: "DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড | Official Online Store",
  description: "DEEN is an empathetic lifestyle e-commerce denim and apparel brand based in Bangladesh.",
};

const HERO_IMAGE =
  "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg";

const CATEGORY_IMAGES: Record<string, { img: string; label: string }> = {
  JEANS: {
    img: "https://deencommerce.com/wp-content/uploads/2026/05/jeans-1.jpg",
    label: "Raw Washed & Vintage Jeans",
  },
  SHIRT: {
    img: "https://deencommerce.com/wp-content/uploads/2026/06/Half-sleeve-Section-iomage.webp",
    label: "Casual & Half Shirts",
  },
  PANJABI: {
    img: "https://deencommerce.com/wp-content/uploads/2026/05/Section-Image-4.jpg",
    label: "Cuban Collar & Resort Wear",
  },
  "T-SHIRT": {
    img: "https://deencommerce.com/wp-content/uploads/2026/07/1x1-2.png",
    label: "Heavyweight T-Shirts",
  },
};

export default async function HomePage() {
  const [featured, newArrivals] = await Promise.all([
    fetchProducts({ per_page: 8, sort: "price-desc" }),
    fetchProducts({ per_page: 4, sort: "new" }),
  ]);

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
          <p className="hero__tagline">Empathetic Men's Lifestyle Fashion in Bangladesh</p>
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
        {/* ── Instant Cashback Offer ─────────────────── */}
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
              Get ৳500 Cashback on {bdt(2500)}+ · ৳700 Cashback on {bdt(3000)}+
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              Applied automatically at checkout on all denim, shirts, and menswear.
            </p>
          </div>
          <Link href="/shop" className="btn btn-sm" style={{ background: "#f0b952", color: "#000", fontWeight: 800, flexShrink: 0 }}>
            Shop &amp; Save →
          </Link>
        </div>

        {/* ── Categories ───────────────────────────────── */}
        <section className="section">
          <div className="section__header">
            <div>
              <h2 className="section__title">Shop by Category</h2>
              <p className="section__sub">Explore our curated collections</p>
            </div>
            <Link href="/shop" className="section__link">See all →</Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {Object.entries(CATEGORY_IMAGES).map(([cat, { img, label }]) => (
              <Link
                key={cat}
                href={`/shop?category=${cat}`}
                style={{
                  position: "relative",
                  height: 240,
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  display: "block",
                  cursor: "pointer",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                  className="cat-img"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(10,15,30,0.75) 0%, transparent 60%)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 16,
                  }}
                >
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
                      DEEN
                    </p>
                    <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, letterSpacing: 0.5 }}>{label}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>Shop →</p>
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
            {/* Mirpur 12 */}
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--brand)", letterSpacing: 1 }}>FLAGSHIP HQ & STUDIO</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 4px" }}>DEEN Mirpur 12 (Dhaka)</h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 12 }}>
                2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216
              </p>
              <a
                href="https://maps.google.com/?q=Ramzannesa+Super+Market+Mirpur+12+Dhaka"
                target="_blank"
                rel="noopener"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}
              >
                📍 View on Google Maps →
              </a>
            </div>

            {/* Wari */}
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--brand)", letterSpacing: 1 }}>DHAKA SOUTH</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 4px" }}>DEEN Wari Outlet</h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 12 }}>
                Ground Floor, 41 A.K Famous Tower, Rankin Street, Wari, Dhaka-1203
              </p>
              <a
                href="https://maps.google.com/?q=Rankin+Street+Wari+Dhaka"
                target="_blank"
                rel="noopener"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}
              >
                📍 View on Google Maps →
              </a>
            </div>

            {/* Cumilla */}
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--brand)", letterSpacing: 1 }}>CUMILLA SHOWROOM</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 4px" }}>DEEN Cumilla Outlet</h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 12 }}>
                4th Floor, QR Tower, Badurtola, Cumilla
              </p>
              <a
                href="https://maps.google.com/?q=QR+Tower+Badurtola+Cumilla"
                target="_blank"
                rel="noopener"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}
              >
                📍 View on Google Maps →
              </a>
            </div>

            {/* Sylhet */}
            <div style={{ padding: 20, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--brand)", letterSpacing: 1 }}>SYLHET SHOWROOM</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 4px" }}>DEEN Sylhet Outlet</h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 12 }}>
                Block-A, House-54/2, Kumar Para, Sylhet
              </p>
              <a
                href="https://maps.google.com/?q=Kumar+Para+Sylhet"
                target="_blank"
                rel="noopener"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}
              >
                📍 View on Google Maps →
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
