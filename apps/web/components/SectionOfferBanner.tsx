"use client";

import Link from "next/link";
import type { SectionBannerItem } from "@/lib/api";

interface SectionOfferBannerProps {
  banner: SectionBannerItem;
  priority?: boolean;
}

export default function SectionOfferBanner({ banner, priority = false }: SectionOfferBannerProps) {
  if (!banner?.image) return null;

  return (
    <div
      style={{
        margin: "36px 0",
        borderRadius: "var(--radius, 12px)",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.08)",
        border: "1px solid var(--border)",
      }}
    >
      <Link
        href={banner.actionUrl || "/shop"}
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.image}
          alt={banner.title || "DEEN Special Offer"}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: 480,
            objectFit: "cover",
            display: "block",
            transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="section-offer-img"
          loading={priority ? "eager" : "lazy"}
        />
        <style>{`
          .section-offer-img:hover {
            transform: scale(1.018);
          }
        `}</style>
      </Link>
    </div>
  );
}
