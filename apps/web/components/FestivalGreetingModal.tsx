"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentFestival, type FestivalTheme } from "@/lib/festivals";
import { fetchCampaigns } from "@/lib/api";

export default function FestivalGreetingModal() {
  const [festival, setFestival] = useState<FestivalTheme | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initial local calendar detection fallback
    const localFest = getCurrentFestival();
    if (localFest) setFestival(localFest);

    // Fetch dynamic gateway configuration
    fetchCampaigns()
      .then((data) => {
        if (data?.festivalGreeting && data.festivalGreeting.active) {
          setFestival(data.festivalGreeting as FestivalTheme);
        }
      })
      .catch(() => {});

    // Listen for manual trigger from header logo/titlebar badge
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("deen_open_festival_greeting", handleOpen);

    // Auto-display check on start screen (once per 24 hours per festival)
    if (localFest) {
      const todayKey = `deen_festival_notified_${localFest.id}_${new Date().toISOString().slice(0, 10)}`;
      const hasNotified = localStorage.getItem(todayKey);
      if (!hasNotified) {
        // Small delay so user sees initial page load smoothly first
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem(todayKey, "true");
        }, 1200);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("deen_open_festival_greeting", handleOpen);
        };
      }
    }

    return () => {
      window.removeEventListener("deen_open_festival_greeting", handleOpen);
    };
  }, []);

  if (!festival || !isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={festival.title}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--surface)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.4)",
          border: `1.5px solid ${festival.themePrimary || "var(--indigo)"}`,
          position: "relative",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Festive Header Gradient Band */}
        <div
          style={{
            background: `linear-gradient(135deg, ${festival.themePrimary} 0%, ${festival.themeSecondary || festival.themePrimary} 100%)`,
            padding: "26px 20px 20px",
            color: "#FFFFFF",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Greetings"
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              background: "rgba(0, 0, 0, 0.25)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: 16,
              transition: "all 0.15s ease",
            }}
          >
            ✕
          </button>

          {/* Festival Motif Icon */}
          <div
            style={{
              fontSize: 42,
              marginBottom: 6,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.3))",
            }}
          >
            {festival.motif}
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              background: "rgba(255, 255, 255, 0.22)",
              padding: "3px 10px",
              borderRadius: 12,
              display: "inline-block",
              marginBottom: 6,
            }}
          >
            FESTIVAL GREETINGS
          </span>

          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            {festival.title}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.9 }}>
            {festival.subtitle}
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: 22, textAlign: "center" }}>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink)",
              margin: "0 0 20px",
            }}
          >
            {festival.greeting}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={festival.actionUrl || "/shop"}
              onClick={() => setIsOpen(false)}
              className="btn btn--primary"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px 20px",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 0.3,
                backgroundColor: festival.themePrimary,
                borderColor: festival.themePrimary,
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 8,
              }}
            >
              {festival.actionLabel || "Explore Festive Collection"} →
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--sub)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px",
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
