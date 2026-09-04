/**
 * DEEN Mobile — Occasion Greeting & Theme Engine
 * Automatically detects and formats greetings for:
 * 1. Muslim Occasions: Eid-ul-Fitr, Eid-ul-Adha, Ramadan, Jummah Mubarak
 * 2. Bangladesh National Days: Pohela Boishakh, Independence Day, Victory Day, Ekushey
 */

export interface FestivalTheme {
  id: string;
  name: string;
  motif: string;
  titlebarText: string;
  title: string;
  subtitle: string;
  greeting: string;
  themePrimary: string;
  themeSecondary: string;
  actionLabel: string;
  actionUrl: string;
}

export const FESTIVALS: Record<string, FestivalTheme> = {
  eid_ul_fitr: {
    id: "eid_ul_fitr",
    name: "Eid-ul-Fitr",
    motif: "🌙✨",
    titlebarText: "🌙 Eid Mubarak",
    title: "Eid Mubarak!",
    subtitle: "Joyous blessings, timeless elegance & peace",
    greeting: "DEEN wishes you and your family a blessed Eid full of peace, happiness & prosperity. Explore our celebratory menswear crafted with care.",
    themePrimary: "#10B981",
    themeSecondary: "#F59E0B",
    actionLabel: "Explore Eid Collection",
    actionUrl: "/(tabs)/shop",
  },
  eid_ul_adha: {
    id: "eid_ul_adha",
    name: "Eid-ul-Adha",
    motif: "🕋✨",
    titlebarText: "🕋 Eid-ul-Adha Mubarak",
    title: "Eid-ul-Adha Mubarak!",
    subtitle: "Sacrifice, generosity & timeless craftsmanship",
    greeting: "May your Eid-ul-Adha be blessed with happiness, purity of heart, and memorable celebrations.",
    themePrimary: "#2A3680",
    themeSecondary: "#F59E0B",
    actionLabel: "Shop Eid Collection",
    actionUrl: "/(tabs)/shop",
  },
  ramadan: {
    id: "ramadan",
    name: "Ramadan Mubarak",
    motif: "🌙",
    titlebarText: "🌙 Ramadan Mubarak",
    title: "Ramadan Kareem",
    subtitle: "A blessed month of spiritual reflection & barakah",
    greeting: "Wishing you a serene and spiritually uplifting Ramadan. May this sacred month bring peace and blessings to your home.",
    themePrimary: "#059669",
    themeSecondary: "#D97706",
    actionLabel: "Explore Ramadan Collection",
    actionUrl: "/(tabs)/shop",
  },
  jumma: {
    id: "jumma",
    name: "Jummah Mubarak",
    motif: "🕌",
    titlebarText: "🕌 Jumma Mubarak",
    title: "Jummah Mubarak!",
    subtitle: "Have a serene & blessed Friday",
    greeting: "DEEN wishes you and your loved ones a peaceful and rewarding Friday. Check out our pure cotton Friday Panjabis.",
    themePrimary: "#059669",
    themeSecondary: "#D49439",
    actionLabel: "Shop Heritage Panjabis",
    actionUrl: "/(tabs)/shop",
  },
  pohela_boishakh: {
    id: "pohela_boishakh",
    name: "Pohela Boishakh",
    motif: "🌸🎨",
    titlebarText: "🌸 শুভ নববর্ষ",
    title: "শুভ নববর্ষ ১৪৩২!",
    subtitle: "Celebrating Bengali heritage, art & new beginnings",
    greeting: "নতুন বছরের নতুন আলোয় উদ্ভাসিত হোক প্রতিটি দিন। DEEN পরিবারের পক্ষ থেকে আপনাকে ও আপনার পরিবারকে শুভ নববর্ষের আন্তরিক শুভেচ্ছা!",
    themePrimary: "#E11D48",
    themeSecondary: "#F59E0B",
    actionLabel: "Explore Boishakhi Collection",
    actionUrl: "/(tabs)/shop",
  },
  independence_day: {
    id: "independence_day",
    name: "Independence Day",
    motif: "🇧🇩",
    titlebarText: "🇧🇩 স্বাধীনতা দিবস",
    title: "মহান স্বাধীনতা দিবস",
    subtitle: "২৬শে মার্চ · বীর মুক্তিযোদ্ধাদের প্রতি বিনম্র শ্রদ্ধা",
    greeting: "স্বাধীনতার চেতনায় সমুন্নত থাকুক প্রতিটি পদক্ষেপ। DEEN পরিবারের পক্ষ থেকে মহান স্বাধীনতা দিবসের রক্তিম শুভেচ্ছা ও সশ্রদ্ধ সালাম।",
    themePrimary: "#006A4E",
    themeSecondary: "#F42A41",
    actionLabel: "Explore Bangladeshi Denim",
    actionUrl: "/(tabs)/shop",
  },
  victory_day: {
    id: "victory_day",
    name: "Victory Day",
    motif: "🇧🇩",
    titlebarText: "🇧🇩 বিজয় দিবস",
    title: "মহান বিজয় দিবস",
    subtitle: "১৬ই ডিসেম্বর · বীর শহীদদের প্রতি সশ্রদ্ধ সালাম",
    greeting: "বিজয়ের গৌরবে উজ্জ্বল হোক প্রতিটি দিন। আত্মত্যাগী সকল বীর শহীদ ও বীরাঙ্গনাদের প্রতি DEEN পরিবারের বিনম্র শ্রদ্ধাঞ্জলি।",
    themePrimary: "#006A4E",
    themeSecondary: "#F42A41",
    actionLabel: "Proudly Crafted in Dhaka",
    actionUrl: "/(tabs)/shop",
  },
  language_day: {
    id: "language_day",
    name: "Ekushey February",
    motif: "🌺",
    titlebarText: "🌺 অমর একুশে",
    title: "অমর একুশে ফেব্রুয়ারি",
    subtitle: "আন্তর্জাতিক মাতৃভাষা দিবস · ভাষা শহীদদের স্মরণে",
    greeting: "রক্তে রাঙানো একুশে ফেব্রুয়ারি। বাংলা ভাষার আত্মমর্যাদা প্রতিষ্ঠায় আত্মোৎসর্গকারী সকল ভাষা শহীদদের প্রতি গভীর শ্রদ্ধা।",
    themePrimary: "#DC2626",
    themeSecondary: "#1F2937",
    actionLabel: "Explore Heritage Collection",
    actionUrl: "/(tabs)/shop",
  },
};

/**
 * Detect current active festival based on Bangladesh Standard Time (UTC+6)
 */
export function getCurrentFestival(overrideId?: string): FestivalTheme | null {
  if (overrideId && FESTIVALS[overrideId]) {
    return FESTIVALS[overrideId];
  }

  // Calculate Bangladesh Standard Time (UTC+6)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bdTime = new Date(utc + 3600000 * 6);

  const month = bdTime.getMonth() + 1; // 1-indexed (1 = Jan, 12 = Dec)
  const day = bdTime.getDate();
  const dayOfWeek = bdTime.getDay(); // 0 = Sun, 5 = Fri

  // 1. Bangladesh National Days
  if (month === 2 && (day === 20 || day === 21 || day === 22)) {
    return FESTIVALS.language_day;
  }
  if (month === 3 && (day >= 25 && day <= 27)) {
    return FESTIVALS.independence_day;
  }
  if (month === 4 && (day >= 13 && day <= 16)) {
    return FESTIVALS.pohela_boishakh;
  }
  if (month === 12 && (day >= 15 && day <= 17)) {
    return FESTIVALS.victory_day;
  }

  // 2. Approximate Muslim Calendars for 2026/2027
  // Ramadan 2026: ~Feb 18 to Mar 19
  if ((month === 2 && day >= 18) || (month === 3 && day <= 18)) {
    return FESTIVALS.ramadan;
  }
  // Eid-ul-Fitr 2026: ~Mar 19 to Mar 23
  if (month === 3 && day >= 19 && day <= 23) {
    return FESTIVALS.eid_ul_fitr;
  }
  // Eid-ul-Adha 2026: ~May 26 to May 30
  if (month === 5 && day >= 26 && day <= 30) {
    return FESTIVALS.eid_ul_adha;
  }

  // 3. Friday (Jummah Mubarak in Bangladesh)
  if (dayOfWeek === 5) {
    return FESTIVALS.jumma;
  }

  // Default fallback during festive/launch periods: Jumma or Eid
  return FESTIVALS.eid_ul_fitr;
}
