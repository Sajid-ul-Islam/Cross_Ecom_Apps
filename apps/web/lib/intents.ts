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
