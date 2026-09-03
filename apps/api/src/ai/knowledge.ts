/**
 * DEEN Commerce Knowledge Base
 * Indexes static brand knowledge, policies, store locations, and fabric specs.
 * Used for RAG retrieval combined with live WooCommerce catalog state.
 */

export interface KnowledgeItem {
  id: string;
  topic: "sizing" | "delivery" | "returns" | "outlets" | "fabric_care" | "general";
  title: string;
  keywords: string[];
  contentBn: string;
  contentEn: string;
}

export const COMMERCE_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "kb_sizing_jeans",
    topic: "sizing",
    title: "Jeans Sizing & Fit Guide",
    keywords: ["size", "fit", "waist", "inches", "সাইজ", "ফিট", "কোমর", "মাপ", "tight", "loose", "slim", "regular"],
    contentBn: "DEEN-এর জিন্সগুলো ট্রু-টু-সাইজ (True to Size)। কোমর ইঞ্চি অনুযায়ী প্রস্তুত (২৮, ৩০, ৩২, ৩৪, ৩৬, ৩৮)। স্লিম ফিটের জন্য আপনার স্বাভাবিক কোমরের মাপ নির্বাচন করুন। যারা কিছুটা আরামদায়ক ফিট পছন্দ করেন তারা ১ সাইজ বড় নিতে পারেন। ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা রয়েছে।",
    contentEn: "DEEN jeans are crafted true-to-size based on standard waist inches (28, 30, 32, 34, 36, 38). For our slim-straight cut, choose your standard waist size. If you prefer a relaxed fit, consider sizing up by one size. We provide a 7-day doorstep size exchange guarantee.",
  },
  {
    id: "kb_sizing_panjabi",
    topic: "sizing",
    title: "Panjabi Sizing Guide",
    keywords: ["panjabi", "punjabi", "chest", "length", "পাঞ্জাবি", "বুক", "লম্বা", "সেমি-লং"],
    contentBn: "DEEN প্রিমিয়াম পাঞ্জাবি সাইজ: S (৩৮ বুক), M (৪০ বুক), L (৪২ বুক), XL (৪৪ বুক)। দৈর্ঘ্য আধুনিক সেমি-লং কাটিংয়ে তৈরি যা পায়জামা বা ডেনিমের সাথে চমৎকার মানায়।",
    contentEn: "DEEN premium panjabis come in sizes S (38\" chest), M (40\" chest), L (42\" chest), and XL (44\" chest) tailored in a contemporary semi-long cut suitable for trousers or denim.",
  },
  {
    id: "kb_delivery_policy",
    topic: "delivery",
    title: "Delivery Charges & Timelines",
    keywords: ["delivery", "shipping", "charge", "cost", "pathao", "courier", "ডেলিভারি", "চার্জ", "খরচ", "সময়", "কত দিন", "কুরিয়ার"],
    contentBn: "ডেলিভারি চার্জ: ঢাকা সিটিতে ৳৫০ (২৪-৪৮ ঘণ্টার মধ্যে পাঠাও এক্সপ্রেস), ঢাকার বাইরে ৬৪ জেলায় ৳৯০ (২-৪ কার্যদিবস)। এছাড়া আউটলেট থেকে স্টোর পিকআপ সম্পূর্ণ ফ্রি (৳০)।",
    contentEn: "Delivery Charges: Inside Dhaka ৳50 (24–48 hours via Pathao Express), Outside Dhaka across all 64 districts ৳90 (2–4 business days). In-store pickup from any of our 4 flagship outlets is completely FREE (৳0).",
  },
  {
    id: "kb_return_exchange",
    topic: "returns",
    title: "7-Day Doorstep Exchange Policy",
    keywords: ["return", "exchange", "refund", "swap", "ফেরত", "এক্সচেঞ্জ", "রিটার্ন", "বদল", "সাইজ পরিবর্তন"],
    contentBn: "সাইজ বা ফিটিং নিয়ে কোনো সমস্যা হলে পার্সেল পাওয়ার ৭ দিনের মধ্যে ফ্রি ডোরস্টেপ এক্সচেঞ্জ করা যাবে। রাইডার আপনার দরজায় নতুন সাইজ পৌঁছে দিয়ে আগের প্রোডাক্টটি রিসিভ করবে। প্রোডাক্টটি অক্ষত ও ট্যাগসহ থাকতে হবে।",
    contentEn: "We offer a 7-day hassle-free doorstep size & fit exchange. The delivery rider will deliver your replacement piece directly to your door while collecting the original unworn piece with original tags attached.",
  },
  {
    id: "kb_outlets",
    topic: "outlets",
    title: "Showroom Locations & Store Hours",
    keywords: ["outlet", "store", "showroom", "location", "address", "branch", "আউটলেট", "শোরুম", "দোকান", "মিরপুর", "ওয়ারী", "কুমিল্লা", "সিলেট", "মিরপুর ১২", "wari", "cumilla", "sylhet"],
    contentBn: "DEEN-এর ৪টি ফ্ল্যাগশিপ শোরুম রয়েছে:\n১. মিরপুর ১২ সেন্ট্রাল স্টুডিও: লেভেল ৩, রমজাননেছা সুপার মার্কেট, মিরপুর ১২ বাস স্ট্যান্ড, ঢাকা।\n২. ওয়ারী শোরুম: গ্রাউন্ড ফ্লোর, ৪১ র‍্যাংকিন স্ট্রিট, ওয়ারী, ঢাকা।\n৩. কুমিল্লা শোরুম: ৪র্থ তলা, কিউআর টাওয়ার, বাদুড়তলা, কান্দিরপাড়, কুমিল্লা।\n৪. সিলেট শোরুম: ৫৪/এ, লেভেল ২, কুমারপাড়া, জিন্দাবাজার, সিলেট।\nসবগুলো শোরুম প্রতিদিন সকাল ১০:০০ থেকে রাত ৯:৩০ পর্যন্ত খোলা। হটলাইন: 01952-700500।",
    contentEn: "DEEN operates 4 flagship retail showrooms in Bangladesh:\n1. Mirpur 12 Central Studio: Level 3, Ramzannesa Super Market, Mirpur 12 Bus Stand, Dhaka.\n2. Wari Showroom: Ground Floor, 41 Rankin Street, Wari, Dhaka.\n3. Cumilla Showroom: 4th Floor, QR Tower, Badurtola, Kandirpar, Cumilla.\n4. Sylhet Showroom: 54/A, Level 2, Block-A, Kumarpara, Zindabazar, Sylhet.\nOpen daily from 10:00 AM – 9:30 PM. Hotline: 01952-700500.",
  },
  {
    id: "kb_fabric_care",
    topic: "fabric_care",
    title: "Denim & Fabric Care Guide",
    keywords: ["wash", "care", "fabric", "clean", "iron", "ধোয়া", "কেয়ার", "ফ্যাব্রিক", "ওয়াশ", "আয়রন", "রং"],
    contentBn: "সেলভেজ ডেনিম কেয়ার: উল্টো করে ঠাণ্ডা পানিতে ধোবেন। সরাসরি কড়া রোদে না শুকিয়ে ছায়ায় শুকান। কখনোই ব্লিচ ব্যবহার করবেন না। প্রথম কয়েক ওয়াশে আলাদা ধোয়া ভালো যাতে ইন্ডিগো ডাই অক্ষুণ্ণ থাকে।",
    contentEn: "Selvedge Denim Care: Turn garments inside-out and wash in cold water with mild detergent. Line dry in shade; avoid direct harsh sunlight. Never use bleach. Wash separately for the first few washes to preserve artisanal indigo dyes.",
  },
];
