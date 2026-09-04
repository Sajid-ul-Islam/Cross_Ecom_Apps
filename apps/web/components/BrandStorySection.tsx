import React from "react";
import Link from "next/link";

export default function BrandStorySection() {
  return (
    <section className="brand-story-section" style={{ padding: "40px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
      <div className="container">
        <div style={{ maxWidth: 840, margin: "0 auto", textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99, 102, 241, 0.12)", color: "var(--indigo)", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", marginBottom: 12 }}>
            <span>🧵</span> EST. DHAKA 2020 · HERITAGE &amp; CRAFT
          </div>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 12 }}>
            Slow Craftsmanship. Pure Indigo Selvedge.
          </h2>
          <p style={{ fontSize: "clamp(13px, 1.8vw, 15px)", color: "var(--sub)", lineHeight: 1.7 }}>
            DEEN was born from a singular obsession: reviving the tactile weight and timeless honesty of shuttle-loom selvedge denim in Bangladesh. We weave with vintage shuttle looms, using deep rope-dyed yarn that fades uniquely with every journey you take.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div style={{ background: "var(--card-secondary)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧵</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Red-Line Selvedge</h3>
            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
              13.5oz vintage shuttle-loom woven denim with self-finished red-line edges.
            </p>
          </div>

          <div style={{ background: "var(--card-secondary)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✂️</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Dhaka Central Studio</h3>
            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
              In-house master pattern-makers and tailors perfecting every seam and collar.
            </p>
          </div>

          <div style={{ background: "var(--card-secondary)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏬</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>4 Retail Showrooms</h3>
            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
              Visit us in Mirpur 12, Wari (Dhaka), and Cumilla for personalized fittings.
            </p>
          </div>

          <div style={{ background: "var(--card-secondary)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Doorstep Size Exchange</h3>
            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
              7-day hassle-free swap directly at your doorstep anywhere in Bangladesh.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--indigo)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 13,
              padding: "12px 24px",
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: "0.04em",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.28)",
            }}
          >
            DISCOVER OUR COLLECTIONS →
          </Link>
        </div>
      </div>
    </section>
  );
}
