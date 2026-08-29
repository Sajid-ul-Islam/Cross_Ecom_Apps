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
    title: "Artisanal Denim & Jeans",
    subtitle: "Selvedge & Stretch Denim Crafted with Precision",
    description:
      "Engineered from ring-spun Japanese & Turkish indigo fabrics with reinforced chain-stitched hems, custom oxidized rivets, and tailored ergonomic tapers.",
    coverImage: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80",
    metaBadge: "Signature Collection",
    highlights: ["12.5oz–14.5oz Raw & Washed Denim", "YKK Solid Brass Zippers", "Comfort Stretch & Raw Rigid Fits"],
  },
  PANJABI: {
    slug: "PANJABI",
    title: "Heritage Festive Panjabi",
    subtitle: "Luxurious Hand-Loom Cotton, Silk & Jacquard Weaves",
    description:
      "Crafted for Friday prayers, weddings, and Eid festivals. Tailored with modern minimalist plackets, mother-of-pearl buttons, and structured band collars.",
    coverImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
    metaBadge: "Festive & Classic",
    highlights: ["100% Egyptian Giza & Organic Cotton", "Artisanal Thread Embroidery", "Slim & Traditional Relaxed Cuts"],
  },
  SHIRT: {
    slug: "SHIRT",
    title: "Tailored Oxford & Casual Shirts",
    subtitle: "Breathable Linens, Indigo Chambrays & Formal Twills",
    description:
      "Versatile shirting from boardroom presentations to weekend getaways. Featuring french seams, collar stays, and curved hem cuts.",
    coverImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    metaBadge: "Modern Tailoring",
    highlights: ["High-Count 80s & 100s 2-Ply Cotton", "Wrinkle-Resistant Weaves", "Mother-of-Pearl Buttons"],
  },
  POLO: {
    slug: "POLO",
    title: "Piqué & Mercerized Polos",
    subtitle: "Subtle Luxury for Effortless Everyday Elegance",
    description:
      "Heavyweight cotton piqué knitted with micro-vent side seams and ribbed anti-curl collars. Designed to retain sharp structure through countless washes.",
    coverImage: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80",
    metaBadge: "Elevated Casual",
    highlights: ["100% Combed Compact Cotton", "Mercerized Anti-Pilling Finish", "Laser-Etched Minimalist Branding"],
  },
  COMBO: {
    slug: "COMBO",
    title: "Curated Style Combos",
    subtitle: "Complete Looks with Integrated Multi-Buy Savings",
    description:
      "Stylist-curated wardrobe bundles pairing premium selvedge jeans with matching oxford shirts and accessories at exclusive package discounts.",
    coverImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
    metaBadge: "Best Value Packs",
    highlights: ["Bundled Discount Tier", "Pre-Matched Palette Pairings", "Gift Ready Packaging"],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    title: "Heavyweight Core T-Shirts",
    subtitle: "220+ GSM Combed Cotton Everyday Essentials",
    description:
      "Zero-shrink, drop-shoulder and classic tailored crew necks crafted from dense combed cotton with bound ribbed necklines.",
    coverImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
    metaBadge: "Core Essentials",
    highlights: ["220–240 GSM Heavy Cotton", "Pre-Shrunk Bio-Washed", "Durable Ribbed Collar"],
  },
};

export function getCategoryInfo(category: string): CategoryInfo {
  const normalized = category.toUpperCase().trim();
  return (
    CATEGORY_DETAILS[normalized] || {
      slug: normalized,
      title: `${category} Collection`,
      subtitle: "DEEN Artisanal Apparel",
      description: "Explore handcrafted premium fashion from DEEN Bangladesh.",
      coverImage: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80",
      metaBadge: "Apparel",
      highlights: ["Premium Fabrics", "Fast Nationwide Delivery", "100% Authenticity Guarantee"],
    }
  );
}
