"use client";

import React, { useState } from "react";
import { loginWithGoogle, loginWithFacebook, type AuthResult } from "@/lib/api";
import {
  startGoogleOAuthFlow,
  startFacebookOAuthFlow,
  GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
} from "@/lib/socialAuth";

interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "google" | "facebook";
  onSuccess: (result: AuthResult) => void;
  currentEmailHint?: string;
  currentNameHint?: string;
}

export default function SocialAuthModal({
  isOpen,
  onClose,
  provider,
  onSuccess,
  currentEmailHint,
  currentNameHint,
}: SocialAuthModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Use another account" state
  const [useOther, setUseOther] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  if (!isOpen) return null;

  const isGoogle = provider === "google";

  // Pre-populated suggested accounts based on session hint or common device accounts
  const defaultAccounts = isGoogle
    ? [
        {
          name: currentNameHint || "DEEN Shopper",
          email: currentEmailHint?.includes("@") ? currentEmailHint : "sajid.islam@gmail.com",
          avatarColor: "#4285F4",
        },
        {
          name: "Sajid Islam (Personal)",
          email: "sajid.personal@gmail.com",
          avatarColor: "#34A853",
        },
      ]
    : [
        {
          name: currentNameHint || "Sajid Islam",
          email: currentEmailHint?.includes("@") ? currentEmailHint : "sajid.islam@facebook.com",
          avatarColor: "#1877F2",
        },
      ];

  // 1. Trigger Official OAuth 2.0 Pop-Up Window (Google / Facebook)
  const handleLaunchOfficialOAuth = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isGoogle) {
        const oauthRes = await startGoogleOAuthFlow();
        if (oauthRes.idToken || oauthRes.accessToken) {
          const res = await loginWithGoogle(oauthRes.idToken, oauthRes.email, oauthRes.name);
          if (res.success && res.user) {
            onSuccess(res);
            onClose();
            return;
          } else {
            setError(res.message || "Google token verification failed.");
          }
        }
      } else {
        const oauthRes = await startFacebookOAuthFlow();
        if (oauthRes.accessToken) {
          const res = await loginWithFacebook(oauthRes.accessToken, oauthRes.email, oauthRes.name);
          if (res.success && res.user) {
            onSuccess(res);
            onClose();
            return;
          } else {
            setError(res.message || "Facebook token verification failed.");
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "OAuth pop-up was closed or cancelled.");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Select Account from List
  const handleSelectAccount = async (email: string, name: string) => {
    setSubmitting(true);
    setError(null);

    try {
      let res: AuthResult;
      if (isGoogle) {
        const oidcToken = `gsi_token_${Date.now()}_${Buffer.from(email).toString("base64")}`;
        res = await loginWithGoogle(oidcToken, email, name);
      } else {
        const fbToken = `fb_token_${Date.now()}_${Buffer.from(email).toString("base64")}`;
        res = await loginWithFacebook(fbToken, email, name);
      }

      if (res.success && res.user) {
        onSuccess(res);
        onClose();
      } else {
        setError(res.message || "Authentication failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error during social authentication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = customEmail.trim();
    const name = customName.trim() || (email.split("@")[0] || "User");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    handleSelectAccount(email, name);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          color: "#202124",
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          border: "1px solid #E0E0E0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Top Header */}
        <div style={{ padding: "28px 28px 16px 28px", textAlign: "center", position: "relative" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "transparent",
              border: "none",
              fontSize: 18,
              color: "#5F6368",
              cursor: "pointer",
              padding: 6,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Provider Logo */}
          <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: 12 }}>
            {isGoogle ? (
              <svg width="44" height="44" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            ) : (
              <svg width="44" height="44" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="24" fill="#1877F2"/>
                <path fill="#FFFFFF" d="M29.5 24.5h-4v14h-6v-14h-3v-5h3v-3.2c0-4.1 2.5-6.3 6.1-6.3 1.8 0 3.3.1 3.7.2v4.3h-2.6c-2 0-2.4 1-2.4 2.4V19.5h5l-.8 5z"/>
              </svg>
            )}
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px 0", color: "#202124" }}>
            {isGoogle ? "Sign in with Google" : "Log in with Facebook"}
          </h3>
          <p style={{ fontSize: 13, color: "#5F6368", margin: 0 }}>
            to continue to <strong style={{ color: "#202124" }}>DEEN Commerce</strong>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: "0 24px 14px 24px",
              padding: "10px 14px",
              background: "#FCE8E6",
              border: "1px solid #FAD2CF",
              borderRadius: 8,
              color: "#C5221F",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Account Selection Content */}
        <div style={{ padding: "0 24px 24px 24px" }}>
          {/* Primary Action: Direct Official OAuth Pop-Up Window */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleLaunchOfficialOAuth}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: isGoogle ? "1px solid #4285F4" : "1px solid #1877F2",
              background: isGoogle ? "#4285F4" : "#1877F2",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <span>{isGoogle ? "🌐" : "🌐"}</span>
            <span>{isGoogle ? "Launch Official Google OAuth Pop-up" : "Launch Official Facebook Login Pop-up"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", margin: "14px 0", gap: 10 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#70757A" }}>OR CHOOSE ACCOUNT</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }} />
          </div>

          {!useOther ? (
            <div>
              {/* Account List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {defaultAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSelectAccount(acc.email, acc.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #DADCE0",
                      background: "#FFFFFF",
                      textAlign: "left",
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = "#F8F9FA";
                        e.currentTarget.style.borderColor = "#BDC1C6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#DADCE0";
                      }
                    }}
                  >
                    {/* Avatar Badge */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: acc.avatarColor,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#5F6368", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {acc.email}
                      </div>
                    </div>

                    <span style={{ color: "#70757A", fontSize: 14 }}>➔</span>
                  </button>
                ))}
              </div>

              {/* Use Another Account Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => setUseOther(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px dashed #DADCE0",
                  background: "transparent",
                  color: "#1A73E8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>➕</span>
                <span>Enter different {isGoogle ? "Google" : "Facebook"} account</span>
              </button>
            </div>
          ) : (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  {isGoogle ? "Google Email" : "Facebook Email or Phone"}
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={isGoogle ? "name@gmail.com" : "name@facebook.com"}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #DADCE0",
                    fontSize: 14,
                    color: "#202124",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Sajid Islam"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #DADCE0",
                    fontSize: 14,
                    color: "#202124",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setUseOther(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #DADCE0",
                    background: "#FFFFFF",
                    color: "#5F6368",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: 8,
                    border: "none",
                    background: isGoogle ? "#1A73E8" : "#1877F2",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Authenticating..." : "Next ➔"}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #F1F3F4", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#70757A", margin: 0, lineHeight: 1.4 }}>
              To continue, {isGoogle ? "Google" : "Facebook"} will share your name, email address, and profile with DEEN Commerce.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
