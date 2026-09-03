"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BD_DISTRICTS } from "@/lib/districts";
import { API_URL, fetchOrders, fetchDistricts, loginCustomer, registerCustomer, loginWithGoogle, loginWithFacebook, fetchOutlets, fetchAppSettings, changePassword, updateCustomerProfile, DEFAULT_OUTLETS, type OrderResult, type BdDistrict, type Outlet, type AuthResult } from "@/lib/api";
import AdminAnalyticsModal, { AdminAnalyticsView } from "@/components/AdminAnalyticsModal";
import SocialAuthModal from "@/components/SocialAuthModal";

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
  const [socialModalProvider, setSocialModalProvider] = useState<"google" | "facebook" | null>(null);

  // Security & Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passNotice, setPassNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingContact, setEditingContact] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (profile.phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone && (cleanPhone.length !== 11 || !cleanPhone.startsWith("01"))) {
      setSavedMessage("✕ Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      setTimeout(() => setSavedMessage(""), 4000);
      return;
    }
    setSavingProfile(true);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
      // Sync to backend gateway in background
      updateCustomerProfile({
        name: profile.name,
        phone: cleanPhone,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        district: profile.district,
      }).catch(() => {});
      setSavedMessage("✓ Profile and sizing preferences saved successfully!");
      setEditingContact(false);
      setTimeout(() => setSavedMessage(""), 3500);
    } catch {
      setSavedMessage("✕ Error saving profile.");
    } finally {
      setSavingProfile(false);
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
        setTimeout(() => setPassNotice(null), 4000);
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
      if (data.token) localStorage.setItem("deen_web_guest_token", data.token);
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

  const handleSocialGoogle = () => {
    setSocialModalProvider("google");
  };

  const handleSocialFacebook = () => {
    setSocialModalProvider("facebook");
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

      {/* 1.5. STORE ADMINISTRATOR EXECUTIVE BI & OPERATIONS DASHBOARD */}
      {profile.role === "admin" && (
        <div style={{ margin: "24px 0" }}>
          <AdminAnalyticsView isEmbedded={true} />
        </div>
      )}

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
        <div className="profile-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="profile-section-title">👤 CONTACT & DEFAULT DELIVERY ADDRESS</h3>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ padding: "6px 14px", fontSize: 11, fontWeight: 800 }}
            onClick={() => setEditingContact(!editingContact)}
          >
            {editingContact ? "✕ CANCEL" : "✏️ EDIT INFO"}
          </button>
        </div>

        {!editingContact ? (
          <div style={{ display: "grid", gap: "12px", marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Full Name</span>
              <strong style={{ color: "var(--ink)", fontSize: 13 }}>{profile.name || "Add full name"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Mobile Phone</span>
              <strong style={{ color: "var(--ink)", fontSize: 13 }}>{profile.phone ? `+880 ${profile.phone}` : "Add phone number"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Email Address</span>
              <strong style={{ color: "var(--ink)", fontSize: 13 }}>{profile.email || "Add email address"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Primary District</span>
              <strong style={{ color: "var(--indigo)", fontSize: 13 }}>📍 {districts.find(d => d.code === profile.district)?.name || "Dhaka"} ({profile.district})</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>City / Thana</span>
              <strong style={{ color: "var(--ink)", fontSize: 13 }}>{profile.city || "Dhaka"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Street Address</span>
              <strong style={{ color: "var(--ink)", fontSize: 13, maxWidth: "60%", textAlign: "right" }}>{profile.address || "No address details saved yet"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
              <span style={{ color: "var(--sub)", fontSize: 13 }}>Saved Sizing</span>
              <strong style={{ color: "var(--indigo)", fontSize: 13 }}>👖 Waist {profile.jeansSize}" · 👕 Top {profile.topSize}</strong>
            </div>
          </div>
        ) : (
          <>
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
              disabled={savingProfile}
            >
              {savingProfile ? "SAVING CHANGES..." : "✓ SAVE CHANGES"}
            </button>
          </>
        )}
      </form>

      {/* 4.5. Account Security & Password Management */}
      <div className="profile-section-card" style={{ marginTop: 24 }}>
        <div className="profile-section-header">
          <h3 className="profile-section-title">🔒 ACCOUNT SECURITY & PASSWORD</h3>
        </div>

        {profile.isGuest ? (
          <div>
            <p style={{ color: "var(--sub)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
              You are currently browsing as a guest. Create a permanent DEEN account to lock in VIP discounts, save addresses, and set an account password.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              style={{ padding: "10px 20px", fontSize: 12, fontWeight: 800 }}
              onClick={() => {
                setAuthMode("signup");
                setAuthNotice(null);
                setAuthModalOpen(true);
              }}
            >
              ✨ CREATE ACCOUNT & PASSWORD
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate}>
            <p style={{ color: "var(--sub)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Update your account login password. We recommend choosing a strong password with at least 6 characters.
            </p>

            {passNotice && (
              <div
                className={`alert ${passNotice.type === "success" ? "alert--success" : "alert--error"}`}
                style={{ marginBottom: 16 }}
              >
                {passNotice.text}
              </div>
            )}

            <div className="form-grid">
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
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                  required
                />
              </div>
            </div>

            {confirmPassword && (
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: confirmPassword === newPassword ? "var(--emerald)" : "var(--crimson)" }}>
                {confirmPassword === newPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              style={{ marginTop: 16, padding: "12px 24px", fontSize: 13, fontWeight: 800 }}
              disabled={passSubmitting}
            >
              {passSubmitting ? "UPDATING PASSWORD..." : "🔑 UPDATE PASSWORD"}
            </button>
          </form>
        )}
      </div>

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
                          setAuthNotice({ type: "success", text: "Logged in as Store Administrator!" });
                          setTimeout(() => {
                            setAuthSubmitting(false);
                            setAuthModalOpen(false);
                          }, 500);
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
                  <p style={{ fontSize: 11, color: "var(--text-sub)", textAlign: "center", marginTop: 6, margin: "6px 0 0" }}>
                    Store Admin Privileges & BI Analytics (user: admin · pass: admin)
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

      {/* Social Auth Pop-Up Modal */}
      <SocialAuthModal
        isOpen={Boolean(socialModalProvider)}
        provider={socialModalProvider || "google"}
        onClose={() => setSocialModalProvider(null)}
        onSuccess={handleSocialSuccess}
        currentEmailHint={signupEmail || profile.email}
        currentNameHint={signupName || profile.name}
      />
    </div>
  );
}

function ProfileOutletsSection() {
  const [outlets, setOutlets] = useState<Outlet[]>(DEFAULT_OUTLETS);
  const [whatsapp, setWhatsapp] = useState("01952-700500");

  useEffect(() => {
    fetchOutlets().then((o) => { if (o && o.length > 0) setOutlets(o); });
    fetchAppSettings().then((s) => { if (s?.contact?.whatsapp) setWhatsapp(s.contact.whatsapp); });
  }, []);

  const waDigits = whatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <h3 className="profile-section-title">🏬 DEEN RETAIL OUTLETS & SHOWROOMS</h3>
      </div>

      <div className="outlets-grid">
        {outlets.map((outlet) => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.mapQuery || outlet.address)}`;
          return (
            <div key={outlet.id} className="outlet-box" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10, padding: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, background: outlet.pickup ? "var(--indigo-light)" : "var(--surface)", color: outlet.pickup ? "var(--indigo)" : "var(--sub)", padding: "2px 6px", borderRadius: 4 }}>
                    {outlet.tag || (outlet.pickup ? "FLAGSHIP STORE" : "SHOWROOM")}
                  </span>
                  {outlet.pickup && (
                    <span style={{ fontSize: 10, color: "var(--emerald)", fontWeight: 800 }}>✓ Store Pickup</span>
                  )}
                </div>
                <strong style={{ fontSize: 13, color: "var(--ink)", marginBottom: 4, display: "block" }}>📍 {outlet.name}</strong>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.4, marginBottom: 6 }}>{outlet.address}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>🕒 {outlet.hours}</p>
                <p style={{ fontSize: 11, color: "var(--indigo)", fontWeight: 700 }}>📞 Hotline: <a href={`tel:${outlet.phone}`} style={{ color: "var(--indigo)", textDecoration: "none" }}>{outlet.phone}</a></p>
              </div>

              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "6px 10px",
                  textDecoration: "none",
                  marginTop: 6,
                }}
              >
                📍 VIEW ON GOOGLE MAPS
              </a>
            </div>
          );
        })}
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
          <div style={{ fontSize: 11, color: "var(--sub)" }}>Tap to Chat with DEEN Concierge on WhatsApp</div>
        </div>
      </a>
    </div>
  );
}
