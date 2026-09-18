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
  TRENDING: {
    slug: "TRENDING",
    title: "Trending Now",
    subtitle: "Everyone is exploring now.",
    description: "The most sought-after silhouettes and latest seasonal releases turning heads across Bangladesh.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Tropical-Cuban-Collar-Shirt-102-0302-005-Front.webp",
    metaBadge: "HOT & TRENDING",
    highlights: ["Highest Demand", "Seasonal Drops", "Limited Stock"],
  },
  NEW_ARRIVALS: {
    slug: "NEW_ARRIVALS",
    title: "New Arrival",
    subtitle: "Just added to the collection.",
    description: "Freshly cut denim, newly released resort shirts, and handcrafted wardrobe essentials.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Burgundy-Floral-Casual-Half-Shirt-102-0301-001-Model-1.webp",
    metaBadge: "JUST ADDED",
    highlights: ["Fresh Silhouettes", "Latest Cuts", "First Edition Batches"],
  },
  JEANS: {
    slug: "JEANS",
    title: "Jeans & Denim",
    subtitle: "Denim styles made for every day.",
    description:
      "Engineered with signature cross-hatch warp and weft textures, reinforced chain-stitched hems, custom oxidized copper rivets, and tailored ergonomic tapers.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    metaBadge: "13.5 OZ CROSS HATCH",
    highlights: ["12.5oz–14.5oz Cross Hatch Denim", "YKK Solid Brass Zippers", "Vintage & Raw Washed Fits"],
  },
  SHIRT: {
    slug: "SHIRT",
    title: "Shirts",
    subtitle: "Classic styles, made to stand out.",
    description:
      "Versatile shirting from boardroom presentations to weekend getaways. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    metaBadge: "100% COTTON",
    highlights: ["High-Count 80s & 100s 2-Ply Cotton", "Wrinkle-Resistant Weaves", "Mother-of-Pearl Buttons"],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    title: "T-Shirts",
    subtitle: "Everyday comfort, effortless style.",
    description:
      "Zero-shrink, drop-shoulder and classic tailored crew necks crafted from dense combed cotton with bound double-ribbed necklines.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    metaBadge: "240 GSM ZERO-TORQUE",
    highlights: ["220–240 GSM Heavy Cotton", "Pre-Shrunk Bio-Washed", "Durable Ribbed Collar"],
  },
  TROUSERS: {
    slug: "TROUSERS",
    title: "Trousers & Cargos",
    subtitle: "Smart fits, everyday comfort.",
    description:
      "Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Teal-Trousers-110-0101-015-Model-Front.webp",
    metaBadge: "COTTON RIPSTOP",
    highlights: ["High-Density Military Weave", "Articulated Knees", "Reinforced Stress Points"],
  },
  PANJABI: {
    slug: "PANJABI",
    title: "Panjabi",
    subtitle: "Tradition with modern elegance.",
    description:
      "Crafted for Friday prayers, weddings, and Eid celebrations. Tailored with modern minimalist plackets, mother-of-pearl buttons, and structured band collars.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    metaBadge: "HERITAGE DOBBY",
    highlights: ["100% Combed Cotton Dobby", "Artisanal Thread Embroidery", "Slim & Traditional Cuts"],
  },
  VALUE_PACKS: {
    slug: "VALUE_PACKS",
    title: "Value Packs",
    subtitle: "Buy More & Save More!",
    description:
      "Multi-buy bundles pairing heavyweight everyday essentials with integrated savings.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Orlando-Relaxed-Graphic-Tank-Top-105-0401-004-Front.webp",
    metaBadge: "MULTI-BUY SAVINGS",
    highlights: ["Bundled Discount", "Curated Packs", "Everyday Basics"],
  },
  SALE: {
    slug: "SALE",
    title: "Sale & Offers",
    subtitle: "Big savings, limited time.",
    description: "Special clearance pricing up to 50% off on authentic artisanal denim and seasonal apparel.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN-PPI.webp",
    metaBadge: "UP TO 50% OFF",
    highlights: ["Flat Discounts", "End of Season Clearance", "While Stocks Last"],
  },
  ACCESSORIES: {
    slug: "ACCESSORIES",
    title: "Accessories",
    subtitle: "Complete your everyday look.",
    description:
      "Artisanal leather accessories handcrafted by master leatherworkers in Old Dhaka. Solid brass hardware that patinas gracefully with age.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    metaBadge: "VEG-TAN LEATHER",
    highlights: ["Full-Grain Cowhide", "Solid Brass Buckles", "Handcrafted in Old Dhaka"],
  },
  DEEN_SELECT: {
    slug: "DEEN_SELECT",
    title: "DEEN Select",
    subtitle: "Curated international drops.",
    description:
      "Exclusive curated drops sourced directly from renowned international fashion houses (Springfield, Lefties, Pull & Bear) with modern cuts.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    metaBadge: "GLOBAL CURATED DROP",
    highlights: ["Authentic International Brands", "Springfield, Lefties & Pull & Bear", "Limited Drop Quantities"],
  },
  POLO: {
    slug: "POLO",
    title: "Knitted Indigo Polos",
    subtitle: "Honey-Comb Pique & Jacquard Knits with Mother of Pearl Accents",
    description:
      "Elevated casual wear crafted from heavyweight cotton pique. Finished with tipped flat-knit collars, mother-of-pearl buttons, and split side hems.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Polo-103-0200-053-Front.webp",
    metaBadge: "HONEYCOMB PIQUE",
    highlights: ["Pique Cotton", "Tipped Collar", "Mother of Pearl Buttons"],
  },
  DEEN_COLLECTION: {
    slug: "DEEN_COLLECTION",
    title: "DEEN Collection · In-House Craft",
    subtitle: "Heritage Denim, Dobby Panjabis & 240 GSM Tees — Made in Bangladesh",
    description:
      "The full DEEN in-house collection — from cross-hatch denim engineered for authentic fades, to heritage dobby panjabis and heavyweight 240 GSM tees. Crafted with local expertise and premium materials.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    metaBadge: "IN-HOUSE CRAFT",
    highlights: ["Cross-Hatch Denim", "Heritage Dobby Jacquard", "240 GSM Heavy Cotton"],
  },
  OTHERS: {
    slug: "OTHERS",
    title: "Others",
    subtitle: "More styles, more choices.",
    description: "Sweatshirts, polo shirts, and specialty seasonal drops to round out your wardrobe.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Sweat-Shirt-108-0101-007-Model-Front.webp",
    metaBadge: "SPECIAL EDITIONS",
    highlights: ["Sweatshirts", "Seasonal Knits", "Limited Editions"],
  },
};

export function getCategoryInfo(category: string, remoteCovers?: Record<string, string>): CategoryInfo {
  const normalized = category.toUpperCase().trim().replace(/[- ]/g, "_");
  const key =
    normalized === "TSHIRT" || normalized === "TEES" || normalized === "TEE"
      ? "T-SHIRT"
      : normalized === "SELECT" || normalized === "DEENSELECT"
      ? "DEEN_SELECT"
      : normalized === "COLLECTION" || normalized === "DEENCOLLECTION"
      ? "DEEN_COLLECTION"
      : normalized === "NEW" || normalized === "NEW_ARRIVAL" || normalized === "NEWARRIVALS"
      ? "NEW_ARRIVALS"
      : normalized === "TRENDING_NOW" || normalized === "TRENDINGNOW"
      ? "TRENDING"
      : normalized === "VALUE" || normalized === "VALUEPACKS" || normalized === "COMBO"
      ? "VALUE_PACKS"
      : normalized === "OFFERS" || normalized === "DISCOUNT"
      ? "SALE"
      : normalized;

  const base = CATEGORY_DETAILS[key] || {
    slug: category,
    title: `${category} Collection`,
    subtitle: "DEEN Artisanal Apparel",
    description: "Explore handcrafted premium fashion from DEEN Bangladesh.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
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
