"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BD_DISTRICTS } from "@/lib/districts";
import { API_URL, fetchOrders, fetchDistricts, loginCustomer, registerCustomer, loginWithGoogle, loginWithFacebook, fetchOutlets, fetchAppSettings, type OrderResult, type BdDistrict, type Outlet } from "@/lib/api";
import AdminAnalyticsModal from "@/components/AdminAnalyticsModal";

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
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loginIdent, setLoginIdent] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [authNotice, setAuthNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {}
    // Fetch districts from API (single source of truth)
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setSavedMessage("✓ Profile and sizing preferences saved successfully!");
      setTimeout(() => setSavedMessage(""), 3500);
    } catch {}
  };

  const handleLogout = () => {
    const guest: UserProfile = { ...DEFAULT_PROFILE, isGuest: true };
    setProfile(guest);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(guest));
    setOrders([]);
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
        setAuthNotice({ type: "success", text: `Welcome back, ${updated.name}!` });
        setTimeout(() => {
          setAuthSubmitting(false);
          setAuthModalOpen(false);
        }, 600);
      } else {
        setAuthSubmitting(false);
        setAuthNotice({ type: "error", text: data.message || "Invalid credentials. Please try again." });
      }
    } catch {
      setAuthSubmitting(false);
      setAuthNotice({ type: "error", text: "Network error during sign in." });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = signupPhone.replace(/[^0-9]/g, "");
    if (!signupName.trim()) {
      setAuthNotice({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
      setAuthNotice({ type: "error", text: "Valid 11-digit Bangladeshi mobile number required (01XXXXXXXXX)." });
      return;
    }
    setAuthSubmitting(true);
    try {
      const data = await registerCustomer(signupName.trim(), cleanPhone, "DeenCustomerPass@2026", signupEmail.trim());
      const updated: UserProfile = {
        ...profile,
        name: signupName.trim(),
        phone: cleanPhone,
        email: signupEmail.trim(),
        isGuest: false,
        role: "customer",
      };
      setProfile(updated);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
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

  const handleSocialGoogle = async () => {
    setAuthSubmitting(true);
    setAuthNotice(null);
    try {
      const email = signupEmail.trim() || profile.email || (signupPhone ? `${signupPhone.replace(/[^0-9]/g, "")}@gmail.com` : (profile.phone ? `${profile.phone}@gmail.com` : "customer@gmail.com"));
      const name = signupName.trim() || profile.name || "Google User";
      const res = await loginWithGoogle(undefined, email, name);
      if (res.success && res.user) {
        const updated: UserProfile = {
          ...profile,
          name: res.user.name || name,
          email: res.user.email || email,
          role: "customer",
          isGuest: false,
        };
        setProfile(updated);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        setAuthNotice({ type: "success", text: `Signed in with Google as ${res.user.name || name}!` });
        setTimeout(() => {
          setAuthSubmitting(false);
          setAuthModalOpen(false);
        }, 600);
      } else {
        setAuthSubmitting(false);
        setAuthNotice({ type: "error", text: res.message || "Google sign-in failed. Please check network." });
      }
    } catch (err: any) {
      setAuthSubmitting(false);
      setAuthNotice({ type: "error", text: err?.message || "Google sign-in network error." });
    }
  };

  const handleSocialFacebook = async () => {
    setAuthSubmitting(true);
    setAuthNotice(null);
    try {
      const email = signupEmail.trim() || profile.email || (signupPhone ? `${signupPhone.replace(/[^0-9]/g, "")}@facebook.deencommerce.com` : (profile.phone ? `${profile.phone}@facebook.deencommerce.com` : "customer@facebook.deencommerce.com"));
      const name = signupName.trim() || profile.name || "Facebook User";
      const res = await loginWithFacebook(undefined, email, name);
      if (res.success && res.user) {
        const updated: UserProfile = {
          ...profile,
          name: res.user.name || name,
          email: res.user.email || email,
          role: "customer",
          isGuest: false,
        };
        setProfile(updated);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        setAuthNotice({ type: "success", text: `Signed in with Facebook as ${res.user.name || name}!` });
        setTimeout(() => {
          setAuthSubmitting(false);
          setAuthModalOpen(false);
        }, 600);
      } else {
        setAuthSubmitting(false);
        setAuthNotice({ type: "error", text: res.message || "Facebook sign-in failed. Please check network." });
      }
    } catch (err: any) {
      setAuthSubmitting(false);
      setAuthNotice({ type: "error", text: err?.message || "Facebook sign-in network error." });
    }
  };

  const isPhoneValid = signupPhone.replace(/[^0-9]/g, "").length === 11 && signupPhone.startsWith("01");

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {savedMessage && <div className="alert alert--success">{savedMessage}</div>}

      {/* 1. Account Hero Identity Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-top">
          <div className="profile-avatar">
            {profile.role === "admin" ? "👑" : profile.isGuest ? "👤" : (profile.name ? profile.name.charAt(0).toUpperCase() : "D")}
          </div>
          <div className="profile-identity">
            <div className="profile-badge-row">
              <span className={`profile-role-badge ${profile.role === "admin" ? "profile-role-badge--admin" : profile.isGuest ? "profile-role-badge--guest" : "profile-role-badge--member"}`}>
                {profile.role === "admin" ? "👑 STORE ADMINISTRATOR" : profile.isGuest ? "🛍️ GUEST SHOPPER" : "💎 DEEN CLUB MEMBER"}
              </span>
            </div>
            <h2 className="profile-name">
              {profile.role === "admin" ? (profile.name || "Store Administrator") : profile.isGuest ? "Guest User" : (profile.name || "DEEN Customer")}
            </h2>
            <p className="profile-sub">
              {profile.phone ? `📞 ${profile.phone}` : profile.email ? `✉️ ${profile.email}` : "Fast Guest Checkout Active"}
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="profile-stats-bar">
          <Link href="/orders" className="profile-stat-item">
            <span className="profile-stat-val">📦 {orders.length}</span>
            <span className="profile-stat-lbl">Orders</span>
          </Link>
          <div className="profile-stat-divider" />
          <div className="profile-stat-item">
            <span className="profile-stat-val">📍 {profile.city || "Dhaka"}</span>
            <span className="profile-stat-lbl">District</span>
          </div>
          <div className="profile-stat-divider" />
          <Link href="/shop" className="profile-stat-item">
            <span className="profile-stat-val">⚡ Fast</span>
            <span className="profile-stat-lbl">1-Tap Checkout</span>
          </Link>
        </div>

        {/* Auth CTA Buttons */}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              {profile.role === "admin" && (
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ width: "100%", fontSize: 12, fontWeight: 900, background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" }}
                  onClick={() => setAnalyticsModalOpen(true)}
                >
                  📊 VIEW STORE BI & REVENUE DASHBOARD
                </button>
              )}
              <button
                type="button"
                className="btn btn--outline"
                style={{ width: "100%", borderColor: "var(--crimson)", color: "var(--crimson)", fontSize: 12, fontWeight: 800 }}
                onClick={handleLogout}
              >
                LOG OUT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Orders & Live Pathao Tracking */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <h3 className="profile-section-title">📦 RECENT ORDERS & LOGISTICS TRACKING</h3>
          <Link href="/orders" className="profile-section-link">View All →</Link>
        </div>

        {loadingOrders ? (
          <p style={{ color: "var(--sub)", fontSize: 13 }}>Checking orders…</p>
        ) : orders.length === 0 ? (
          <p style={{ color: "var(--sub)", fontSize: 13 }}>
            No orders found yet for this phone number.
          </p>
        ) : (
          <div className="orders-list" style={{ marginTop: 12 }}>
            {orders.slice(0, 3).map((o) => (
              <div key={o.id} className="order-item-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>Order #{o.number || o.id}</span>
                  <span className={`status-pill status-pill--${o.status.toLowerCase()}`}>
                    {o.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 8 }}>
                  Total: <strong>৳{o.total.toLocaleString()}</strong> · {o.paymentTitle || "Cash on Delivery"}
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
          </div>
        )}
      </div>

      {/* 3. Contact & Delivery Address Form */}
      <form onSubmit={handleSave} className="profile-section-card">
        <div className="profile-section-header">
          <h3 className="profile-section-title">👤 CONTACT & DEFAULT DELIVERY ADDRESS</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Tanvir Ahmed"
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
              placeholder="e.g. Mirpur, Banani, Agrabad"
            />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Street Address *</label>
            <textarea
              className="form-input"
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="House #, Road #, Sector / Area details..."
            />
          </div>
        </div>

        {/* 4. Fit & Sizing Preferences */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>
            📐 FIT & SIZING PREFERENCES
          </h4>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>
              Jeans Waist Size (Inches):
            </span>
            <div className="size-chips-wrap">
              {["28", "30", "32", "34", "36", "38"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`size-chip-btn ${profile.jeansSize === sz ? "size-chip-btn--active" : ""}`}
                  onClick={() => setProfile({ ...profile, jeansSize: sz })}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>
              Shirt / Panjabi / Tee Size:
            </span>
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
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          style={{ marginTop: 24, width: "100%", padding: "14px", fontWeight: 800 }}
        >
          SAVE PREFERENCES
        </button>
      </form>

      {/* 5. DEEN Retail Outlets & WhatsApp Concierge */}
      <ProfileOutletsSection />

      {/* Auth Modal */}
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
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-sub)", letterSpacing: 0.5 }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleSocialGoogle}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <span>G</span> Google
                  </button>
                  <button
                    type="button"
                    onClick={handleSocialFacebook}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 800, color: "#1877F2", borderColor: "rgba(24, 119, 242, 0.3)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <span>f</span> Facebook
                  </button>
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
                <div className="perks-banner">
                  <strong>✨ MEMBERSHIP PRIVILEGES:</strong>
                  <p>• 1-Tap checkout across all web & mobile devices<br />• Live Pathao parcel tracking<br />• Saved sizing preferences</p>
                </div>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ width: "100%", padding: 12, marginTop: 10, fontWeight: 800 }}
                  disabled={authSubmitting}
                >
                  {authSubmitting ? "Creating account…" : "CREATE DEEN ACCOUNT"}
                </button>

                <div style={{ display: "flex", alignItems: "center", margin: "16px 0", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-sub)", letterSpacing: 0.5 }}>OR JOIN WITH</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleSocialGoogle}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <span>G</span> Google
                  </button>
                  <button
                    type="button"
                    onClick={handleSocialFacebook}
                    disabled={authSubmitting}
                    className="btn btn--outline"
                    style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 800, color: "#1877F2", borderColor: "rgba(24, 119, 242, 0.3)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <span>f</span> Facebook
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Analytics Modal */}
      <AdminAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
      />
    </div>
  );
}

function ProfileOutletsSection() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [whatsapp, setWhatsapp] = useState("01952-700500");

  useEffect(() => {
    fetchOutlets().then((o) => { if (o.length > 0) setOutlets(o); });
    fetchAppSettings().then((s) => { if (s?.contact?.whatsapp) setWhatsapp(s.contact.whatsapp); });
  }, []);

  const waDigits = whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <h3 className="profile-section-title">🏬 DEEN RETAIL OUTLETS</h3>
      </div>

      <div className="outlets-grid">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="outlet-box">
            <strong>📍 {outlet.name}</strong>
            <p>{outlet.address}</p>
          </div>
        ))}
      </div>

      <a
        href={`https://wa.me/88${waDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-hotline-card"
      >
        <div style={{ fontSize: 24 }}>💬</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Customer Hotline & WhatsApp: +880 {whatsapp}</div>
          <div style={{ fontSize: 11, color: "var(--sub)" }}>Tap to Chat on WhatsApp</div>
        </div>
      </a>
    </div>
  );
}
