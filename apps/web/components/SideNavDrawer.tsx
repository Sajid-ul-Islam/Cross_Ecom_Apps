"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStories?: () => void;
}

export default function SideNavDrawer({ isOpen, onClose, onOpenStories }: SideNavDrawerProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ role?: string; isGuest?: boolean; name?: string; phone?: string } | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Read profile
    try {
      const p = localStorage.getItem("deen_web_user_profile");
      if (p) setProfile(JSON.parse(p));
      else setProfile(null);
    } catch {
      setProfile(null);
    }

    // Read theme
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    setIsDark(dark);

    // Disable body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("deen_theme", next ? "dark" : "light");
  };

  if (!isOpen) return null;

  const categories = [
    { label: "Jeans & Cross Hatch", query: "JEANS", icon: "👖" },
    { label: "Casual & Resort Shirts", query: "SHIRT", icon: "👔" },
    { label: "Heritage Panjabi", query: "PANJABI", icon: "✨" },
    { label: "Springfield Polos", query: "POLO", icon: "👕" },
    { label: "Cargo Trousers", query: "TROUSER", icon: "🧵" },
    { label: "Heavyweight Tees", query: "T-SHIRT", icon: "⚡" },
  ];

  const socials = [
    {
      name: "Instagram",
      handle: "@deencommerce",
      href: "https://www.instagram.com/deencommerce/?hl=en",
      badge: "Reels & Looks",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      handle: "fb.com/deencommerce",
      href: "https://www.facebook.com/deencommerce",
      badge: "Community",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      handle: "@deencommerce",
      href: "https://www.youtube.com/@deencommerce",
      badge: "Lookbooks",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: "WhatsApp Concierge",
      handle: "+880 1952-700500",
      href: "https://wa.me/8801952700500",
      badge: "Instant Support",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fadeIn 200ms ease-out",
        }}
      />

      {/* Drawer Card */}
      <aside
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          height: "100%",
          backgroundColor: "var(--surface)",
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          animation: "slideInLeft 260ms cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="DEEN"
              style={{
                height: 24,
                width: "auto",
                filter: isDark ? "invert(1) brightness(1.2)" : "none",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--indigo)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "rgba(99, 102, 241, 0.12)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              EST. 2020
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User Status Card */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
          {profile && !profile.isGuest ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{profile.name || "Valued Patron"}</div>
                <div style={{ fontSize: 12, color: "var(--sub)" }}>{profile.phone || "Member Account"}</div>
              </div>
              <Link
                href="/profile"
                onClick={onClose}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--indigo)",
                  textDecoration: "none",
                }}
              >
                View Profile →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Welcome to DEEN</div>
                <div style={{ fontSize: 11, color: "var(--sub)" }}>Fast checkout & track orders</div>
              </div>
              <Link
                href="/profile"
                onClick={onClose}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor: "var(--indigo)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Section 1: Interactive Brand & Content (Stories) */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--sub)", letterSpacing: "0.08em", marginBottom: 12 }}>
            Featured Experience
          </div>

          <div>
            {/* Stories Option */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenStories) {
                  onOpenStories();
                } else {
                  const el = document.getElementById("stories-feed-trigger");
                  if (el) el.click();
                }
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(244, 63, 94, 0.08) 100%)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                cursor: "pointer",
                textAlign: "left",
                transition: "transform 150ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🎬</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Stories</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", background: "rgba(239, 68, 68, 0.15)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em" }}>LIVE</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--sub)", marginTop: 2 }}>Shoppable Reels &amp; Drops</div>
                </div>
              </div>
              <span style={{ color: "var(--sub)", fontSize: 14, fontWeight: 700 }}>→</span>
            </button>
          </div>
        </div>

        {/* Section 2: Product Categories */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--sub)", letterSpacing: "0.08em", marginBottom: 12 }}>
            Apparel & Collections
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {categories.map((cat) => (
              <Link
                key={cat.query}
                href={`/shop?category=${cat.query}`}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--surface-2)",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 150ms ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  {cat.label}
                </span>
                <span style={{ color: "var(--sub)", fontSize: 12 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 3: Essential Navigation */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--sub)", letterSpacing: "0.08em", marginBottom: 12 }}>
            Account & Logistics
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link
              href="/orders"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                color: "var(--ink)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 16 }}>📦</span>
              <span>Track Orders &amp; Consignment</span>
            </Link>

            <Link
              href="/cart"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                color: "var(--ink)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 16 }}>🛒</span>
              <span>Shopping Bag</span>
            </Link>

            <Link
              href="/chat"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                color: "var(--ink)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              <span>Live Support &amp; AI Concierge</span>
            </Link>
          </div>
        </div>

        {/* Section 4: Social Channels & Community */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--sub)", letterSpacing: "0.08em", marginBottom: 12 }}>
            Connect with DEEN
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 8,
                  backgroundColor: "var(--surface-2)",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--indigo)" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>{s.handle}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--indigo)",
                    background: "rgba(99, 102, 241, 0.1)",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {s.badge}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Section 5: Footer & Theme Switcher */}
        <div style={{ padding: "16px 20px", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--sub)", fontWeight: 600 }}>Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isDark ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: "var(--sub)", textAlign: "center" }}>
            64 Districts COD · 7-Day Easy Exchange
          </div>
        </div>
      </aside>
    </div>
  );
}
