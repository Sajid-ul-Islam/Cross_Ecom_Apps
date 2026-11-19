/**
 * DEEN Mobile --- Chat AI (Cloud Concierge).
 *
 * Provides AI-powered chat (summarization, proofreading, smart replies) by
 * calling the cloud AI concierge API (/v1/deen/ai/chat). The response is
 * shown with source attribution so customers know it came from the cloud.
 * All chat history persists in AsyncStorage for instant replay.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { request, getAuthToken, getGuestSession } from "../services/gateway";

// ---------------------------------------------------------------------------
// Types (used by AiConciergeModal.tsx)
// ---------------------------------------------------------------------------

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source: "cloud" | "offline";
  timestamp: number;
}

export interface CloudAiReply {
  reply: string;
  quickReplies?: string[];
  suggestion?: string;
}

// ---------------------------------------------------------------------------
// Chat history persistence (AsyncStorage)
// ---------------------------------------------------------------------------

const CHAT_HISTORY_KEY = "@deen/chat_history";
const GUEST_SESSION_KEY = "@deen/guest_session";

/** Load persisted chat history from AsyncStorage. */
export async function loadChatHistory(): Promise<AiMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AiMessage[];
  } catch {
    return [];
  }
}

/** Persist chat history to AsyncStorage. */
export async function persistChatHistory(messages: AiMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch {
    // Storage not available; continue without persisting.
  }
}

/** Save a guest session so the chat can authenticate with the server. */
export async function saveGuestSession(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, token);
  } catch {
    // Ignore.
  }
}

/** Clear a saved guest session. */
export async function clearGuestSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Ignore.
  }
}

// ---------------------------------------------------------------------------
// Cloud concierge (the only AI backend that is always available)
// ---------------------------------------------------------------------------

/**
 * Send a message to the cloud concierge and return the full reply.
 * Callers should then render the reply, quickReplies, and suggestion.
 */
export async function sendToCloudConcierge(
  text: string,
  authToken: string | null,
): Promise<CloudAiReply> {
  try {
    const response = await request(
      "/v1/deen/ai/chat",
      { method: "POST", ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}) },
      8000,
      false,
    ).then((r) => (typeof r === "object" && r !== null ? r : {}));
    if (response && typeof response === "object") {
      return {
        reply: (response as { reply?: string }).reply ?? "",
        quickReplies: (response as { quickReplies?: string[] }).quickReplies,
        suggestion: (response as { suggestion?: string }).suggestion,
      };
    }
    return { reply: "" };
  } catch {
    return {
      reply: "I couldn't process that right now. Please try again.",
    };
  }
}

/**
 * Fetch the cloud concierge reply (returns null on any error).
 * Callers should check `reply` and render accordingly.
 */
export async function fetchCloudAiReply(
  text: string,
  messages: AiMessage[],
): Promise<CloudAiReply | null> {
  try {
    const token =
      (await getAuthToken()) || (await getGuestSession()) || null;
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders.Authorization = `Bearer ${token}`;

    const data = await request<CloudAiReply>(
      "/v1/deen/ai/chat",
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          message: text,
          phone: "",
          history: messages.slice(-4).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
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

export interface AiChatAnalysis {
  reply: string;
  quickReplies?: string[];
  source: "offline" | "cloud";
  sourceDetail: string;
}

/**
 * Dispatch a natural-language request.
 * Always falls back to the cloud concierge (/v1/deen/ai/chat).
 */
export async function runOfflineAi(
  query: string,
  contextDescription: string,
  preferences: { tone?: "friendly" | "formal" | "concise" | "helpful" | "summarize" | "proofread" | "smart_replies" } = {},
): Promise<AiChatAnalysis> {
  const t = preferences.tone;

  // Manual tasks fall through to cloud (the user's phone is not a
  // supported on-device AI device; the cloud concierge handles it).
  if (t === "summarize" || t === "proofread" || t === "smart_replies") {
    const cloud = await fetchCloudAiReply(query, []);
    if (cloud?.reply) {
      return {
        reply: cloud.reply,
        quickReplies: cloud.quickReplies,
        source: "cloud",
        sourceDetail: "/v1/deen/ai/chat",
      };
    }
    return {
      reply: "I couldn't process that right now. Please try again.",
      source: "cloud",
      sourceDetail: "fallback",
    };
  }

  // Default: cloud concierge for all other intents
  const cloud = await fetchCloudAiReply(query, []);
  if (cloud?.reply) {
    return {
      reply: cloud.reply,
      quickReplies: cloud.quickReplies,
      source: "cloud",
      sourceDetail: "/v1/deen/ai/chat",
    };
  }
  return {
    reply: "I couldn't process that right now. Please try again or contact our support desk.",
    source: "cloud",
    sourceDetail: "fallback",
  };
}

// ---------------------------------------------------------------------------
// Compatibility exports for AiConciergeModal.tsx (older consumers)
// ---------------------------------------------------------------------------

/** Always returns false — on-device Nano is not available on this build. */
export async function isNanoSupported(): Promise<boolean> {
  return false;
}

/** Always returns false — Nano is not ready. */
export async function isNanoReady(): Promise<boolean> {
  return false;
}

/**
 * Cloud-only fallback for the "offline" summarizer.
 * Returns null when the cloud call fails.
 */
export async function summarizeOffline(
  text: string,
  maxOutputTokens = 600,
): Promise<string | null> {
  const cloud = await fetchCloudAiReply(text, []);
  return cloud?.reply ?? null;
}

/**
 * Cloud-only fallback for the "offline" proofreader.
 * Returns null when the cloud call fails.
 */
export async function proofreadOffline(
  text: string,
  maxOutputTokens = 400,
): Promise<string | null> {
  const cloud = await fetchCloudAiReply(text, []);
  return cloud?.reply ?? null;
}

/**
 * Cloud-only fallback for smart replies.
 * Returns [] when the cloud call fails.
 */
export async function generateOfflineSuggestions(
  userText: string,
  contextDescription: string,
  count = 3,
): Promise<Array<{ label: string; text: string; tone?: string }>> {
  const cloud = await fetchCloudAiReply(userText, []);
  if (!cloud?.reply) return [];
  const lines = cloud.reply
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, count);
  return lines.map((text, i) => ({
    label: text,
    text,
    tone: i === 0 ? "friendly" : "helpful",
  }));
}

export function resetNanoStates() {
  // No-op — AI is cloud-only on this build.
}
