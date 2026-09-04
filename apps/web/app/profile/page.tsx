"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BD_DISTRICTS } from "@/lib/districts";
import {
  fetchOrders,
  fetchDistricts,
  loginCustomer,
  registerCustomer,
  changePassword,
  updateCustomerProfile,
  type OrderResult,
  type BdDistrict,
  type AuthResult,
} from "@/lib/api";
import SocialAuthModal from "@/components/SocialAuthModal";
import AboutDeenDrawer from "@/components/AboutDeenDrawer";
import ProfileDrawer from "@/components/ProfileDrawer";

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  jeansSize: string;
  topSize: string;
  isGuest: boolean;
  role: "customer" | "admin";
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "Dhaka",
  district: "BD-13",
  jeansSize: "32",
  topSize: "L",
  isGuest: true,
  role: "customer",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);

  // Active slide-over drawer
  const [activeDrawer, setActiveDrawer] = useState<
    "orders" | "address" | "sizing" | "security" | "preferences" | null
  >(null);
  const [aboutDrawerOpen, setAboutDrawerOpen] = useState(false);

  // Theme & notification preferences
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const [pushOrders, setPushOrders] = useState(true);
  const [pushPromos, setPushPromos] = useState(false);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loginIdent, setLoginIdent] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [authNotice, setAuthNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [socialModalProvider, setSocialModalProvider] = useState<"google" | "facebook" | null>(null);

  // Security & Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passNotice, setPassNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
      const savedTheme = localStorage.getItem("deen_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setCurrentTheme(savedTheme ? (savedTheme as "light" | "dark") : prefersDark ? "dark" : "light");
    } catch {}

    fetchDistricts().then((data) => {
      if (data.length > 0) setDistricts(data);
    });
  }, []);

  useEffect(() => {
    if (profile.phone) {
      setLoadingOrders(true);
      fetchOrders(profile.phone)
        .then((res) => setOrders(res))
        .finally(() => setLoadingOrders(false));
    }
  }, [profile.phone]);

  const switchTheme = (mode: "light" | "dark") => {
    setCurrentTheme(mode);
    try {
      localStorage.setItem("deen_theme", mode);
      document.documentElement.setAttribute("data-theme", mode);
    } catch {}
  };

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(""), 3500);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (profile.phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone && (cleanPhone.length !== 11 || !cleanPhone.startsWith("01"))) {
      showNotification("✕ Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    setSavingProfile(true);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
      updateCustomerProfile({
        name: profile.name,
        phone: cleanPhone,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        district: profile.district,
      }).catch(() => {});
      showNotification("✓ Delivery address saved successfully!");
      setActiveDrawer(null);
    } catch {
      showNotification("✕ Error saving address.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSizing = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
      showNotification("✓ Fit & sizing preferences updated!");
      setActiveDrawer(null);
    } catch {
      showNotification("✕ Error saving sizing.");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassNotice(null);
    if (!newPassword || newPassword.length < 6) {
      setPassNotice({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassNotice({ type: "error", text: "New password and confirmation password do not match." });
      return;
    }
    setPassSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        identifier: profile.phone || profile.email || "customer",
      });
      if (res.success) {
        setPassNotice({ type: "success", text: res.message || "✓ Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPassNotice(null);
          setActiveDrawer(null);
        }, 1500);
      } else {
        setPassNotice({ type: "error", text: res.message || "Failed to update password." });
      }
    } catch {
      setPassNotice({ type: "error", text: "Network error updating password." });
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleLogout = () => {
    const guest: UserProfile = { ...DEFAULT_PROFILE, isGuest: true };
    setProfile(guest);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(guest));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
    setOrders([]);
    showNotification("✓ Signed out of your account.");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdent.trim() || !loginPass) {
      setAuthNotice({ type: "error", text: "Please enter your username and password." });
      return;
    }
    setAuthSubmitting(true);
    try {
      const data = await loginCustomer(loginIdent.trim(), loginPass);
      if (data.success) {
        const role = data.role === "admin" || (data.user && data.user.role === "admin") ? "admin" : "customer";
        const updated: UserProfile = {
          ...profile,
          name: data.name || (data.user && data.user.name) || loginIdent.trim(),
          email: data.email || (data.user && data.user.email) || "",
          role,
          isGuest: false,
        };
        setProfile(updated);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        if (data.token) localStorage.setItem("deen_web_guest_token", data.token);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: data.token, profile: updated }),
        }).catch(() => {});
        if (role === "admin") {
          setAuthNotice({ type: "success", text: "👑 Welcome back, Store Administrator! Opening BI Control Room..." });
          setTimeout(() => {
            setAuthSubmitting(false);
            setAuthModalOpen(false);
            router.push("/admin");
          }, 400);
        } else {
          setAuthNotice({ type: "success", text: `Welcome back, ${updated.name}!` });
          setTimeout(() => {
            setAuthSubmitting(false);
            setAuthModalOpen(false);
          }, 500);
        }
      } else {
        setAuthSubmitting(false);
        setAuthNotice({ type: "error", text: data.message || "Invalid credentials." });
      }
    } catch {
      setAuthSubmitting(false);
      setAuthNotice({ type: "error", text: "Network error during sign in." });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = signupPhone.replace(/[^0-9]/g, "");
    if (clean.length !== 11 || !clean.startsWith("01")) {
      setAuthNotice({ type: "error", text: "Enter a valid 11-digit Bangladeshi mobile number." });
      return;
    }
    if (signupPassword.length < 6) {
      setAuthNotice({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setAuthSubmitting(true);
    try {
      const data = await registerCustomer(
        signupName.trim(),
        clean,
        signupPassword,
        signupEmail.trim() || undefined
      );
      const updated: UserProfile = {
        ...profile,
        name: signupName.trim(),
        phone: clean,
        email: signupEmail.trim(),
        isGuest: false,
        role: "customer",
      };
      setProfile(updated);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      if (data.token) localStorage.setItem("deen_web_guest_token", data.token);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token, profile: updated }),
      }).catch(() => {});
      setAuthNotice({ type: "success", text: `Welcome to DEEN Club, ${signupName.trim()}!` });
      setTimeout(() => {
        setAuthSubmitting(false);
        setAuthModalOpen(false);
      }, 600);
    } catch {
      setAuthSubmitting(false);
      setAuthNotice({ type: "error", text: "Network error during registration." });
    }
  };

  const handleSocialSuccess = (res: AuthResult) => {
    if (res.success && res.user) {
      const updated: UserProfile = {
        ...profile,
        name: res.user.name || profile.name || "Customer",
        email: res.user.email || profile.email,
        role: "customer",
        isGuest: false,
      };
      setProfile(updated);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      if (res.token) localStorage.setItem("deen_web_guest_token", res.token);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: res.token, profile: updated }),
      }).catch(() => {});
      setAuthNotice({ type: "success", text: `✓ Signed in successfully as ${res.user.name}!` });
      setTimeout(() => {
        setAuthModalOpen(false);
        setSocialModalProvider(null);
      }, 500);
    }
  };

  const districtName = districts.find((d) => d.code === profile.district)?.name || "Dhaka";
  const isPhoneValid = signupPhone.replace(/[^0-9]/g, "").length === 11 && signupPhone.startsWith("01");

  return (
    <div className="container" style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 90 }}>
      {savedMessage && <div className="alert alert--success">{savedMessage}</div>}

      {/* ── 1. Compact Hero Identity Card (Clean & Minimal) ── */}
      <div className="profile-hero-card" style={{ padding: "20px", marginBottom: 16 }}>
        <div className="profile-hero-top">
          <div className="profile-avatar">
            {profile.role === "admin"
              ? "👑"
              : profile.isGuest
              ? "👤"
              : profile.name
              ? profile.name.charAt(0).toUpperCase()
              : "D"}
          </div>
          <div className="profile-identity">
            <div className="profile-badge-row">
              <span
                className={`profile-role-badge ${
                  profile.role === "admin"
                    ? "profile-role-badge--admin"
                    : profile.isGuest
                    ? "profile-role-badge--guest"
                    : "profile-role-badge--member"
                }`}
              >
                {profile.role === "admin"
                  ? "👑 STORE ADMINISTRATOR"
                  : profile.isGuest
                  ? "🛍️ GUEST SHOPPER"
                  : "💎 DEEN CLUB MEMBER"}
              </span>
            </div>
            <h2 className="profile-name">
              {profile.role === "admin"
                ? profile.name || "Store Administrator"
                : profile.isGuest
                ? "Guest Shopper"
                : profile.name || "DEEN Customer"}
            </h2>
            <p className="profile-sub">
              {profile.phone
                ? `📞 +880 ${profile.phone}`
                : profile.email
                ? `✉️ ${profile.email}`
                : "Fast 1-Tap Guest Checkout"}
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Row (Tappable Drawer Shortcuts) */}
        <div className="profile-stats-bar" style={{ margin: "14px 0 16px" }}>
          <button
            type="button"
            className="profile-stat-item"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => setActiveDrawer("orders")}
          >
            <span className="profile-stat-val">📦 {orders.length}</span>
            <span className="profile-stat-lbl">Orders</span>
          </button>
          <div className="profile-stat-divider" />
          <button
            type="button"
            className="profile-stat-item"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => setActiveDrawer("address")}
          >
            <span className="profile-stat-val">📍 {districtName}</span>
            <span className="profile-stat-lbl">District</span>
          </button>
          <div className="profile-stat-divider" />
          <button
            type="button"
            className="profile-stat-item"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => setActiveDrawer("sizing")}
          >
            <span className="profile-stat-val">👖 {profile.jeansSize}&quot; · 👕 {profile.topSize}</span>
            <span className="profile-stat-lbl">Saved Size</span>
          </button>
        </div>

        {/* Auth Actions */}
        <div className="profile-auth-actions">
          {profile.isGuest ? (
            <>
              <button
                type="button"
                className="btn btn--primary"
                style={{ flex: 1.2, padding: "10px 16px", fontSize: 12, fontWeight: 800 }}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthNotice(null);
                  setAuthModalOpen(true);
                }}
              >
                ✨ CREATE ACCOUNT
              </button>
              <button
                type="button"
                className="btn btn--outline"
                style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 800 }}
                onClick={() => {
                  setAuthMode("signin");
                  setAuthNotice(null);
                  setAuthModalOpen(true);
                }}
              >
                🔑 SIGN IN
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--outline"
              style={{
                width: "100%",
                borderColor: "var(--crimson)",
                color: "var(--crimson)",
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 16px",
              }}
              onClick={handleLogout}
            >
              LOG OUT FROM ACCOUNT
            </button>
          )}
        </div>
      </div>

      {/* ── Priority for Admin: Executive BI Command Hub ── */}
      {profile.role === "admin" && (
        <div
          className="profile-section-card"
          style={{
            borderColor: "var(--indigo)",
            borderWidth: 1.5,
            boxShadow: "0 4px 16px rgba(79, 70, 229, 0.12)",
            marginBottom: 16,
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <strong style={{ fontSize: 13, color: "var(--indigo)", letterSpacing: 0.3 }}>
                BUSINESS INTELLIGENCE (BI) COMMAND HUB
              </strong>
            </div>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "var(--emerald)",
                fontSize: 10,
                fontWeight: 900,
                padding: "3px 7px",
                borderRadius: 999,
              }}
            >
              ● LIVE BI
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--sub)", margin: "0 0 12px", lineHeight: 1.4 }}>
            Net revenues, gross margins, return intelligence, and Pathao logistics control.
          </p>
          <Link
            href="/admin"
            className="btn btn--primary"
            style={{
              width: "100%",
              padding: "11px 16px",
              fontSize: 12.5,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            OPEN DEDICATED BI CONTROL ROOM →
          </Link>
        </div>
      )}

      {/* ── 2. Minimal Profile Drawer Menu Rows (Simple, Clean & Fast) ── */}
      <div className="profile-menu-list">
        {/* 1. My Orders & Tracking */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setActiveDrawer("orders")}
        >
          <div className="profile-menu-item__icon">📦</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">
              <span>My Orders &amp; Courier Tracking</span>
              {orders.length > 0 && (
                <span className="profile-menu-item__badge">{orders.length}</span>
              )}
            </div>
            <p className="profile-menu-item__subtitle">
              {loadingOrders
                ? "Checking orders…"
                : orders.length > 0
                ? `${orders.length} orders · Live Pathao tracking`
                : "View order history & live logistics dispatch"}
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 2. Saved Delivery Address */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setActiveDrawer("address")}
        >
          <div className="profile-menu-item__icon">📍</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">Saved Delivery Address</div>
            <p className="profile-menu-item__subtitle">
              {profile.address
                ? `${districtName} · ${profile.address}`
                : `${districtName} · Tap to set default shipping address`}
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 3. Fit & Sizing Preferences */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setActiveDrawer("sizing")}
        >
          <div className="profile-menu-item__icon">📐</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">Fit &amp; Sizing Preferences</div>
            <p className="profile-menu-item__subtitle">
              Jeans Waist {profile.jeansSize}&quot; · Top {profile.topSize} · Tap to adjust
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 4. Account Security & Password */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setActiveDrawer("security")}
        >
          <div className="profile-menu-item__icon">🔒</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">Account Security &amp; Password</div>
            <p className="profile-menu-item__subtitle">
              {profile.isGuest ? "Guest account · Set password & protect account" : "Change password & login protection"}
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 5. Appearance & Notifications */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setActiveDrawer("preferences")}
        >
          <div className="profile-menu-item__icon">🎨</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">Appearance &amp; Preferences</div>
            <p className="profile-menu-item__subtitle">
              Theme: {currentTheme.toUpperCase()} · Order updates active
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 6. About DEEN & Showrooms */}
        <button
          type="button"
          className="profile-menu-item"
          onClick={() => setAboutDrawerOpen(true)}
        >
          <div className="profile-menu-item__icon">🏢</div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">About DEEN &amp; Showrooms</div>
            <p className="profile-menu-item__subtitle">
              4 retail stores, ethical denim heritage, careers &amp; wholesale
            </p>
          </div>
          <div className="profile-menu-item__chevron">→</div>
        </button>

        {/* 7. WhatsApp Concierge */}
        <a
          href="https://wa.me/8801952700500?text=Hello%20DEEN%20Commerce%2C%20I%20need%20assistance."
          target="_blank"
          rel="noopener noreferrer"
          className="profile-menu-item"
        >
          <div className="profile-menu-item__icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "var(--emerald)" }}>
            💬
          </div>
          <div className="profile-menu-item__content">
            <div className="profile-menu-item__title">WhatsApp Concierge Hotline</div>
            <p className="profile-menu-item__subtitle">
              Instant customer service &amp; size styling: +880 1952-700500
            </p>
          </div>
          <div className="profile-menu-item__chevron">↗</div>
        </a>
      </div>

      {/* ── 3. The Modular Slide-out Drawers ── */}

      {/* Drawer: Orders & Tracking */}
      <ProfileDrawer
        isOpen={activeDrawer === "orders"}
        onClose={() => setActiveDrawer(null)}
        title="MY ORDERS & TRACKING"
        icon="📦"
        subtitle="Order history and live Pathao courier status"
      >
        {loadingOrders ? (
          <p style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
            Checking orders…
          </p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No Orders Placed Yet</h4>
            <p style={{ fontSize: 12.5, color: "var(--sub)", lineHeight: 1.5, marginBottom: 20 }}>
              Orders linked to mobile number <strong>{profile.phone || "your account"}</strong> will appear here automatically with live courier tracking.
            </p>
            <Link
              href="/shop"
              onClick={() => setActiveDrawer(null)}
              className="btn btn--primary"
              style={{ padding: "10px 20px", fontWeight: 800 }}
            >
              EXPLORE COLLECTION →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 14,
                  backgroundColor: "var(--surface-2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>Order #{o.number || o.id}</span>
                  <span className={`status-pill status-pill--${o.status.toLowerCase()}`}>
                    {o.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 10 }}>
                  Total: <strong style={{ color: "var(--ink)" }}>৳{o.total.toLocaleString()}</strong> · {o.paymentTitle || "Cash on Delivery"}
                </div>
                {o.pathaoConsignmentId ? (
                  <a
                    href={o.pathaoTrackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${o.pathaoConsignmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pathao-track-badge"
                  >
                    🚚 Track Pathao: {o.pathaoConsignmentId} ↗
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--faint)" }}>Preparing Dispatch</span>
                )}
              </div>
            ))}

            <Link
              href="/orders"
              onClick={() => setActiveDrawer(null)}
              className="btn btn--outline"
              style={{ width: "100%", textAlign: "center", marginTop: 10, padding: 12, fontWeight: 800 }}
            >
              VIEW FULL ORDERS PAGE →
            </Link>
          </div>
        )}
      </ProfileDrawer>

      {/* Drawer: Delivery Address */}
      <ProfileDrawer
        isOpen={activeDrawer === "address"}
        onClose={() => setActiveDrawer(null)}
        title="SAVED DELIVERY ADDRESS"
        icon="📍"
        subtitle="Default shipping location for 1-tap checkout"
      >
        <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Tanvir Ahmed"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bangladeshi Mobile Number *</label>
            <input
              type="tel"
              className="form-input"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="017XXXXXXXX"
              maxLength={11}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">District (All 64 BD Districts) *</label>
            <select
              className="form-input"
              value={profile.district}
              onChange={(e) => {
                const found = districts.find((d) => d.code === e.target.value);
                setProfile({
                  ...profile,
                  district: e.target.value,
                  city: found ? found.name : profile.city,
                });
              }}
            >
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">City / Thana / Area *</label>
            <input
              type="text"
              className="form-input"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="e.g. Mirpur, Uttara, Agrabad"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <textarea
              className="form-input"
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="House #, Road #, Sector / Area details..."
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: "100%", padding: 13, fontWeight: 900, marginTop: 10 }}
            disabled={savingProfile}
          >
            {savingProfile ? "SAVING ADDRESS…" : "✓ SAVE DELIVERY ADDRESS"}
          </button>
        </form>
      </ProfileDrawer>

      {/* Drawer: Fit & Sizing Preferences */}
      <ProfileDrawer
        isOpen={activeDrawer === "sizing"}
        onClose={() => setActiveDrawer(null)}
        title="FIT & SIZING PREFERENCES"
        icon="📐"
        subtitle="Save sizing for personalized fit recommendations"
      >
        <form onSubmit={handleSaveSizing} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", display: "block", marginBottom: 10 }}>
              Jeans Waist Size (Inches):
            </label>
            <div className="size-chips-wrap">
              {["28", "30", "32", "34", "36", "38"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`size-chip-btn ${profile.jeansSize === sz ? "size-chip-btn--active" : ""}`}
                  onClick={() => setProfile({ ...profile, jeansSize: sz })}
                >
                  {sz}&quot;
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", display: "block", marginBottom: 10 }}>
              Shirt / Panjabi / Tee Size:
            </label>
            <div className="size-chips-wrap">
              {["S", "M", "L", "XL", "XXL"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`size-chip-btn ${profile.topSize === sz ? "size-chip-btn--active" : ""}`}
                  onClick={() => setProfile({ ...profile, topSize: sz })}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--sub)",
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Fitting Note:</strong> Our artisanal selvedge denim is cut with a standard modern taper. If you prefer a relaxed or roomier thigh fit, consider sizing up by 1 inch.
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: "100%", padding: 13, fontWeight: 900 }}
          >
            ✓ SAVE SIZING PREFERENCES
          </button>
        </form>
      </ProfileDrawer>

      {/* Drawer: Account Security & Password */}
      <ProfileDrawer
        isOpen={activeDrawer === "security"}
        onClose={() => setActiveDrawer(null)}
        title="ACCOUNT SECURITY & PASSWORD"
        icon="🔒"
        subtitle="Manage login credentials & security"
      >
        {profile.isGuest ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--sub)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              You are currently signed in as a <strong>Guest Shopper</strong>. Register an official account to set a permanent password, save addresses, and earn cashback.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              style={{ width: "100%", padding: 12, fontWeight: 800 }}
              onClick={() => {
                setActiveDrawer(null);
                setAuthMode("signup");
                setAuthModalOpen(true);
              }}
            >
              ✨ CREATE FULL ACCOUNT &amp; PASSWORD
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {passNotice && (
              <div className={`alert ${passNotice.type === "success" ? "alert--success" : "alert--error"}`}>
                {passNotice.text}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (if known)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password * (Min. 6 characters)</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                minLength={6}
                required
              />
            </div>

            {confirmPassword && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: confirmPassword === newPassword ? "var(--emerald)" : "var(--crimson)",
                }}
              >
                {confirmPassword === newPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: "100%", padding: 13, fontWeight: 900, marginTop: 8 }}
              disabled={passSubmitting}
            >
              {passSubmitting ? "UPDATING PASSWORD…" : "🔑 UPDATE PASSWORD"}
            </button>
          </form>
        )}
      </ProfileDrawer>

      {/* Drawer: Appearance & Preferences */}
      <ProfileDrawer
        isOpen={activeDrawer === "preferences"}
        onClose={() => setActiveDrawer(null)}
        title="APPEARANCE & PREFERENCES"
        icon="🎨"
        subtitle="Customize theme and notification channels"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Theme Mode */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", display: "block", marginBottom: 10 }}>
              Display Theme Mode:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                className={`btn ${currentTheme === "light" ? "btn--primary" : "btn--outline"}`}
                style={{ padding: 12, fontWeight: 800, fontSize: 12.5 }}
                onClick={() => switchTheme("light")}
              >
                ☀️ LIGHT MODE
              </button>
              <button
                type="button"
                className={`btn ${currentTheme === "dark" ? "btn--primary" : "btn--outline"}`}
                style={{ padding: 12, fontWeight: 800, fontSize: 12.5 }}
                onClick={() => switchTheme("dark")}
              >
                🌙 DARK MODE
              </button>
            </div>
          </div>

          {/* Notification Options */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", display: "block", marginBottom: 12 }}>
              Notification Alerts:
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <strong style={{ fontSize: 12.5, color: "var(--ink)" }}>Order Status &amp; Dispatch Alerts</strong>
                  <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>Instant Pathao dispatch and delivery notices</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushOrders}
                  onChange={(e) => setPushOrders(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--indigo)", cursor: "pointer" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <strong style={{ fontSize: 12.5, color: "var(--ink)" }}>Exclusive Promos &amp; Drops</strong>
                  <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>VIP early access to seasonal sales</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushPromos}
                  onChange={(e) => setPushPromos(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--indigo)", cursor: "pointer" }}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            style={{ width: "100%", padding: 13, fontWeight: 900, marginTop: 10 }}
            onClick={() => {
              showNotification("✓ Preferences saved!");
              setActiveDrawer(null);
            }}
          >
            ✓ APPLY PREFERENCES
          </button>
        </div>
      </ProfileDrawer>

      {/* ── 4. Modals ── */}

      {/* Auth Sign In / Register Modal */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-tabs">
                <button
                  type="button"
                  className={`modal-tab ${authMode === "signin" ? "modal-tab--active" : ""}`}
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthNotice(null);
                  }}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  className={`modal-tab ${authMode === "signup" ? "modal-tab--active" : ""}`}
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthNotice(null);
                  }}
                >
                  CREATE ACCOUNT
                </button>
              </div>
              <button type="button" className="modal-close" onClick={() => setAuthModalOpen(false)}>
                ✕
              </button>
            </div>

            {authNotice && (
              <div className={`alert alert--${authNotice.type === "success" ? "success" : "error"}`}>
                {authNotice.text}
              </div>
            )}

            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Username or Email</label>
                  <input
                    type="text"
                    className="form-input"
                    value={loginIdent}
                    onChange={(e) => setLoginIdent(e.target.value)}
                    placeholder="your username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ width: "100%", padding: 12, marginTop: 10, fontWeight: 800 }}
                  disabled={authSubmitting}
                >
                  {authSubmitting ? "Signing in…" : "SIGN IN TO YOUR ACCOUNT"}
                </button>

                <div style={{ display: "flex", alignItems: "center", margin: "16px 0", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-sub)", letterSpacing: 0.5 }}>
                    OR CONTINUE WITH
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSocialModalProvider("google")}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{
                      flex: 1,
                      padding: 10,
                      fontSize: 13,
                      fontWeight: 800,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>G</span> Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialModalProvider("facebook")}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{
                      flex: 1,
                      padding: 10,
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1877F2",
                      borderColor: "rgba(24, 119, 242, 0.3)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>f</span> Facebook
                  </button>
                </div>

                {/* Store Admin Quick Access */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoginIdent("admin");
                      setLoginPass("admin");
                      setAuthSubmitting(true);
                      try {
                        const data = await loginCustomer("admin", "admin");
                        if (data.success) {
                          const updated: UserProfile = {
                            ...profile,
                            name: "DEEN Store Admin",
                            email: "admin@deencommerce.com",
                            role: "admin",
                            isGuest: false,
                          };
                          setProfile(updated);
                          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
                          if (data.token) localStorage.setItem("deen_web_guest_token", data.token);
                          if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
                          setAuthNotice({
                            type: "success",
                            text: "👑 Welcome back, Store Administrator! Opening BI Control Room...",
                          });
                          setTimeout(() => {
                            setAuthSubmitting(false);
                            setAuthModalOpen(false);
                            router.push("/admin");
                          }, 400);
                        } else {
                          setAuthSubmitting(false);
                          setAuthNotice({ type: "error", text: data.message || "Admin login failed." });
                        }
                      } catch {
                        setAuthSubmitting(false);
                        setAuthNotice({ type: "error", text: "Admin login network error." });
                      }
                    }}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{
                      width: "100%",
                      padding: 10,
                      fontSize: 12.5,
                      fontWeight: 800,
                      borderColor: "var(--indigo)",
                      color: "var(--indigo)",
                      background: "var(--surface-2)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    👑 LOGIN AS STORE ADMIN
                  </button>
                  <p style={{ fontSize: 11, color: "var(--text-sub)", textAlign: "center", marginTop: 6 }}>
                    Store Admin Privileges &amp; BI Analytics (user: admin · pass: admin)
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    required
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label className="form-label">Bangladeshi Mobile Number *</label>
                    {signupPhone.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: isPhoneValid ? "var(--emerald)" : "var(--crimson)" }}>
                        {isPhoneValid ? "✓ Valid 11-digit BD number" : "11 digits required"}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    className="form-input"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Create Password * (Min. 6 characters)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <div className="perks-banner">
                  <strong>✨ MEMBERSHIP PRIVILEGES:</strong>
                  <p>• 1-Tap checkout across all web &amp; mobile devices<br />• Live Pathao parcel tracking<br />• Saved sizing preferences</p>
                </div>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ width: "100%", padding: 12, marginTop: 10, fontWeight: 800 }}
                  disabled={authSubmitting}
                >
                  {authSubmitting ? "Creating account…" : "CREATE DEEN ACCOUNT"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Social Auth Modal */}
      <SocialAuthModal
        isOpen={Boolean(socialModalProvider)}
        provider={socialModalProvider || "google"}
        onClose={() => setSocialModalProvider(null)}
        onSuccess={handleSocialSuccess}
        currentEmailHint={signupEmail || profile.email}
        currentNameHint={signupName || profile.name}
      />

      {/* About DEEN Sliding Drawer */}
      <AboutDeenDrawer
        isOpen={aboutDrawerOpen}
        onClose={() => setAboutDrawerOpen(false)}
      />
    </div>
  );
}
