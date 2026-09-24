import { NextRequest, NextResponse } from "next/server";
import { sessionStore, createNewSession } from "@/lib/session";

/**
 * Resets or clears a chatbot session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await sessionStore.clear(sessionId);
    const newSession = createNewSession(sessionId);
    await sessionStore.set(sessionId, newSession);

    return NextResponse.json({ success: true, message: "Session reset successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset session" }, { status: 500 });
  }
}
