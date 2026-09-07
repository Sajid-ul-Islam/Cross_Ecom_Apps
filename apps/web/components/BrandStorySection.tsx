"use client";

import React, { useState } from "react";
import Link from "next/link";
import AboutDeenDrawer from "./AboutDeenDrawer";
import { AwardIcon, ArrowRightIcon, CHIPS, TRUST_ITEMS } from "@/lib/storyContent";

export default function BrandStorySection() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      {/* ── Desktop band (≥769px) — headline + craft pillars + CTA ── */}
      <section
        className="brand-story-section brand-story-section--desktop"
        style={{ padding: "40px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
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
            <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🧵</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Red-Line Selvedge</h3>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
                13.5oz vintage shuttle-loom woven denim with self-finished red-line edges.
              </p>
            </div>

            <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✂️</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>Dhaka Central Studio</h3>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
                In-house master pattern-makers and tailors perfecting every seam and collar.
              </p>
            </div>

            <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏬</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>4 Retail Showrooms</h3>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
                Visit us in Mirpur 12, Wari (Dhaka), and Cumilla for personalized fittings.
              </p>
            </div>

            <div style={{ background: "var(--surface-2)", padding: 20, borderRadius: 14, border: "1px solid var(--border)" }}>
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

      {/* ── Mobile-only swipeable rail (native parity, <769px) ── */}
      <section className="story-mobile-rail-section" aria-label="Heritage, craft and authenticity">
        <div className="story-mobile-rail">
          {/* Heritage & Craft narrative card */}
          <article className="story-card">
            <div className="story-card__header">
              <span className="story-card__badge" style={{ color: "var(--indigo)", background: "rgba(99, 102, 241, 0.12)" }}>
                <AwardIcon size={13} /> HERITAGE &amp; CRAFT
              </span>
              <span className="story-card__right-tag">EST. DHAKA 2020</span>
            </div>
            <h3 className="story-card__title">Slow Craftsmanship. Pure Indigo Selvedge.</h3>
            <p className="story-card__desc">
              DEEN revives the tactile weight of shuttle-loom selvedge denim in Bangladesh — woven on vintage shuttle looms with deep rope-dyed yarn that fades uniquely with every journey you take.
            </p>
            <div className="story-card__chips">
              {CHIPS.map((chip) => (
                <div key={chip.title} className="story-card__chip">
                  <span style={{ fontSize: 18 }}>{chip.emoji}</span>
                  <strong>{chip.title}</strong>
                  <span className="story-card__chip-sub">{chip.sub}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="story-card__cta"
              onClick={() => setAboutOpen(true)}
              aria-label="Read full DEEN heritage story and store locations"
            >
              DISCOVER OUR STORY &amp; SHOWROOMS <ArrowRightIcon size={14} />
            </button>
          </article>

          {/* Authenticity / trust cards */}
          {TRUST_ITEMS.map((item) => (
            <article key={item.id} className="story-card">
              <div className="story-card__header">
                <span className="story-card__icon-circle" style={{ background: "var(--surface-2)", color: item.tone }}>
                  {item.icon}
                </span>
                <span className="story-card__right-tag">EST. DHAKA 2020</span>
              </div>
              <h3 className="story-card__title">{item.title}</h3>
              <p className="story-card__desc">{item.desc}</p>
              <div className="story-card__divider" />
              <div className="story-card__points">
                {item.points.map((point) => (
                  <div key={point} className="story-card__point">
                    <span className="story-card__dot" style={{ background: item.tone }} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="story-card__spacer" />
              <span className="story-card__tag">{item.tag}</span>
            </article>
          ))}
        </div>
      </section>

      <AboutDeenDrawer isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
