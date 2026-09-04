"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SocialReel, OFFICIAL_BRAND_SOCIALS } from "@/lib/socialContent";
import { bdt } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface SocialReelsSectionProps {
  reels: SocialReel[];
}

export default function SocialReelsSection({ reels }: SocialReelsSectionProps) {
  const [selectedReel, setSelectedReel] = useState<SocialReel | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);
  const { addItem } = useCart();

  if (!reels || reels.length === 0) return null;

  const handleQuickAdd = (reel: SocialReel) => {
    if (!reel.taggedProduct) return;
    const p = reel.taggedProduct;
    addItem(
      {
        id: p.id,
        sku: `DEEN-${p.id}`,
        name: p.name,
        category: p.category as any,
        price: p.price,
        regularPrice: p.regularPrice,
        sizes: ["30", "32", "34"],
        images: [p.image, p.image],
        fabric: "100% Cotton",
        stockStatus: "instock",
        rating: 4.9,
        ratingCount: 28,
        blurb: p.name,
      },
      "32"
    );
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <section className="social-reels-section" style={{ padding: "40px 0" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              <span>📸</span> DEEN REELS &amp; SOCIAL DISCOVERY
            </div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              Daily Styling &amp; Shuttle-Loom Reels
            </h2>
            <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 4 }}>
              Tag @deencommerce in your daily outfits to be featured on our official channel.
            </p>
          </div>

          <a
            href={OFFICIAL_BRAND_SOCIALS.instagram}
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 12,
              padding: "8px 16px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Follow @deencommerce →
          </a>
        </div>

        {/* Reels Track */}
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 12,
            scrollbarWidth: "thin",
          }}
        >
          {reels.map((reel) => (
            <div
              key={reel.id}
              onClick={() => setSelectedReel(reel)}
              style={{
                flex: "0 0 240px",
                height: 380,
                borderRadius: 16,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                background: "#0D111A",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Poster */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reel.poster}
                alt={reel.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Dark Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)",
                }}
              />

              {/* Top Row: Platform & Views */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  right: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    background: reel.platform === "instagram" ? "#E1306C" : "#1877F2",
                    color: "#FFFFFF",
                    fontSize: 9.5,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  {reel.platform === "instagram" ? "IG REEL" : "FB POST"}
                </span>

                <span
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  👁️ {reel.views}
                </span>
              </div>

              {/* Center Play Pulse */}
              <div
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "1.5px solid rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>

              {/* Bottom Info & Tagged Product */}
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  right: 12,
                }}
              >
                <p
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    marginBottom: 8,
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {reel.title}
                </p>

                {reel.taggedProduct && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 11 }}>🛍️</span>
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {bdt(reel.taggedProduct.price)} · {reel.taggedProduct.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Reel Viewer */}
        {selectedReel && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.78)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setSelectedReel(null)}
          >
            <div
              style={{
                background: "var(--card)",
                borderRadius: 18,
                maxWidth: 480,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid var(--border)",
                padding: 20,
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedReel(null)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "var(--card-secondary)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--ink)",
                  fontWeight: 800,
                }}
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* Author & Platform */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span
                  style={{
                    background: selectedReel.platform === "instagram" ? "#E1306C" : "#1877F2",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  {selectedReel.platform === "instagram" ? "INSTAGRAM" : "FACEBOOK"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{selectedReel.author}</span>
              </div>

              {/* Media Preview */}
              <div style={{ borderRadius: 12, overflow: "hidden", maxHeight: 320, background: "#000", marginBottom: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedReel.poster}
                  alt={selectedReel.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>
                {selectedReel.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, marginBottom: 16 }}>
                {selectedReel.caption}
              </p>

              {/* Tagged Product Box */}
              {selectedReel.taggedProduct && (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 12,
                    background: "var(--card-secondary)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedReel.taggedProduct.image}
                      alt={selectedReel.taggedProduct.name}
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                        {selectedReel.taggedProduct.name}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "var(--indigo)", marginTop: 2 }}>
                        {bdt(selectedReel.taggedProduct.price)}
                      </p>
                    </div>
                  </div>

                  {addedNotice && (
                    <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: 12, fontWeight: 800, padding: "6px 10px", borderRadius: 6, marginBottom: 8, textAlign: "center" }}>
                      ✓ Added to bag! Size 32 selected.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(selectedReel)}
                      style={{
                        flex: 1,
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                        color: "var(--ink)",
                      }}
                    >
                      Quick Add
                    </button>
                    <Link
                      href={`/product/${selectedReel.taggedProduct.id}`}
                      style={{
                        flex: 1.5,
                        background: "var(--indigo)",
                        color: "#FFFFFF",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: 12,
                        textAlign: "center",
                        textDecoration: "none",
                      }}
                    >
                      View Piece →
                    </Link>
                  </div>
                </div>
              )}

              <a
                href={selectedReel.permalink}
                target="_blank"
                rel="noopener"
                style={{
                  display: "block",
                  textAlign: "center",
                  color: "var(--indigo)",
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Open in {selectedReel.platform === "instagram" ? "Instagram" : "Facebook"} ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
