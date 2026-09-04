"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useEffect, useState } from "react";
import SearchModal from "@/components/SearchModal";
import NotificationModal from "@/components/NotificationModal";
import BankOffersModal from "@/components/BankOffersModal";
import WishlistModal from "@/components/WishlistModal";

export default function Header() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bankOffersOpen, setBankOffersOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
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
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/categories", label: "Categories" },
    { href: "/orders", label: "Track Order" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" className="nav__brand" style={{ display: "flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="DEEN"
                style={{
                  height: 26,
                  width: "auto",
                  objectFit: "contain",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none",
                }}
              />
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
          <div className="nav__actions" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="btn-admin-pill"
                title="Open Dedicated Admin BI Page"
                style={{
                  color: "#fff",
                  backgroundColor: "#6366f1",
                  fontSize: 11.5,
                  fontWeight: 900,
                  padding: "6px 12px",
                  borderRadius: 999,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                }}
              >
                📊 Admin BI
              </Link>
            )}
            {/* Search Button (Both Web Mobile View & Desktop) */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search catalog"
              title="Search products"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              title="Store Notifications &amp; Bank Offers"
              style={{
                position: "relative",
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: "var(--crimson)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                3
              </span>
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDark ? "Switch to light" : "Switch to dark"}
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
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Wishlist Heart Button */}
            <button
              type="button"
              className="nav__icon-btn"
              onClick={() => setWishlistOpen(true)}
              aria-label={`Wishlist, ${totalWishlist} items`}
              title="Saved Wishlist Items"
              style={{
                position: "relative",
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill={totalWishlist > 0 ? "rgba(225, 41, 62, 0.15)" : "none"} stroke={totalWishlist > 0 ? "var(--crimson)" : "currentColor"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {totalWishlist > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "var(--crimson)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {totalWishlist > 99 ? "99+" : totalWishlist}
                </span>
              )}
            </button>

            {/* Orders Tracking Button in Navbar (Desktop only — mobile view uses bottom nav orders) */}
            <Link
              href="/orders"
              className="nav__icon-btn nav__orders-desktop-only"
              aria-label="My Orders & Tracking"
              title="Track Orders & Consignment"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: pathname === "/orders" ? "var(--indigo)" : "var(--ink)",
                textDecoration: "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </Link>

            {/* Cart Button (Desktop only — mobile view uses bottom nav cart) */}
            <Link
              href="/cart"
              className="nav__icon-btn nav__cart-desktop-only"
              aria-label="Cart"
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "var(--indigo)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            {/* Dedicated Profile Action (Desktop Only - Mobile uses bottom nav) */}
            <Link
              href="/profile"
              className="nav__icon-btn nav__profile-desktop"
              aria-label="Account Profile"
              title={profile && !profile.isGuest ? `Account: ${profile.name || "Member"}` : "Account & Profile"}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: pathname === "/profile" ? "var(--indigo)" : "var(--ink)",
                textDecoration: "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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
    </>
  );
}
