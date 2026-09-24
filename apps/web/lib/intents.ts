import { Intent, IntentResult, Lang } from "./types";
import { normalizeLower } from "./normalize";

interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
  keywords: {
    bn: string[];
    en: string[];
    banglish: string[];
  };
}

/**
 * Priority-ordered intent rules:
 * PLACE_ORDER > ORDER_STATUS > PRODUCT_SEARCH > HUMAN_HANDOFF > GREETING
 */
const INTENT_RULES: IntentRule[] = [
  // 1. PLACE_ORDER
  {
    intent: "PLACE_ORDER",
    patterns: [
      /(?:order|অর্ডার|kinbo|কিনবো|nibo|নিবো|buy|purchase|lagbe|লাগবে)\s+(?:korte|করতে|chai|চাই|koro|করো|dite|দিতে|parbo)/i,
      /(?:i\s*want\s*to\s*(?:order|buy|purchase|get))/i,
      /(?:ami|আমি)\s+.*(?:order|অর্ডার|kinbo|কিনবো|nibo|নিবো)\s+(?:korte|করতে|chai|চাই)/i,
      /(?:place\s+(?:an\s+)?order|want\s+to\s+order)/i,
      /(?:can\s+i\s+(?:order|buy))/i,
      /(?:kivabe\s+order|কিভাবে\s+অর্ডার)\s+(?:korbo|করব|kora\s+jay|করা\s+যায়)/i,
      /(?:ekta|১টা|একটি)\s+.*(?:order|অর্ডার|pathan|পাঠান|den|দ্যান|din|দিন)/i,
    ],
    keywords: {
      bn: ["অর্ডার করতে চাই", "অর্ডার করব", "কিনতে চাই", "অর্ডার দিন", "অর্ডার নেয়া", "অর্ডার নেওয়া"],
      en: ["order now", "place order", "want to buy", "buy now", "purchase"],
      banglish: ["order korte chai", "order korbo", "kinte chai", "nibo ami", "order dite chai", "order koro"],
    },
  },

  // 2. ORDER_STATUS
  {
    intent: "ORDER_STATUS",
    patterns: [
      /(?:order|অর্ডার)\s*(?:status|স্ট্যাটাস|track|ট্র্যাক|kothay|কোথায়|kobe|কবে|pelam\s*na|পাইনি)/i,
      /(?:status|condition)\s+of\s+(?:my\s+)?order/i,
      /(?:where\s+is\s+my\s+order|track\s+(?:my\s+)?(?:order|parcel|package))/i,
      /(?:order\s*#?\s*\d{4,})/i,
      /(?:amar\s+order|আমার\s+অর্ডার)\s+(?:kobe|কবে|kothay|কোথায়|ashbe|আসবে)/i,
      /(?:delivery\s+(?:update|status|kobe))/i,
    ],
    keywords: {
      bn: ["অর্ডার স্ট্যাটাস", "অর্ডার ট্র্যাকিং", "আমার অর্ডার", "অর্ডার কবে আসবে", "ডেলিভারি কবে"],
      en: ["order status", "track order", "where is my order", "order update", "track parcel"],
      banglish: ["order status", "order track", "order kothay", "order ashbe kobe", "delivery status", "order pailam na"],
    },
  },

  // 3. DELIVERY_INFO
  {
    intent: "DELIVERY_INFO",
    patterns: [
      /(?:delivery|shipping|ডেলিভারি|শিপিং)\s*(?:charge|cost|fee|time|koto|কত|চার্জ|খরচ|kobe|কবে|somoy|সময়)/i,
      /(?:delivery|ডেলিভারি)\s+(?:in|to|inside|outside|dhaka|chittagong|ctg|dhakay|ঢাকার|চট্টগ্রাম)/i,
      /(?:chittagong|ctg|dhaka|চট্টগ্রাম|খুলনা|রাজশাহী|সিলেট)\s*(?:e\s*)?(?:delivery|ডেলিভারি)/i,
      /(?:delivery\s*koto|koto\s*taka\s*delivery)/i,
      /(?:how\s*much\s*is\s*delivery|shipping\s*charges?|delivery\s*charge)/i,
    ],
    keywords: {
      bn: ["ডেলিভারি চার্জ", "ডেলিভারি খরচ", "শিপিং চার্জ", "ডেলিভারি চার্জ কত", "ঢাকার বাইরে ডেলিভারি", "চট্টগ্রাম ডেলিভারি"],
      en: ["delivery charge", "shipping fee", "delivery time", "delivery cost", "outside dhaka delivery", "shipping rate"],
      banglish: ["delivery charge", "delivery koto", "shipping charge", "delivery fee koto", "dhakar baire delivery", "delivery somoy"],
    },
  },

  // 4. EXCHANGE_POLICY
  {
    intent: "EXCHANGE_POLICY",
    patterns: [
      /(?:exchange|return|refund|swap|পাল্টানো|পরিবর্তন|ফেরত|বদলি)\s*(?:policy|পলিসি|kivabe|কীভাবে|kora\s*jabe|করা\s*যাবে|korbo|করব)/i,
      /(?:7\s*days?|seven\s*days?|৭\s*দিন|৭\s*দিনের)\s*(?:exchange|return|doorstep|ডোরস্টেপ|পলিসি)/i,
      /(?:size\s*(?:change|swap|exchange)|সাইজ\s*(?:পরিবর্তন|বদল|পাল্টানো))/i,
      /(?:how\s*(?:does|can\s*i)\s*(?:return|exchange)|exchange\s*policy|return\s*policy)/i,
    ],
    keywords: {
      bn: ["এক্সচেঞ্জ পলিসি", "রিটার্ন পলিসি", "সাইজ পরিবর্তন", "৭ দিনের এক্সচেঞ্জ", "সাইজ বদল", "ফেরত পলিসি"],
      en: ["exchange policy", "return policy", "size exchange", "size swap", "7-day exchange", "return item"],
      banglish: ["exchange policy", "return policy", "size change", "size swap", "7 diner exchange", "size palte nibo"],
    },
  },

  // 5. STORE_LOCATOR
  {
    intent: "STORE_LOCATOR",
    patterns: [
      /(?:showroom|outlet|store|branch|দোকান|শোরুম|আউটলেট|শাখা)\s*(?:kothay|কোথায়|location|ঠিকানা|address|ache\s*ki|আছে\s*কি)/i,
      /(?:where\s*(?:is|are)\s*(?:your|the)?\s*(?:retail\s*)?(?:stores?|showrooms?|outlets?))/i,
      /(?:retail\s+)?(?:showrooms?|outlets?)\s+(?:in|address|location|dhaka)/i,
      /(?:dhanmondi|uttara|banani|jamuna\s*future\s*park|ধানমন্ডি|উত্তরা|বনানী|যমুনা)\s*(?:showroom|outlet|শোরুম|আউটলেট|branch)/i,
      /(?:physical\s*store|retail\s*store|শোরুমের\s*ঠিকানা|আউটলেটের\s*ঠিকানা)/i,
    ],
    keywords: {
      bn: ["শোরুম কোথায়", "আউটলেট লোকেশন", "দোকানের ঠিকানা", "শোরুমের ঠিকানা", "ধানমন্ডি আউটলেট", "উত্তরা আউটলেট"],
      en: ["store location", "showroom address", "where is showroom", "retail outlet", "dhanmondi outlet", "uttara outlet"],
      banglish: ["showroom kothay", "outlet kothay", "dokander thikana", "showroom address", "dhakay showroom"],
    },
  },

  // 6. OFFERS
  {
    intent: "OFFERS",
    patterns: [
      /(?:offer|discount|promo|cashback|coupon|deal|অফার|ছাড়|ক্যাশব্যাক|কুপন)\s*(?:ki|কী|ache|আছে|koto|কত|cholche|চলছে|\?)/i,
      /(?:current\s*offers?|todays?\s*offers?|latest\s*discount|cashback\s*offer)/i,
      /(?:offer\s*ki|discount\s*ache|kono\s*offer\s*ache)/i,
      /(?:কোনো\s*অফার\s*আছে|ডিসকাউন্ট\s*কত|আজকের\s*অফার|অফারের\s*খবর)/i,
    ],
    keywords: {
      bn: ["অফার কী", "ডিসকাউন্ট আছে", "ক্যাশব্যাক অফার", "বর্তমান অফার", "কোনো অফার আছে", "কুপন কোড"],
      en: ["current offers", "discount", "cashback offer", "promo code", "any offer", "special deal"],
      banglish: ["current offer", "kono offer ache", "discount koto", "cashback offer", "promo code ache", "ajker offer"],
    },
  },

  // 7. SIZING_GUIDE
  {
    intent: "SIZING_GUIDE",
    patterns: [
      /(?:size\s*guide|sizing|measurements?|size\s*chart|সাইজ\s*গাইড|মাপের\s*চার্ট|মাপজোক)/i,
      /(?:how\s*to\s*measure|waist\s*size|inseam\s*length|chest\s*size)/i,
      /(?:সাইজ\s*কীভাবে\s*বুঝব|কোমরের\s*মাপ|বুকের\s*মাপ)/i,
    ],
    keywords: {
      bn: ["সাইজ গাইড", "সাইজ চার্ট", "কোমরের মাপ", "বুকের মাপ", "মেজারমেন্ট চার্ট"],
      en: ["size guide", "size chart", "measurement guide", "waist sizing", "how to measure"],
      banglish: ["size guide", "size chart", "kivabe mapbo", "waist size", "measurement chart"],
    },
  },

  // 3. PRODUCT_SEARCH
  {
    intent: "PRODUCT_SEARCH",
    patterns: [
      /(?:dam|daam|দাম|rate|price|মূল্য)\s*(?:koto|কত|ki|কী|\?)/i,
      /(?:koto|কত)\s*(?:dam|daam|দাম|taka|টাকা)/i,
      /(?:show\s+me|dekhan|দেখান|dekhao|দেখাও|khujchi|খুঁজছি)\s+/i,
      /(?:do\s+you\s+have|apnader\s+kache|আপনাদের\s+কাছে)\s+/i,
      /(?:ache\s*ki|আছে\s*কি|pawa\s*jabe|পাওয়া\s*যাবে)/i,
      /(?:what\s+is\s+the\s+price|how\s+much\s+is)/i,
      /(?:collection|কালেকশন|catalog|ক্যাটালগ)\s*(?:dekhan|দেখান|dekte|দেখতে|chai|চাই)/i,
      /(?:shart|shirt|শার্ট|panjabi|পাঞ্জাবি|t-shirt|tshirt|টি-শার্ট|jeans|জিন্স|pant|প্যান্ট|shoe|জুতা|bag|ব্যাগ|watch|ঘড়ি)/i,
    ],
    keywords: {
      bn: ["দাম কত", "পণ্য দেখান", "কালেকশন", "আছে কি", "কী কী আছে", "দাম", "শার্ট", "পাঞ্জাবি", "জিন্স", "প্যান্ট", "টি-শার্ট"],
      en: ["show me", "price of", "how much", "available", "products", "shirt", "panjabi", "jeans", "t-shirt", "catalog"],
      banglish: ["dam koto", "daam koto", "price koto", "koto taka", "ache ki", "dekhan", "dekhao", "shob product", "collection dekhan"],
    },
  },

  // 4. HUMAN_HANDOFF
  {
    intent: "HUMAN_HANDOFF",
    patterns: [
      /(?:human|person|agent|executive|officer|manush|মানুষ|kotha\s*bolte|কথা\s*বলতে)\s*(?:chai|চাই|speak|talk)/i,
      /(?:talk\s+to\s+(?:a\s+)?(?:human|person|agent|support|representative))/i,
      /(?:customer\s*care|help\s*line|hotline|হটলাইন|support\s*number)/i,
      /(?:phone\s*number\s*den|call\s*me|আমাকে\s*কল\s*দিন)/i,
      /(?:whatsapp|হোয়াটসঅ্যাপ)\s*(?:number|নম্বর|e\s*kotha)/i,
    ],
    keywords: {
      bn: ["কাস্টমার কেয়ার", "কথা বলতে চাই", "প্রতিনিধি", "মানুষের সাথে কথা", "হটলাইন", "কল দিন"],
      en: ["human", "agent", "support team", "customer care", "talk to human", "speak with agent", "hotline"],
      banglish: ["manush er sathe kotha", "agent chai", "kotha bolbo", "customer care", "hotline number", "call den"],
    },
  },

  // 5. GREETING
  {
    intent: "GREETING",
    patterns: [
      /^(?:hi|hello|hey|yo|hola|greetings)\b/i,
      /^(?:assalamu?\s*alaikum|salam|assalam|slam)\b/i,
      /^(?:হ্যালো|হাই|সালাম|আসসালামু\s*আলাইকুম|নমস্কার|আদাব)\b/i,
      /^(?:kemon\s*achen|kemon\s*aso|bhalo\s*achen|valo\s*asen)\b/i,
      /^(?:shunchen|sunchen|vai|bhai|bro|sir|boss)\b/i,
      /^(?:good\s*(?:morning|afternoon|evening))\b/i,
    ],
    keywords: {
      bn: ["হ্যালো", "হাই", "আসসালামু আলাইকুম", "সালাম", "কেমন আছেন", "নমস্কার", "আদাব", "শুভ সকাল"],
      en: ["hi", "hello", "hey", "good morning", "good evening", "greetings"],
      banglish: ["assalam vai", "salam", "kemon achen", "kemon aso", "vai", "bhai", "hello bro"],
    },
  },
];

/**
 * Classifies user text into one of the 6 supported intents.
 * Pattern match confidence = 1.0
 * Keyword match confidence = 0.7
 * Fallback = UNKNOWN (0.0)
 */
export function classifyIntent(text: string, lang: Lang = "en"): IntentResult {
  if (!text || typeof text !== "string") {
    return { intent: "UNKNOWN", confidence: 0, matched: "" };
  }

  const normalized = normalizeLower(text);

  // Evaluate rules in strict priority order
  for (const rule of INTENT_RULES) {
    // 1. Check regex patterns first (highest precision -> 1.0 confidence)
    for (const pattern of rule.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return {
          intent: rule.intent,
          confidence: 1.0,
          matched: match[0],
        };
      }
    }

    // 2. Check localized keywords (0.7 confidence)
    const keywordsForLang = rule.keywords[lang] || [];
    for (const kw of keywordsForLang) {
      if (normalized.includes(kw.toLowerCase())) {
        return {
          intent: rule.intent,
          confidence: 0.7,
          matched: kw,
        };
      }
    }

    // Also check cross-language keywords for resilience
    const allKeywords = [
      ...rule.keywords.bn,
      ...rule.keywords.en,
      ...rule.keywords.banglish,
    ];
    for (const kw of allKeywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return {
          intent: rule.intent,
          confidence: 0.7,
          matched: kw,
        };
      }
    }
  }

  return {
    intent: "UNKNOWN",
    confidence: 0,
    matched: "",
  };
}
