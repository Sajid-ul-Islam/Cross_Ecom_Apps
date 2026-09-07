import React from "react";

/* Inline SVGs (lucide-style) mirroring the native app's icons. */
export function AwardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
export function ShieldCheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
export function MapPinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export const CHIPS = [
  { emoji: "🧵", title: "Red-Line Selvedge", sub: "13.5oz vintage shuttle loom" },
  { emoji: "✂️", title: "Dhaka Central Studio", sub: "In-house artisan master tailors" },
  { emoji: "🏬", title: "4 Retail Showrooms", sub: "Mirpur 12, Wari & Cumilla" },
  { emoji: "🔄", title: "Doorstep Exchange", sub: "7-day hassle-free size swaps" },
];

export interface TrustItem {
  id: string;
  icon: React.ReactNode;
  tone: string;
  title: string;
  desc: string;
  points: string[];
  tag: string;
}

export const TRUST_ITEMS: TrustItem[] = [
  {
    id: "authentic_quality",
    icon: <AwardIcon size={18} />,
    tone: "var(--indigo)",
    title: "Authentic Quality",
    desc: "Pre-shrunk premium indigo textiles with guaranteed dye-fastness.",
    points: ["Premium indigo textiles", "Guaranteed dye-fastness"],
    tag: "PREMIUM INDIGO TEXTILES",
  },
  {
    id: "ecab_registered",
    icon: <ShieldCheckIcon size={18} />,
    tone: "var(--emerald)",
    title: "e-CAB Registered",
    desc: "Trusted e-commerce brand with official registration & COD nationwide.",
    points: ["Official e-commerce registration", "Cash on Delivery nationwide"],
    tag: "OFFICIAL E-COMMERCE",
  },
  {
    id: "flagship_stores",
    icon: <MapPinIcon size={18} />,
    tone: "var(--crimson)",
    title: "Flagship Stores",
    desc: "Visit our outlets for personal fittings and full collection previews.",
    points: ["Mirpur 12 (Dhaka)", "Wari (Dhaka) · Cumilla"],
    tag: "MIRPUR 12 · WARI · CUMILLA",
  },
];
