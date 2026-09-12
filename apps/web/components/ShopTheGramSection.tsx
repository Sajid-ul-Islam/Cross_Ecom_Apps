"use client";

import { useState } from "react";
import Link from "next/link";
import type { SocialFeedData, SocialReel } from "@/lib/api";
import StoriesFeedModal from "./StoriesFeedModal";

interface ShopTheGramSectionProps {
  feedData: SocialFeedData;
}

export default function ShopTheGramSection({ feedData }: ShopTheGramSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const reels = feedData?.reels && feedData.reels.length > 0 ? feedData.reels : [];
  const accounts = feedData?.officialAccounts;

  const openReel = (index: number) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  return (
    <>
      <section
        id="shop-the-gram"
        style={{
          padding: "48px 0",
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
        aria-label="Shop The Gram - Community and Social Looks"
      >
        <div className="container">
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(168, 85, 247, 0.12)",
                color: "#9333ea",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              <span>📸</span>
              <span>{accounts?.handle || "@deencommerce"} Community</span>
            </div>

            <h2
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
              }}
            >
              Shop The Gram &amp; Social Looks
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "var(--sub)",
                maxWidth: 540,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Real fits worn by patrons across Bangladesh. Tap any look to explore shoppable craftsmanship or watch high-resolution reels.
            </p>
          </div>

          {/* Social UGC Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {reels.map((reel: SocialReel, idx: number) => (
              <div
                key={reel.id}
                onClick={() => openReel(idx)}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: "var(--surface-2)",
                  aspectRatio: "9 / 14",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
                  transition: "transform 250ms ease, box-shadow 250ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.06)";
                }}
              >
                {/* Media Poster */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.poster}
                  alt={reel.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  loading="lazy"
                />

                {/* Video Play Pill Badge */}
                {reel.videoUrl && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "rgba(0, 0, 0, 0.65)",
                      backdropFilter: "blur(6px)",
                      color: "#FFFFFF",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>▶</span>
                    <span>REEL</span>
                  </div>
                )}

                {/* Platform Tag */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(6px)",
                    color: "#FFFFFF",
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {reel.platform === "instagram" ? "Instagram" : "Facebook"}
                </div>

                {/* Bottom Overlay Info */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 12px 12px",
                    background: "linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      marginBottom: 6,
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {reel.title}
                  </div>

                  {/* Tagged Product Chip */}
                  {reel.taggedProduct && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(8px)",
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#FFFFFF",
                          maxWidth: 130,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reel.taggedProduct.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#4ade80" }}>
                        ৳{reel.taggedProduct.price}
                      </span>
                    </div>
                  )}

                  {/* Likes & Views */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 8,
                      fontSize: 11,
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    <span>❤️ {reel.likes}</span>
                    <span>👁️ {reel.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Community Bar */}
          <div
            style={{
              marginTop: 36,
              padding: "20px 24px",
              borderRadius: 16,
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                Join {accounts?.communityCount || "125,000+ Patrons"}
              </div>
              <div style={{ fontSize: 13, color: "var(--sub)", marginTop: 2 }}>
                Follow DEEN on Instagram, Facebook &amp; YouTube for daily style releases
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <a
                href={accounts?.instagram || "https://www.instagram.com/deencommerce/?hl=en"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(236, 72, 153, 0.12)",
                  color: "#db2777",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>📸</span>
                <span>Follow Instagram</span>
              </a>

              <a
                href={accounts?.facebook || "https://www.facebook.com/deencommerce"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(59, 130, 246, 0.12)",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>📘</span>
                <span>Facebook Community</span>
              </a>

              <a
                href="https://www.youtube.com/@deencommerce"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>▶</span>
                <span>YouTube Lookbooks</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Feed Modal */}
      <StoriesFeedModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feedData={feedData}
        initialIndex={selectedIndex}
      />
    </>
  );
}
