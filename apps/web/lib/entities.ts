import { ExtractedEntities } from "./types";
import { normalize } from "./normalize";

const BANGLA_WORD_NUMBERS: Record<string, number> = {
  ek: 1,
  ekta: 1,
  "১টা": 1,
  "একটি": 1,
  dui: 2,
  duita: 2,
  "২টা": 2,
  "দুইটি": 2,
  tin: 3,
  tinta: 3,
  "৩টা": 3,
  "তিনটি": 3,
  char: 4,
  charta: 4,
  "৪টা": 4,
  "চারটি": 4,
  pach: 5,
  pachta: 5,
  "৫টা": 5,
  "পাঁচটি": 5,
};

/**
 * Extracts key e-commerce entities from raw text.
 * Runs normalize() first to handle Bengali digits.
 */
export function extractEntities(rawText: string): ExtractedEntities {
  if (!rawText) return {};

  const text = normalize(rawText);
  const entities: ExtractedEntities = {};

  // 1. Bangladeshi Phone Number (01[3-9] followed by 8 digits)
  // Also handles variations like +8801[3-9]... or 8801[3-9]...
  const phoneMatch = text.match(/(?:\+?88)?(01[3-9]\d{8})\b/);
  if (phoneMatch) {
    entities.phone = phoneMatch[1];
  }

  // 2. Order Number: explicitly prefixed with #, order, ord, or standalone 4-8 digits
  const orderPrefixMatch = text.match(/(?:#|order\s*#?|ord-?|অর্ডার\s*#?)\s*(\d{4,8})\b/i);
  if (orderPrefixMatch) {
    entities.orderNumber = orderPrefixMatch[1];
  } else {
    // If text is predominantly a standalone 4-8 digit number and not a phone
    const pureNumMatch = text.match(/\b(\d{4,8})\b/);
    if (pureNumMatch && (!entities.phone || entities.phone !== pureNumMatch[1])) {
      entities.orderNumber = pureNumMatch[1];
    }
  }

  // 3. Clothing / Footwear Size:
  // Standard alpha sizes: XS, S, M, L, XL, XXL, 2XL, 3XL, 4XL
  // Numeric waist/shoe sizes: 28 to 46
  const sizeMatch = text.match(/\b(2xl|3xl|4xl|xxl|xl|xs|s|m|l|free|3[0-9]|4[0-6]|2[8-9])\b/i);
  if (sizeMatch) {
    entities.size = sizeMatch[1].toUpperCase();
  }

  // 4. Quantity:
  // Numeric + suffix: e.g. "2 pcs", "1 ta", "3টা", "5 piece"
  const qtySuffixMatch = text.match(/\b(\d+)\s*(?:pcs?|ta|টা|piece|pieces|ti|টি|জোড়া|pair)\b/i);
  if (qtySuffixMatch) {
    const val = parseInt(qtySuffixMatch[1], 10);
    if (!isNaN(val) && val > 0 && val <= 50) {
      entities.quantity = val;
    }
  } else {
    // Check Bengali word quantities
    const lower = text.toLowerCase();
    for (const [word, val] of Object.entries(BANGLA_WORD_NUMBERS)) {
      const wordRegex = new RegExp(`\\b${word}\\b`, "i");
      if (wordRegex.test(lower)) {
        entities.quantity = val;
        break;
      }
    }
  }

  // 5. Price:
  // e.g. "1200 tk", "500 taka", "৳2500", "1500 টাকা", "2000 bdt"
  const priceMatch = text.match(/(?:৳\s*(\d+)|(\d+)\s*(?:tk|taka|৳|টাকা|bdt))\b/i);
  if (priceMatch) {
    const pStr = priceMatch[1] || priceMatch[2];
    const pVal = parseInt(pStr, 10);
    if (!isNaN(pVal)) {
      entities.price = pVal;
    }
  }

  // 6. Email:
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    entities.email = emailMatch[0].toLowerCase();
  }

  return entities;
}
