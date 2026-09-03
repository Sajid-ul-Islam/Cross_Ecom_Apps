/**
 * DEEN AI Commerce Shopping Assistant & RAG Engine
 * Combines brand knowledge retrieval with live WooCommerce catalog state.
 */

import { COMMERCE_KNOWLEDGE, KnowledgeItem } from "./knowledge.js";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiAssistantProductSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  image: string;
  sizes: string[];
  stockStatus: string;
}

export interface AiAssistantResponse {
  reply: string;
  intent: "product_recommendation" | "policy_qa" | "delivery_calc" | "store_locator" | "order_track" | "general";
  suggestedProducts?: AiAssistantProductSummary[];
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

/** Check if text is predominantly Bengali */
function isBengaliText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/** Extract max price budget from text (e.g. "under 3000", "৩০০০ টাকার মধ্যে", "< 2500") */
function extractBudget(text: string): number | null {
  // Convert Bengali numerals to Latin numerals
  const normalized = text.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const match = normalized.match(/(?:under|below|max|maximum|budget|মধ্যে|কম|পর্যন্ত)\s*(?:tk|bdt|৳)?\s*(\d{3,5})/i) ||
                normalized.match(/(\d{3,5})\s*(?:tk|bdt|টাকা|টাকার|bucks)?\s*(?:under|below|মধ্যে|কম)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 500 && val <= 50000) return val;
  }
  return null;
}

/** Match best knowledge base item */
function findBestKnowledge(query: string): KnowledgeItem | null {
  const lower = query.toLowerCase();
  let bestItem: KnowledgeItem | null = null;
  let maxMatches = 0;

  for (const item of COMMERCE_KNOWLEDGE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > maxMatches) {
      maxMatches = score;
      bestItem = item;
    }
  }

  return maxMatches >= 1 ? bestItem : null;
}

export async function processAiCommerceQuery(
  query: string,
  catalog: any[],
  history: AiChatMessage[] = []
): Promise<AiAssistantResponse> {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const isBn = isBengaliText(trimmed);
  const budget = extractBudget(trimmed);

  // 1. Order Tracking Intent
  if (/track|order|delivery status|পার্সেল|অর্ডার|ট্র্যাকিং|কোথায়/i.test(lower) && !/charge|cost|চার্জ|খরচ/i.test(lower)) {
    return {
      reply: isBn
        ? "আপনার অর্ডারের বর্তমান অবস্থা এবং লাইভ পাঠাও ট্র্যাকিং দেখতে নিচের বাটনে ট্যাপ করে 'My Orders' পেজে যান। আপনার ফোন নাম্বার দিয়ে লগইন থাকলে সব পার্সেলের রিয়েল-টাইম আপডেট দেখতে পাবেন।"
        : "To view real-time delivery status and live Pathao courier tracking for your order, head over to the 'My Orders' section. If you're signed in with your phone number, all live parcels are listed there.",
      intent: "order_track",
      suggestedActions: [
        { label: isBn ? "📦 আমার অর্ডার দেখুন" : "📦 View My Orders", action: "navigate_orders" },
        { label: isBn ? "📞 কাস্টমার কেয়ার" : "📞 Call Concierge", action: "contact_support" },
      ],
    };
  }

  // 2. Return / Exchange Intent (explicit priority)
  if (/return|exchange|swap|ফেরত|এক্সচেঞ্জ|রিটার্ন|বদল/i.test(lower)) {
    const returnKb = COMMERCE_KNOWLEDGE.find((k) => k.topic === "returns")!;
    return {
      reply: isBn ? returnKb.contentBn : returnKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "🔄 এক্সচেঞ্জ রিকোয়েস্ট" : "🔄 Initiate Exchange", action: "navigate_returns" },
        { label: isBn ? "🛍️ নতুন কালেকশন দেখুন" : "🛍️ Shop Catalog", action: "navigate_shop" },
      ],
    };
  }

  // 3. Store / Showroom Locations Intent
  if (/outlet|store|showroom|branch|আউটলেট|শোরুম|দোকান|মিরপুর|ওয়ারী|কুমিল্লা|সিলেট/i.test(lower) && !/pickup/i.test(lower)) {
    const outletKb = COMMERCE_KNOWLEDGE.find((k) => k.topic === "outlets")!;
    return {
      reply: isBn ? outletKb.contentBn : outletKb.contentEn,
      intent: "store_locator",
      suggestedActions: [
        { label: isBn ? "📍 শোরুম লোকেশন দেখুন" : "📍 View Showroom Locations", action: "open_outlets" },
        { label: isBn ? "💬 হোয়াটসঅ্যাপে যোগাযোগ" : "💬 WhatsApp Support", action: "open_whatsapp" },
      ],
    };
  }

  // 4. Delivery Cost & Timelines Intent
  if (/delivery|shipping|charge|cost|পাঠাও|কুরিয়ার|ডেলিভারি|চার্জ|খরচ|কত দিন/i.test(lower)) {
    const deliveryKb = COMMERCE_KNOWLEDGE.find((k) => k.topic === "delivery")!;
    const isInsideDhaka = /dhaka|ঢাকা|mirpur|dhanmondi|gulshan|banani|uttara/i.test(lower);
    const isOutsideDhaka = /chittagong|ctg|sylhet|rajshahi|khulna|cumilla|comilla|gazipur|নারায়ণগঞ্জ|চট্টগ্রাম|সিলেট|রংপুর|খুলনা/i.test(lower);

    let specificReply = isBn ? deliveryKb.contentBn : deliveryKb.contentEn;
    if (isInsideDhaka) {
      specificReply = isBn
        ? "ঢাকা সিটির মধ্যে ডেলিভারি চার্জ মাত্র ৳৫০ (২৪-৪৮ ঘণ্টার মধ্যে পাঠাও এক্সপ্রেস ডেলিভারি)। এছাড়া আমাদের ৪টি শোরুম থেকে স্টোর পিকআপ সম্পূর্ণ ফ্রি (৳০)।"
        : "Delivery inside Dhaka is only ৳50 with 24–48h Pathao Express dispatch. In-store pickup from any of our 4 showrooms is completely FREE (৳0).";
    } else if (isOutsideDhaka) {
      specificReply = isBn
        ? "ঢাকার বাইরে বাংলাদেশের যেকোনো জেলায় ডেলিভারি চার্জ মাত্র ৳৯০ (২-৪ কার্যদিবসের মধ্যে হোম ডেলিভারি)। ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে।"
        : "Delivery outside Dhaka across all 64 districts is only ৳90 (2–4 business days with doorstep delivery). Cash on Delivery (COD) is available.";
    }

    return {
      reply: specificReply,
      intent: "delivery_calc",
      suggestedActions: [
        { label: isBn ? "🛒 চেকআউটে যান" : "🛒 Go to Checkout", action: "navigate_checkout" },
      ],
    };
  }

  // 5. Sizing & Fit Guide Intent (without shopping keyword)
  const isSizeInquiry = /size|fit|waist|inches|সাইজ|ফিট|কোমর|মাপ|tight|loose/i.test(lower);
  const isShoppingIntent = /suggest|recommend|সাজেস্ট|দেখাও|খুঁজছি|কিনতে|কালেকশন|collection|buy|shop|চাই|দাও/i.test(lower) || budget !== null;

  if (isSizeInquiry && !isShoppingIntent) {
    const sizingKb = COMMERCE_KNOWLEDGE.find((k) => k.topic === "sizing")!;
    return {
      reply: isBn ? sizingKb.contentBn : sizingKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "📐 সাইজ চার্ট দেখুন" : "📐 View Size Chart", action: "open_size_guide" },
        { label: isBn ? "🛍️ জিন্স কালেকশন" : "🛍️ Shop Jeans", action: "navigate_shop" },
      ],
    };
  }

  // 6. Product Search & Catalog Recommendation Intent
  const isJeans = /jean|denim|জিন্স|ডেনিম|প্যান্ট|pant|trouser/i.test(lower);
  const isPanjabi = /panjabi|punjabi|পাঞ্জাবি/i.test(lower);
  const isShirt = /shirt|শার্ট|polo|পোলো/i.test(lower) && !/t-shirt|tee|টি-শার্ট/i.test(lower);
  const isTee = /t-shirt|tee|টি-শার্ট|গেঞ্জি/i.test(lower);

  let targetCategory: string | null = null;
  if (isJeans) targetCategory = "JEANS";
  else if (isPanjabi) targetCategory = "PANJABI";
  else if (isShirt) targetCategory = "SHIRT";
  else if (isTee) targetCategory = "T-SHIRT";

  // If category was mentioned or shopping intent detected:
  if (targetCategory || isShoppingIntent) {
    let filtered = catalog.filter((p) => p.stockStatus !== "outofstock");

    if (targetCategory) {
      const catMatches = filtered.filter((p) => (p.category || "").toUpperCase() === targetCategory);
      if (catMatches.length > 0) filtered = catMatches;
    }

    if (budget) {
      const budgetMatches = filtered.filter((p) => (p.salePrice ?? p.price) <= budget);
      if (budgetMatches.length > 0) filtered = budgetMatches;
    }

    // Color filter
    const isBlack = /black|কালো/i.test(lower);
    const isBlue = /blue|নীল|indigo|ইন্ডিগো/i.test(lower);
    const isWhite = /white|সাদা/i.test(lower);

    if (isBlack) {
      const blackMatches = filtered.filter((p) => /black|jet|nero|dark/i.test(p.name + " " + (p.description || "")));
      if (blackMatches.length > 0) filtered = blackMatches;
    } else if (isBlue) {
      const blueMatches = filtered.filter((p) => /blue|indigo|selvedge|denim|wash/i.test(p.name + " " + (p.description || "")));
      if (blueMatches.length > 0) filtered = blueMatches;
    } else if (isWhite) {
      const whiteMatches = filtered.filter((p) => /white|blanc/i.test(p.name + " " + (p.description || "")));
      if (whiteMatches.length > 0) filtered = whiteMatches;
    }

    if (filtered.length > 0) {
      const topPicks = filtered.slice(0, 3);
      const summaries: AiAssistantProductSummary[] = topPicks.map((p) => ({
        id: String(p.id),
        name: p.name,
        category: p.category,
        price: p.price,
        salePrice: p.salePrice,
        image: p.images?.[0] || p.thumb || "https://images.unsplash.com/photo-1542272604-780c96856592?w=800",
        sizes: p.sizes || [],
        stockStatus: p.stockStatus || "instock",
      }));

      let reply = "";
      if (isBn) {
        reply = `আপনার পছন্দের ভিত্তিতে শীর্ষ ${topPicks.length}টি প্রোডাক্ট সাজেস্ট করা হলো${budget ? ` (বাজেট ৳${budget}-এর মধ্যে)` : ""}:\n\n` +
          topPicks.map((p, i) => `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price} (সাইজ: ${p.sizes?.slice(0, 4).join(", ") || "স্ট্যান্ডার্ড"})\n   ${p.fabric ? `🧵 ${p.fabric}` : "✨ প্রিমিয়াম কোয়ালিটি"}`).join("\n\n") +
          `\n\nযেকোনো প্রোডাক্টে ট্যাপ করে বিস্তারিত দেখে সরাসরি ব্যাগে অ্যাড করতে পারেন। ৭ দিনের ডোরস্টেপ এক্সচেঞ্জ গ্যারান্টি রয়েছে!`;
      } else {
        reply = `Here are our top recommended picks based on your request${budget ? ` (under ৳${budget})` : ""}:\n\n` +
          topPicks.map((p, i) => `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price} (Sizes: ${p.sizes?.slice(0, 4).join(", ") || "Standard"})\n   ${p.fabric ? `🧵 ${p.fabric}` : "✨ Artisanal Finish"}`).join("\n\n") +
          `\n\nTap any product card below to view details and add directly to your bag. Backed by our 7-day doorstep exchange guarantee!`;
      }

      return {
        reply,
        intent: "product_recommendation",
        suggestedProducts: summaries,
        suggestedActions: [
          { label: isBn ? "🛒 শপ ক্যাটালগ দেখুন" : "🛒 Browse Full Shop", action: "navigate_shop" },
          { label: isBn ? "💬 স্টাইলিস্টের সাথে কথা বলুন" : "💬 WhatsApp Stylist", action: "open_whatsapp" },
        ],
      };
    }
  }

  // 7. Default General Brand Concierge Greeting
  return {
    reply: isBn
      ? "স্বাগতম DEEN AI শপিং অ্যাসিস্ট্যান্টে! আপনি যেকোনো প্রশ্ন করতে পারেন—যেমন:\n• 'আমার জন্য ৩০০০ টাকার মধ্যে একটা কালো জিন্স সাজেস্ট করো'\n• 'চট্টগ্রামে ডেলিভারি চার্জ কত এবং কত দিন লাগবে?'\n• 'সাইজ না মিললে কি এক্সচেঞ্জ করা যাবে?'\n• 'নিকটস্থ শোরুমগুলোর ঠিকানা দিন'\n\nআপনাকে কীভাবে সহযোগিতা করতে পারি?"
      : "Welcome to DEEN AI Shopping Concierge! You can ask me anything about our collections, sizing, or policies—for example:\n• 'Suggest selvedge jeans under ৳3000'\n• 'What is the delivery fee and timeframe for Chittagong?'\n• 'How does the 7-day doorstep size exchange work?'\n• 'Where are your retail showrooms in Dhaka?'\n\nHow may I assist your style journey today?",
    intent: "general",
    suggestedActions: [
      { label: isBn ? "👖 বেস্ট সেলার জিন্স" : "👖 Best Seller Jeans", action: "search_jeans" },
      { label: isBn ? "🚚 ডেলিভারি ও পলিসি" : "🚚 Shipping Policies", action: "search_delivery" },
      { label: isBn ? "📍 আউটলেট লোকেশন" : "📍 Store Locations", action: "open_outlets" },
    ],
  };
}
