"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCampaigns, type ActiveCampaignState, type RotatingCampaignItem } from "@/lib/api";
import BankOffersModal from "@/components/BankOffersModal";

const DEFAULT_CAMPAIGNS: RotatingCampaignItem[] = [
  {
    id: "camp_sale",
    badge: "🔥 FLAT UP TO 50% OFF",
    title: "Season Clearance Sale",
    subtitle: "40%–50% discount on selected artisanal selvedge denim & menswear.",
    actionUrl: "/shop",
    actionLabel: "Shop Sale",
  },
  {
    id: "camp_cards",
    badge: "💳 BANK CARD SAVINGS",
    title: "Up to 15% Bank Card Discounts",
    subtitle: "Instant savings on City Bank Amex, BRAC Bank, EBL & SCB cards.",
    actionUrl: "#bank-offers",
    actionLabel: "View Bank Offers",
  },
  {
    id: "camp_delivery",
    badge: "⚡ FAST NATIONWIDE DELIVERY",
    title: "Delivery from ৳50",
    subtitle: "24–48h delivery in Dhaka Metro (৳50) · 3–5 days across 64 districts (৳90).",
    actionUrl: "/shop",
    actionLabel: "Shop Now",
  },
];

export default function DynamicCampaignBanner() {
  const [campaignState, setCampaignState] = useState<ActiveCampaignState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("deen_campaign_dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }

    let mounted = true;
    fetchCampaigns()
      .then((data) => {
        if (mounted && data) setCampaignState(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const rawCampaigns = campaignState?.rotatingCampaigns && campaignState.rotatingCampaigns.length > 0
    ? campaignState.rotatingCampaigns
    : DEFAULT_CAMPAIGNS;
  // Per directive: never show cashback banner in the top rotating slideshow
  const campaigns = rawCampaigns.filter((c) => c.id !== "camp_cashback");

  // Auto-cycle through campaigns every 5 seconds
  useEffect(() => {
    if (dismissed || isPaused || campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [dismissed, isPaused, campaigns.length]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem("deen_campaign_dismissed", "true");
  };

  if (dismissed) return null;

  const current = campaigns[currentIndex] || campaigns[0];

  const getBannerTheme = (id: string) => {
    switch (id) {
      case "camp_sale":
        return {
          bg: "linear-gradient(90deg, #180a13 0%, #290f1d 50%, #1a0b16 100%)",
          border: "rgba(244, 63, 94, 0.4)",
          shadow: "0 2px 14px rgba(225, 29, 72, 0.2)",
          badgeBg: "linear-gradient(135deg, #e11d48, #be123c)",
          ctaBg: "rgba(225, 29, 72, 0.2)",
          ctaBorder: "rgba(225, 29, 72, 0.5)",
          ctaColor: "#fecdd3",
          dotColor: "#fb7185",
        };
      case "camp_cards":
        return {
          bg: "linear-gradient(90deg, #090e24 0%, #13193a 50%, #0d122b 100%)",
          border: "rgba(99, 102, 241, 0.4)",
          shadow: "0 2px 14px rgba(99, 102, 241, 0.2)",
          badgeBg: "linear-gradient(135deg, #4f46e5, #4338ca)",
          ctaBg: "rgba(99, 102, 241, 0.2)",
          ctaBorder: "rgba(99, 102, 241, 0.5)",
          ctaColor: "#c7d2fe",
          dotColor: "#818cf8",
        };
      case "camp_delivery":
        return {
          bg: "linear-gradient(90deg, #051914 0%, #0a2720 50%, #061e18 100%)",
          border: "rgba(16, 185, 129, 0.4)",
          shadow: "0 2px 14px rgba(16, 185, 129, 0.2)",
          badgeBg: "linear-gradient(135deg, #059669, #047857)",
          ctaBg: "rgba(16, 185, 129, 0.2)",
          ctaBorder: "rgba(16, 185, 129, 0.5)",
          ctaColor: "#a7f3d0",
          dotColor: "#34d399",
        };
      default:
        return {
          bg: "linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          border: "rgba(99, 102, 241, 0.4)",
          shadow: "0 2px 14px rgba(0, 0, 0, 0.2)",
          badgeBg: "linear-gradient(135deg, #4f46e5, #4338ca)",
          ctaBg: "rgba(255, 255, 255, 0.15)",
          ctaBorder: "rgba(255, 255, 255, 0.35)",
          ctaColor: "#ffffff",
          dotColor: "#6366f1",
        };
    }
  };

  const theme = getBannerTheme(current.id);

  return (
    <>
      <div
        className="campaign-banner"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          position: "relative",
          width: "100%",
          background: theme.bg,
          borderBottom: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          color: "#f8fafc",
          padding: "8px 46px 8px 16px",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "42px",
          transition: "all 0.35s ease",
        }}
      >
        <div
          className="container campaign-banner__inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            margin: "0 auto",
          }}
        >
          {/* Eye-catching Badge with micro-glow */}
          <span
            className="campaign-badge"
            style={{
              background: theme.badgeBg,
              color: "#ffffff",
              boxShadow: `0 2px 8px ${theme.border}`,
            }}
          >
            {current.badge}
          </span>

          {/* Banner message */}
          <span
            className="campaign-text"
            style={{
              color: "rgba(255, 255, 255, 0.95)",
              fontSize: "12px",
              letterSpacing: "0.2px",
            }}
          >
            <strong style={{ color: "#ffffff", fontWeight: 800 }}>{current.title}:</strong>
            <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>{current.subtitle}</span>
          </span>

          {/* CTA Link / Button with precision vertical alignment */}
          {current.actionUrl === "#bank-offers" ? (
            <button
              type="button"
              onClick={() => setBankModalOpen(true)}
              className="campaign-link-btn"
              style={{
                background: theme.ctaBg,
                border: `1px solid ${theme.ctaBorder}`,
                color: theme.ctaColor,
              }}
            >
              <span>{current.actionLabel}</span>
              <span style={{ fontSize: "12px", transform: "translateY(-0.5px)" }}>→</span>
            </button>
          ) : current.actionUrl.startsWith("/") ? (
            <Link
              href={current.actionUrl}
              className="campaign-link-btn"
              style={{
                background: theme.ctaBg,
                border: `1px solid ${theme.ctaBorder}`,
                color: theme.ctaColor,
              }}
            >
              <span>{current.actionLabel}</span>
              <span style={{ fontSize: "12px", display: "inline-block", transform: "translateY(-0.5px)" }}>→</span>
            </Link>
          ) : (
            <a
              href={current.actionUrl}
              className="campaign-link-btn"
              style={{
                background: theme.ctaBg,
                border: `1px solid ${theme.ctaBorder}`,
                color: theme.ctaColor,
              }}
            >
              <span>{current.actionLabel}</span>
              <span style={{ fontSize: "12px", display: "inline-block", transform: "translateY(-0.5px)" }}>→</span>
            </a>
          )}
        </div>

        {/* Carousel indicator dots */}
        {campaigns.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 2,
              display: "flex",
              gap: 4,
              opacity: 0.75,
            }}
          >
            {campaigns.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === currentIndex ? 14 : 4,
                  height: 3,
                  borderRadius: 2,
                  background: idx === currentIndex ? theme.dotColor : "rgba(255, 255, 255, 0.25)",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Dismiss [X] Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss promotional banner"
          title="Dismiss banner"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 12,
            cursor: "pointer",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
        >
          ✕
        </button>
      </div>

      {/* Bank & Card Offers Modal */}
      <BankOffersModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
      />
    </>
  );
}
