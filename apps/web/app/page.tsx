import Link from "next/link";
import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { bdt } from "@/lib/api";

export const metadata = {
  title: "DEEN Commerce — Premium Men's Fashion Bangladesh",
};

const HERO_IMAGE =
  "https://deencommerce.com/wp-content/uploads/2023/04/WhatsApp-Image-2023-04-20-at-2.39.00-PM-scaled.jpeg";

const CATEGORY_IMAGES: Record<string, { img: string; label: string }> = {
  JEANS: {
    img: "https://deencommerce.com/wp-content/uploads/2023/04/WhatsApp-Image-2023-04-20-at-2.39.00-PM-scaled.jpeg",
    label: "Jeans",
  },
  SHIRT: {
    img: "https://deencommerce.com/wp-content/uploads/2023/05/White-Microprint-Casual-Half-Shirt-1-scaled.jpg",
    label: "Shirts",
  },
  PANJABI: {
    img: "https://deencommerce.com/wp-content/uploads/2023/06/Edward-Embroidered-Panjabi-1-scaled.jpg",
    label: "Panjabis",
  },
  "T-SHIRT": {
    img: "https://deencommerce.com/wp-content/uploads/2023/05/Full-Sleeve-White-Stripe-T-shirt-1-scaled.jpg",
    label: "T-Shirts",
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
          <img src={HERO_IMAGE} alt="DEEN Collection" />
        </div>
        <div className="hero__overlay" />
        <div className="hero__content">
          <div className="hero__badge">
            <span>✦</span>
            <span>PREMIUM COLLECTION 2026</span>
          </div>
          <p className="hero__tagline">Crafted for the modern Bangladeshi man</p>
          <h1 className="hero__title">
            Wear What<br />Defines You
          </h1>
          <p className="hero__sub">
            From raw-washed denim to hand-embroidered panjabis — every piece built
            for quality, comfort, and confidence.
          </p>
          <div className="hero__actions">
            <Link href="/shop" className="btn btn-primary btn-lg">
              Shop Now →
            </Link>
            <Link href="/shop?category=JEANS" className="btn btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(8px)" }}>
              Explore Jeans
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Free Tee Offer ───────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--indigo) 0%, #1a2350 100%)",
            borderRadius: "var(--radius)",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 48,
          }}
        >
          <div>
            <p style={{ color: "#f0b952", fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
              EXCLUSIVE OFFER
            </p>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
              🎁 FREE 240 GSM Heavyweight T-Shirt on orders over {bdt(3500)}
            </p>
          </div>
          <Link href="/shop" className="btn btn-sm" style={{ background: "#fff", color: "var(--indigo)", flexShrink: 0 }}>
            Shop Now
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
                desc: "Not satisfied? Return within 7 days — no questions asked",
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

        {/* ── Outlet CTA ───────────────────────────────── */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "40px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 60,
          }}
        >
          <div>
            <p style={{ color: "var(--indigo)", fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>
              VISIT US IN PERSON
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
              Banani Showroom
            </h2>
            <p style={{ color: "var(--sub)", fontSize: 14, lineHeight: 1.6 }}>
              Plot 68, Kemal Ataturk Ave, Banani, Dhaka 1213<br />
              Sat–Thu 10am–10pm · Fri 2pm–10pm
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=Banani+Dhaka"
            target="_blank"
            rel="noopener"
            className="btn btn-outline"
          >
            📍 Get Directions
          </a>
        </section>
      </div>
    </>
  );
}
