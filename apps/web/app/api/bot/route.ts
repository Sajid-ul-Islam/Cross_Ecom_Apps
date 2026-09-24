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
    let botResponse: BotResponse = await processDialogTurn(
      normalizedText,
      session,
      intent
    );

    // If intent was UNKNOWN and session is IDLE, consult gateway AI concierge for live RAG answer & catalog products
    if (intent === "UNKNOWN" && session.state === "IDLE") {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.deencommerce.com";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const aiRes = await fetch(`${apiUrl}/v1/deen/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: rawMessage,
            phone: session.slots?.phone,
            history: session.history.slice(-4).map((h) => ({
              role: h.role === "user" ? "user" : "assistant",
              content: h.text,
            })),
          }),
        });
        clearTimeout(timeoutId);

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData?.reply && !aiData.reply.includes("I'm having trouble connecting")) {
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
      } catch {
        // Gateway AI offline/timeout; fallback safely remains in botResponse
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

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
