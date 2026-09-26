"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface CategoryDisplayItem {
  key: string;
  label: string;
  subtitle: string;
  img: string;
  badge?: string;
  count?: number;
  initialOrientation?: "landscape" | "portrait" | "square";
  initialAspectRatio?: number;
}

interface CategoryBentoShowcaseProps {
  categories: CategoryDisplayItem[];
}

export default function CategoryBentoShowcase({ categories }: CategoryBentoShowcaseProps) {
  // Track dynamically detected image orientations per category key
  const [orientations, setOrientations] = useState<Record<string, "landscape" | "portrait" | "square">>(() => {
    const initial: Record<string, "landscape" | "portrait" | "square"> = {};
    categories.forEach((c) => {
      if (c.initialOrientation) {
        initial[c.key] = c.initialOrientation;
      } else if (c.key === "SALE" || c.img.includes("1920x840") || c.img.toLowerCase().includes("banner")) {
        initial[c.key] = "landscape";
      } else {
        initial[c.key] = "portrait";
      }
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<"all" | "inhouse" | "curated">("all");

  const handleImageLoad = (key: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    // Landscape if ratio > 1.25, portrait if ratio < 0.9, otherwise square
    const detected: "landscape" | "portrait" | "square" =
      ratio >= 1.25 ? "landscape" : ratio <= 0.9 ? "portrait" : "square";

    setOrientations((prev) => {
      if (prev[key] === detected) return prev;
      return { ...prev, [key]: detected };
    });
  };

  const handleOpenChat = () => {
    const chatBtn = document.getElementById("chatbot-widget-btn");
    if (chatBtn) chatBtn.click();
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === "inhouse") {
      return !["DEEN_SELECT", "OTHERS"].includes(c.key);
    }
    if (activeTab === "curated") {
      return ["DEEN_SELECT", "SALE", "TRENDING"].includes(c.key);
    }
    return true;
  });

  return (
    <section className="category-bento-section" style={{ margin: "36px 0 54px" }}>
      {/* ── Section Header with Visual Controls ── */}
      <div className="section__header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 className="section__title" style={{ margin: 0 }}>
              Shop by Category
            </h2>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: "linear-gradient(135deg, rgba(224, 83, 5, 0.15) 0%, rgba(224, 83, 5, 0.25) 100%)",
                color: "var(--denim-stitch)",
                border: "1px solid rgba(224, 83, 5, 0.35)",
                padding: "3px 9px",
                borderRadius: 999,
                letterSpacing: 0.6,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              DYNAMIC SHOWCASE
            </span>
          </div>
          <p className="section__sub" style={{ marginTop: 4 }}>
            Explore artisanal denim, heritage panjabis & resort casuals tailored in Bangladesh
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Filter Pills */}
          <div
            style={{
              display: "inline-flex",
              background: "var(--surface-2)",
              padding: 3,
              borderRadius: 20,
              border: "1px solid var(--border)",
            }}
          >
            {[
              { id: "all", label: "All Categories" },
              { id: "inhouse", label: "In-House Craft" },
              { id: "curated", label: "Curated Drops" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: activeTab === tab.id ? "var(--denim-stitch)" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "var(--sub)",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: 16,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link href="/shop" className="section__link" style={{ fontSize: 13, fontWeight: 700 }}>
            All Items →
          </Link>
        </div>
      </div>

      <style>{`
        /* ── Dynamic Bento Grid with Dense Auto-Flow ── */
        .cat-bento-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-flow: dense;
          gap: 18px;
          width: 100%;
        }

        @media (max-width: 1200px) {
          .cat-bento-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 860px) {
          .cat-bento-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 520px) {
          .cat-bento-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        /* ── Base Card Architecture ── */
        .cat-card-base {
          position: relative;
          border-radius: var(--radius, 14px);
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          isolation: isolate;
        }

        .cat-card-base:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
          border-color: rgba(224, 83, 5, 0.5);
        }

        /* ── Landscape Card Spanning 2 Columns ── */
        .cat-card--landscape {
          grid-column: span 2;
          min-height: 290px;
        }

        @media (max-width: 520px) {
          .cat-card--landscape {
            grid-column: span 1;
            min-height: 240px;
          }
        }

        /* ── Portrait Card Spanning 1 Column ── */
        .cat-card--portrait {
          grid-column: span 1;
          min-height: 310px;
        }

        @media (max-width: 520px) {
          .cat-card--portrait {
            min-height: 280px;
          }
        }

        /* ── Square Card Spanning 1 Column ── */
        .cat-card--square {
          grid-column: span 1;
          min-height: 270px;
        }

        /* ── Image Display Layer ── */
        .cat-card__media-wrap {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
          background: #0f131a;
        }

        .cat-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
        }

        .cat-card-base:hover .cat-card__img {
          transform: scale(1.08);
          filter: brightness(1.05);
        }

        /* Landscape Specific: Gradient with Left Text Focus */
        .cat-card--landscape .cat-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(10, 15, 28, 0.94) 0%,
            rgba(10, 15, 28, 0.82) 42%,
            rgba(10, 15, 28, 0.35) 75%,
            rgba(10, 15, 28, 0.2) 100%
          );
          z-index: 2;
        }

        /* Portrait / Square: Bottom Gradient */
        .cat-card--portrait .cat-card__overlay,
        .cat-card--square .cat-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(10, 15, 28, 0.95) 0%,
            rgba(10, 15, 28, 0.75) 45%,
            rgba(10, 15, 28, 0.2) 75%,
            transparent 100%
          );
          z-index: 2;
        }

        /* ── Card Content Architecture ── */
        .cat-card__content {
          position: relative;
          z-index: 3;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
          pointer-events: none;
        }

        .cat-card--landscape .cat-card__content {
          justify-content: space-between;
          padding: 24px;
          max-width: 580px;
        }

        /* ── Landscape Action Buttons & Tags ── */
        .cat-card__cta-btn {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--denim-stitch);
          color: #ffffff;
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(224, 83, 5, 0.4);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          width: fit-content;
        }
        .cat-card__cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(224, 83, 5, 0.55);
          background: #c2410c;
        }

        /* ── Companion Filler Tiles ── */
        .cat-filler-tile {
          border-radius: var(--radius, 14px);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .cat-filler-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
        }

        .cat-arrow-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 14px;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .cat-card-base:hover .cat-arrow-icon {
          transform: translateX(3px) scale(1.08);
          background: var(--denim-stitch);
        }
      `}</style>

      {/* ── Dynamic Bento Grid ── */}
      <div className="cat-bento-grid">
        {filteredCategories.map((cat) => {
          const orientation = orientations[cat.key] || "portrait";
          const isLandscape = orientation === "landscape";

          if (isLandscape) {
            // ── LANDSCAPE CARD: Spans 2 columns, shows full wide image + rich integrated components ──
            return (
              <Link
                key={cat.key}
                href={`/shop?category=${cat.key}`}
                className="cat-card-base cat-card--landscape"
              >
                <div className="cat-card__media-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="cat-card__img"
                    onLoad={(e) => handleImageLoad(cat.key, e)}
                  />
                  <div className="cat-card__overlay" />
                </div>

                <div className="cat-card__content">
                  {/* Top Bar: Live Promo Badge + Stock Pill */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        boxShadow: "0 2px 8px rgba(225, 29, 72, 0.35)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      {cat.badge || "FEATURED COLLECTION"}
                    </span>

                    {cat.count ? (
                      <span
                        style={{
                          background: "rgba(0, 0, 0, 0.65)",
                          backdropFilter: "blur(6px)",
                          color: "rgba(255, 255, 255, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                        }}
                      >
                        📦 {cat.count} Products Live
                      </span>
                    ) : null}
                  </div>

                  {/* Middle & Bottom: Headline, Subtitle & Interactive CTA */}
                  <div style={{ marginTop: 16 }}>
                    <h3
                      style={{
                        color: "#ffffff",
                        fontSize: 24,
                        fontWeight: 900,
                        margin: "0 0 6px",
                        letterSpacing: "-0.01em",
                        textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      {cat.label}
                    </h3>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.88)",
                        fontSize: 13,
                        lineHeight: 1.45,
                        margin: "0 0 14px",
                        maxWidth: 440,
                      }}
                    >
                      {cat.subtitle}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="cat-card__cta-btn">
                        Explore {cat.label} →
                      </span>
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        Full Authentic Collection
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }

          // ── PORTRAIT / SQUARE CARD: Spans 1 column, shows full vertical image + bottom gradient ──
          return (
            <Link
              key={cat.key}
              href={`/shop?category=${cat.key}`}
              className={`cat-card-base ${
                orientation === "square" ? "cat-card--square" : "cat-card--portrait"
              }`}
            >
              <div className="cat-card__media-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="cat-card__img"
                  onLoad={(e) => handleImageLoad(cat.key, e)}
                />
                <div className="cat-card__overlay" />
              </div>

              <div className="cat-card__content">
                {/* Top Badge (if any) */}
                {cat.badge && (
                  <div style={{ marginBottom: "auto" }}>
                    <span
                      style={{
                        color: "var(--denim-stitch)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: 0.8,
                        background: "rgba(0, 0, 0, 0.72)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(224, 83, 5, 0.3)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "#10B981",
                        }}
                      />
                      {cat.badge}
                    </span>
                  </div>
                )}

                {/* Bottom Title, Subtitle, Product Count & Arrow */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <h3
                      style={{
                        color: "#ffffff",
                        fontSize: 17,
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: "-0.01em",
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {cat.label}
                    </h3>
                    <span className="cat-arrow-icon">→</span>
                  </div>

                  {cat.subtitle && (
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.82)",
                        fontSize: 11.5,
                        margin: "4px 0 0",
                        lineHeight: 1.35,
                      }}
                    >
                      {cat.subtitle}
                    </p>
                  )}

                  {cat.count ? (
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          background: "rgba(255, 255, 255, 0.12)",
                          backdropFilter: "blur(4px)",
                          color: "rgba(255, 255, 255, 0.9)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {cat.count} Items
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}

        {/* ── Dynamic Filler / Companion Components ──
            Fills any blank spaces in the bento layout with high-value e-commerce actions! */}
        
        {/* Companion Component 1: Artisanal Denim Shuttle Loom Craft */}
        <div
          className="cat-filler-tile"
          style={{
            background: "linear-gradient(135deg, #0b1220 0%, #152238 100%)",
            borderColor: "rgba(79, 70, 229, 0.35)",
            boxShadow: "0 8px 24px rgba(11, 18, 32, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🧵</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: "#818cf8",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Selvedge Heritage
              </span>
            </div>
            <h4 style={{ color: "#ffffff", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>
              Vintage Shuttle Looms
            </h4>
            <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>
              Woven slowly on traditional looms with deep rope-dyed indigo & reinforced chain stitching.
            </p>
          </div>
          <Link
            href="/shop?category=JEANS"
            style={{
              marginTop: 14,
              color: "#a5b4fc",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Explore Selvedge Denim →
          </Link>
        </div>

        {/* Companion Component 2: Nationwide Delivery & Exchange Trust */}
        <div
          className="cat-filler-tile"
          style={{
            background: "linear-gradient(135deg, #0d1e16 0%, #133023 100%)",
            borderColor: "rgba(16, 185, 129, 0.35)",
            boxShadow: "0 8px 24px rgba(13, 30, 22, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🚚</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: "#34d399",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Nationwide Logistics
              </span>
            </div>
            <h4 style={{ color: "#ffffff", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>
              Fast Doorstep Delivery
            </h4>
            <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>
              Dhaka in 24–48h (৳50) · All Bangladesh in 3–5 days (৳90) with hassle-free 7-day doorstep size exchange.
            </p>
          </div>
          <Link
            href="/shop"
            style={{
              marginTop: 14,
              color: "#6ee7b7",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Learn Delivery & Return Policy →
          </Link>
        </div>

        {/* Companion Component 3: AI Sizing & Concierge Interactive Chat Trigger */}
        <div
          className="cat-filler-tile"
          style={{
            background: "linear-gradient(135deg, #23122c 0%, #371846 100%)",
            borderColor: "rgba(224, 83, 5, 0.4)",
            boxShadow: "0 8px 24px rgba(35, 18, 44, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: "var(--denim-stitch)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                AI Fit Concierge
              </span>
            </div>
            <h4 style={{ color: "#ffffff", fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>
              Unsure About Sizing?
            </h4>
            <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>
              Our AI Assistant recommends the exact waist and chest size in real-time, personalized for you.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenChat}
            style={{
              marginTop: 14,
              background: "linear-gradient(135deg, var(--denim-stitch) 0%, #c2410c 100%)",
              color: "#ffffff",
              border: "none",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              width: "fit-content",
              boxShadow: "0 3px 10px rgba(224, 83, 5, 0.35)",
            }}
          >
            Ask AI Concierge Now 💬
          </button>
        </div>
      </div>
    </section>
  );
}
