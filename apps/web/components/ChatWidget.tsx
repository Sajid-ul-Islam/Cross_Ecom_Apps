"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatMessage, { MessageItem } from "./ChatMessage";
import { ProductCard, BotResponse } from "@/lib/types";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>("EN");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or restore sessionId from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    let storedId = localStorage.getItem("deen_bot_session_id");
    if (!storedId) {
      storedId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("deen_bot_session_id", storedId);
    }
    setSessionId(storedId);

    // Initial greeting if message history is empty
    const initialGreeting: MessageItem = {
      id: "msg_init",
      role: "bot",
      text: "👋 আসসালামু আলাইকুম! Welcome to our store. How can I assist you today?",
      quickReplies: [
        "পাঞ্জাবি কালেকশন",
        "সেলভেজ জিন্স",
        "আমি একটা শার্ট অর্ডার করতে চাই",
        "অর্ডার স্ট্যাটাস চেক",
      ],
      ts: Date.now(),
    };
    setMessages([initialGreeting]);
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading || !sessionId) return;

    setErrorMsg(null);
    setInput("");

    // Append user message
    const userMsg: MessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: BotResponse = await res.json();

      // Update detected language tag based on script/keywords
      if (/[\u0980-\u09FF]/.test(text)) {
        setDetectedLang("বাংলা (BN)");
      } else if (/(?:koto|dam|chai|koro|lagbe|ache|vai|bhai)/i.test(text)) {
        setDetectedLang("Banglish");
      } else {
        setDetectedLang("English");
      }

      const botMsg: MessageItem = {
        id: `bot_${Date.now()}`,
        role: "bot",
        text: data.reply,
        products: data.products,
        quickReplies: data.quickReplies,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("[ChatWidget] Send error:", err);
      setErrorMsg("Connection issue, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    if (!sessionId) return;
    try {
      await fetch("/api/bot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("deen_bot_session_id", newId);
      setSessionId(newId);
      setMessages([
        {
          id: `init_${Date.now()}`,
          role: "bot",
          text: "🔄 Session reset. How can I help you today?",
          quickReplies: ["Show Products", "Place Order", "Order Status"],
          ts: Date.now(),
        },
      ]);
    } catch (e) {
      console.warn("Reset failed:", e);
    }
  };

  const handleOrderProduct = (product: ProductCard) => {
    sendMessage(`I want to order ${product.name}`);
  };

  const handleSelectQuickReply = (replyText: string) => {
    sendMessage(replyText);
  };

  return (
    <>
      {/* Floating Circular Toggle Button */}
      <button
        type="button"
        id="chatbot-widget-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chatbot" : "Open shopping chatbot"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
          color: "#FFFFFF",
          border: "none",
          boxShadow: "0 6px 20px rgba(79, 70, 229, 0.45)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 22, fontWeight: 900 }}>✕</span>
        ) : (
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 26 }}>💬</span>
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#10b981",
                border: "2px solid #ffffff",
              }}
            />
          </div>
        )}
      </button>

      {/* Chatbot Window Panel */}
      {isOpen && (
        <div
          className="chatbot-panel"
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 400,
            height: 600,
            maxHeight: "calc(100vh - 110px)",
            maxWidth: "calc(100vw - 32px)",
            background: "var(--surface)",
            borderRadius: 18,
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            animation: "chatPanelPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "var(--indigo)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                👖
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: "var(--ink)" }}>
                    {process.env.NEXT_PUBLIC_STORE_NAME || "DEEN Concierge"}
                  </h4>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}
                  >
                    ● Online
                  </span>
                </div>
                <span style={{ fontSize: 10, color: "var(--sub)", fontWeight: 700 }}>
                  Mode: Multilingual (BN / EN / Banglish) · {detectedLang}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={handleResetSession}
                title="Reset dialog"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--sub)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--sub)",
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages List Area */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              background: "var(--surface)",
            }}
          >
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLatest={index === messages.length - 1}
                onOrderProduct={handleOrderProduct}
                onSelectQuickReply={handleSelectQuickReply}
              />
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0", color: "var(--sub)" }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                  }}
                >
                  🤖
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontStyle: "italic" }}>
                  Assistant is typing…
                </span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  margin: "8px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => sendMessage(messages[messages.length - 1]?.text || "Hi")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--indigo)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            style={{
              padding: "10px 14px",
              background: "var(--surface-2)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message in Bangla, English or Banglish…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: !input.trim() || loading ? "var(--border)" : "var(--indigo)",
                color: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes chatPanelPop {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (max-width: 640px) {
          .chatbot-panel {
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            max-width: 100vw !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
