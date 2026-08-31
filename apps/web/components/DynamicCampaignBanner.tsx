"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCampaigns, type ActiveCampaignState } from "@/lib/api";

export default function DynamicCampaignBanner() {
  const [campaign, setCampaign] = useState<ActiveCampaignState | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchCampaigns()
      .then((data) => {
        if (mounted && data) setCampaign(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const active = campaign?.activeCampaign;
  const isCashback = campaign?.cashback?.enabled;

  if (isCashback && campaign?.cashback) {
    const tier1Min = campaign.cashback.tier1?.minSpend ?? 2500;
    const tier1Amt = campaign.cashback.tier1?.amount ?? 500;
    const tier2Min = campaign.cashback.tier2?.minSpend ?? 3000;
    const tier2Amt = campaign.cashback.tier2?.amount ?? 700;

    return (
      <div className="campaign-banner">
        <div className="container campaign-banner__inner">
          <span className="campaign-badge">🎁 INSTANT CASHBACK</span>
          <span className="campaign-text">
            <strong>Unlock Cashback:</strong> ৳{tier1Amt} on ৳{tier1Min.toLocaleString()}+ · ৳{tier2Amt} on ৳{tier2Min.toLocaleString()}+
          </span>
          <Link href="/shop" className="campaign-link">
            Shop Now →
          </Link>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="campaign-banner">
        <div className="container campaign-banner__inner">
          <span className="campaign-badge">{active.badge || "SPECIAL OFFER"}</span>
          <span className="campaign-text">
            <strong>{active.title}:</strong> {active.subtitle}
          </span>
          <Link href={active.actionUrl || "/shop"} className="campaign-link">
            {active.actionLabel || "Explore Sale"} →
          </Link>
        </div>
      </div>
    );
  }

  // Fallback default sale banner from REST API default
  return (
    <div className="campaign-banner">
      <div className="container campaign-banner__inner">
        <span className="campaign-badge">🔥 FLAT UP TO 50% OFF</span>
        <span className="campaign-text">
          <strong>Season Clearance:</strong> 40%–50% discount on selected artisanal denim & menswear.
        </span>
        <Link href="/shop" className="campaign-link">
          Shop Sale →
        </Link>
      </div>
    </div>
  );
}
