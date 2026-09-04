/**
 * DEEN Commerce Knowledge Base
 * Indexes static brand knowledge, policies, store locations, selvedge heritage,
 * payment gateways, dynamic campaign tiers, and fabric specs.
 * Used for RAG retrieval combined with live WooCommerce catalog state.
 */

export interface KnowledgeItem {
  id: string;
  topic:
    | "sizing"
    | "delivery"
    | "returns"
    | "outlets"
    | "fabric_care"
    | "heritage"
    | "payment"
    | "campaigns"
    | "b2b"
    | "contact"
    | "general";
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
    keywords: [
      "size",
      "fit",
      "waist",
      "inches",
      "সাইজ",
      "ফিট",
      "কোমর",
      "মাপ",
      "tight",
      "loose",
      "slim",
      "regular",
      "inseam",
      "straight",
      "২৮",
      "৩০",
      "৩২",
      "৩৪",
      "৩৬",
      "৩৮",
      "28",
      "30",
      "32",
      "34",
      "36",
      "38",
    ],
    contentBn:
      "DEEN-এর সেলভেজ ও প্রিমিয়াম জিন্সগুলো ট্রু-টু-সাইজ (True to Size)। কোমর স্ট্যান্ডার্ড ইঞ্চি অনুযায়ী প্রস্তুত (২৮, ৩০, ৩২, ৩৪, ৩৬, ৩৮)। স্লিম-স্ট্রেইট ফিটের জন্য আপনার স্বাভাবিক কোমরের মাপ নির্বাচন করুন। যদি আপনি কিছুটা রিল্যাক্সড বা আরামদায়ক ফিট চান, তবে ১ সাইজ বড় নিতে পারেন। আমাদের জিন্সের স্ট্যান্ডার্ড ইনসিম ৩২ ইঞ্চি। ডেলিভারির পর সাইজ না মিললে রয়েছে সম্পূর্ণ ফ্রি ৭ দিনের ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা!",
    contentEn:
      "DEEN jeans are crafted strictly true-to-size based on standard waist inches (28, 30, 32, 34, 36, 38) with standard 32\" inseam length. For our signature slim-straight cut, pick your exact waist size. If you prefer a relaxed tapered feel, we recommend sizing up by one size. Backed by our complimentary 7-day doorstep size exchange guarantee!",
  },
  {
    id: "kb_sizing_panjabi",
    topic: "sizing",
    title: "Panjabi Sizing Guide",
    keywords: [
      "panjabi",
      "punjabi",
      "chest",
      "length",
      "পাঞ্জাবি",
      "বুক",
      "লম্বা",
      "সেমি-লং",
      "semi-long",
      "পাঞ্জাবির মাপ",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
    ],
    contentBn:
      "DEEN প্রিমিয়াম পাঞ্জাবি কালেকশন আধুনিক সেমি-লং (Semi-Long) কাটিংয়ে তৈরি:\n• S (৩৮\" বুক, ৪০\" দৈর্ঘ্য)\n• M (৪০\" বুক, ৪২\" দৈর্ঘ্য)\n• L (৪২\" বুক, ৪৪\" দৈর্ঘ্য)\n• XL (৪৪\" বুক, ৪৫\" দৈর্ঘ্য)\n• XXL (৪৬\" বুক, ৪৬\" দৈর্ঘ্য)\n১০০% ফাইন সুতি ও জ্যাকার্ড উইভ ফেব্রিকের কারণে গরমের দিনেও অত্যন্ত আরামদায়ক।",
    contentEn:
      "DEEN premium panjabis are tailored in an elegant contemporary semi-long silhouette:\n• Size S: 38\" Chest, 40\" Length\n• Size M: 40\" Chest, 42\" Length\n• Size L: 42\" Chest, 44\" Length\n• Size XL: 44\" Chest, 45\" Length\n• Size XXL: 46\" Chest, 46\" Length\nWoven from 100% breathable fine-combed cotton and luxury jacquards perfect for everyday comfort and festive occasions.",
  },
  {
    id: "kb_sizing_shirts",
    topic: "sizing",
    title: "Shirts & Polos Sizing Guide",
    keywords: [
      "shirt",
      "polo",
      "t-shirt",
      "tee",
      "শার্ট",
      "পোলো",
      "টি-শার্ট",
      "কলার",
      "collar",
      "chest size",
      "শার্টের মাপ",
    ],
    contentBn:
      "DEEN প্রিমিয়াম ক্যাজুয়াল শার্ট ও পোলো শার্টের সাইজ পরিমাপ:\n• S (স্মল): ৩৮\" বুক, ১৫\" কলার\n• M (মিডিয়াম): ৪০\" বুক, ১৫.৫\" কলার\n• L (লার্জ): ৪২\" বুক, ১৬\" কলার\n• XL (এক্সট্রা লার্জ): ৪৪\" বুক, ১৬.৫\" কলার\n• XXL: ৪৬\" বুক, ১৭\" কলার\n১০০% প্রি-শ্রাঙ্ক চিরুনি সুতি (Combed Cotton) কাপড়ে তৈরি, ধোয়ার পর কুঁচকাবে বা সাইজ ছোট হবে না।",
    contentEn:
      "DEEN tailored casual shirts and pique polo sizing:\n• S (Small): 38\" Chest, 15\" Collar\n• M (Medium): 40\" Chest, 15.5\" Collar\n• L (Large): 42\" Chest, 16\" Collar\n• XL (Extra Large): 44\" Chest, 16.5\" Collar\n• XXL: 46\" Chest, 17\" Collar\nConstructed from 100% pre-shrunk long-staple combed cotton engineered against shrinkage or collar curl.",
  },
  {
    id: "kb_delivery_policy",
    topic: "delivery",
    title: "64-District Delivery Charges & Timelines",
    keywords: [
      "delivery",
      "shipping",
      "charge",
      "cost",
      "pathao",
      "courier",
      "fee",
      "ডেলিভারি",
      "চার্জ",
      "খরচ",
      "সময়",
      "কত দিন",
      "কুরিয়ার",
      "পাঠাও",
      "ঢাকা",
      "চট্টগ্রাম",
      "সিলেট",
      "রাজশাহী",
      "খুলনা",
      "বরিশাল",
      "রংপুর",
      "ময়মনসিংহ",
    ],
    contentBn:
      "DEEN দেশব্যাপী ৬৪ জেলাতেই নির্ভরযোগ্য ডেলিভারি সেবা প্রদান করে:\n• ঢাকা সিটির ভেতর: ৳৫০ ডেলিভারি চার্জ (২৪-৪৮ ঘণ্টার মধ্যে পাঠাও এক্সপ্রেস হোম ডেলিভারি)।\n• ঢাকার বাইরে দেশব্যাপী ৬৪ জেলায়: ৳৯০ ডেলিভারি চার্জ (২-৪ কার্যদিবসের মধ্যে সরাসরি হোম ডেলিভারি)।\n• ফ্ল্যাগশিপ শোরুম পিকআপ: সম্পূর্ণ ফ্রি (৳০)।\nক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। রেগুলার অর্ডারে কোনো অগ্রিম ডেলিভারি ফি লাগে না!",
    contentEn:
      "DEEN delivers to all 64 districts across Bangladesh via Pathao Logistics:\n• Inside Dhaka Metro: ৳50 delivery fee (24–48 hours via Pathao Express Home Delivery).\n• Outside Dhaka (all 64 districts): ৳90 delivery fee (2–4 business days doorstep delivery).\n• Flagship Showroom Pickup: 100% FREE (৳0) from any of our 4 retail studios.\nCash on Delivery (COD) is available nationwide with zero advance fee on standard deliveries!",
  },
  {
    id: "kb_return_exchange",
    topic: "returns",
    title: "7-Day Hassle-Free Doorstep Exchange Policy",
    keywords: [
      "return",
      "exchange",
      "refund",
      "swap",
      "doorstep",
      "ফেরত",
      "এক্সচেঞ্জ",
      "রিটার্ন",
      "বদল",
      "সাইজ পরিবর্তন",
      "সাইজ না মিললে",
      "টাকা ফেরত",
    ],
    contentBn:
      "সাইজ বা ফিটিং নিয়ে কোনো দ্বিধা থাকলে পার্সেল রিসিভের ৭ দিনের মধ্যে সম্পূর্ণ ফ্রি ডোরস্টেপ সাইজ এক্সচেঞ্জ সুবিধা পাবেন!\nডোরস্টেপ এক্সচেঞ্জের নিয়ম:\n১. কুরিয়ার অফিসে দৌড়াদৌড়ি করতে হবে না।\n২. পাঠাও ডেলিভারি রাইডার সরাসরি আপনার ঠিকানায় নতুন সাইজ পৌঁছে দেবে এবং একই সাথে আগের অক্ষত ও ট্যাগযুক্ত প্রোডাক্টটি রিসিভ করবে।\n৩. প্রোডাক্টটি অক্ষত ও মূল ট্যাগসহ থাকতে হবে।",
    contentEn:
      "We provide a complimentary 7-day hassle-free doorstep size & fit exchange across all 64 districts!\nHow doorstep exchange works:\n1. No need to visit courier hubs or post offices.\n2. A Pathao delivery rider delivers your replacement piece directly to your door while collecting the original unworn piece with original tags attached in a single seamless trip.\n3. Items must be unworn, unwashed, and retain original brand tags.",
  },
  {
    id: "kb_outlets",
    topic: "outlets",
    title: "4 Retail Flagship Showrooms & Store Hours",
    keywords: [
      "outlet",
      "store",
      "showroom",
      "location",
      "address",
      "branch",
      "hours",
      "open",
      "আউটলেট",
      "শোরুম",
      "দোকান",
      "মিরপুর",
      "ওয়ারী",
      "কুমিল্লা",
      "সিলেট",
      "মিরপুর ১২",
      "wari",
      "cumilla",
      "sylhet",
      "মিরপুর শোরুম",
    ],
    contentBn:
      "DEEN-এর ৪টি প্রিমিয়াম ফ্ল্যাগশিপ শোরুম রয়েছে:\n১. মিরপুর ১২ সেন্ট্রাল স্টুডিও: লেভেল ৩, রমজাননেছা সুপার মার্কেট, মিরপুর ১২ বাস স্ট্যান্ড, ঢাকা।\n২. ওয়ারী শোরুম: গ্রাউন্ড ফ্লোর, ৪১ র‍্যাংকিন স্ট্রিট, ওয়ারী, ঢাকা দক্ষিণ।\n৩. কুমিল্লা শোরুম: ৪র্থ তলা, কিউআর টাওয়ার, বাদুড়তলা, কান্দিরপাড়, কুমিল্লা।\n৪. সিলেট শোরুম: ৫৪/এ, লেভেল ২, কুমারপাড়া, জিন্দাবাজার, সিলেট।\nসবগুলো শোরুম সপ্তাহে ৭ দিন সকাল ১০:০০ থেকে রাত ৯:৩০ পর্যন্ত খোলা। হেল্পলাইন ও হোয়াটসঅ্যাপ: 01952-700500।",
    contentEn:
      "DEEN operates 4 retail flagship showrooms in Bangladesh:\n1. Mirpur 12 Central Studio: Level 3, Ramzannesa Super Market, Mirpur 12 Bus Stand, Dhaka.\n2. Wari Showroom: Ground Floor, 41 Rankin Street, Wari, Dhaka South.\n3. Cumilla Showroom: 4th Floor, QR Tower, Badurtola, Kandirpar, Cumilla.\n4. Sylhet Showroom: 54/A, Level 2, Block-A, Kumarpara, Zindabazar, Sylhet.\nAll retail outlets are open 7 days a week from 10:00 AM – 9:30 PM. Hotline & WhatsApp: 01952-700500.",
  },
  {
    id: "kb_fabric_care",
    topic: "fabric_care",
    title: "Denim & Fabric Wash and Care Guide",
    keywords: [
      "wash",
      "care",
      "fabric",
      "clean",
      "iron",
      "shrink",
      "dry",
      "ধোয়া",
      "কেয়ার",
      "ফ্যাব্রিক",
      "ওয়াশ",
      "আয়রন",
      "রং",
      "ব্লিচ",
      "কালার",
    ],
    contentBn:
      "সেলভেজ ও র-ডেনিম যত্নের নিয়ম:\n১. উল্টো করে (Inside-Out) ঠাণ্ডা পানিতে মাইল্ড ডিটারজেন্ট দিয়ে ধোবেন।\n২. কখনোই ব্লিচ বা কঠোর রাসায়নিক ব্যবহার করবেন না।\n৩. সরাসরি কড়া রোদে না শুকিয়ে ছায়াযুক্ত জায়গায় ঝুলিয়ে বাতাসে শুকান।\n৪. ইন্ডিগো রঙের গভীরতা টিকিয়ে রাখতে প্রথম ১-২ বার আলাদা ধোবেন। অল্প লবণ বা ভিনেগার মেশানো ঠাণ্ডা পানিতে ভিজিয়ে রাখলে রঙ দীর্ঘস্থায়ী হয়।\n৫. ওয়াশিং মেশিনের বদলে হাতে ওয়াশ করা ডেনিমের ফেডিং কন্ট্রাস্ট চমৎকার রাখে।",
    contentEn:
      "Selvedge & Raw Denim Care Guide:\n1. Always turn garments inside-out and wash in cold water using mild detergent.\n2. Never use bleach, enzyme boosters, or fabric softeners.\n3. Line dry in shade; avoid tumble dryers and direct blazing sun to prevent shrinkage and keep the indigo deep.\n4. Wash separately for initial cycles as natural indigo dye stabilizes.\n5. Minimal cold-water washing preserves the crisp honeycomb and whisker fading journey uniquely personal to you.",
  },
  {
    id: "kb_selvedge_heritage",
    topic: "heritage",
    title: "Selvedge Denim Craftsmanship & Heritage",
    keywords: [
      "selvedge",
      "selvage",
      "shuttle loom",
      "raw denim",
      "japan",
      "indigo",
      "weight",
      "oz",
      "সেলভেজ",
      "লুম",
      "ডেনিম",
      "ইন্ডিগো",
      "সুতা",
      "হ্যান্ডক্রাফট",
      "সানফোরাইজড",
      "sanforized",
    ],
    contentBn:
      "DEEN সেলভেজ ডেনিম ঐতিহ্যবাহী শাটল লুম (Shuttle Loom)-এ বুনা প্রিমিয়াম ফেব্রিক দ্বারা নির্মিত।\n• রেড-লাইন সেলভেজ আইডি (Red-Line Selvedge ID) যা বটম কফ ফোল্ড করলে স্পষ্ট দৃশ্যমান হয়।\n• ১২.৫ থেকে ১৪.৫ আউন্স (oz) মিড ও হেভিওয়েট খাঁটি লং-স্ট্যাপল কটন ফেব্রিক।\n• ১০০% সানফোরাইজড (Sanforized) যাতে ধোয়ার পর সাইজ ছোট বা লেগ-টুইস্ট না হয়।\n• ব্যবহারের সাথে সাথে ব্যক্তির শরীরের মাপ অনুযায়ী অনন্য ভিস্কার (Whiskers) এবং ফেডিং তৈরি করে।",
    contentEn:
      "DEEN Selvedge Denim represents pure artisanal heritage woven on vintage shuttle looms:\n• Finished with our signature Red-Line Selvedge ticker visible upon cuffing.\n• Robust 12.5 oz to 14.5 oz 100% long-staple ring-spun cotton fabric weights.\n• Pre-sanforized construction to eliminate severe post-wash shrinkage and leg twisting.\n• Ages organically over time, developing unique honeycombs, whiskers, and personalized patina.",
  },
  {
    id: "kb_payment_methods",
    topic: "payment",
    title: "Payment Methods, COD & 0% EMI",
    keywords: [
      "payment",
      "cod",
      "cash on delivery",
      "bkash",
      "nagad",
      "rocket",
      "card",
      "credit card",
      "debit card",
      "visa",
      "mastercard",
      "amex",
      "emi",
      "ক্যাশ অন ডেলিভারি",
      "বিকাশ",
      "নগদ",
      "রকেট",
      "কার্ড",
      "ইএমআই",
      "কিস্তি",
    ],
    contentBn:
      "DEEN-এ পেমেন্ট করার একাধিক সহজ ও নিরাপদ মাধ্যম রয়েছে:\n১. ক্যাশ অন ডেলিভারি (COD): পার্সেল হাতে পেয়ে মূল্য পরিশোধ করুন (দেশব্যাপী ৬৪ জেলায় প্রযোজ্য)।\n২. মোবাইল ফিন্যান্সিয়াল সার্ভিস: বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket)।\n৩. ক্রেডিট ও ডেবিট কার্ড: ভিসা (Visa), মাস্টারকার্ড (MasterCard), ইউনিয়নপে এবং সিটি ব্যাংক আমেরিকান এক্সপ্রেস (City Amex)।\n৪. ০% ইএমআই (0% EMI): সিটি ব্যাংক, ব্র্যাক ব্যাংক, ইস্টার্ন ব্যাংক ও স্ট্যান্ডার্ড চার্টার্ড কার্ডে ৳৫,০০০ টাকার উপরের কেনাকাটায় ৩ থেকে ৬ মাসের সহজ কিস্তি সুবিধা।",
    contentEn:
      "DEEN offers diverse, 100% secure payment gateways:\n1. Cash on Delivery (COD): Available across all 64 districts with zero advance deposit required on standard parcels.\n2. Mobile Money: Instant bKash, Nagad, and Rocket payments.\n3. Credit / Debit Cards: Visa, MasterCard, UnionPay, and City Bank American Express.\n4. 0% Interest EMI: Available on orders above ৳5,000 for 3 to 6 months with City Bank Amex, BRAC Bank, Eastern Bank (EBL), and Standard Chartered cards.",
  },
  {
    id: "kb_campaigns_cashback",
    topic: "campaigns",
    title: "Dynamic Cashback Tiers & Bank Card Discounts",
    keywords: [
      "offer",
      "campaign",
      "cashback",
      "discount",
      "coupon",
      "promo",
      "bank offer",
      "অফার",
      "ক্যাম্পেইন",
      "ক্যাশব্যাক",
      "ডিসকাউন্ট",
      "কুপন",
      "প্রোমো",
      "ছাড়",
      "সেভিংস",
    ],
    contentBn:
      "DEEN-এর চলমান আকর্ষণীয় ডিসকাউন্ট ও ক্যাশব্যাক অফারসমূহ:\n১. ইনস্ট্যান্ট ক্যাশব্যাক টিয়ার (চেকআউটে অটোমেটিক প্রযোজ্য):\n   • ৳২,৫০০+ অর্ডারে ৳৫০০ ইনস্ট্যান্ট ক্যাশব্যাক!\n   • ৳৩,০০০+ অর্ডারে ৳৭০০ ইনস্ট্যান্ট ক্যাশব্যাক!\n২. ব্যাংক কার্ড ডিসকাউন্ট:\n   • সিটি ব্যাংক অ্যামেক্স (City Amex): ১০% ছাড় (কুপন কোড: AMEXDEEN, সর্বোচ্চ ৳৫০০)।\n   • ব্র্যাক ব্যাংক কার্ড (BRAC Bank): ১০% ছাড় (কুপন কোড: BRAC10, সর্বোচ্চ ৳৬০০)।\n   • ইস্টার্ন ব্যাংক (EBL): ১০% ছাড় (কুপন কোড: EBL10, সর্বোচ্চ ৳৫০০)।\n৩. আউটলেট পিকআপে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (৳০)।",
    contentEn:
      "DEEN's active campaigns and automated tier savings:\n1. Instant Checkout Cashback (applied automatically at checkout):\n   • Spend ৳2,500+ → Receive ৳500 Instant Cashback!\n   • Spend ৳3,000+ → Receive ৳700 Instant Cashback!\n2. Bank Card Partner Savings:\n   • City Bank Amex: 10% instant discount (Coupon: AMEXDEEN, up to ৳500 savings).\n   • BRAC Bank: 10% instant discount (Coupon: BRAC10, up to ৳600 savings).\n   • Eastern Bank (EBL): 10% instant discount (Coupon: EBL10, up to ৳500 savings).\n3. In-store showroom pickup has zero delivery fee (৳0).",
  },
  {
    id: "kb_corporate_b2b",
    topic: "b2b",
    title: "Corporate Bulk Orders & Custom Denim Manufacturing",
    keywords: [
      "corporate",
      "bulk",
      "b2b",
      "wholesale",
      "uniform",
      "custom",
      "পাইকারি",
      "কর্পোরেট",
      "বাল্ক",
      "অর্ডার",
      "ইউনিফর্ম",
      "কাস্টমাইজ",
    ],
    contentBn:
      "DEEN প্রতিষ্ঠান ও করপোরেট ক্লায়েন্টদের জন্য কাস্টমাইজড বাল্ক অর্ডার এবং প্রাতিষ্ঠানিক ইউনিফর্ম সেবা প্রদান করে:\n• সেলভেজ ডেনিম, প্রিমিয়াম শার্ট ও এমব্রয়ডারি পোলো কাস্টমাইজেশন সুবিধা।\n• ন্যূনতম অর্ডার কোয়ান্টিটি (MOQ): ৫০ পিস।\n• স্পেশাল ভলিউম প্রাইসিং এবং ডেডিকেটেড রিলেশনশিপ ম্যানেজার।\nযোগাযোগ করুন: support@deencommerce.com অথবা কল করুন আমাদের করপোরেট হেল্পলাইনে: 01952-700500।",
    contentEn:
      "DEEN Corporate Desk provides tailored apparel & bulk denim production for enterprises:\n• Customization across premium selvedge jeans, formal/casual shirts, and branded polos.\n• Minimum Order Quantity (MOQ): 50 pieces.\n• Tiered volume pricing and dedicated business account manager.\nInquire via email at support@deencommerce.com or call our corporate hotline at 01952-700500.",
  },
  {
    id: "kb_contact_support",
    topic: "contact",
    title: "Customer Concierge, Hotline & WhatsApp Support",
    keywords: [
      "contact",
      "support",
      "phone",
      "whatsapp",
      "call",
      "hotline",
      "help",
      "যোগাযোগ",
      "সাপোর্ট",
      "ফোন",
      "হোয়াটসঅ্যাপ",
      "কল",
      "হেল্পলাইন",
      "নাম্বার",
      "কথা বলতে চাই",
    ],
    contentBn:
      "DEEN কাস্টমার কেয়ার ও স্টাইলিস্টদের সাথে সরাসরি যোগাযোগ করার মাধ্যমসমূহ:\n• সরাসরি হটলাইন: 01952-700500 (প্রতিদিন সকাল ১০:০০ থেকে রাত ১০:০০)।\n• অফিসিয়াল হোয়াটসঅ্যাপ: https://wa.me/8801952700500\n• ইমেইল: support@deencommerce.com\n• প্রধান কার্যালয়: মিরপুর ১২ সেন্ট্রাল স্টুডিও, ঢাকা।",
    contentEn:
      "Connect with DEEN Personal Stylists & Customer Concierge:\n• Dedicated Hotline: 01952-700500 (Open daily from 10:00 AM – 10:00 PM).\n• Official WhatsApp Chat: https://wa.me/8801952700500\n• Official Email: support@deencommerce.com\n• Central Studio: Level 3, Ramzannesa Super Market, Mirpur 12 Bus Stand, Dhaka.",
  },
];
