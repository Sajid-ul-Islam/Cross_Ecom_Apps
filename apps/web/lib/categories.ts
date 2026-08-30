export interface CategoryInfo {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  metaBadge: string;
  highlights: string[];
}

export const CATEGORY_DETAILS: Record<string, CategoryInfo> = {
  JEANS: {
    slug: "JEANS",
    title: "Artisanal Selvedge Denim & Jeans",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo",
    description:
      "Engineered from ring-spun Japanese & Turkish indigo fabrics with reinforced chain-stitched hems, custom oxidized copper rivets, and tailored ergonomic tapers.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/05/jeans-1.jpg",
    metaBadge: "13.5 OZ SELVEDGE",
    highlights: ["12.5oz–14.5oz Raw & Washed Denim", "YKK Solid Brass Zippers", "Comfort Stretch & Raw Rigid Fits"],
  },
  PANJABI: {
    slug: "PANJABI",
    title: "Heritage Dobby & Festive Panjabi",
    subtitle: "Luxurious Hand-Loom Cotton, Silk & Jacquard Weaves",
    description:
      "Crafted for Friday prayers, weddings, and Eid festivals. Tailored with modern minimalist plackets, mother-of-pearl buttons, and structured band collars.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/05/Section-Image-4.jpg",
    metaBadge: "EID & FESTIVE",
    highlights: ["100% Egyptian Giza & Organic Cotton", "Artisanal Thread Embroidery", "Slim & Traditional Relaxed Cuts"],
  },
  SHIRT: {
    slug: "SHIRT",
    title: "Artisanal Casual & Oxford Shirts",
    subtitle: "Breathable Linens, Indigo Chambrays & Formal Twills",
    description:
      "Versatile shirting from boardroom presentations to weekend getaways. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/06/Half-sleeve-Section-iomage.webp",
    metaBadge: "100% COTTON",
    highlights: ["High-Count 80s & 100s 2-Ply Cotton", "Wrinkle-Resistant Weaves", "Mother-of-Pearl Buttons"],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    title: "Heavyweight 240 GSM Core T-Shirts",
    subtitle: "Zero-Torque Combed Cotton with Structured Boxy Drapes",
    description:
      "Zero-shrink, drop-shoulder and classic tailored crew necks crafted from dense combed cotton with bound double-ribbed necklines.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/1x1-2.png",
    metaBadge: "240 GSM ZERO-TORQUE",
    highlights: ["220–240 GSM Heavy Cotton", "Pre-Shrunk Bio-Washed", "Durable Ribbed Collar"],
  },
  POLO: {
    slug: "POLO",
    title: "Knitted Indigo & Honeycomb Polos",
    subtitle: "Piqué & Jacquard Knits with Mother of Pearl Accents",
    description:
      "Heavyweight cotton piqué knitted with micro-vent side seams and tipped flat-knit anti-curl collars. Designed to retain sharp structure through countless washes.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/Desktop-Hero-Banner.jpg",
    metaBadge: "HONEYCOMB PIQUE",
    highlights: ["100% Combed Compact Cotton", "Mercerized Anti-Pilling Finish", "Laser-Etched Minimalist Branding"],
  },
  TROUSERS: {
    slug: "TROUSERS",
    title: "Utility & Chino Trousers",
    subtitle: "Articulated Knee Pleats, Heavy Ripstop & High-Density Twills",
    description:
      "Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg",
    metaBadge: "COTTON RIPSTOP",
    highlights: ["High-Density Military Weave", "Articulated Knees", "Reinforced Stress Points"],
  },
  COMBO: {
    slug: "COMBO",
    title: "Curated Style Combos",
    subtitle: "Complete Looks with Integrated Multi-Buy Savings",
    description:
      "Stylist-curated wardrobe bundles pairing premium selvedge jeans with matching oxford shirts and accessories at exclusive package discounts.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg",
    metaBadge: "Best Value Packs",
    highlights: ["Bundled Discount Tier", "Pre-Matched Palette Pairings", "Gift Ready Packaging"],
  },
};

export function getCategoryInfo(category: string, remoteCovers?: Record<string, string>): CategoryInfo {
  const normalized = category.toUpperCase().trim().replace(/-/g, "_");
  const key =
    normalized === "TSHIRT" || normalized === "TEES" || normalized === "TEE"
      ? "T-SHIRT"
      : normalized;

  const base = CATEGORY_DETAILS[key] || {
    slug: category,
    title: `${category} Collection`,
    subtitle: "DEEN Artisanal Apparel",
    description: "Explore handcrafted premium fashion from DEEN Bangladesh.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg",
    metaBadge: "Apparel",
    highlights: ["Premium Fabrics", "Fast Nationwide Delivery", "100% Authenticity Guarantee"],
  };

  if (remoteCovers && remoteCovers[category]) {
    return { ...base, coverImage: remoteCovers[category] };
  }
  if (remoteCovers && remoteCovers[key]) {
    return { ...base, coverImage: remoteCovers[key] };
  }

  return base;
}
