"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";
import SearchModal from "@/components/SearchModal";
import NotificationModal from "@/components/NotificationModal";
import BankOffersModal from "@/components/BankOffersModal";
import WishlistModal from "@/components/WishlistModal";
import SideNavDrawer from "@/components/SideNavDrawer";
import StoriesFeedModal from "@/components/StoriesFeedModal";
import { DEFAULT_SOCIAL_FEED } from "@/lib/api";

export default function Header() {
  const pathname = usePathname();
  const { totalWishlist } = useWishlist();
  const { totalItems } = useCart();
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bankOffersOpen, setBankOffersOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [profile, setProfile] = useState<{ role?: string; isGuest?: boolean; name?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("deen_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

    const readProfile = () => {
      try {
        const p = localStorage.getItem("deen_web_user_profile");
        if (p) setProfile(JSON.parse(p));
        else setProfile(null);
      } catch {
        setProfile(null);
      }
    };
    readProfile();
    window.addEventListener("storage", readProfile);
    window.addEventListener("deen_profile_updated", readProfile);

    return () => {
      window.removeEventListener("storage", readProfile);
      window.removeEventListener("deen_profile_updated", readProfile);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("deen_theme", next ? "dark" : "light");
  };

  const navLinks = [
    { href: "/shop?category=JEANS", label: "Jeans" },
    { href: "/shop?category=SHIRT", label: "Shirts" },
    { href: "/shop?category=PANJABI", label: "Panjabi" },
    { href: "/shop?category=T-SHIRT", label: "T-Shirts" },
    { href: "/shop?category=TROUSERS", label: "Trousers" },
    { href: "/shop?segment=select", label: "DEEN Select ⚡" },
    { href: "/shop?sort=sale", label: "Sale 🔥" },
    { href: "/orders", label: "Track Order" },
  ];

  return (
    <>
      {/* ── Top Brand Announcement Bar (deencommerce.com vibe) ── */}
      <div
        style={{
          backgroundColor: "#101827",
          color: "#ffffff",
          fontSize: "11.5px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          padding: "7px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #c93b36",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
          <span style={{ whiteSpace: "nowrap" }}>
            <strong style={{ color: "#d49439" }}>দেশের প্রথম ডেনিম ব্র্যান্ড</strong> · DEEN
          </span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ whiteSpace: "nowrap", opacity: 0.85 }}>
            🚚 Dhaka 24–48h (৳50) · All Bangladesh (৳90)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <a
            href="https://wa.me/8801952700500"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ffffff", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span>Concierge: +880 1952-700500</span>
          </a>
        </div>
      </div>

      <header className="nav">
        <div className="container nav__inner">
          {/* Brand & Hamburger Menu */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="nav__icon-btn nav__hamburger-btn"
              onClick={() => setSideNavOpen(true)}
              aria-label="Open Navigation Menu"
              title="Menu & Options"
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link href="/" className="nav__brand" style={{ display: "flex", flexDirection: "column", textDecoration: "none", gap: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isDark ? "/logo_white.png" : "/logo.png"}
                alt="DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড"
                style={{
                  height: 26,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--denim-stitch)",
                  lineHeight: 1,
                  marginTop: "1px",
                }}
              >
                EST. 2020 · DHAKA
              </span>
            </Link>
          </div>

          {/* Desktop links */}
          <nav>
            <ul className="nav__links">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`nav__link ${pathname === l.href ? "nav__link--active" : ""}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {profile?.role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    className="nav__link"
                    style={{
                      color: "var(--indigo)",
                      fontWeight: 900,
                      background: "rgba(99, 102, 241, 0.12)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    📊 Admin BI
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Actions */}
          <div className="nav__actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search Button (Both Web Mobile View & Desktop) */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search catalog"
              title="Search products"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications, 3 new offers"
              title="Store Notifications & Bank Offers"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="nav__badge nav__badge--crimson">3</span>
            </button>

            {/* Wishlist Heart Button - Consistent 44x44 Visual Target */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={() => setWishlistOpen(true)}
              aria-label={`Wishlist, ${totalWishlist} items`}
              title="Saved Wishlist Items"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={totalWishlist > 0 ? "var(--crimson)" : "none"} stroke={totalWishlist > 0 ? "var(--crimson)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {totalWishlist > 0 && (
                <span className="nav__badge nav__badge--crimson">
                  {totalWishlist > 99 ? "99+" : totalWishlist}
                </span>
              )}
            </button>

            {/* AI Assistant & Live Chat (Desktop Only - Mobile uses bottom nav) */}
            <button
              type="button"
              className="nav__icon-btn nav__chat-desktop-only"
              onClick={() => window.dispatchEvent(new CustomEvent("deen_open_chat"))}
              aria-label="DEEN Assistant & Live Chat"
              title="DEEN Assistant · AI Concierge & Chatbot"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            {/* Orders Tracking Button in Navbar (Desktop only — mobile view uses bottom nav orders) */}
            <Link
              href="/orders"
              className={`nav__icon-btn nav__orders-desktop-only ${pathname === "/orders" ? "nav__icon-btn--active" : ""}`}
              aria-label="My Orders & Tracking"
              title="Track Orders & Consignment"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </Link>

            {/* Dedicated Profile Action (Desktop Only - Mobile uses bottom nav) */}
            <Link
              href="/profile"
              className={`nav__icon-btn nav__profile-desktop ${pathname === "/profile" ? "nav__icon-btn--active" : ""}`}
              aria-label="Account Profile"
              title={profile && !profile.isGuest ? `Account: ${profile.name || "Member"}` : "Account & Profile"}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Dedicated Cart Action (Desktop Only - Mobile uses bottom nav) */}
            <Link
              href="/cart"
              className={`nav__icon-btn nav__cart-desktop-only ${totalItems > 0 ? "nav__cart-desktop-only--has-items" : ""} ${pathname === "/cart" ? "nav__icon-btn--active" : ""}`}
              aria-label={`Shopping bag, ${totalItems} items`}
              title="Shopping Bag & Cart"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && (
                <span className="nav__badge nav__badge--indigo">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* In-App Notifications Modal */}
      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onOpenBankOffers={() => {
          setNotifOpen(false);
          setBankOffersOpen(true);
        }}
      />

      {/* Bank & Card Offers Modal */}
      <BankOffersModal
        isOpen={bankOffersOpen}
        onClose={() => setBankOffersOpen(false)}
      />

      {/* Wishlist Drawer Modal */}
      <WishlistModal
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />

      {/* Side Card Navigation Drawer */}
      <SideNavDrawer
        isOpen={sideNavOpen}
        onClose={() => setSideNavOpen(false)}
        onOpenStories={() => setStoriesOpen(true)}
      />

      {/* Shoppable Stories Modal */}
      <StoriesFeedModal
        isOpen={storiesOpen}
        onClose={() => setStoriesOpen(false)}
        feedData={DEFAULT_SOCIAL_FEED}
      />
    </>
  );
}
