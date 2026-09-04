import { API_URL } from "./api";

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  category: string;
  image: string;
}

export interface SocialStory {
  id: string;
  title: string;
  image: string;
  hasUnseen: boolean;
  actionUrl: string;
}

export interface SocialReel {
  id: string;
  title: string;
  author: string;
  platform: "instagram" | "facebook";
  poster: string;
  videoUrl?: string;
  caption: string;
  likes: number;
  views: string;
  comments: number;
  permalink: string;
  taggedProduct?: TaggedProduct;
}

export interface SocialOfficialAccounts {
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  handle: string;
  communityCount: string;
}

export interface SocialFeedResponse {
  officialAccounts: SocialOfficialAccounts;
  stories: SocialStory[];
  reels: SocialReel[];
}

export const OFFICIAL_BRAND_SOCIALS: SocialOfficialAccounts = {
  facebook: "https://www.facebook.com/deencommerce",
  instagram: "https://www.instagram.com/deencommerce/?hl=en",
  linkedin: "https://www.linkedin.com/company/deencommerce",
  whatsapp: "https://wa.me/8801952700500",
  handle: "@deencommerce",
  communityCount: "125,000+ Patrons Across Bangladesh",
};

export const FALLBACK_REELS: SocialReel[] = [
  {
    id: "reel_selvedge_autumn",
    title: "Unboxing the 13.5oz Autumn Raw Selvedge",
    author: "@deencommerce",
    platform: "instagram",
    poster: "https://deencommerce.com/wp-content/uploads/2026/08/Section-image.jpg",
    caption:
      "Every fold speaks dedication. 100% shuttle-loom woven raw selvedge with signature red-line ID. Engineered to fade with your daily journey. 👖✨ #DeenDenim #RawSelvedge #MadeInBangladesh",
    likes: 1842,
    views: "24.5K",
    comments: 96,
    permalink: "https://www.instagram.com/deencommerce/?hl=en",
    taggedProduct: {
      id: "101",
      name: "13.5oz Signature Raw Selvedge Denim",
      price: 2850,
      regularPrice: 3200,
      category: "JEANS",
      image: "https://deencommerce.com/wp-content/uploads/2025/11/Jeans.webp",
    },
  },
  {
    id: "reel_panjabi_heritage",
    title: "Artisanal Dobby Cotton Panjabi",
    author: "@deencommerce",
    platform: "facebook",
    poster: "https://deencommerce.com/wp-content/uploads/2026/06/Panjabi-Section-Image.webp",
    caption:
      "Refined minimalism for Friday prayer and festive evenings. Hand-finished mandarin collar in pure breathable dobby cotton. 🌙 #DeenHeritage #Panjabi #PureCotton",
    likes: 2430,
    views: "38.2K",
    comments: 142,
    permalink: "https://www.facebook.com/deencommerce",
    taggedProduct: {
      id: "102",
      name: "Indigo Dobby Heritage Kurta",
      price: 2150,
      regularPrice: 2450,
      category: "PANJABI",
      image: "https://deencommerce.com/wp-content/uploads/2026/02/Category.jpg",
    },
  },
  {
    id: "reel_oxford_shirt",
    title: "Classic Oxford Weave - Work to Weekend",
    author: "@deencommerce",
    platform: "instagram",
    poster: "https://deencommerce.com/wp-content/uploads/2026/06/Shirt-Section-Image.png",
    caption:
      "Heavyweight pin-point Oxford weave. Mother-of-pearl buttons and tailored relaxed fit for Dhaka's climate. 👔 #DeenTailoring #OxfordShirt",
    likes: 1290,
    views: "19.4K",
    comments: 68,
    permalink: "https://www.instagram.com/deencommerce/?hl=en",
    taggedProduct: {
      id: "103",
      name: "Premium Tailored Oxford Shirt",
      price: 1750,
      regularPrice: 1950,
      category: "SHIRT",
      image: "https://deencommerce.com/wp-content/uploads/2026/04/Category.webp",
    },
  },
  {
    id: "reel_summer_half_sleeve",
    title: "Breathable Heavyweight 240 GSM Tees",
    author: "@deencommerce",
    platform: "instagram",
    poster: "https://deencommerce.com/wp-content/uploads/2026/06/Half-sleeve-Section-iomage.webp",
    caption:
      "Structured drop-shoulder silhouette in 100% combed compact cotton. Minimalist essential for daily wear. ⚡ #DeenStudio #DailyApparel",
    likes: 1520,
    views: "22.1K",
    comments: 74,
    permalink: "https://www.instagram.com/deencommerce/?hl=en",
    taggedProduct: {
      id: "104",
      name: "240 GSM Heavyweight Drop-Shoulder Tee",
      price: 850,
      regularPrice: 990,
      category: "T-SHIRT",
      image: "https://deencommerce.com/wp-content/uploads/2026/06/Half-sleeve-Section-iomage.webp",
    },
  },
];

export const FALLBACK_STORIES: SocialStory[] = [
  {
    id: "story_1",
    title: "Raw Selvedge",
    image: "https://deencommerce.com/wp-content/uploads/2025/11/Jeans.webp",
    hasUnseen: true,
    actionUrl: "/shop?category=JEANS",
  },
  {
    id: "story_2",
    title: "Heritage Panjabi",
    image: "https://deencommerce.com/wp-content/uploads/2026/02/Category.jpg",
    hasUnseen: true,
    actionUrl: "/shop?category=PANJABI",
  },
  {
    id: "story_3",
    title: "Oxford Shirts",
    image: "https://deencommerce.com/wp-content/uploads/2026/04/Category.webp",
    hasUnseen: false,
    actionUrl: "/shop?category=SHIRT",
  },
  {
    id: "story_4",
    title: "Dhaka Studio",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/Mobile-Hero-Banner.jpg",
    hasUnseen: false,
    actionUrl: "/shop",
  },
];

export async function fetchSocialFeed(): Promise<SocialFeedResponse> {
  try {
    const res = await fetch(`${API_URL}/v1/deen/social/feed`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SocialFeedResponse = await res.json();
    return data;
  } catch {
    return {
      officialAccounts: OFFICIAL_BRAND_SOCIALS,
      stories: FALLBACK_STORIES,
      reels: FALLBACK_REELS,
    };
  }
}
