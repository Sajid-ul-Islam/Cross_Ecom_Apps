"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface CampaignState {
  type: "cashback" | "sale";
  badge: string;
  title: string;
  subtitle: string;
  actionUrl: string;
  cashback: {
    enabled: boolean;
    tier1Threshold: number;
    tier1Amount: number;
    tier2Threshold: number;
    tier2Amount: number;
  };
}

export default function DynamicCampaignBanner() {
  const [campaign, setCampaign] = useState<CampaignState | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_URL}/v1/deen/campaigns`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) setCampaign(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!campaign) {
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

  return (
    <div className="campaign-banner">
      <div className="container campaign-banner__inner">
        <span className="campaign-badge">{campaign.badge}</span>
        <span className="campaign-text">
          <strong>{campaign.title}:</strong> {campaign.subtitle}
        </span>
        <Link href={campaign.actionUrl || "/shop"} className="campaign-link">
          Explore Collection →
        </Link>
      </div>
    </div>
  );
}
