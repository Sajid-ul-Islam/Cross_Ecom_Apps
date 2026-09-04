/**
 * DEEN AI Commerce Shopping Assistant & RAG Engine
 * Combines brand knowledge retrieval with live WooCommerce catalog state,
 * real-time order tracking with Pathao logistics, multi-attribute product search,
 * and dynamic campaign offer awareness.
 */

import { COMMERCE_KNOWLEDGE, KnowledgeItem } from "./knowledge.js";
import { callGemini, buildCatalogSummary, toGeminiHistory } from "./gemini.js";
import { config } from "../config.js";

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
  intent:
    | "product_recommendation"
    | "policy_qa"
    | "delivery_calc"
    | "store_locator"
    | "order_track"
    | "general";
  suggestedProducts?: AiAssistantProductSummary[];
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

export interface AiCommerceOptions {
  phone?: string;
  orders?: any[];
  orderLookup?: (query: {
    orderNumber?: string;
    consignmentId?: string;
    phone?: string;
  }) => Promise<{ order?: any; orders?: any[] } | any | null>;
  activeCampaigns?: {
    cashbackEnabled?: boolean;
    saleEnabled?: boolean;
    saleTitle?: string;
    bankOffers?: any[];
  };
}

/** Check if text is predominantly Bengali */
export function isBengaliText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/** Convert Bengali numerals (০-৯) to Latin digits (0-9) */
export function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
}

/** Extract max price budget from text (e.g. "under 3000", "৩০০০ টাকার মধ্যে", "< 2500") */
export function extractBudget(text: string): number | null {
  const normalized = normalizeDigits(text);
  const match =
    normalized.match(/(?:under|below|max|maximum|budget|মধ্যে|কম|পর্যন্ত)\s*(?:tk|bdt|৳)?\s*(\d{3,5})/i) ||
    normalized.match(/(\d{3,5})\s*(?:tk|bdt|টাকা|টাকার|bucks)?\s*(?:under|below|মধ্যে|কম)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 500 && val <= 50000) return val;
  }
  return null;
}

/** Extract requested size (e.g. "size 32", "34 waist", "সাইজ ৩৬", "XL") */
export function extractRequestedSize(text: string): string | null {
  const normalized = normalizeDigits(text);

  // Numeric waist size: 28, 30, 32, 34, 36, 38
  const waistMatch =
    normalized.match(/(?:size|সাইজ|কোমর|মাপ|waist)\s*[:=]?\s*(2[89]|3[0-8]|4[02])\b/i) ||
    normalized.match(/\b(28|30|32|34|36|38)\s*(?:size|সাইজ|ইঞ্চি|inch|"| waist| কোমর)\b/i);
  if (waistMatch) {
    return waistMatch[1];
  }

  // Alpha chest size: S, M, L, XL, XXL, XXXL
  const alphaMatch =
    normalized.match(/(?:size|সাইজ|মাপ)\s*[:=]?\s*(XXL|XXXL|XL|[SML])\b/i) ||
    normalized.match(/\b(XXL|XXXL|XL|[SML])\s*(?:size|সাইজ)\b/i);
  if (alphaMatch) {
    return alphaMatch[1].toUpperCase();
  }

  return null;
}

/** Extract order number (e.g. "#1041", "order 1041", "অর্ডার 1041", "d-1725...") */
export function extractOrderNumber(text: string): string | null {
  const normalized = normalizeDigits(text);

  // Explicit hash prefix: #1041 or #1024
  const hashMatch = normalized.match(/#(\d{3,7})\b/);
  if (hashMatch) return hashMatch[1];

  // Order keyword prefix
  const keywordMatch = normalized.match(
    /(?:order|অর্ডার|parcel|পার্সেল|track|ট্র্যাক|status|অবস্থা|নং|no\.?|id)\s*[:#-]?\s*(\d{3,7})\b/i
  );
  if (keywordMatch) return keywordMatch[1];

  // Gateway internal ID: d-1725...
  const dMatch = normalized.match(/\b(d-\d{8,15})\b/i);
  if (dMatch) return dMatch[1];

  // If query is strictly a 4 to 6 digit number
  const singleNumMatch = normalized.trim().match(/^(\d{4,6})$/);
  if (singleNumMatch) return singleNumMatch[1];

  return null;
}

/** Extract Pathao consignment ID (e.g. "DD220826MDKMP9") */
export function extractConsignmentId(text: string): string | null {
  const match = text.match(/\b([A-Z]{2}\d{6,}[A-Z0-9]+)\b/i) || text.match(/\b(PTC-[A-Z0-9]+)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/** Extract 11-digit Bangladeshi mobile number (e.g. "01712345678") */
export function extractBangladeshiPhone(text: string): string | null {
  const normalized = normalizeDigits(text).replace(/[^0-9]/g, "");
  let digits = normalized;
  if (digits.startsWith("880") && digits.length === 13) {
    digits = digits.slice(2);
  }
  const match = digits.match(/(01[3-9]\d{8})/);
  return match ? match[1] : null;
}

/** Match best knowledge base item with weighted scoring */
export function findBestKnowledge(query: string): KnowledgeItem | null {
  const lower = query.toLowerCase();
  let bestItem: KnowledgeItem | null = null;
  let maxScore = 0;

  for (const item of COMMERCE_KNOWLEDGE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length > 4 ? 2 : 1;
      }
    }
    if (lower.includes(item.title.toLowerCase())) {
      score += 4;
    }
    if (score > maxScore) {
      maxScore = score;
      bestItem = item;
    }
  }

  return maxScore >= 2 ? bestItem : null;
}

/** Format order status for human-friendly customer display */
function formatOrderStatus(status: string, isBn: boolean): string {
  const s = (status || "").toLowerCase();
  if (s === "processing") {
    return isBn ? "প্রসেসিং হচ্ছে (প্যাকিং সম্পন্ন)" : "Processing (Packed & Ready)";
  }
  if (s === "shipped" || s === "in_transit" || s === "in-transit") {
    return isBn ? "ডেলিভারির পথে (ইন ট্রানজিট)" : "In Transit (Out for Delivery)";
  }
  if (s === "delivered" || s === "completed") {
    return isBn ? "ডেলিভারি সম্পন্ন" : "Delivered Successfully";
  }
  if (s === "received" || s === "on-hold") {
    return isBn ? "অর্ডার গৃহীত হয়েছে" : "Order Placed & Confirmed";
  }
  if (s === "cancelled" || s === "failed") {
    return isBn ? "অর্ডার বাতিল" : "Cancelled";
  }
  return isBn ? "প্রক্রিয়াধীন" : status.toUpperCase();
}

export async function processAiCommerceQuery(
  query: string,
  catalog: any[],
  history: AiChatMessage[] = [],
  options?: AiCommerceOptions
): Promise<AiAssistantResponse> {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const isBn = isBengaliText(trimmed);
  const budget = extractBudget(trimmed);
  const requestedSize = extractRequestedSize(trimmed);

  const extractedOrderNum = extractOrderNumber(trimmed);
  const extractedConsignment = extractConsignmentId(trimmed);
  const extractedPhone = extractBangladeshiPhone(trimmed);
  const effectivePhone = extractedPhone || options?.phone;

  // Conversation memory: merge last 4 history messages for follow-up context
  const historyContext = history.slice(-4).map((h) => h.content).join(" ");
  const extendedLower = (historyContext + " " + lower).toLowerCase();
  const historyBudget = budget === null ? extractBudget(historyContext) : budget;
  const historySize = requestedSize || extractRequestedSize(historyContext);

  // ------------------------------------------------------------------
  // 1. Real-Time Order Tracking & Logistics Query
  // ------------------------------------------------------------------
  const isOrderQuery =
    extractedOrderNum !== null ||
    extractedConsignment !== null ||
    (/track|order|delivery status|পার্সেল|অর্ডার|ট্র্যাকিং|কোথায়|খবর কি|অবস্থা|কবে পাব/i.test(lower) &&
      !/charge|cost|fee|চার্জ|খরচ|কত টাকা/i.test(lower));

  if (isOrderQuery) {
    let matchedOrder: any = null;
    let orderListForPhone: any[] = [];

    // Attempt real-time lookup via provided orderLookup callback or orders array
    if (options?.orderLookup) {
      try {
        const lookupRes = await options.orderLookup({
          orderNumber: extractedOrderNum || undefined,
          consignmentId: extractedConsignment || undefined,
          phone: effectivePhone || undefined,
        });
        if (lookupRes) {
          if (Array.isArray(lookupRes)) {
            orderListForPhone = lookupRes;
            matchedOrder = lookupRes[0];
          } else if (lookupRes.order) {
            matchedOrder = lookupRes.order;
            orderListForPhone = lookupRes.orders || [lookupRes.order];
          } else {
            matchedOrder = lookupRes;
          }
        }
      } catch (e) {
        console.warn("[ai-agent] Order lookup warning:", (e as Error).message);
      }
    }

    // In-memory fallback if orderLookup wasn't provided or didn't return
    if (!matchedOrder && options?.orders && Array.isArray(options.orders)) {
      if (extractedOrderNum) {
        const cleanNum = extractedOrderNum.toLowerCase();
        matchedOrder = options.orders.find(
          (o) =>
            (o.number && String(o.number).toLowerCase() === cleanNum) ||
            (o.id && String(o.id).toLowerCase() === cleanNum) ||
            (o.wooId && String(o.wooId) === cleanNum) ||
            (o.wooNumber && String(o.wooNumber) === cleanNum)
        );
      } else if (extractedConsignment) {
        const cleanCons = extractedConsignment.toLowerCase();
        matchedOrder = options.orders.find(
          (o) => o.pathaoConsignmentId && String(o.pathaoConsignmentId).toLowerCase() === cleanCons
        );
      } else if (effectivePhone) {
        const digits = effectivePhone.replace(/[^0-9]/g, "");
        const userOrders = options.orders.filter((o) => o.phone === digits);
        if (userOrders.length > 0) {
          orderListForPhone = [...userOrders].sort((a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
          );
          matchedOrder = orderListForPhone[0];
        }
      }
    }

    // 1A. Matched Order Found in Real-Time
    if (matchedOrder) {
      const orderNum = matchedOrder.number || matchedOrder.wooNumber || matchedOrder.id || "—";
      const statusText = formatOrderStatus(matchedOrder.status, isBn);
      const totalAmount = matchedOrder.total ? `৳${matchedOrder.total}` : "—";
      const cityDistrict = matchedOrder.city || matchedOrder.state || matchedOrder.district || "বাংলাদেশ";
      const consignmentId = matchedOrder.pathaoConsignmentId || null;
      const trackingUrl =
        matchedOrder.pathaoTrackingUrl ||
        (consignmentId ? `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}` : null);
      const trackingStatus =
        matchedOrder.pathaoTrackingInfo?.order_status ||
        matchedOrder.pathaoTrackingInfo?.current_status ||
        null;

      let reply = "";
      if (isBn) {
        reply =
          `📦 **অর্ডার #${orderNum} এর রিয়েল-টাইম আপডেট:**\n\n` +
          `• **স্ট্যাটাস:** ${statusText}\n` +
          `• **মোট মূল্য:** ${totalAmount} (${matchedOrder.paymentTitle || "ক্যাশ অন ডেলিভারি"})\n` +
          `• **ডেলিভারি এলাকা:** ${cityDistrict}\n` +
          (consignmentId
            ? `• **পাঠাও কনসাইনমেন্ট আইডি:** \`${consignmentId}\`\n` +
              (trackingStatus ? `• **কুরিয়ার লাইভ ট্র্যাকিং:** ${trackingStatus}\n` : "") +
              `• **লাইভ ট্র্যাকিং লিংক:** ${trackingUrl}\n\n` +
              `আপনার পার্সেলটি পাঠাও কুরিয়ারের মাধ্যমে ডেলিভারির প্রক্রিয়ায় রয়েছে। নিচের বাটনে ট্যাপ করে যেকোনো সময় সরাসরি লাইভ কুরিয়ার লোকেশন দেখতে পারেন!`
            : `\n✨ আপনার পার্সেলটি আমাদের মিরপুর সেন্ট্রাল স্টুডিও থেকে পাঠাও কুরিয়ারে হস্তান্তরের প্রস্তুতি চলছে। কুরিয়ারে হ্যান্ডওভার হওয়ার সাথে সাথে এসএমএস ও কনসাইনমেন্ট ট্র্যাকিং লিংক পেয়ে যাবেন।`);
      } else {
        reply =
          `📦 **Real-Time Status for Order #${orderNum}:**\n\n` +
          `• **Status:** ${statusText}\n` +
          `• **Total:** ${totalAmount} (${matchedOrder.paymentTitle || "Cash on Delivery"})\n` +
          `• **Destination:** ${cityDistrict}\n` +
          (consignmentId
            ? `• **Pathao Consignment ID:** \`${consignmentId}\`\n` +
              (trackingStatus ? `• **Courier Movement:** ${trackingStatus}\n` : "") +
              `• **Live Tracking:** ${trackingUrl}\n\n` +
              `Your order is in transit with Pathao Courier. Tap the tracking button below to view real-time rider coordinates!`
            : `\n✨ Your parcel is currently being prepared for dispatch at our Mirpur Central Studio. You will receive live Pathao consignment tracking as soon as it is picked up.`);
      }

      const actions: Array<{ label: string; action: string; payload?: any }> = [];
      if (trackingUrl) {
        actions.push({
          label: isBn ? "🚚 লাইভ পাঠাও ট্র্যাকিং" : "🚚 Live Pathao Tracking",
          action: "open_url",
          payload: { url: trackingUrl },
        });
      }
      actions.push({
        label: isBn ? "📦 আমার অর্ডার হিস্ট্রি" : "📦 View Full Orders",
        action: "navigate_orders",
      });
      actions.push({
        label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp",
        action: "open_whatsapp",
      });
      actions.push({
        label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger",
        action: "open_messenger",
      });

      return {
        reply,
        intent: "order_track",
        suggestedActions: actions,
      };
    }

    // 1B. Order Number Specified but NOT Found
    if (extractedOrderNum) {
      return {
        reply: isBn
          ? `দুঃখিত, আমাদের সিস্টেমে **অর্ডার #${extractedOrderNum}** খুঁজে পাওয়া যায়নি।\n\nঅনুগ্রহ করে অর্ডার নম্বরটি সঠিক কিনা যাচাই করুন, অথবা আপনার ১১-ডিজিটের মোবাইল নম্বর (যেমন: 017XXXXXXXX) লিখে মেসেজ পাঠান। এছাড়া আমাদের হোয়াটসঅ্যাপ হেল্পলাইনে (01952-700500) দ্রুত সহায়তা পেতে পারেন।`
          : `We could not locate **Order #${extractedOrderNum}** in our active database.\n\nPlease verify that your order number is correct, or reply with your 11-digit mobile number (e.g. 017XXXXXXXX). You can also reach our customer concierge on WhatsApp at 01952-700500 for immediate lookup.`,
        intent: "order_track",
        suggestedActions: [
          { label: isBn ? "📦 আমার অর্ডার দেখুন" : "📦 My Orders", action: "navigate_orders" },
          { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" }, { label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger", action: "open_messenger" },
        ],
      };
    }

    // 1C. Phone Number Provided but No Orders Found
    if (effectivePhone && extractedPhone) {
      return {
        reply: isBn
          ? `মোবাইল নম্বর **${effectivePhone}** দিয়ে কোনো সাম্প্রতিক অর্ডার রেকর্ড খুঁজে পাওয়া যায়নি। আপনি কি অন্য কোনো নম্বর দিয়ে অর্ডার করেছিলেন? অনুগ্রহ করে আপনার সঠিক অর্ডার নম্বরটি উল্লেখ করুন।`
          : `No active orders were found for mobile number **${effectivePhone}**. If you checked out with a different phone number or guest session, please provide your exact Order # (e.g. #1041).`,
        intent: "order_track",
        suggestedActions: [
          { label: isBn ? "📦 অর্ডার পেজে যান" : "📦 Go to Orders", action: "navigate_orders" },
          { label: isBn ? "📞 কাস্টমার কেয়ার" : "📞 Call Concierge", action: "contact_support" },
        ],
      };
    }

    // 1D. Generic Order Inquiry without ID or Phone
    return {
      reply: isBn
        ? "আপনার অর্ডারের রিয়েল-টাইম স্ট্যাটাস ও পাঠাও কুরিয়ার ট্র্যাকিং জানতে অনুগ্রহ করে আপনার **অর্ডার নম্বর** (যেমন: `#১০৪১`) অথবা **১১-ডিজিটের ফোন নম্বর** লিখে জানান। অথবা নিচের বাটনে ট্যাপ করে সরাসরি 'My Orders' পেজে যেতে পারেন।"
        : "To check the live status and Pathao tracking for your parcel, please reply with your **Order #** (e.g. `#1041`) or your **11-digit phone number**. You can also tap below to open your orders directly.",
      intent: "order_track",
      suggestedActions: [
        { label: isBn ? "📦 আমার অর্ডার দেখুন" : "📦 View My Orders", action: "navigate_orders" },
        { label: isBn ? "📞 কাস্টমার কেয়ার" : "📞 Call Concierge", action: "contact_support" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 2A. New Products & Latest Arrivals Intent
  // ------------------------------------------------------------------
  if (/new product|new arrival|new drop|latest drop|latest product|recent drop|new collection|latest collection|what's new|what is the new|নতুন প্রোডাক্ট|নতুন কি|নতুন কালেকশন|নতুন আইটেম|নতুন ড্রপ|নতুন কালেকশন/i.test(lower)) {
    const inStock = catalog.filter((p) => p.stockStatus !== "outofstock");
    const topNew = inStock.slice(0, 4);

    const reply = isBn
      ? `DEEN-এর লেটেস্ট ও নতুন কালেকশন থেকে সেরা ${topNew.length}টি প্রোডাক্ট নিচে উপস্থাপন করা হলো। প্রতিটি আইটেম প্রিমিয়াম ফেব্রিক এবং নিখুঁত ফিনিশিংয়ে তৈরি:\n\n` +
        topNew.map((p, i) => `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price}${p.salePrice ? ` ~~(মূল্য: ৳${p.price})~~` : ""}\n   • ক্যাটাগরি: ${p.category || "Menswear"}\n   • ফেব্রিক: ${p.fabric || "Premium Finish"}`).join("\n\n") +
        `\n\nআপনি সাইজ সিলেক্ট করে সরাসরি ব্যাগে যোগ করতে পারেন। ৭ দিনের ফ্রি ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা রয়েছে!`
      : `Here are the latest new arrivals and fresh seasonal drops from DEEN Commerce:\n\n` +
        topNew.map((p, i) => `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price}${p.salePrice ? ` ~~(Regular: ৳${p.price})~~` : ""}\n   • Category: ${p.category || "Menswear"}\n   • Fabric: ${p.fabric || "Artisanal Finish"}`).join("\n\n") +
        `\n\nTap any product card below to view details, select your size, and add to bag!`;

    return {
      reply,
      intent: "product_recommendation",
      suggestedProducts: topNew,
      suggestedActions: [
        { label: isBn ? "🛍️ সম্পূর্ণ কালেকশন দেখুন" : "🛍️ Browse All New Drops", action: "navigate_shop" },
        { label: isBn ? "🔥 বর্তমান অফার দেখুন" : "🔥 View Active Offers", action: "search_delivery" },
        { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 2B. Dynamic Campaigns, Offers, Cashback & Bank Card Savings
  // ------------------------------------------------------------------
  if (/offer|campaign|cashback|discount|coupon|promo|bank offer|current offer|deals|sale|অফার|ক্যাম্পেইন|ক্যাশব্যাক|ডিসকাউন্ট|কুপন|প্রোমো|ছাড়|ডিল/i.test(lower)) {
    const saleItems = catalog
      .filter((p) => p.stockStatus !== "outofstock" && p.salePrice && p.salePrice < p.price)
      .slice(0, 4);

    const reply = isBn
      ? `DEEN-এ বর্তমানে চলমান স্পেশাল অফার ও ডিসকাউন্টসমূহ:\n\n` +
        `🔥 **ফ্ল্যাট আপ টু ৫০% ছাড়**: সিলেক্টেড সেলভেজ জিন্স ও প্রিমিয়াম শার্টে ৪০%-৫০% পর্যন্ত মূল্যছাড় চলছে।\n` +
        `💸 **ইনস্ট্যান্ট ক্যাশব্যাক**: ৳২৫০০+ অর্ডারে ৳৫০০ এবং ৳৩০০০+ অর্ডারে ৳৭০০ ইনস্ট্যান্ট ক্যাশব্যাক চেকআউটে স্বয়ংক্রিয়ভাবে প্রযোজ্য।\n` +
        `🚚 **ডেলিভারি অফার**: ঢাকা মেট্রোয় মাত্র ৳৫০ এবং ঢাকার বাইরে ৳৯০। যেকোনো শোরুম থেকে সেলফ-পিকআপ সম্পূর্ণ ফ্রি (৳০)।\n` +
        `💳 **০% ইএমআই ও ব্যাংক ছাড়**: সিলেক্টেড ক্রেডিট কার্ডে ৩, ৬ ও ১২ মাসের ০% ইএমআই সুবিধা।\n\n` +
        (saleItems.length > 0 ? `নিচে বর্তমান অফারের সেরা কয়েকটি প্রোডাক্ট দেওয়া হলো:` : `চেকআউটে ডিসকাউন্ট স্বয়ংক্রিয়ভাবে যুক্ত হয়ে যাবে!`)
      : `Here are the active campaigns, offers, and discounts currently live at DEEN Commerce:\n\n` +
        `🔥 **Flat Up to 50% Off**: Season Clearance discount on selected selvedge denim & artisanal shirts.\n` +
        `💸 **Instant Tiered Cashback**: Get ৳500 instant cashback on orders ৳2500+, and ৳700 cashback on orders ৳3000+ (applied automatically at checkout).\n` +
        `🚚 **Affordable Delivery**: ৳50 inside Dhaka Metro, ৳90 across all 64 districts nationwide. Showroom pickup is 100% FREE.\n` +
        `💳 **0% EMI & Bank Discounts**: 3, 6, and 12-month 0% EMI available on major credit cards via SSLCommerz.\n\n` +
        (saleItems.length > 0 ? `Check out these featured deal items from our live catalog below:` : `All discounts apply automatically at checkout!`);

    return {
      reply,
      intent: "policy_qa",
      suggestedProducts: saleItems.length > 0 ? saleItems : undefined,
      suggestedActions: [
        { label: isBn ? "🛍️ অফার কালেকশন দেখুন" : "🛍️ Shop Deal Items", action: "navigate_shop" },
        { label: isBn ? "💳 ব্যাংক অফার দেখুন" : "💳 Bank Card Offers", action: "open_bank_offers" },
        { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 3. Return / 7-Day Doorstep Exchange Policy
  // ------------------------------------------------------------------
  if (/return|exchange|swap|doorstep|ফেরত|এক্সচেঞ্জ|রিটার্ন|বদল|সাইজ পরিবর্তন|সাইজ না মিললে/i.test(lower)) {
    const returnKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_return_exchange")!;
    return {
      reply: isBn ? returnKb.contentBn : returnKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "🔄 এক্সচেঞ্জ রিকোয়েস্ট" : "🔄 Initiate Exchange", action: "navigate_returns" },
        { label: isBn ? "🛍️ নতুন কালেকশন দেখুন" : "🛍️ Shop Catalog", action: "navigate_shop" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 4. Retail Flagship Showrooms & Store Locator
  // ------------------------------------------------------------------
  if (/outlet|store|showroom|branch|আউটলেট|শোরুম|দোকান|মিরপুর|ওয়ারী|কুমিল্লা|সিলেট/i.test(lower) && !/pickup/i.test(lower)) {
    const outletKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_outlets")!;
    return {
      reply: isBn ? outletKb.contentBn : outletKb.contentEn,
      intent: "store_locator",
      suggestedActions: [
        { label: isBn ? "📍 শোরুম লোকেশন দেখুন" : "📍 View Showroom Locations", action: "open_outlets" },
        { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" }, { label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger", action: "open_messenger" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 5. 64-District Delivery Cost & Timelines Intent
  // ------------------------------------------------------------------
  if (/delivery|shipping|charge|cost|পাঠাও|কুরিয়ার|ডেলিভারি|চার্জ|খরচ|কত দিন|ফি/i.test(lower)) {
    const deliveryKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_delivery_policy")!;
    const isInsideDhaka = /dhaka|ঢাকা|mirpur|dhanmondi|gulshan|banani|uttara|wari|motijheel/i.test(lower);
    const isOutsideDhaka = /chittagong|ctg|sylhet|rajshahi|khulna|cumilla|comilla|gazipur|নারায়ণগঞ্জ|চট্টগ্রাম|সিলেট|রংপুর|খুলনা|বরিশাল|বগুড়া|ময়মনসিংহ/i.test(lower);

    let specificReply = isBn ? deliveryKb.contentBn : deliveryKb.contentEn;
    if (isInsideDhaka) {
      specificReply = isBn
        ? "ঢাকা সিটির মধ্যে ডেলিভারি চার্জ মাত্র ৳৫০ (২৪-৪৮ ঘণ্টার মধ্যে পাঠাও এক্সপ্রেস হোম ডেলিভারি)। এছাড়া আমাদের ৪টি ফ্ল্যাগশিপ শোরুম থেকে পিকআপ সম্পূর্ণ ফ্রি (৳০)। ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।"
        : "Delivery inside Dhaka is only ৳50 via 24–48h Pathao Express home delivery. Showroom pickup from any of our 4 retail studios is 100% FREE (৳0). Cash on Delivery is available.";
    } else if (isOutsideDhaka) {
      specificReply = isBn
        ? "ঢাকার বাইরে বাংলাদেশের যেকোনো জেলায় ডেলিভারি চার্জ মাত্র ৳৯০ (২-৪ কার্যদিবসের মধ্যে সরাসরি হোম ডেলিভারি)। রেগুলার অর্ডারে কোনো অগ্রিম পেমেন্ট ছাড়াই ক্যাশ অন ডেলিভারিতে (COD) পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।"
        : "Delivery outside Dhaka across all 64 districts is only ৳90 (2–4 business days doorstep delivery). Cash on Delivery (COD) is available nationwide with zero advance fee on standard deliveries.";
    }

    return {
      reply: specificReply,
      intent: "delivery_calc",
      suggestedActions: [
        { label: isBn ? "🛒 চেকআউটে যান" : "🛒 Go to Checkout", action: "navigate_checkout" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 6. Selvedge Craftsmanship & Heritage
  // ------------------------------------------------------------------
  if (/selvedge|selvage|shuttle loom|raw denim|লুম|ইন্ডিগো|সানফোরাইজড|sanforized|রেড-লাইন/i.test(lower) && !/suggest|recommend|কিনতে|দেখাও/i.test(lower)) {
    const heritageKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_selvedge_heritage")!;
    return {
      reply: isBn ? heritageKb.contentBn : heritageKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "👖 সেলভেজ কালেকশন দেখুন" : "👖 Shop Selvedge Jeans", action: "search_jeans" },
        { label: isBn ? "🧼 ওয়াশ ও কেয়ার গাইড" : "🧼 Denim Care Guide", action: "open_care_guide" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 7. Payment Methods & 0% EMI
  // ------------------------------------------------------------------
  if (/payment|cod|cash on delivery|bkash|nagad|rocket|emi|কিস্তি|পেমেন্ট|বিকাশ|নগদ|রকেট/i.test(lower)) {
    const paymentKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_payment_methods")!;
    return {
      reply: isBn ? paymentKb.contentBn : paymentKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "💳 ব্যাংক অফার দেখুন" : "💳 Bank Card Offers", action: "open_bank_offers" },
        { label: isBn ? "🛍️ কেনাকাটা করুন" : "🛍️ Shop Catalog", action: "navigate_shop" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 8. Fabric Care & Washing Instructions
  // ------------------------------------------------------------------
  if (/wash|care|ধোয়া|কেয়ার|ওয়াশ|আয়রন|shrink|ব্লিচ/i.test(lower)) {
    const careKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_fabric_care")!;
    return {
      reply: isBn ? careKb.contentBn : careKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "🧼 ডেনিম কেয়ার দেখুন" : "🧼 Full Care Guide", action: "open_care_guide" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 9. Sizing & Fit Guide (when not directly requesting product listing)
  // ------------------------------------------------------------------
  const isSizeInquiry = /size|fit|waist|inches|chest|সাইজ|ফিট|কোমর|বুক|মাপ|tight|loose/i.test(lower);
  const isShoppingIntent =
    /suggest|recommend|সাজেস্ট|দেখাও|খুঁজছি|কিনতে|কালেকশন|collection|buy|shop|চাই|দাও|অ্যাভেইলেবল|available|stock|স্টক/i.test(lower) ||
    budget !== null;

  if (isSizeInquiry && !isShoppingIntent) {
    let chosenKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_sizing_jeans")!;
    if (/panjabi|পাঞ্জাবি/i.test(lower)) {
      chosenKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_sizing_panjabi")!;
    } else if (/shirt|polo|শার্ট|পোলো/i.test(lower)) {
      chosenKb = COMMERCE_KNOWLEDGE.find((k) => k.id === "kb_sizing_shirts")!;
    }

    return {
      reply: isBn ? chosenKb.contentBn : chosenKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "📐 সাইজ চার্ট দেখুন" : "📐 View Size Chart", action: "open_size_guide" },
        { label: isBn ? "🛍️ কালেকশন দেখুন" : "🛍️ Shop Collection", action: "navigate_shop" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 10. Real-Time Multi-Attribute Product Search & Size Stock Query
  // ------------------------------------------------------------------
  const isJeans = /jean|denim|জিন্স|ডেনিম|প্যান্ট|pant|trouser|সেলভেজ|selvedge/i.test(lower);
  const isPanjabi = /panjabi|punjabi|পাঞ্জাবি/i.test(lower);
  const isShirt = /shirt|শার্ট|polo|পোলো|oxford|cuban/i.test(lower) && !/t-shirt|tee|টি-শার্ট/i.test(lower);
  const isTee = /t-shirt|tee|টি-শার্ট|গেঞ্জি/i.test(lower);

  let targetCategory: string | null = null;
  if (isJeans) targetCategory = "JEANS";
  else if (isPanjabi) targetCategory = "PANJABI";
  else if (isShirt) targetCategory = "SHIRT";
  else if (isTee) targetCategory = "T-SHIRT";

  if (targetCategory || isShoppingIntent || requestedSize) {
    let filtered = catalog.filter((p) => p.stockStatus !== "outofstock");

    // 10A. Category filter
    if (targetCategory) {
      const catMatches = filtered.filter((p) => (p.category || "").toUpperCase() === targetCategory);
      if (catMatches.length > 0) filtered = catMatches;
    }

    // 10B. Budget filter
    if (budget) {
      const budgetMatches = filtered.filter((p) => (p.salePrice ?? p.price) <= budget);
      if (budgetMatches.length > 0) filtered = budgetMatches;
    }

    // 10C. Specific size availability check
    let sizeMatchedCount = 0;
    if (requestedSize) {
      const sizeMatches = filtered.filter((p) => {
        const sizes: string[] = p.sizes || [];
        return sizes.some((s) => s.toUpperCase() === requestedSize.toUpperCase());
      });
      if (sizeMatches.length > 0) {
        filtered = sizeMatches;
        sizeMatchedCount = sizeMatches.length;
      }
    }

    // 10D. Color filter
    const isBlack = /black|কালো/i.test(lower);
    const isBlue = /blue|নীল|indigo|ইন্ডিগো/i.test(lower);
    const isWhite = /white|সাদা/i.test(lower);

    if (isBlack) {
      const blackMatches = filtered.filter((p) =>
        /black|jet|nero|dark/i.test(p.name + " " + (p.description || "") + " " + (p.fabric || ""))
      );
      if (blackMatches.length > 0) filtered = blackMatches;
    } else if (isBlue) {
      const blueMatches = filtered.filter((p) =>
        /blue|indigo|selvedge|denim|wash/i.test(p.name + " " + (p.description || "") + " " + (p.fabric || ""))
      );
      if (blueMatches.length > 0) filtered = blueMatches;
    } else if (isWhite) {
      const whiteMatches = filtered.filter((p) =>
        /white|blanc/i.test(p.name + " " + (p.description || "") + " " + (p.fabric || ""))
      );
      if (whiteMatches.length > 0) filtered = whiteMatches;
    }

    // 10E. Keyword match across name & fabric
    const keywords = trimmed
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/বাজেট|টাকা|মডেল|দেখাও|suggest|please|price/i.test(w));
    if (keywords.length > 0 && filtered.length > 3) {
      const keywordMatches = filtered.filter((p) => {
        const text = `${p.name} ${p.fabric || ""} ${p.category || ""}`.toLowerCase();
        return keywords.some((kw) => text.includes(kw.toLowerCase()));
      });
      if (keywordMatches.length > 0) filtered = keywordMatches;
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
        reply =
          `আপনার রিকোয়েস্ট অনুযায়ী লাইভ ক্যাটালগ থেকে সেরা ${topPicks.length}টি প্রোডাক্ট উপস্থাপন করা হলো` +
          `${requestedSize ? ` (সাইজ ${requestedSize} স্টকে উপলব্ধ ✅)` : ""}` +
          `${budget ? ` (বাজেট ৳${budget}-এর মধ্যে)` : ""}:\n\n` +
          topPicks
            .map(
              (p, i) =>
                `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price}${
                  p.salePrice ? ` ~~(মূল্য: ৳${p.price})~~` : ""
                }\n   • উপলব্ধ সাইজ: ${p.sizes?.slice(0, 5).join(", ") || "স্ট্যান্ডার্ড"}\n   • ফেব্রিক: ${
                  p.fabric || "প্রিমিয়াম কোয়ালিটি"
                }`
            )
            .join("\n\n") +
          `\n\nযেকোনো প্রোডাক্টে ট্যাপ করে বিস্তারিত দেখে সরাসরি ব্যাগে অ্যাড করতে পারেন। ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা রয়েছে!`;
      } else {
        reply =
          `Here are our top recommended picks from our live catalog` +
          `${requestedSize ? ` (Size ${requestedSize} in stock ✅)` : ""}` +
          `${budget ? ` (under ৳${budget})` : ""}:\n\n` +
          topPicks
            .map(
              (p, i) =>
                `${i + 1}. **${p.name}** — ৳${p.salePrice ?? p.price}${
                  p.salePrice ? ` ~~(Regular: ৳${p.price})~~` : ""
                }\n   • Available Sizes: ${p.sizes?.slice(0, 5).join(", ") || "Standard"}\n   • Fabric: ${
                  p.fabric || "Artisanal Finish"
                }`
            )
            .join("\n\n") +
          `\n\nTap any product card below to view details and add directly to your bag. Backed by our 7-day doorstep size exchange guarantee!`;
      }

      return {
        reply,
        intent: "product_recommendation",
        suggestedProducts: summaries,
        suggestedActions: [
          { label: isBn ? "🛒 শপ ক্যাটালগ দেখুন" : "🛒 Browse Full Shop", action: "navigate_shop" },
          { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" }, { label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger", action: "open_messenger" },
        ],
      };
    }
  }

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // 11. Generic Knowledge Base Retrieval (RAG)
  // ------------------------------------------------------------------
  const bestKb = findBestKnowledge(trimmed);
  if (bestKb) {
    return {
      reply: isBn ? bestKb.contentBn : bestKb.contentEn,
      intent: "policy_qa",
      suggestedActions: [
        { label: isBn ? "🛍️ কালেকশন দেখুন" : "🛍️ Shop Collection", action: "navigate_shop" },
        { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" },
        { label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger", action: "open_messenger" },
      ],
    };
  }

  // ------------------------------------------------------------------
  // 12. Gemini 1.5 Flash LLM Fallback (hybrid — fires only when no rule matches)
  // ------------------------------------------------------------------
  if (config.geminiApiKey) {
    try {
      const catalogSummary = buildCatalogSummary(catalog);
      const campaignSummary = "No active campaigns.";
      const geminiHistory = toGeminiHistory(history);
      const llmReply = await callGemini(trimmed, catalogSummary, campaignSummary, geminiHistory);
      if (llmReply) {
        return {
          reply: llmReply,
          intent: "general",
          suggestedActions: [
            { label: isBn ? "🛍️ কালেকশন দেখুন" : "🛍️ Browse Shop", action: "navigate_shop" },
            { label: isBn ? "📦 অর্ডার ট্র্যাক করুন" : "📦 Track Order", action: "navigate_orders" },
            { label: isBn ? "💬 হোয়াটসঅ্যাপ" : "💬 WhatsApp", action: "open_whatsapp" },
            { label: isBn ? "💬 মেসেঞ্জার" : "💬 Messenger", action: "open_messenger" },
          ],
        };
      }
    } catch (err) {
      console.error("[agent] Gemini fallback failed:", (err as Error).message);
    }
  }

  // ------------------------------------------------------------------
  // 13. Static Greeting (Gemini unavailable)
  // ------------------------------------------------------------------
  return {
    reply: isBn
      ? "স্বাগতম DEEN Assistant-এ! আমাকে জিজ্ঞেস করুন:\n• অর্ডার ট্র্যাকিং\n• সাইজ ও কালেকশন\n• ডেলিভারি চার্জ\n• এক্সচেঞ্জ পলিসি"
      : "Welcome to DEEN Assistant! Ask me about:\n• Order tracking\n• Sizes & collections\n• Delivery charges\n• Exchange policy",
    intent: "general",
    suggestedActions: [
      { label: isBn ? "📦 অর্ডার ট্র্যাক করুন" : "📦 Track My Order", action: "navigate_orders" },
      { label: isBn ? "👖 সেলভেজ জিন্স" : "👖 Best Seller Jeans", action: "search_jeans" },
      { label: isBn ? "🚚 ডেলিভারি পলিসি" : "🚚 Shipping Policies", action: "search_delivery" },
      { label: isBn ? "📍 শোরুম লোকেশন" : "📍 Store Locations", action: "open_outlets" },
    ],
  };
}
