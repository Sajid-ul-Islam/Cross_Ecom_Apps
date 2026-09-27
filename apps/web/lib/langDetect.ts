import { Lang } from "./types";
import { normalizeLower } from "./normalize";

/**
 * Bengali script Unicode block: U+0980 to U+09FF
 */
const BENGALI_UNICODE_REGEX = /[\u0980-\u09FF]/;

/**
 * Common Banglish phonetic keywords and functional words in Bangladeshi e-commerce.
 */
/**
 * Distinct Banglish phonetic words that do not exist in standard English.
 */
const DISTINCT_BANGLISH_WORDS = new Set([
  // Greetings / Salutations
  "salam", "assalam", "assalamu", "walaikum", "alaikum",
  "bhai", "vai", "bro", "apa", "apu", "didi", "dada", "janab",

  // Inquiries / Pricing / Interrogatives
  "koto", "dam", "daam", "rate", "kom", "beshi", "komano",
  "ache", "achen", "aso", "nei", "nai", "hobe", "hobena", "thakbe",
  "pabo", "paoya", "pawa", "jabe", "jabena", "kothay", "kobe", "ashbe", "asbe",
  "kivabe", "kemne", "keno", "ki", "eta", "ota", "ei", "oi",

  // Want / Need / Action verbs
  "chai", "lagbe", "lagbo", "lagche", "kinbo", "nibo", "nibona", "dibo", "dite",
  "parben", "parbo", "dorkar", "proyojon", "pochondo", "pochontho",
  "dekhan", "dehan", "dekhaw", "dekhao", "dekhte", "shunchen", "bolen", "bolte", "bolbo",
  "janan", "janao", "koro", "korbo", "korun", "koren", "korte", "pathao", "pathan", "pathaben",
  "pelam", "paina", "paisina", "pailam", "paise", "porbo", "jabo", "khujchi", "khujtechi",

  // Quantifiers / Particles / Pronouns
  "ekta", "duita", "tinta", "charta", "koita", "ta", "ti",
  "ami", "amra", "apni", "apnara", "tumi", "amar", "amader", "apnar", "apnader",
  "ha", "haa", "na", "accha", "acha", "thik", "shob", "aro",

  // Local terms
  "thikana", "barir", "basha", "gram", "bhalo", "valo", "shart", "sharter", "jama"
]);

/**
 * Common English grammatical and functional words.
 */
const ENGLISH_FUNCTION_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them",
  "what", "whats", "which", "who", "whom", "this", "that", "these", "those",
  "am", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "should",
  "want", "need", "like", "order", "buy", "show", "give", "tell", "check", "find", "search",
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "from", "of",
  "how", "much", "many", "status", "please", "help", "hello", "hi", "hey", "good"
]);

/**
 * Detects whether the input is in Bengali script ("bn"), Banglish ("banglish"), or English ("en").
 */
export function detectLanguage(text: string): Lang {
  if (!text || typeof text !== "string") return "en";

  // 1. If text contains Bengali script characters -> "bn"
  if (BENGALI_UNICODE_REGEX.test(text)) {
    return "bn";
  }

  // 2. Tokenize into words
  const normalized = normalizeLower(text);
  const words = normalized.split(/[^a-zA-Z0-9]+/).filter(Boolean);

  if (words.length === 0) return "en";

  // 3. If any distinct phonetic Bengali word is found -> "banglish"
  for (const word of words) {
    if (DISTINCT_BANGLISH_WORDS.has(word)) {
      return "banglish";
    }
  }

  // 4. Default to English
  return "en";
}
