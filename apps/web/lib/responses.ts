import { Lang } from "./types";

export type ResponseKey =
  | "GREETING"
  | "GREETING_BACK"
  | "FALLBACK"
  | "NO_PRODUCTS"
  | "HERE_ARE_PRODUCTS"
  | "ORDER_START"
  | "ORDER_ASK_PRODUCT"
  | "ORDER_ASK_SIZE"
  | "ORDER_ASK_QTY"
  | "ORDER_ASK_PHONE"
  | "ORDER_INVALID_PHONE"
  | "ORDER_ASK_ADDRESS"
  | "ORDER_ASK_NAME"
  | "ORDER_CONFIRM"
  | "ORDER_PLACED"
  | "ORDER_FAILED"
  | "ORDER_CANCELLED"
  | "STATUS_ASK_PHONE"
  | "STATUS_ASK_ORDERNO"
  | "STATUS_NOT_FOUND"
  | "STATUS_FOUND"
  | "HUMAN_HANDOFF"
  | "DELIVERY_INFO"
  | "EXCHANGE_POLICY"
  | "STORE_LOCATOR"
  | "OFFERS"
  | "SIZING_GUIDE"
  | "ASK_CLARIFY"
  | "YES"
  | "NO";

export const RESPONSES: Record<ResponseKey, Record<Lang, string>> = {
  GREETING: {
    bn: "আসসালামু আলাইকুম! আমি আপনার শপিং অ্যাসিস্ট্যান্ট। পণ্য দেখতে, অর্ডার করতে বা ডেলিভারি স্ট্যাটাস জানতে মেসেজ করুন।",
    en: "Hello! Welcome to our store. How can I help you today? You can search products, place an order, or check order status.",
    banglish: "Salam! Kemon আছেন? Amake bolun ki proyojon — product khoja, notun order kora ba delivery status jana.",
  },
  GREETING_BACK: {
    bn: "ধন্যবাদ! আজ আপনাকে কীভাবে সাহায্য করতে পারি? কী পণ্য খুঁজছেন জানান।",
    en: "Welcome back! What are you looking to buy today?",
    banglish: "Dhonnobad! Ajke apnar jonno ki dekhte pari? Kon item ta dorkar?",
  },
  FALLBACK: {
    bn: "দুঃখিত, আমি ঠিক বুঝতে পারিনি। আপনি কী ধরণের পণ্য খুঁজছেন বা কোনো অর্ডার সম্পর্কে জানতে চান?",
    en: "I'm sorry, I didn't quite catch that. Could you tell me what product you're looking for or your order number?",
    banglish: "Dukkhito, bujhte parini. Apni ki item khujchen ba kono order somporke jante chan?",
  },
  NO_PRODUCTS: {
    bn: "দুঃখিত, '{query}' দিয়ে কোনো পণ্য পাওয়া যায়নি। দয়া করে অন্য কোনো নাম বা ক্যাটাগরি লিখে চেষ্টা করুন।",
    en: "Sorry, we couldn't find any products matching '{query}'. Please try searching with a different keyword or category.",
    banglish: "Dukkhito, '{query}' diye kono item pawa jayni. Onno kono nam ba size diye check korun.",
  },
  HERE_ARE_PRODUCTS: {
    bn: "আপনার জন্য কয়েকটি সেরা পণ্য নিচে দেওয়া হলো:",
    en: "Here are the top matching products for you:",
    banglish: "Apnar jonno kisu top matching products niche dewa holo:",
  },
  ORDER_START: {
    bn: "দারুণ! আসুন আপনার অর্ডারটি তৈরি করি।",
    en: "Great! Let's get your order placed.",
    banglish: "Darun! Cholun apnar order ta confirm kori.",
  },
  ORDER_ASK_PRODUCT: {
    bn: "আপনি কোন পণ্যটি অর্ডার করতে চান? দয়া করে পণ্যের নাম বা লিংক জানান।",
    en: "Which product would you like to order? Please tell me the product name or share the item.",
    banglish: "Apni kon product ta order korte chan? Item er nam ta bolun.",
  },
  ORDER_ASK_SIZE: {
    bn: "আপনার সাইজ কত? (যেমন: M, L, XL, XXL অথবা প্যান্টের জন্য 30, 32, 34, 36)",
    en: "What size do you need? (e.g., M, L, XL, XXL or waist 30, 32, 34, 36)",
    banglish: "Apnar size koto lagbe? (Jemon: M, L, XL, XXL ba pant er jonno 30, 32, 34, 36)",
  },
  ORDER_ASK_QTY: {
    bn: "আপনি কয়টি (কত পিস) নিতে চান? (যেমন: ১, ২, ৩)",
    en: "How many pieces would you like? (e.g., 1, 2, 3)",
    banglish: "Koita piece niben bolun? (Jemon: 1, 2, 3)",
  },
  ORDER_ASK_PHONE: {
    bn: "ডেলিভারি কনফার্মেশনের জন্য আপনার ১১ ডিজিটের মোবাইল নম্বরটি দিন (যেমন: 017XXXXXXXX)।",
    en: "Please provide your 11-digit mobile number for delivery confirmation (e.g., 017XXXXXXXX).",
    banglish: "Delivery confirmation er jonno apnar 11-digit mobile number ta din (e.g., 017XXXXXXXX).",
  },
  ORDER_INVALID_PHONE: {
    bn: "নম্বরটি সঠিক মনে হচ্ছে না। দয়া করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (০১৩-০১৯)।",
    en: "That doesn't look like a valid number. Please provide a valid 11-digit Bangladeshi mobile number (013-019).",
    banglish: "Number ta thik mone hocchena. Doya kore 11 digit er shothik BD mobile number din (013-019).",
  },
  ORDER_ASK_ADDRESS: {
    bn: "আপনার সম্পূর্ণ ডেলিভারি ঠিকানা দিন (বাড়ি নং, রোড, এলাকা, ও জেলা)।",
    en: "Please share your complete delivery address (House/Road, Area, City/District).",
    banglish: "Apnar full delivery address ta bolun (House/Road, Area, Zilla/District).",
  },
  ORDER_ASK_NAME: {
    bn: "ডেলিভারির রিসিভারের নাম কী হবে?",
    en: "What is the recipient's full name for delivery?",
    banglish: "Delivery receiver er nam ta bolun kindly?",
  },
  ORDER_CONFIRM: {
    bn: "অর্ডার সামারি:\n• পণ্য: {product}\n• সাইজ: {size}\n• পরিমাণ: {qty} পিস\n• মোবাইল: {phone}\n• ঠিকানা: {address}\n• মোট মূল্য: ৳{total} (ক্যাশ অন ডেলিভারি)\n\nঅর্ডারটি কি কনফার্ম করব? ('হ্যাঁ' বা 'না' বলুন)",
    en: "Order Summary:\n• Product: {product}\n• Size: {size}\n• Qty: {qty}\n• Phone: {phone}\n• Address: {address}\n• Total: ৳{total} (Cash on Delivery)\n\nWould you like to confirm this order? (Reply 'Yes' or 'No')",
    banglish: "Order Summary:\n• Item: {product}\n• Size: {size}\n• Qty: {qty} pcs\n• Phone: {phone}\n• Address: {address}\n• Total: ৳{total} (Cash on Delivery)\n\nOrder confirm korbo? ('Haa' ba 'Na' bolun)",
  },
  ORDER_PLACED: {
    bn: "🎉 ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। অর্ডার আইডি: #{orderId}। আমাদের টিম শীঘ্রই যোগাযোগ করবে।",
    en: "🎉 Thank you! Your order has been placed successfully. Order ID: #{orderId}. Our team will contact you shortly.",
    banglish: "🎉 Dhonnobad! Apnar order ti successfully place hoyeche. Order ID: #{orderId}. Shighroi amader team contact korbe.",
  },
  ORDER_FAILED: {
    bn: "দুঃখিত, সিস্টেম জটিলতার কারণে অর্ডারটি সম্পন্ন করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন বা সরাসরি আমাদের হটলাইনে যোগাযোগ করুন।",
    en: "Sorry, we encountered an issue processing your order. Please try again in a few moments or contact our support team.",
    banglish: "Dukkhito, technical issue er karone order ta submit hoyni. Ektu por abar try korun ba hotline e call din.",
  },
  ORDER_CANCELLED: {
    bn: "আপনার অর্ডারটি বাতিল করা হয়েছে। নতুন কিছু দেখতে চাইলে জানান।",
    en: "Your order process has been cancelled. Let me know if you'd like to browse anything else!",
    banglish: "Apnar order ti cancel kora hoyeche. Notun kisu lagle oboshoy bolben!",
  },
  STATUS_ASK_PHONE: {
    bn: "অর্ডার স্ট্যাটাস চেক করতে আপনার অর্ডার করার সময় ব্যবহৃত ১১ ডিজিটের মোবাইল নম্বরটি দিন।",
    en: "To check your order status, please enter the 11-digit mobile number used during ordering.",
    banglish: "Order status check korar jonno order e dewa 11-digit mobile number ta din kindly.",
  },
  STATUS_ASK_ORDERNO: {
    bn: "আপনার অর্ডার নম্বরটি (Order ID) দিন (যেমন: 1234)।",
    en: "Please provide your Order ID number (e.g., 1234).",
    banglish: "Apnar Order ID number ta bolun (jemon: 1234).",
  },
  STATUS_NOT_FOUND: {
    bn: "দুঃখিত, আপনার প্রদত্ত তথ্যের সাথে কোনো সক্রিয় অর্ডার পাওয়া যায়নি। দয়া করে সঠিক মোবাইল নম্বর ও অর্ডার আইডি মিলিয়ে দেখুন।",
    en: "Sorry, no matching order was found with those details. Please double-check your phone number and Order ID.",
    banglish: "Dukkhito, ei info diye kono order khuje pawa jayni. Phone number ar Order ID ta abar check korun.",
  },
  STATUS_FOUND: {
    bn: "📦 অর্ডার স্ট্যাটাস (অর্ডার #{orderId}):\n• স্ট্যাটাস: {status}\n• মোট মূল্য: ৳{total}\n• পণ্য: {items}\n• তারিখ: {date}",
    en: "📦 Order Status (Order #{orderId}):\n• Status: {status}\n• Total: ৳{total}\n• Items: {items}\n• Date: {date}",
    banglish: "📦 Order Status (Order #{orderId}):\n• Status: {status}\n• Total: ৳{total}\n• Items: {items}\n• Date: {date}",
  },
  HUMAN_HANDOFF: {
    bn: "আমাদের কাস্টমার কেয়ার প্রতিনিধির সাথে সরাসরি কথা বলতে WhatsApp এ নক দিন: +8801952700500 অথবা কল করুন। আমরা সব সময় আপনার সহায়তায় প্রস্তুত!",
    en: "To connect directly with our human support team, please reach out on WhatsApp at +8801952700500 or call us. We're here to assist you!",
    banglish: "Amader customer support representative er sathe direct kotha bolte WhatsApp e knock din: +8801952700500 ba call korun.",
  },
  DELIVERY_INFO: {
    bn: "🚚 **DEEN ডেলিভারি চার্জ ও সময়সীমা:**\n• **ঢাকা মেট্রো:** ৳৫০ (২৪–৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি)\n• **ঢাকার বাইরে (সারা বাংলাদেশ):** ৳৯০ (৩–৫ কার্যদিবস)\n\nসারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) ও ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা রয়েছে!",
    en: "🚚 **DEEN Delivery Charges & Timelines:**\n• **Dhaka Metro:** ৳50 (24–48 hours home delivery)\n• **Outside Dhaka (All Bangladesh):** ৳90 (3–5 business days)\n\nCash on Delivery (COD) & 7-day doorstep size exchange available nationwide!",
    banglish: "🚚 **Delivery charge & time:**\n• Dhaka Metro: ৳50 (24-48 hours)\n• Outside Dhaka: ৳90 (3-5 days)\n\nCash on Delivery & 7-day doorstep size exchange available nationwide!",
  },
  EXCHANGE_POLICY: {
    bn: "🔄 **৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ পলিসি:**\n• সাইজ ঠিক না হলে ডেলিভারির ৭ দিনের মধ্যে সম্পূর্ণ ফ্রিতে সাইজ পরিবর্তন করতে পারবেন।\n• শর্ত: প্রোডাক্টটি অব্যবহৃত, আনওয়াশড এবং আসল ট্যাগ ও বারকোডযুক্ত থাকতে হবে।\n• হটলাইন: +880 1952-700500",
    en: "🔄 **7-Day Doorstep Size Exchange Guarantee:**\n• If your fit isn't 100% perfect, request a free doorstep size swap within 7 days of delivery.\n• Conditions: Item must be unworn and unwashed with original hangtags & barcode intact.\n• Hotline: +880 1952-700500",
    banglish: "🔄 **7-Day Doorstep Size Exchange:**\n• Size e problem hole 7 diner moddhe doorstep size swap paben.\n• Conditions: Unworn, unwashed with original tags intact thakle hobe.\n• Hotline: +880 1952-700500",
  },
  STORE_LOCATOR: {
    bn: "📍 **DEEN অনলাইন শপ (deencommerce.com):**\nDEEN একটি অনলাইন-ফার্স্ট ফ্যাশন ব্র্যান্ড (ঢাকা, ট্রেড লাইসেন্স: ২২৪৪৭৮)। বর্তমানে আমাদের কোনো ফিজিক্যাল রিটেল আউটলেট বা শোরুম নেই।\n\n🚚 আমরা সারাদেশে ৬৪ জেলায় ক্যাশ অন ডেলিভারিতে সরাসরি হোম ডেলিভারি এবং ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা দিয়ে থাকি।\n💬 যেকোনো সহায়তায় আমাদের অনলাইন কনসিয়ার্জে WhatsApp / হটলাইনে যোগাযোগ করুন: +880 1952-700500।",
    en: "📍 **DEEN Online Store (deencommerce.com):**\nDEEN is an online-first e-commerce fashion brand based in Dhaka (Trade License: 224468). Currently, we do not operate walk-in retail showrooms or outlets.\n\n🚚 We deliver right to your doorstep across all 64 districts in Bangladesh with Cash on Delivery (COD) and 7-day hassle-free doorstep size exchanges.\n💬 For any assistance, reach our concierge on WhatsApp / Hotline: +880 1952-700500.",
    banglish: "📍 **DEEN Online Store (deencommerce.com):**\nDEEN ekta online e-commerce fashion brand (Dhaka, Trade License: 224468). Amader kono physical retail showroom ba outlet nei.\n\n🚚 Amra shara Bangladesh-er 64 zillay Cash on Delivery (COD) ebong 7-diner doorstep size exchange shubidha diye thaki.\n💬 Jekono proyojone WhatsApp / Hotline e knock din: +880 1952-700500.",
  },
  OFFERS: {
    bn: "🔥 **বর্তমান লাইভ অফার ও ক্যাম্পেইন:**\n• ৳২,৫০০ – ৳২,৯৯৯ অর্ডারে **৳৫০০ ইন্সট্যান্ট ক্যাশব্যাক**!\n• ৳৩,০০০+ অর্ডারে **৳৭০০ ইন্সট্যান্ট ক্যাশব্যাক**!\n• ঢাকা মেট্রোতে ডেলিভারি চার্জ মাত্র ৳৫০\n• পার্টনার ব্যাংক কার্ডে ১০% পর্যন্ত অতিরিক্ত ছাড়!",
    en: "🔥 **Active Campaigns & Instant Cashback:**\n• Flat **৳500 Cashback** on orders ৳2,500 – ৳2,999!\n• Flat **৳700 Cashback** on orders ৳3,000+!\n• Dhaka Metro delivery only ৳50\n• Up to 10% extra savings with partner bank cards!",
    banglish: "🔥 **Live Offers & Cashback:**\n• ৳2,500 - ৳2,999 ordere **৳500 flat cashback**!\n• ৳3,000+ ordere **৳700 flat cashback**!\n• Dhaka Metro delivery matro ৳50\n• Bank card payment e extra discount!",
  },
  SIZING_GUIDE: {
    bn: "📏 **DEEN সাইজিং ও মেজারমেন্ট গাইড:**\n• **জিন্স/প্যান্ট:** আপনার সাধারণ কোমর মাপ (২৮, ৩০, ৩২, ৩৪, ৩৬, ৩৮ ইঞ্চি) অনুযায়ী অর্ডার করুন। আমাদের ডেনিম সানফোরাইজড (< ২% সংকোচন)।\n• **শার্ট, টি-শার্ট ও পাঞ্জাবি:**\n  - M: চেস্ট ৩৮–৩৯\"\n  - L: চেস্ট ৪০–৪১\"\n  - XL: চেস্ট ৪২–৪৩\"\n  - XXL: চেস্ট ৪৪–৪৫\"\n• ফ্রি ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা রয়েছে!",
    en: "📏 **DEEN Sizing & Measurement Guide:**\n• **Jeans & Trousers:** True-to-size waist inches (28, 30, 32, 34, 36, 38). Sanforized denim (< 2% shrinkage).\n• **Shirts, Tees & Panjabis:**\n  - M: Chest 38–39\"\n  - L: Chest 40–41\"\n  - XL: Chest 42–43\"\n  - XXL: Chest 44–45\"\n• Backed by complimentary 7-day doorstep size exchange guarantee!",
    banglish: "📏 **Size Guide:**\n• Jeans: Exact waist size (28, 30, 32, 34, 36, 38) select korun.\n• Shirts/Tees: M (38\"), L (40\"), XL (42\"), XXL (44\").\n• 7-day doorstep size exchange guarantee!",
  },
  ASK_CLARIFY: {
    bn: "আপনি কি পণ্য দেখতে চান নাকি কোনো অর্ডারের বিষয়ে জানতে চান? নিচে নির্বাচন করতে পারেন:",
    en: "Would you like to browse products, place an order, or check an existing order?",
    banglish: "Apni ki product dekhte chan naki order somporke kisu jante chan?",
  },
  YES: {
    bn: "হ্যাঁ",
    en: "Yes",
    banglish: "Haa",
  },
  NO: {
    bn: "না",
    en: "No",
    banglish: "Na",
  },
};

/**
 * Returns a template string localized to the requested language with variable substitution.
 * @example reply("bn", "ORDER_PLACED", { orderId: 1042 })
 */
export function reply(
  lang: Lang,
  key: ResponseKey,
  vars: Record<string, string | number> = {}
): string {
  const langKey: Lang = lang === "bn" || lang === "banglish" ? lang : "en";
  const template = RESPONSES[key]?.[langKey] || RESPONSES[key]?.en || "";

  return template.replace(/\{(\w+)\}/g, (_, varName) => {
    return vars[varName] !== undefined ? String(vars[varName]) : `{${varName}}`;
  });
}
