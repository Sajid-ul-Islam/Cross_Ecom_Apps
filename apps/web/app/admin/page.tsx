"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginCustomer } from "@/lib/api";
import { AdminAnalyticsView } from "@/components/AdminAnalyticsModal";

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

export default function AdminPage() {
  const [profile, setProfile] = useState<{ role?: string; name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checkAuth = () => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        setProfile(p);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    const onProfileUpdate = () => checkAuth();
    window.addEventListener("storage", onProfileUpdate);
    window.addEventListener("deen_profile_updated", onProfileUpdate);
    return () => {
      window.removeEventListener("storage", onProfileUpdate);
      window.removeEventListener("deen_profile_updated", onProfileUpdate);
    };
  }, []);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await loginCustomer(username.trim(), password);
      if (res.success) {
        const updated = {
          name: res.name || res.user?.name || "DEEN Store Admin",
          email: res.email || res.user?.email || "admin@deencommerce.com",
          role: "admin" as const,
          isGuest: false,
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
        if (res.token) localStorage.setItem("deen_web_guest_token", res.token);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
        setProfile(updated);
      } else {
        setErrorMsg(res.message || "Invalid administrator credentials.");
      }
    } catch {
      setErrorMsg("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--sub)", fontSize: 14 }}>Verifying administrator session…</p>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div className="container" style={{ padding: "32px 16px 64px" }}>
      {/* Top Breadcrumb & Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ color: "var(--sub)", fontSize: 13, textDecoration: "none" }}>Home</Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <Link href="/profile" style={{ color: "var(--sub)", fontSize: 13, textDecoration: "none" }}>Profile</Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ color: "var(--ink)", fontSize: 13, fontWeight: 800 }}>Admin BI &amp; Operations</span>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
              ● Logged in as Store Admin
            </span>
            <button
              type="button"
              className="btn btn--outline"
              style={{ fontSize: 11, padding: "5px 12px", color: "var(--crimson)", borderColor: "var(--crimson)" }}
              onClick={() => {
                localStorage.removeItem(PROFILE_STORAGE_KEY);
                localStorage.removeItem("deen_web_guest_token");
                setProfile(null);
                if (typeof window !== "undefined") window.dispatchEvent(new Event("deen_profile_updated"));
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {isAdmin ? (
        /* Full embedded BI Dashboard */
        <AdminAnalyticsView isEmbedded={true} />
      ) : (
        /* Store Admin Authentication Gate */
        <div style={{ maxWidth: 460, margin: "40px auto", background: "var(--surface)", border: "1.5px solid var(--indigo)", borderRadius: "var(--radius)", padding: 32, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
              DEEN STORE ADMINISTRATOR
            </h1>
            <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 6 }}>
              Proprietary sales revenue, frequent itemset pairs, Pathao logistics dispatch, and inventory valuation portal.
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert--error" style={{ marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="modal-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password / Passkey</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: "100%", padding: 12, marginTop: 12, fontWeight: 900, background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" }}
              disabled={submitting}
            >
              {submitting ? "Authenticating…" : "👑 UNLOCK STORE ADMIN BI DASHBOARD"}
            </button>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin");
                }}
                style={{ background: "none", border: "none", color: "var(--indigo)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              >
                Use Default Credentials (admin / admin)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
