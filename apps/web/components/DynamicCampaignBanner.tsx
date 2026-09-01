"use client";

import { useEffect, useState } from "react";
import Link from "next/navigation";
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
    id: "camp_cashback",
    badge: "🎁 INSTANT CASHBACK",
    title: "Cashback Reward",
    subtitle: "৳500 Cashback on ৳2,500+ · ৳700 Cashback on ৳3,000+ orders.",
    actionUrl: "/shop",
    actionLabel: "Unlock Rewards",
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

  const campaigns = campaignState?.rotatingCampaigns && campaignState.rotatingCampaigns.length > 0
    ? campaignState.rotatingCampaigns
    : DEFAULT_CAMPAIGNS;

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

  return (
    <>
      <div
        className="campaign-banner"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          position: "relative",
          width: "100%",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          padding: "7px 36px 7px 14px",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "36px",
          transition: "background 0.3s ease",
        }}
      >
        <div className="container campaign-banner__inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <span className="campaign-badge" style={{ background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
            {current.badge}
          </span>
          <span className="campaign-text" style={{ color: "var(--ink)", fontSize: "12px" }}>
            <strong>{current.title}:</strong> {current.subtitle}
          </span>
          {current.actionUrl === "#bank-offers" ? (
            <button
              type="button"
              onClick={() => setBankModalOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--indigo)",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "2px 4px",
              }}
            >
              {current.actionLabel} →
            </button>
          ) : (
            <a href={current.actionUrl} className="campaign-link" style={{ color: "var(--indigo)", fontWeight: 800, fontSize: "11px", textDecoration: "underline" }}>
              {current.actionLabel} →
            </a>
          )}
        </div>

        {/* Carousel indicator dots */}
        {campaigns.length > 1 && (
          <div style={{ position: "absolute", bottom: 2, display: "flex", gap: 3, opacity: 0.5 }}>
            {campaigns.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === currentIndex ? 12 : 4,
                  height: 3,
                  borderRadius: 2,
                  background: idx === currentIndex ? "var(--indigo)" : "var(--sub)",
                  transition: "width 0.2s ease",
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
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: "var(--sub)",
            fontSize: 14,
            cursor: "pointer",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
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
