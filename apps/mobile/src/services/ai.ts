/**
 * DEEN Mobile --- On-Device Offline AI (Gemini Nano via Google AI Edge SDK).
 *
 * Provides fully offline summarization, proofreading, and smart-reply
 * capabilities on supported flagship Android devices (Google Tensor, Pixel,
 * newer Samsung, etc.) with zero API costs and zero network usage.
 *
 * Design:
 * - Use the on-device Gemini Nano through @react-native-ai/android (Google ML
 *   Kit GenAI / AICore). No secrets, no network, no cost.
 * - Graceful degradation: if the device doesn't support Nano, the model is
 *   not yet downloaded/prepared, or generation fails, the app falls back to
 *   the cloud concierge (/v1/deen/ai/chat) automatically.
 * - All chat history stays on the device (already persisted in AsyncStorage).
 */

import { Platform } from "react-native";
import { android, type AndroidLanguageModel, type AndroidModelInfo, type AndroidPrepareOptions } from "@react-native-ai/android";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------------------------------------
// Platform / capability detection
// ---------------------------------------------------------------------------

/** True when the device is Android and ML Kit's AICore reports Nano as available. */
export async function isNanoSupported(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const info = await android.getModelInfo({ model: {} });
    return info.availability === "available";
  } catch {
    return false;
  }
}

/** True when Nano is ready (downloaded + prepared). Does NOT download. */
export async function isNanoReady(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const info = await android.getModelInfo({ model: {} });
    return info.availability === "available";
  } catch {
    return false;
  }
}

/** Download + warm-up Gemini Nano. Falls back to cloud if unsupported. */
export async function prepareNano(
  onProgress?: (progress: { phase: string; bytesDownloaded?: number; bytesToDownload?: number }) => void,
): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }
  try {
    await android.languageModel({}).prepare({ onProgress });
    const info = await android.getModelInfo({ model: {} });
    return info.availability === "available";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Offline summarizer (for "Summarize this" buttons / manual AI tasks)
// ---------------------------------------------------------------------------

let _summaryNanoState: {
  ready: boolean;
  features: string[];
  promise: Promise<void>;
} | null = null;

async function ensureSummaryNano(): Promise<void> {
  if (_summaryNanoState?.ready) return;
  let ready = false;
  let features: string[] = [];
  let promise: Promise<void>;
  promise = (async () => {
    try {
      // ML Kit's `prepare` downloads the model; returns when ready
      await android.languageModel({}).prepare({ onProgress: noopProgress });
      const info = (await android.getModelInfo({ model: {} })) ?? {
        availability: "unavailable" as const,
        features: [] as string[],
      };
      ready = info.availability === "available";
      features = info.features ?? [];
    } catch {
      ready = false;
      features = [];
    }
  })();
  _summaryNanoState = { ready, features, promise };
  await promise;
}

/** Summarize a block of text offline. Returns null when Nano is not usable. */
export async function summarizeOffline(
  text: string,
  maxOutputTokens = 600,
): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  try {
    await ensureSummaryNano();
    if (!_summaryNanoState || !_summaryNanoState.ready) return null;

    // ML Kit counts tokens; cap total (prompt + output) to stay inside the model's limit
    const tokenCount = await android.languageModel({}).countTokens(text);
    const safeLimit = Math.max(64, (tokenCount ?? 0) + maxOutputTokens);
    const result = await android.languageModel({}).doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: text.trim() }] }],
      maxOutputTokens: safeLimit,
      temperature: 0.35,
      topP: 0.9,
    });
    const reply = result.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: string; text: string }).text)
      .join("");
    return reply || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Offline proofreader (grammar / spelling / fluency)
// ---------------------------------------------------------------------------

let _proofNanoState: {
  ready: boolean;
  features: string[];
  promise: Promise<void>;
} | null = null;

async function ensureProofNano(): Promise<void> {
  if (_proofNanoState?.ready) return;
  let ready = false;
  let features: string[] = [];
  let promise: Promise<void>;
  promise = (async () => {
    try {
      await android.languageModel({}).prepare({ onProgress: noopProgress });
      const info = (await android.getModelInfo({ model: {} })) ?? {
        availability: "unavailable" as const,
        features: [] as string[],
      };
      ready = info.availability === "available";
      features = info.features ?? [];
    } catch {
      ready = false;
      features = [];
    }
  })();
  _proofNanoState = { ready, features, promise };
  await promise;
}

export async function proofreadOffline(
  text: string,
  maxOutputTokens = 400,
): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  try {
    await ensureProofNano();
    if (!_proofNanoState || !_proofNanoState.ready) return null;

    const prompt = `Proofread and fix the following text. Return only the corrected version, nothing else.\n\n${text}`;
    const tokenCount = await android.languageModel({}).countTokens(prompt);
    const safeLimit = Math.max(64, (tokenCount ?? 0) + maxOutputTokens);
    const result = await android.languageModel({}).doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      maxOutputTokens: safeLimit,
      temperature: 0.25,
      topP: 0.95,
    });
    const reply = result.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: string; text: string }).text)
      .join("");
    return reply || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Offline smart replies (swipe-up reply suggestions)
// ---------------------------------------------------------------------------

export interface OfflineSuggestion {
  label: string;
  text: string;
  tone?: "friendly" | "formal" | "concise" | "helpful";
}

let _suggestionsNanoState: {
  ready: boolean;
  features: string[];
  promise: Promise<void>;
} | null = null;

async function ensureSuggestionsNano(): Promise<void> {
  if (_suggestionsNanoState?.ready) return;
  let ready = false;
  let features: string[] = [];
  let promise: Promise<void>;
  promise = (async () => {
    try {
      await android.languageModel({}).prepare({ onProgress: noopProgress });
      const info = (await android.getModelInfo({ model: {} })) ?? {
        availability: "unavailable" as const,
        features: [] as string[],
      };
      ready = info.availability === "available";
      features = info.features ?? [];
    } catch {
      ready = false;
      features = [];
    }
  })();
  _suggestionsNanoState = { ready, features, promise };
  await promise;
}

export async function generateOfflineSuggestions(
  userText: string,
  contextDescription: string,
  count = 3,
): Promise<OfflineSuggestion[]> {
  if (Platform.OS !== "android") return [];
  try {
    await ensureSuggestionsNano();
    if (!_suggestionsNanoState || !_suggestionsNanoState.ready) {
      return [];
    }

    const prompt = `You are a friendly shopping assistant for DEEN, an online menswear brand in Bangladesh.
A customer wrote this in our chat:
"${userText}"

DEEN conversation context: ${contextDescription}

Reply now as the assistant with ${count} short, natural reply options the customer could tap.
Each option must be a complete sentence a real person would type.
Return ONLY plain text, one option per line, no numbering, no markdown.`;
    const tokenCount = await android.languageModel({}).countTokens(prompt);
    const safeLimit = Math.max(64, (tokenCount ?? 0) + 256);
    const result = await android.languageModel({}).doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      maxOutputTokens: safeLimit,
      temperature: 0.9,
      topP: 0.95,
    });
    const text = result.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: string; text: string }).text)
      .join("")
      .trim();
    if (!text) return [];
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, count)
      .map((text, i) => ({ label: text, text, tone: i === 0 ? "friendly" : "helpful" }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cloud fallback (existing concierge) --- used when Nano is not available
// ---------------------------------------------------------------------------

import { request as gatewayRequest } from "../services/gateway";
import { getAuthToken } from "../services/gateway";

/** Shared with the chat component (re-declared here so the service is self-contained). */
export interface AiMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    salePrice?: number;
    image: string;
    sizes: string[];
  }>;
  actions?: Array<{ label: string; action: string; payload?: any }>;
  quickReplies?: string[];
}

export interface CloudAiReply {
  reply: string;
  suggestedProducts?: any[];
  suggestedActions?: { label: string; action: string; payload?: any }[];
  quickReplies?: string[];
}

export async function fetchCloudAiReply(
  text: string,
  messages: AiMessage[],
): Promise<CloudAiReply | null> {
  try {
    // Build auth headers from persisted auth token (if any) so the cloud
    // concierge can scope retrieved orders to this account.
    const token = (await getAuthToken()) || (await AsyncStorage.getItem("@deen/guest_session"));
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders.Authorization = `Bearer ${token}`;

    const data = await gatewayRequest<CloudAiReply>(
      "/v1/deen/ai/chat",
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          message: text,
          phone: "",
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      },
      8000,
    );
    return data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Uniform chat action dispatcher
// ---------------------------------------------------------------------------

const noopProgress = () => {};

export interface AiChatAnalysis {
  reply: string;
  quickReplies?: string[];
  source: "offline" | "cloud";
  sourceDetail: string;
}

/**
 * Dispatch a natural-language request to the best available backend.
 *
 * 1. Offline Gemini Nano (on-device, zero cost, zero network) for
 *    summarization / proofreading / smart replies.
 * 2. Cloud concierge (/v1/deen/ai/chat) as fallback for everything else.
 */
export async function runOfflineAi(
  query: string,
  contextDescription: string,
  preferences: { tone?: "friendly" | "formal" | "concise" | "helpful" | "summarize" | "proofread" | "smart_replies" } = {},
): Promise<AiChatAnalysis> {
  const t = preferences.tone;
  if (t === "summarize") {
    const s = await summarizeOffline(query);
    if (s) return { reply: s, source: "offline", sourceDetail: "offline Gemini Nano" };
  }
  if (t === "proofread") {
    const s = await proofreadOffline(query);
    if (s) return { reply: s, source: "offline", sourceDetail: "offline Gemini Nano" };
  }
  if (t === "smart_replies") {
    const suggs = await generateOfflineSuggestions(query, contextDescription, 3);
    if (suggs.length > 0) {
      return {
        reply: suggs.map((s) => s.text).join("\n"),
        quickReplies: suggs.map((s) => s.text),
        source: "offline" as const,
        sourceDetail: "offline Gemini Nano smart replies",
      };
    }
  }
  // Fall back to cloud concierge for all other intents
  const cloud = await fetchCloudAiReply(query, []);
  if (cloud?.reply) {
    return { reply: cloud.reply, quickReplies: cloud.quickReplies, source: "cloud", sourceDetail: "/v1/deen/ai/chat" };
  }
  return { reply: "I couldn't process that right now. Please try again or contact our support desk.", source: "cloud", sourceDetail: "fallback" };
}

export function resetNanoStates() {
  _summaryNanoState = null;
  _proofNanoState = null;
  _suggestionsNanoState = null;
}
