/**
 * Text normalization utility for Bangladeshi e-commerce NLP.
 * Maps Bangla digits to Latin (০-৯ -> 0-9), collapses whitespace, and trims.
 */

const BANGLA_TO_LATIN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/**
 * Normalizes user input text:
 * 1. Converts Bengali digits (০-৯) to Latin digits (0-9).
 * 2. Normalizes special Bengali punctuation / zero-width characters.
 * 3. Trims and collapses multiple spaces into a single space.
 */
export function normalize(text: string): string {
  if (!text || typeof text !== "string") return "";

  // Replace Bengali digits with Latin digits
  let normalized = text.replace(/[\u09E6-\u09EF]/g, (digit) => {
    return BANGLA_TO_LATIN_DIGITS[digit] ?? digit;
  });

  // Strip zero-width non-joiners / joiners often introduced by Bangla mobile keyboards
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Normalize common Bangla / English separators (e.g. । to period, multiple dashes to single)
  normalized = normalized.replace(/।/g, ".");

  // Collapse multiple whitespaces and trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Normalizes text and converts to lowercase for case-insensitive matching.
 */
export function normalizeLower(text: string): string {
  return normalize(text).toLowerCase();
}
