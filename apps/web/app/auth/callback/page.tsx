"use client";

import React, { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Completing authentication...");

  useEffect(() => {
    try {
      // 1. Check hash fragment (OAuth 2.0 Implicit Flow / Token flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);

      // 2. Check query params (OAuth 2.0 Code / Error flow)
      const searchParams = new URLSearchParams(window.location.search);

      const idToken = hashParams.get("id_token") || searchParams.get("id_token");
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token") || searchParams.get("token");
      const error = hashParams.get("error") || searchParams.get("error") || searchParams.get("error_description");

      if (error) {
        setStatus(`Authentication failed: ${error}`);
        if (window.opener) {
          window.opener.postMessage(
            { type: "OAUTH_ERROR", error },
            window.location.origin
          );
          setTimeout(() => window.close(), 1500);
        }
        return;
      }

      if (idToken || accessToken) {
        setStatus("✓ Authentication successful! Returning to DEEN Commerce...");
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "OAUTH_SUCCESS",
              idToken: idToken || undefined,
              accessToken: accessToken || undefined,
            },
            window.location.origin
          );
          setTimeout(() => window.close(), 500);
        } else {
          // If not in a popup, redirect to profile
          window.location.href = "/profile";
        }
      } else {
        setStatus("No credentials returned from identity provider.");
        if (window.opener) {
          setTimeout(() => window.close(), 2000);
        }
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "Unknown error"}`);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center",
        background: "#F8FAFC",
        color: "#1E293B",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #E2E8F0",
          borderTopColor: "#2A3680",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: 20,
        }}
      />
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>
        DEEN Commerce Security
      </h2>
      <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>{status}</p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
