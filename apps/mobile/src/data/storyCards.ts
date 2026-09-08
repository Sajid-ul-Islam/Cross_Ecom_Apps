import type { ComponentType } from "react";
import { Award, ShieldCheck, MapPin } from "../components/Icons";

export type StoryIcon = ComponentType<{ size: number; color: string }>;

export interface StoryChip {
  emoji: string;
  title: string;
  sub: string;
}

export interface StoryCardCta {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** A single horizontal story/trust card — add new cards here, not in markup. */
export interface StoryCardData {
  id: string;
  /** Accent used for icon/dot/badge coloring. Defaults to indigo. */
  tone?: "indigo" | "emerald" | "crimson";
  /** Pill badge in the card header (e.g. HERITAGE & CRAFT). */
  badge?: { icon?: StoryIcon; text: string };
  /** Circular icon chip in the card header (used when no badge text). */
  icon?: StoryIcon;
  /** Small caps text pinned to the top-right (e.g. EST. DHAKA 2020). */
  rightTag?: string;
  title: string;
  description: string;
  /** Optional 2-column mini chips grid (craft details). */
  chips?: StoryChip[];
  /** Optional bullet facts rendered under a hairline divider. */
  points?: string[];
  /** Small caps tag pinned to the card bottom. */
  footerTag?: string;
  /** Optional full-width call-to-action button. */
  cta?: StoryCardCta;
}

/** Authenticity / trust cards — shared verbatim by the Home rail and the About flow. */
export const TRUST_STORY_CARDS: StoryCardData[] = [
  {
    id: "authentic_quality",
    tone: "indigo",
    icon: Award,
    rightTag: "EST. DHAKA 2020",
    title: "Authentic Quality",
    description: "Pre-shrunk premium indigo textiles with guaranteed dye-fastness.",
    points: ["Premium indigo textiles", "Guaranteed dye-fastness"],
    footerTag: "PREMIUM INDIGO TEXTILES",
  },
  {
    id: "ecab_registered",
    tone: "emerald",
    icon: ShieldCheck,
    rightTag: "EST. DHAKA 2020",
    title: "e-CAB Registered",
    description: "Trusted e-commerce brand with official registration & COD nationwide.",
    points: ["Official e-commerce registration", "Cash on Delivery nationwide"],
    footerTag: "OFFICIAL E-COMMERCE",
  },
  {
    id: "flagship_stores",
    tone: "crimson",
    icon: MapPin,
    rightTag: "EST. DHAKA 2020",
    title: "Flagship Stores",
    description: "Visit our outlets for personal fittings and full collection previews.",
    points: ["Mirpur 12 (Dhaka)", "Wari (Dhaka) · Cumilla"],
    footerTag: "MIRPUR 12 · WARI · CUMILLA",
  },
];

/** Home rail = Heritage & Craft narrative card (keeps its craft chips + About CTA) + the trust cards. */
export const HOME_STORY_CARDS: StoryCardData[] = [
  {
    id: "heritage_and_craft",
    tone: "indigo",
    badge: { icon: Award, text: "HERITAGE & CRAFT" },
    rightTag: "EST. DHAKA 2020",
    title: "Slow Craftsmanship. Pure Indigo Selvedge.",
    description:
      "DEEN revives the tactile weight of shuttle-loom selvedge denim in Bangladesh — woven on vintage shuttle looms with deep rope-dyed yarn that fades uniquely with every journey you take.",
    chips: [
      { emoji: "🧵", title: "Red-Line Selvedge", sub: "13.5oz vintage shuttle loom" },
      { emoji: "✂️", title: "Dhaka Central Studio", sub: "In-house artisan master tailors" },
      { emoji: "🏬", title: "4 Retail Showrooms", sub: "Mirpur 12, Wari & Cumilla" },
      { emoji: "🔄", title: "Doorstep Exchange", sub: "7-day hassle-free size swaps" },
    ],
    cta: {
      label: "DISCOVER OUR STORY & SHOWROOMS",
      accessibilityLabel: "Read full DEEN heritage story and store locations",
    },
  },
  ...TRUST_STORY_CARDS,
];
