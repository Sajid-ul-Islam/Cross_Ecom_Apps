"use client";

import React from "react";

export interface CategoryCareGuide {
  title: string;
  subtitle: string;
  badge: string;
  philosophyTitle: string;
  philosophyText: string;
  gradient: string;
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
}

export const CATEGORY_CARE_GUIDES: Record<string, CategoryCareGuide> = {
  JEANS: {
    title: "RAW DENIM CARE & FADING GUIDE",
    subtitle: "Artisanal Japanese Selvedge Handbook",
    badge: "RAW SELVEDGE PHILOSOPHY",
    philosophyTitle: "A Canvas That Evolves With Your Life",
    philosophyText:
      "Unlike pre-distressed mass market jeans, DEEN 13.5 oz raw selvedge denim is unwashed and untreated. Every crease, whisker, and fade will form uniquely to your body.",
    gradient: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
    steps: [
      {
        number: 1,
        title: "THE FIRST COLD SOAK",
        description:
          "Fill a tub with cold or lukewarm water. Turn your selvedge jeans inside out and submerge for 30–45 minutes with a pinch of sea salt to set the deep indigo dye. Hang dry outdoors in shade. Never machine dry.",
      },
      {
        number: 2,
        title: "BREAK-IN & HIGH CONTRAST FADING",
        description:
          "Wear your raw denim continuously for the first 3 to 6 months before your first deep wash. Daily friction wears off the surface indigo, creating sharp contrast honeycombs behind your knees and authentic lap whiskers.",
      },
      {
        number: 3,
        title: "WASHING & PRESERVATION",
        description:
          "When washing is required, use mild detergent or wool wash in cold water (≤ 30°C). Avoid bleach or fabric softeners. Always hang dry upside down by the cuffs to preserve the custom roping effect on the chain-stitched hem.",
      },
    ],
  },
  PANJABI: {
    title: "HERITAGE PANJABI CARE GUIDE",
    subtitle: "Embroidery, Jacquard & Silk-Cotton Handbook",
    badge: "FESTIVE APPAREL CARE",
    philosophyTitle: "Preserving Artisanal Weaves & Embroidery",
    philosophyText:
      "DEEN Panjabis are crafted from 100% Egyptian Giza cotton, breathable dobby jacquards, and detailed artisanal thread embroidery. Gentle care keeps the plackets sharp and fabric lustrous for years.",
    gradient: "linear-gradient(135deg, #064E3B 0%, #047857 100%)",
    steps: [
      {
        number: 1,
        title: "GENTLE HAND WASH ONLY",
        description:
          "Submerge in cold water with mild liquid detergent for 10–15 minutes. Gently agitate with hands. Avoid rigorous scrubbing across embroidered panels or mother-of-pearl buttons.",
      },
      {
        number: 2,
        title: "TOWEL ROLL & SHADE DRYING",
        description:
          "Do not wring or twist. Roll in a clean, dry towel to absorb excess moisture, then hang flat on a padded hanger in shade to prevent color fading and collar creasing.",
      },
      {
        number: 3,
        title: "REVERSE STEAM IRONING",
        description:
          "Always iron on the reverse side of embroidery using medium steam heat. Place a pressing cloth over delicate threadwork to preserve the 3D relief of the artisanal motifs.",
      },
    ],
  },
  SHIRT: {
    title: "ARTISANAL SHIRT & LINEN CARE GUIDE",
    subtitle: "Camp Collar, Poplin & Oxford Handbook",
    badge: "PREMIUM SHIRTING CARE",
    philosophyTitle: "Crisp Structure & Breathable Drape",
    philosophyText:
      "From breathable Cuban camp collars to structured executive stripes, DEEN shirts are engineered with reinforced side gussets and high-count cotton poplin for enduring drape.",
    gradient: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
    steps: [
      {
        number: 1,
        title: "COLD GENTLE MACHINE CYCLE",
        description:
          "Unbutton all buttons before washing (including cuffs and collar). Machine wash in cold water (≤ 30°C) with similar colors on a gentle spin cycle.",
      },
      {
        number: 2,
        title: "RESHAPE WHILE DAMP",
        description:
          "Remove promptly from the wash. Reshape the camp collar points, front placket, and shoulder seams while damp, then hang dry immediately on a contoured hanger.",
      },
      {
        number: 3,
        title: "MEDIUM HEAT IRONING",
        description:
          "Iron while the fabric is slightly damp for an effortless crisp finish. Start with collar points, cuffs, sleeves, and finish with the main body.",
      },
    ],
  },
  "T-SHIRT": {
    title: "240 GSM HEAVYWEIGHT TEE CARE GUIDE",
    subtitle: "Zero-Torque Combed Cotton Handbook",
    badge: "HEAVY COTTON LONGEVITY",
    philosophyTitle: "Zero-Torque Boxy Structure",
    philosophyText:
      "Crafted from 220–240 GSM pre-shrunk combed compact cotton. High-density knit prevents seam twisting (torque) and maintains a boxy structured silhouette wash after wash.",
    gradient: "linear-gradient(135deg, #451A03 0%, #78350F 100%)",
    steps: [
      {
        number: 1,
        title: "INSIDE-OUT COLD WASH",
        description:
          "Turn tee inside out before washing to protect graphic screen prints and surface texture. Wash with cold water using mild, color-safe detergent.",
      },
      {
        number: 2,
        title: "FLAT OR HANGER DRY",
        description:
          "Avoid high-heat tumble dryers which degrade cotton fibers. Hang dry or dry flat. Never stretch the bound ribbed neckline while wet.",
      },
      {
        number: 3,
        title: "LOW-HEAT REVERSE IRON",
        description:
          "If ironing is desired, iron inside out on low-to-medium heat. Never place a hot iron directly onto rubberized or high-density puff chest prints.",
      },
    ],
  },
  POLO: {
    title: "KNITTED PIQUÉ & POLO CARE GUIDE",
    subtitle: "Honeycomb Knit & Anti-Curl Collar Handbook",
    badge: "COMPACT KNIT CARE",
    philosophyTitle: "Retaining Anti-Curl Collar Contour",
    philosophyText:
      "Knitted from combed compact cotton with tipped flat-knit collars. Engineered to retain sharp shape and micro-vent side seams without pilling.",
    gradient: "linear-gradient(135deg, #14532D 0%, #15803D 100%)",
    steps: [
      {
        number: 1,
        title: "BUTTON THE PLACKET",
        description:
          "Fasten all placket buttons and flip the ribbed collar up before placing into a cold gentle wash. This prevents the collar from stretching or catching.",
      },
      {
        number: 2,
        title: "COLLAR SHAPING WHILE DAMP",
        description:
          "Fold collar back down into its natural fold line while damp. Smooth out the tips flat and line dry in shade away from direct sun.",
      },
      {
        number: 3,
        title: "STEAM REFRESH",
        description:
          "Use a garment steamer or low-heat iron over the piqué body. Avoid heavy pressure on the textured honeycomb knit.",
      },
    ],
  },
  TROUSERS: {
    title: "UTILITY CHINO & TROUSERS CARE GUIDE",
    subtitle: "Ripstop Durability & High-Density Twill Handbook",
    badge: "ENDURANCE TAILORING",
    philosophyTitle: "Preserving High-Density Twill & Articulated Seams",
    philosophyText:
      "Built for daily urban mobility with stretch cotton twills and articulated knee pleats. Proper care maintains color depth and reinforced seam integrity.",
    gradient: "linear-gradient(135deg, #1C1917 0%, #292524 100%)",
    steps: [
      {
        number: 1,
        title: "EMPTY POCKETS & FASTEN ZIPPER",
        description:
          "Zip up fly zippers and secure utility flap buttons. Wash inside out in cold water to minimize surface friction and maintain twill color depth.",
      },
      {
        number: 2,
        title: "HANG BY HEM CUFFS",
        description:
          "Hang trousers upside down by the leg cuffs using clamp hangers. Gravity naturally pulls out travel creases while drying.",
      },
      {
        number: 3,
        title: "LINE-CREASE IRONING",
        description:
          "Iron on medium heat along the natural leg crease for a sharp tailored profile. Spot clean cargo utility pockets as needed.",
      },
    ],
  },
};

export function getCareGuideForCategory(category?: string): CategoryCareGuide {
  if (!category) return CATEGORY_CARE_GUIDES.JEANS;
  const cat = category.toUpperCase();
  if (cat.includes("JEAN") || cat.includes("DENIM")) return CATEGORY_CARE_GUIDES.JEANS;
  if (cat.includes("PANJABI") || cat.includes("PUNJABI")) return CATEGORY_CARE_GUIDES.PANJABI;
  if (cat.includes("SHIRT") && !cat.includes("T-SHIRT")) return CATEGORY_CARE_GUIDES.SHIRT;
  if (cat.includes("T-SHIRT") || cat.includes("TEE") || cat.includes("TANK")) return CATEGORY_CARE_GUIDES["T-SHIRT"];
  if (cat.includes("POLO")) return CATEGORY_CARE_GUIDES.POLO;
  if (cat.includes("TROUSER") || cat.includes("PANT") || cat.includes("CHINO")) return CATEGORY_CARE_GUIDES.TROUSERS;
  return CATEGORY_CARE_GUIDES.JEANS;
}

interface DenimCareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  productName?: string;
}

export default function DenimCareGuideModal({
  isOpen,
  onClose,
  category = "JEANS",
  productName,
}: DenimCareGuideModalProps) {
  if (!isOpen) return null;

  const guide = getCareGuideForCategory(category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              📖 {guide.title}
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              {productName ? `${productName} · ` : ""}{guide.subtitle}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Philosophy Banner */}
          <div style={{ background: guide.gradient, color: "#fff", padding: 18, borderRadius: "var(--radius)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 4 }}>
              {guide.badge}
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginTop: 8, marginBottom: 4 }}>
              {guide.philosophyTitle}
            </h3>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              {guide.philosophyText}
            </p>
          </div>

          {/* Steps */}
          {guide.steps.map((step) => (
            <div
              key={step.number}
              style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ background: "var(--indigo)", color: "#fff", width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                  {step.number}
                </span>
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>{step.title}</strong>
              </div>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, paddingLeft: 34 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
