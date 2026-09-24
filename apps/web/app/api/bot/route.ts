import { NextRequest, NextResponse } from "next/server";
import { sessionStore, createNewSession } from "@/lib/session";
import { normalize } from "@/lib/normalize";
import { detectLanguage } from "@/lib/langDetect";
import { classifyIntent } from "@/lib/intents";
import { processDialogTurn } from "@/lib/orderFlow";
import { reply } from "@/lib/responses";
import { BotResponse } from "@/lib/types";

// In-memory rate limiting: max 20 messages per session per minute
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(sessionId, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.message !== "string" || !body.sessionId) {
      return NextResponse.json(
        { error: "Invalid payload. 'message' and 'sessionId' are required." },
        { status: 400 }
      );
    }

    const rawMessage = body.message.trim();
    const sessionId = String(body.sessionId).trim();

    if (!rawMessage || !sessionId) {
      return NextResponse.json(
        { error: "Empty message or sessionId." },
        { status: 400 }
      );
    }

    // 1. Rate Limiting Check
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        {
          reply: "You are sending messages too quickly. Please wait a moment and try again.",
          state: "IDLE",
        },
        { status: 429 }
      );
    }

    // 2. Load or create session
    let session = await sessionStore.get(sessionId);
    if (!session) {
      session = createNewSession(sessionId);
    }

    // 3. Normalize & Detect Language
    const normalizedText = normalize(rawMessage);
    const detectedLang = detectLanguage(normalizedText);
    session.lang = detectedLang;

    // 4. Classify intent
    const { intent } = classifyIntent(normalizedText, detectedLang);

    // 5. Append user message to history
    session.history.push({
      role: "user",
      text: rawMessage,
      ts: Date.now(),
    });

    // 6. Process dialog turn through state machine
    const botResponse: BotResponse = await processDialogTurn(
      normalizedText,
      session,
      intent
    );

    // 7. Append bot response to history (capped at 20 messages)
    session.history.push({
      role: "bot",
      text: botResponse.reply,
      ts: Date.now(),
      products: botResponse.products,
      quickReplies: botResponse.quickReplies,
    });

    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    // 8. Persist updated session
    await sessionStore.set(sessionId, session);

    // 9. Return JSON
    return NextResponse.json(botResponse);
  } catch (error) {
    console.error("[bot-api-error]", error);

    const fallbackResponse: BotResponse = {
      reply: reply("en", "FALLBACK"),
      state: "IDLE",
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
