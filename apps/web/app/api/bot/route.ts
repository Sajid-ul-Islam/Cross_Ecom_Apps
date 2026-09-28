import { NextRequest, NextResponse } from "next/server";
import { sessionStore, createNewSession } from "@/lib/session";
import { normalize } from "@/lib/normalize";
import { detectLanguage } from "@/lib/langDetect";
import { classifyIntent } from "@/lib/intents";
import { processDialogTurn } from "@/lib/orderFlow";
import { reply } from "@/lib/responses";
import { BotResponse, ProductCard } from "@/lib/types";

// In-memory rate limiting: max 20 messages per session per minute
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 20;
const activeSessions = new Set<string>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size >= 10_000) {
    for (const [key, entry] of rateLimitMap) if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    if (rateLimitMap.size >= 10_000 && !rateLimitMap.has(sessionId)) return false;
  }
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

// ── Gateway addressing ────────────────────────────────────────────────────
// Primary Render gateway with backup failover — mirrors lib/api.ts. The old
// hardcoded api.deencommerce.com default no longer resolves for AI chat.
const DEFAULT_GATEWAY_URL = "https://cross-ecom-apps-4b4n.onrender.com";
const BACKUP_GATEWAY_URL = "https://cross-ecom-apps.onrender.com";
const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_GATEWAY_URL;

// Shared gateway key — every request to the gateway must carry x-api-key or
// the gateway rejects with 401 and the chat shows no retrieved data.
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

// ── Gateway AI fallback helper (single-flight per request) ────────────────
async function consultGatewayAi(
  rawMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  authHeader?: string
): Promise<{ reply: string; suggestedProducts?: any[]; suggestedActions?: any[] } | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/v1/deen/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GATEWAY_API_KEY,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({ message: rawMessage, history }),
    });

    if (!res.ok) return null;

    const aiData = await res.json();
    if (aiData?.reply && !aiData.reply.includes("I'm having trouble connecting")) {
      return aiData;
    }
    return null;
  } catch {
    // Gateway AI offline/timeout — caller falls back safely
    return null;
  }
}

export async function POST(req: NextRequest) {
  let activeSession: string | undefined;
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.message !== "string" || body.message.length > 500 || typeof body.sessionId !== "string" || body.sessionId.length > 128 || !body.sessionId) {
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

    if (activeSessions.has(sessionId)) return NextResponse.json({ error: "CONFLICT", message: "Please wait for the previous message to finish." }, { status: 409 });
    activeSessions.add(sessionId);
    activeSession = sessionId;
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
    let botResponse: BotResponse = await processDialogTurn(
      normalizedText,
      session,
      intent
    );

    // If intent was UNKNOWN and session is IDLE, consult gateway AI concierge for live RAG answer & catalog products
    if (intent === "UNKNOWN" && session.state === "IDLE") {
      // Forward the caller's Authorization token (if any) so the gateway can
      // scope visible orders to THIS account — enables in-chat order tracking.
      const callerAuth = req.headers.get("authorization") || undefined;

      const aiData = await consultGatewayAi(
        rawMessage,
        session.history.slice(-4).map((h) => ({
          role: h.role === "user" ? ("user" as const) : ("assistant" as const),
          content: h.text,
        })),
        callerAuth
      );

      if (aiData) {
        const mappedProducts: ProductCard[] | undefined = aiData.suggestedProducts?.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: Number(p.price) || 0,
          salePrice: p.salePrice ? Number(p.salePrice) : undefined,
          regularPrice: p.regularPrice ? Number(p.regularPrice) : undefined,
          image: p.image || "/images/placeholder.jpg",
          category: p.category,
          sizes: p.sizes || [],
          in_stock: p.stockStatus ? p.stockStatus === "instock" : true,
        }));

        botResponse = {
          reply: aiData.reply,
          products: mappedProducts && mappedProducts.length > 0 ? mappedProducts : undefined,
          actions: aiData.suggestedActions,
          quickReplies: botResponse.quickReplies,
          state: "IDLE",
        };
      }
    }

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

    return NextResponse.json(fallbackResponse, { status: 503 });
  } finally {
    if (activeSession) activeSessions.delete(activeSession);
  }
}
