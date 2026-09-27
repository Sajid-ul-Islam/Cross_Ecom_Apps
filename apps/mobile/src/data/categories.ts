import { DeenCategory } from "../types";

export interface CategoryInfo {
  slug: string;
  name: DeenCategory | string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  badge?: string;
  craftNote: string;
  orientation?: "landscape" | "portrait" | "square";
  aspectRatio?: number;
  /** Static filter tags — always empty; real WooCommerce sub-category chips
   *  are fetched live via fetchSubCategories() in category/[slug].tsx. */
  filterTags: string[];
}

export const CATEGORY_DETAILS: Record<string, CategoryInfo> = {
  JEANS: {
    slug: "JEANS",
    name: "JEANS",
    title: "JEANS",
    subtitle: "Denim styles made for every day.",
    description:
      "Engineered for authentic fades and timeless durability. Featuring rope-dyed indigo warp and weft textures, custom copper rivets, and heavy tobacco stitch thread.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
    badge: "13.5 OZ DENIM",
    craftNote: "Sanforized denim with authentic texture and less than 2% shrinkage.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  PANJABI: {
    slug: "PANJABI",
    name: "PANJABI",
    title: "PANJABI",
    subtitle: "Tradition with modern elegance.",
    description:
      "A seamless fusion of cultural heritage and contemporary menswear. Tailored from breathable dobby cotton jacquard weaves with subtle indigo geometry.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp",
    badge: "EID & CELEBRATION",
    craftNote: "Pure cotton jacquard weave with self-textured indigo geometric motifs.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  SHIRT: {
    slug: "SHIRT",
    name: "SHIRT",
    title: "SHIRTS",
    subtitle: "Classic styles, made to stand out.",
    description:
      "Designed for effortless layering and all-day comfort. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Checkmate-Executive-Formal-Shirt-102-0501-005-Front.webp",
    badge: "100% COTTON",
    craftNote: "Pre-washed yarn-dyed cotton ensuring zero post-wash twisting.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    name: "T-SHIRT",
    title: "T-SHIRTS",
    subtitle: "Everyday comfort, effortless style.",
    description:
      "The quintessential foundation of modern streetwear. Crafted from ultra-dense 240 GSM organic cotton with double-ribbed collars that never sag.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Warm-Spice-T-shirt-105-0101-377-Front.webp",
    badge: "240 GSM ZERO-TORQUE",
    craftNote: "Pre-shrunk ring-spun cotton engineered for maximum drape and shape retention.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  POLO: {
    slug: "POLO",
    name: "POLO",
    title: "POLO SHIRTS",
    subtitle: "Honey-Comb Pique & Jacquard Knits with Mother of Pearl Accents",
    description:
      "Elevated casual wear crafted from heavyweight cotton pique. Finished with tipped flat-knit collars, mother-of-pearl buttons, and split side hems.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Polo-103-0200-053-Front.webp",
    badge: "HONEYCOMB PIQUE",
    craftNote: "Interlock combed cotton with natural stretch and moisture-wicking weave.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  TROUSERS: {
    slug: "TROUSERS",
    name: "TROUSERS",
    title: "TROUSERS",
    subtitle: "Smart fits, everyday comfort.",
    description:
      "Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Teal-Trousers-110-0101-015-Model-Front.webp",
    badge: "COTTON RIPSTOP",
    craftNote: "High-density military-spec weave with triple-stitched stress points.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  ACCESSORIES: {
    slug: "ACCESSORIES",
    name: "ACCESSORIES",
    title: "ACCESSORIES",
    subtitle: "Complete your everyday look.",
    description:
      "Artisanal leather accessories handcrafted by master leatherworkers in Old Dhaka. Solid brass hardware that patinas gracefully with age.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Wallet-109-0102-071-Side-view.webp",
    badge: "VEG-TAN LEATHER",
    craftNote: "100% full-grain vegetable tanned cowhide and solid brass buckle hardware.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  SALE: {
    slug: "SALE",
    name: "SALE",
    title: "SALE & OFFERS",
    subtitle: "Big savings, limited time.",
    description: "Special clearance pricing up to 50% off on authentic artisanal denim and seasonal apparel.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/09/End-Of-The-Season-Sale-Hero-Banner-DEEN.jpg",
    badge: "UP TO 50% OFF",
    craftNote: "Special clearance pricing with nationwide delivery.",
    orientation: "landscape",
    aspectRatio: 2.29,
    filterTags: [],
  },
  TRENDING: {
    slug: "TRENDING",
    name: "TRENDING",
    title: "TRENDING NOW",
    subtitle: "Everyone is exploring now.",
    description: "The most sought-after silhouettes and latest seasonal releases turning heads across Bangladesh.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/08/DEEN-Tropical-Cuban-Collar-Shirt-102-0302-005-Front.webp",
    badge: "HOT & TRENDING",
    craftNote: "Highest demand pieces updated daily.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  NEW_ARRIVALS: {
    slug: "NEW_ARRIVALS",
    name: "NEW_ARRIVALS",
    title: "NEW ARRIVALS",
    subtitle: "Just added to the collection.",
    description: "Freshly cut denim, newly released resort shirts, and handcrafted wardrobe essentials.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Burgundy-Floral-Casual-Half-Shirt-102-0301-001-Model-1.webp",
    badge: "JUST ADDED",
    craftNote: "First edition batches handcrafted in Bangladesh.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  DEEN_SELECT: {
    slug: "DEEN_SELECT",
    name: "ACCESSORIES" as DeenCategory,
    title: "⚡ DEEN SELECT",
    subtitle: "Curated international drops.",
    description:
      "A curated edit of internationally sourced menswear — now available exclusively through DEEN. Each piece is personally selected for fit, fabric, and wearability.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/09/Springfield-Polo-Shirt-103-0100-119.webp",
    badge: "CURATED DROP",
    craftNote: "Internationally sourced from premium menswear labels.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
  },
  DEEN_COLLECTION: {
    slug: "DEEN_COLLECTION",
    name: "ACCESSORIES" as DeenCategory,
    title: "💎 DEEN COLLECTION",
    subtitle: "Heritage Denim, Dobby Panjabis & 240 GSM Tees — Made in Bangladesh",
    description:
      "The full DEEN in-house collection — from rope-dyed indigo denim engineered for authentic fades, to heritage dobby panjabis and heavyweight 240 GSM tees. Crafted with local expertise and premium materials.",
    coverImage:
      "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
    badge: "IN-HOUSE CRAFT",
    craftNote: "100% in-house designed and crafted in Bangladesh with premium materials.",
    orientation: "portrait",
    aspectRatio: 0.8,
    filterTags: [],
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
        "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp",
      craftNote: "Artisanal craftsmanship made with premium cotton and heritage dye techniques.",
      filterTags: [],
    }
  );
};
