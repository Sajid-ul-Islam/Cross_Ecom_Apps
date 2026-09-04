"use client";

import React, { useState, useEffect } from "react";
import { fetchOutlets, fetchAppSettings, DEFAULT_OUTLETS, type Outlet } from "@/lib/api";

interface AboutDeenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDeenDrawer({ isOpen, onClose }: AboutDeenDrawerProps) {
  const [outlets, setOutlets] = useState<Outlet[]>(DEFAULT_OUTLETS);
  const [whatsapp, setWhatsapp] = useState("01952-700500");

  useEffect(() => {
    fetchOutlets().then((o) => {
      if (o && o.length > 0) setOutlets(o);
    });
    fetchAppSettings().then((s) => {
      if (s?.contact?.whatsapp) setWhatsapp(s.contact.whatsapp);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const waDigits = whatsapp.replace(/[^0-9]/g, "");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 100000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About DEEN"
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .about-drawer-panel {
          width: 100%;
          max-width: 480px;
          height: 100%;
          background: var(--surface);
          background-color: var(--surface);
          box-shadow: -10px 0 36px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .about-drawer-panel {
            max-width: 100%;
            height: 90vh;
            margin-top: auto;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            animation: slideInBottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }
      `}</style>

      <div
        className="about-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "var(--indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 18,
              }}
            >
              🏪
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--ink)" }}>
                ABOUT DEEN
              </h3>
              <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600 }}>
                The country&apos;s first denim brand
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close About Drawer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Brand Intro Hero Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--indigo) 0%, #171d47 100%)",
              borderRadius: 12,
              padding: "18px 16px",
              color: "#FFFFFF",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>✨</span>
              <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 1.2, color: "var(--denim-stitch)", textTransform: "uppercase" }}>
                EST. 2020 · DHAKA, BANGLADESH
              </span>
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, lineHeight: 1.4 }}>
              Harmonising Fashion and Ethics
            </h4>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
              DEEN Commerce was founded with a clear vision: marrying contemporary artisanal fashion with responsible craftsmanship. Rooted in Dhaka manufacturing, we bring premium denim to life.
            </p>
          </div>

          {/* Section 1: Who We Are */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🧵</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                Who We Are
              </h5>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              The company is committed to ethical values and high quality, challenging industry conventions. Every selvedge denim pair and shirt is crafted with high-density cotton, rope-dyed indigo, and reinforced bar-tack stitching.
            </p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              Ethics and quality are not slogans; they are the bedrock of every decision and product manufactured in our Dhaka ateliers.
            </p>
          </div>

          {/* Section 2: What Drives Us */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>❤️</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                What Drives Us
              </h5>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              Customer delight is the core of our mindset. With spontaneous concierge support, 24–48h express delivery via Pathao Logistics in Dhaka, and hassle-free 7-day doorstep size exchange across all 64 districts, we aim to provide an effortless experience.
            </p>
          </div>

          {/* Official Brand Social Community */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🌐</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                Official Brand Community &amp; Socials
              </h5>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              Follow our official channels for new arrivals, styling masterclasses, and denim drops:
            </p>

            {/* Social Link Handles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: "var(--sub)" }}>
                📱 WhatsApp: <strong>01952-700500</strong>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--sub)" }}>
                📘 Facebook: <strong>facebook.com/deencommerce</strong>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--sub)" }}>
                📸 Instagram: <strong>instagram.com/deencommerce</strong>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--sub)" }}>
                💼 LinkedIn: <strong>linkedin.com/company/deencommerce</strong>
              </div>
            </div>

            {/* Round Social Icon Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <a
                href={`https://wa.me/88${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official DEEN WhatsApp"
                title="WhatsApp Concierge"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#25D366",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37, 211, 102, 0.35)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z" />
                  <path d="M8.8 8.6c0 3 2.5 5.5 5.5 5.5l1-1.5c.3-.4.9-.4 1.3-.1l1.7 1c.4.3.5.9.2 1.3-1 1.3-2.6 1.2-3.8.2" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/deencommerce/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official DEEN Instagram"
                title="Instagram @deencommerce"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#E1306C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(225, 48, 108, 0.35)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1.2" fill="#fff" stroke="none" />
                </svg>
              </a>

              <a
                href="https://www.facebook.com/deencommerce"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official DEEN Facebook"
                title="Facebook @deencommerce"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#1877F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(24, 119, 242, 0.35)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M14 8h-2c-1.1 0-2 .9-2 2v1.5H8v2h2V19h2v-5.5h2l.5-2H12V10c0-.3.2-.5.5-.5H14V8z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/deencommerce"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Official DEEN LinkedIn"
                title="LinkedIn DEEN Commerce Ltd"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#0A66C2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(10, 102, 194, 0.35)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Section 3: Career & Wholesale Opportunities */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>💼</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                Careers &amp; Opportunities
              </h5>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              We are constantly growing! If you are passionate about apparel design, textile merchandising, web engineering, or showroom styling:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <a
                href="mailto:career@deencommerce.com"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--indigo)",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span>✉️</span>
                <span>Send CV: <strong>career@deencommerce.com</strong></span>
              </a>

              <a
                href="mailto:wholesale@deencommerce.com"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--sub)",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span>📦</span>
                <span>Wholesale: <strong>wholesale@deencommerce.com</strong></span>
              </a>
            </div>
          </div>

          {/* Corporate Responsibility */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🤝</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                Corporate Responsibility
              </h5>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--sub)" }}>
              We support fashion that is produced, consumed and sold in a responsible manner. DEEN Commerce Ltd. donates 5% of profit to the DEEN Foundation to serve the underprivileged and support community welfare.
            </p>
          </div>

          {/* Section 4: Flagship Retail Showrooms */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🏬</span>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
                Retail Showrooms &amp; Outlets
              </h5>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {outlets.map((outlet) => {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.mapQuery || outlet.address)}`;
                return (
                  <div
                    key={outlet.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <strong style={{ fontSize: 12.5, color: "var(--ink)" }}>📍 {outlet.name}</strong>
                      <span style={{ fontSize: 9, fontWeight: 800, background: "var(--indigo-light)", color: "var(--indigo)", padding: "2px 6px", borderRadius: 4 }}>
                        {outlet.tag || "SHOWROOM"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "var(--sub)", margin: "0 0 6px", lineHeight: 1.4 }}>
                      {outlet.address}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10.5, color: "var(--faint)" }}>🕒 {outlet.hours}</span>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: "var(--indigo)",
                          textDecoration: "none",
                        }}
                      >
                        Google Maps ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Hotline & WhatsApp Concierge */}
          <a
            href={`https://wa.me/88${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "var(--indigo-light)",
              border: "1px solid var(--border)",
              color: "var(--indigo)",
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 24 }}>💬</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "var(--indigo)" }}>
                Hotline &amp; WhatsApp: +880 {whatsapp}
              </div>
              <div style={{ fontSize: 11, color: "var(--sub)" }}>
                Tap to chat with DEEN styling concierge
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
