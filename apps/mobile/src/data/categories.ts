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
    title: "SELVEDGE DENIM & JEANS",
    subtitle: "Woven on Vintage Shuttle Looms with Deep Rope-Dyed Indigo",
    description:
      "Engineered for authentic fades and timeless durability. Featuring signature redline selvedge edges, custom copper rivets, and heavy tobacco stitch thread.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
    badge: "13.5 OZ SELVEDGE",
    craftNote: "Sanforized Japanese-grade denim with less than 2% shrinkage.",
    filterTags: ["All", "Raw Selvedge", "Slim Tapered", "Regular Fit", "Whisker Wash"],
  },
  PANJABI: {
    slug: "PANJABI",
    name: "PANJABI",
    title: "HERITAGE DOBBY PANJABIS",
    subtitle: "Festive Geometric Textures with Antique Metallic Buttons",
    description:
      "A seamless fusion of cultural heritage and contemporary menswear. Tailored from breathable dobby cotton jacquard weaves with subtle indigo geometry.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/611a91e5-6b58-450f-9fa8-e4b2a3449339/_result.png",
    badge: "EID & FESTIVE",
    craftNote: "Pure cotton jacquard weave with self-textured indigo geometric motifs.",
    filterTags: ["All", "Dobby Weave", "Semi-Slim", "Mandarin Collar", "Casual Classic"],
  },
  SHIRT: {
    slug: "SHIRT",
    name: "SHIRT",
    title: "ARTISANAL CASUAL SHIRTS",
    subtitle: "Indigo Oxford & Handcrafted Twill Button-Downs",
    description:
      "Designed for effortless layering and all-day comfort. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/9163013b-3136-40e1-bbcb-b1b7470fcf14/_result.png",
    badge: "100% COTTON",
    craftNote: "Pre-washed yarn-dyed cotton ensuring zero post-wash twisting.",
    filterTags: ["All", "Oxford", "Twill", "Button Down", "Mandarin Collar"],
  },
  "T-SHIRT": {
    slug: "T-SHIRT",
    name: "T-SHIRT",
    title: "HEAVYWEIGHT 240 GSM TEES",
    subtitle: "Zero-Torque Combed Cotton with Structured Boxy Drapes",
    description:
      "The quintessential foundation of modern streetwear. Crafted from ultra-dense 240 GSM organic cotton with double-ribbed collars that never sag.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/8eeef08a-df99-4d69-be53-6ec2fb1eeafc/_result.png",
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
      "https://image.qwenlm.ai/generated-images/179ae4ca-9540-424f-9e79-58b29df92a54/_result.png",
    badge: "HONEYCOMB PIQUE",
    craftNote: "Interlock combed cotton with natural stretch and moisture-wicking weave.",
    filterTags: ["All", "Pique Cotton", "Tipped Collar", "Slim Fit", "Classic Navy"],
  },
  TROUSERS: {
    slug: "TROUSERS",
    name: "TROUSERS",
    title: "UTILITY & CHINO TROUSERS",
    subtitle: "Articulated Knee Pleats, Heavy Ripstop & High-Density Twills",
    description:
      "Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/1aa1bb4f-b649-43a3-a75d-357ff8a38ec2/_result.png",
    badge: "COTTON RIPSTOP",
    craftNote: "High-density military-spec weave with triple-stitched stress points.",
    filterTags: ["All", "Utility Cargo", "Chino", "Ergonomic Taper", "Drawstring"],
  },
  ACCESSORIES: {
    slug: "ACCESSORIES",
    name: "ACCESSORIES",
    title: "LEATHER GOODS & ACCESSORIES",
    subtitle: "Full-Grain Veg-Tan Belts, Selvedge Wallets & Tote Bags",
    description:
      "Artisanal leather accessories handcrafted by master leatherworkers in Old Dhaka. Solid brass hardware that patinas gracefully with age.",
    coverImage:
      "https://image.qwenlm.ai/generated-images/179ae4ca-9540-424f-9e79-58b29df92a54/_result.png",
    badge: "VEG-TAN LEATHER",
    craftNote: "100% full-grain vegetable tanned cowhide and solid brass buckle hardware.",
    filterTags: ["All", "Belts", "Wallets", "Caps", "Bags"],
  },
};

export const getCategoryInfo = (cat: string): CategoryInfo => {
  const upper = (cat || "").toUpperCase().replace(/-/g, "_");
  if (upper === "TSHIRT" || upper === "TEES" || upper === "TEE") {
    return CATEGORY_DETAILS["T-SHIRT"];
  }
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
