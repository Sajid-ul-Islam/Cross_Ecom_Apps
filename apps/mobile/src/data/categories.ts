import { DeenCategory } from "../types";

export interface CategoryInfo {
  slug: string;
  name: DeenCategory;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  badge?: string;
  craftNote: string;
  filterTags: string[];
}

export const CATEGORY_DETAILS: Record<string, CategoryInfo> = {
  JEANS: {
    slug: "JEANS",
    name: "JEANS",
    title: "CROSS HATCH DENIM & JEANS",
    subtitle: "Denim styles made for every day.",
    description:
      "Engineered for authentic fades and timeless durability. Featuring signature cross-hatch warp and weft textures, custom copper rivets, and heavy tobacco stitch thread.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    badge: "13.5 OZ CROSS HATCH",
    craftNote: "Sanforized cross-hatch denim with authentic texture and less than 2% shrinkage.",
    filterTags: ["All", "Cross Hatch", "Slim Tapered", "Regular Fit", "Whisker Wash"],
  },
  PANJABI: {
    slug: "PANJABI",
    name: "PANJABI",
    title: "HERITAGE DOBBY PANJABIS",
    subtitle: "Tradition with modern elegance.",
    description:
      "A seamless fusion of cultural heritage and contemporary menswear. Tailored from breathable dobby cotton jacquard weaves with subtle indigo geometry.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    badge: "EID & CELEBRATION",
    craftNote: "Pure cotton jacquard weave with self-textured indigo geometric motifs.",
    filterTags: ["All", "Dobby Weave", "Semi-Slim", "Mandarin Collar", "Casual Classic"],
  },
  SHIRT: {
    slug: "SHIRT",
    name: "SHIRT",
    title: "ARTISANAL CASUAL SHIRTS",
    subtitle: "Classic styles, made to stand out.",
    description:
      "Designed for effortless layering and all-day comfort. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp",
    badge: "100% COTTON",
    craftNote: "Pre-washed yarn-dyed cotton ensuring zero post-wash twisting.",
    filterTags: ["All", "Oxford", "Twill", "Button Down", "Mandarin Collar"],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    name: "T-SHIRT",
    title: "HEAVYWEIGHT 240 GSM TEES",
    subtitle: "Everyday comfort, effortless style.",
    description:
      "The quintessential foundation of modern streetwear. Crafted from ultra-dense 240 GSM organic cotton with double-ribbed collars that never sag.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp",
    badge: "240 GSM ZERO-TORQUE",
    craftNote: "Pre-shrunk ring-spun cotton engineered for maximum drape and shape retention.",
    filterTags: ["All", "Heavyweight", "Relaxed Fit", "Graphic Drops", "Plain Classics"],
  },
  POLO: {
    slug: "POLO",
    name: "POLO",
    title: "KNITTED INDIGO POLOS",
    subtitle: "Honey-Comb Pique & Jacquard Knits with Mother of Pearl Accents",
    description:
      "Elevated casual wear crafted from heavyweight cotton pique. Finished with tipped flat-knit collars, mother-of-pearl buttons, and split side hems.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    badge: "HONEYCOMB PIQUE",
    craftNote: "Interlock combed cotton with natural stretch and moisture-wicking weave.",
    filterTags: ["All", "Pique Cotton", "Tipped Collar", "Slim Fit", "Classic Navy"],
  },
  TROUSERS: {
    slug: "TROUSERS",
    name: "TROUSERS",
    title: "UTILITY & CHINO TROUSERS",
    subtitle: "Smart fits, everyday comfort.",
    description:
      "Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Teal-Trousers-110-0101-015-Model-Front.webp",
    badge: "COTTON RIPSTOP",
    craftNote: "High-density military-spec weave with triple-stitched stress points.",
    filterTags: ["All", "Utility Cargo", "Chino", "Ergonomic Taper", "Drawstring"],
  },
  ACCESSORIES: {
    slug: "ACCESSORIES",
    name: "ACCESSORIES",
    title: "LEATHER GOODS & ACCESSORIES",
    subtitle: "Complete your everyday look.",
    description:
      "Artisanal leather accessories handcrafted by master leatherworkers in Old Dhaka. Solid brass hardware that patinas gracefully with age.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp",
    badge: "VEG-TAN LEATHER",
    craftNote: "100% full-grain vegetable tanned cowhide and solid brass buckle hardware.",
    filterTags: ["All", "Belts", "Wallets", "Caps", "Bags"],
  },
  DEEN_SELECT: {
    slug: "DEEN_SELECT",
    name: "ACCESSORIES" as DeenCategory,
    title: "⚡ DEEN SELECT · CURATED DROPS",
    subtitle: "Curated international drops.",
    description:
      "A curated edit of internationally sourced menswear labels — Springfield, Lefties, Pull & Bear — now available exclusively through DEEN. Each piece is personally selected for fit, fabric, and wearability.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp",
    badge: "CURATED DROP",
    craftNote: "Internationally sourced from premium European fast-fashion labels.",
    filterTags: ["All", "Springfield", "Lefties", "Pull & Bear", "Shirts", "Cargo"],
  },
  DEEN_COLLECTION: {
    slug: "DEEN_COLLECTION",
    name: "ACCESSORIES" as DeenCategory,
    title: "💎 DEEN COLLECTION · IN-HOUSE CRAFT",
    subtitle: "Heritage Denim, Dobby Panjabis & 240 GSM Tees — Made in Bangladesh",
    description:
      "The full DEEN in-house collection — from cross-hatch denim engineered for authentic fades, to heritage dobby panjabis and heavyweight 240 GSM tees. Crafted with local expertise and premium materials.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp",
    badge: "IN-HOUSE CRAFT",
    craftNote: "100% in-house designed and crafted in Bangladesh with premium materials.",
    filterTags: ["All", "Jeans", "Panjabi", "Shirt", "T-Shirt", "Polo", "Trousers"],
  },
};

export const getCategoryInfo = (cat: string): CategoryInfo => {
  const upper = (cat || "").toUpperCase().replace(/-/g, "_");
  if (upper === "TSHIRT" || upper === "TEES" || upper === "TEE") {
    return CATEGORY_DETAILS["T-SHIRT"];
  }
  if (upper === "SELECT") return CATEGORY_DETAILS["DEEN_SELECT"];
  if (upper === "COLLECTION") return CATEGORY_DETAILS["DEEN_COLLECTION"];
  return (
    CATEGORY_DETAILS[upper] || {
      slug: cat,
      name: cat as DeenCategory,
      title: `${cat.toUpperCase()} COLLECTION`,
      subtitle: "Handcrafted Men's Apparel Crafted in Bangladesh",
      description: "Discover our artisanal collection crafted with premium materials and ethical tailoring.",
      coverImage:
        "https://images.unsplash.com/photo-1542272604-780c96856592?w=1200",
      craftNote: "Artisanal craftsmanship made with premium cotton and heritage dye techniques.",
      filterTags: ["All", "New Arrivals", "Best Sellers", "Sale"],
    }
  );
};
