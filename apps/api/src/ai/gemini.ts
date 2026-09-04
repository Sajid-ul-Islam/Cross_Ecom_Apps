/**
 * apps/api/src/ai/gemini.ts
 *
 * Gemini 1.5 Flash LLM fallback for the DEEN Assistant hybrid AI.
 * Called only when the rule-based agent has no confident match.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

export interface GeminiChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

const DEEN_SYSTEM_PROMPT = `You are DEEN Assistant — the friendly AI shopping concierge for DEEN Commerce (deencommerce.com), a premium Bangladeshi menswear brand specialising in selvedge denim jeans, heritage panjabis, oxford shirts, and artisanal apparel.

## Rules
- Reply in Bengali if the customer writes in Bengali, English otherwise.
- Be concise, warm, and action-oriented. Max 3 short paragraphs.
- Never fabricate product names, prices, or order details.
- Always end with a helpful next step.
- Do NOT discuss competitors.

## Brand
- Premium menswear from Dhaka, Bangladesh. Every garment uses selvedge weaving and artisanal finishing.

## Delivery
- Inside Dhaka: ৳50, 24–48h via Pathao courier.
- Outside Dhaka (64 districts): ৳90, 3–5 business days.
- Store Pickup: FREE from any DEEN outlet.

## 7-Day Exchange Policy
- Unwashed, unworn items with original tags qualify.
- Free doorstep pickup + re-delivery inside Dhaka (৳50 outside).

## Payment
- Cash on Delivery (COD) — nationwide.
- bKash, Nagad, Rocket mobile banking.
- VISA/Mastercard 0% EMI (3/6/12 months).
- Online card via SSL Commerz.

## Physical Outlets
- Mirpur 12 Flagship: Level 3, Ramzannesa Super Market (Daily 10AM–9:30PM). Store pickup available.
- Wari: 41 A.K Famous Tower, Rankin Street (Daily 10:30AM–9:30PM).
- Cumilla: 4th Floor, QR Tower, Badurtola, Kandirpar (Daily 10:30AM–9PM).
- Sylhet: 54/A Level 2, Kumarpara, Zindabazar (Daily 10:30AM–9:30PM).

## Contact
- Hotline: 09617-700500 | WhatsApp: 01952-700500 | Messenger: m.me/deencommerce`;

let _genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!config.geminiApiKey) return null;
  if (!_genAI) _genAI = new GoogleGenerativeAI(config.geminiApiKey);
  return _genAI;
}

export async function callGemini(
  userMessage: string,
  catalogSummary: string,
  campaignSummary: string,
  history: GeminiChatMessage[]
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        DEEN_SYSTEM_PROMPT +
        `\n\n## Live Catalog\n${catalogSummary}` +
        `\n\n## Active Campaigns\n${campaignSummary}`,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.65,
        topP: 0.9,
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text().trim() || null;
  } catch (err) {
    console.error("[gemini] fallback error:", (err as Error).message);
    return null;
  }
}

/** Compact catalog summary string injected into Gemini system prompt. */
export function buildCatalogSummary(catalog: any[]): string {
  if (!catalog.length) return "Catalog loading.";
  const byCategory: Record<string, number> = {};
  let minPrice = Infinity, maxPrice = 0;
  for (const p of catalog) {
    const cat = (p.category || "OTHER").toUpperCase();
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    const price = p.salePrice ?? p.price ?? 0;
    if (price > 0) { if (price < minPrice) minPrice = price; if (price > maxPrice) maxPrice = price; }
  }
  const lines = Object.entries(byCategory).map(([c, n]) => `  ${c}: ${n} items`).join("\n");
  return `${catalog.length} products in stock. Price range ৳${minPrice}–৳${maxPrice}.\n${lines}`;
}

/** Convert AiChatMessage history to Gemini Content format. */
export function toGeminiHistory(
  history: Array<{ role: string; content: string }>
): GeminiChatMessage[] {
  return history.map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.content }],
  }));
}
