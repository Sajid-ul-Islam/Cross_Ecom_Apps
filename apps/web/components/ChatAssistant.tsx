"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import ChatMessage, { MessageItem } from "./ChatMessage";
import { ProductCard, BotResponse } from "@/lib/types";
import { type Product } from "@/lib/api";
import QuickAddModal from "./QuickAddModal";

export interface ChatAssistantProps {
  isEmbedded?: boolean;
}

const QUICK_PROMPTS = [
  "🔥 What is the current offer & discount?",
  "👖 Suggest selvedge jeans under ৳2500",
  "📦 Where is my order #1041?",
  "🛒 I want to order a shirt",
  "🚚 Chittagong delivery charge & time?",
  "🔄 How does the 7-day size exchange work?",
  "📍 Where are your retail showrooms in Dhaka?",
  "💬 WhatsApp Concierge Hotline",
];

export default function ChatAssistant({ isEmbedded = false }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>("EN");
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();



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
      text: "👋 **আসসালামু আলাইকুম! Welcome to DEEN Assistant.**\n\nI can recommend menswear from our live catalog, calculate Bangladesh delivery charges, guide you on sizing, explain our 7-day doorstep size swap, or help you **place an order directly in chat**!\n\nHow can I help you today?",
      quickReplies: [
        "পাঞ্জাবি কালেকশন",
        "সেলভেজ জিন্স",
        "আমি একটা শার্ট অর্ডার করতে চাই",
        "অর্ডার স্ট্যাটাস চেক",
        "ডেলিভারি চার্জ কত?",
      ],
      ts: Date.now(),
    };
    setMessages([initialGreeting]);
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Lock background scroll on mobile when full-screen sheet is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen && window.innerWidth < 769) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Global events to open / close chat from anywhere in the app
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener("deen_open_chat", handleOpen);
    window.addEventListener("deen_close_chat", handleClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("deen_open_chat", handleOpen);
      window.removeEventListener("deen_close_chat", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (window.innerWidth < 769) {
          mobileInputRef.current?.focus();
        } else {
          desktopInputRef.current?.focus();
        }
      }, 180);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const text = textToSend.trim();
      if (!text || loading || !sessionId) return;

      // Direct WhatsApp intent shortcut
      if (/whatsapp|হোয়াটসঅ্যাপ|concierge hotline/i.test(text)) {
        window.open("https://wa.me/8801952700500", "_blank");
      }

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

        // Update detected language tag
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
          actions: data.actions,
          ts: Date.now(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error("[ChatAssistant] Send error:", err);
        setErrorMsg("Connection issue. Please try again or chat via WhatsApp (+8801952700500).");
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId]
  );

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
          text: "🔄 **Conversation reset.** How can I assist you with DEEN apparel or orders today?",
          quickReplies: [
            "পাঞ্জাবি কালেকশন",
            "সেলভেজ জিন্স",
            "আমি একটা শার্ট অর্ডার করতে চাই",
            "অর্ডার স্ট্যাটাস চেক",
            "ডেলিভারি চার্জ",
          ],
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

  const handleAddToCart = (product: ProductCard) => {
    // Convert ProductCard to Product for QuickAddModal
    const fullProd: Product = {
      id: String(product.id),
      name: product.name,
      sku: product.sku || String(product.id),
      category: product.category || "Apparel",
      price: product.price,
      salePrice: product.salePrice,
      regularPrice: product.regularPrice,
      sizes: product.sizes || ["M", "L", "XL", "32", "34"],
      images: [product.image, product.image],
      stockStatus: product.in_stock ? "instock" : "outofstock",
      rating: 5,
      ratingCount: 12,
    };
    setQuickAddProduct(fullProd);
  };

  const handleAction = (action: string) => {
    if (action === "navigate_shop") {
      router.push("/shop");
      if (window.innerWidth < 769) setIsOpen(false);
    } else if (action === "navigate_orders") {
      router.push("/orders");
      if (window.innerWidth < 769) setIsOpen(false);
    } else if (action === "open_whatsapp") {
      window.open("https://wa.me/8801952700500", "_blank");
    } else if (action === "search_jeans") {
      sendMessage("Show me selvedge jeans");
    } else if (action === "search_delivery") {
      sendMessage("What are the delivery charges inside and outside Dhaka?");
    }
  };

  // If this is the background widget in layout.tsx and user is on /chat, suppress widget
  if (!isEmbedded && pathname === "/chat") {
    return null;
  }

  if (isEmbedded) {
    return (
      <div
        className="chat-embedded-wrapper"
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "16px auto",
          height: "calc(100vh - 140px)",
          minHeight: 540,
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 20px",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--indigo) 0%, #3b82f6 100%)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              👖
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--ink)" }}>
                  DEEN Assistant
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    padding: "2px 8px",
                    borderRadius: 12,
                  }}
                >
                  LIVE · {detectedLang}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--sub)" }}>
                AI Stylist · Direct Order · Live Pathao Tracking
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleResetSession}
              title="Reset conversation"
              aria-label="Restart conversation"
              style={{
                padding: "6px 12px",
                borderRadius: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--sub)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Quick Prompts Carousel */}
        <div
          style={{
            padding: "10px 16px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              style={{
                background: "var(--surface-2)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto",
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onOrderProduct={handleOrderProduct}
              onAddToCart={handleAddToCart}
              onAction={handleAction}
              onSelectQuickReply={(reply) => sendMessage(reply)}
              isLatest={index === messages.length - 1}
            />
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span style={{ fontSize: 12, color: "var(--sub)", fontStyle: "italic" }}>
                DEEN Assistant is checking catalog &amp; orders…
              </span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 8,
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          style={{
            padding: "12px 18px",
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <input
            ref={desktopInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type in Bangla, English or Banglish (e.g. Jeans 32 size, delivery charges, or order)..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: 24,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: input.trim() && !loading ? "var(--indigo)" : "var(--border)",
              color: "#FFFFFF",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !loading ? "pointer" : "default",
              transition: "background 0.15s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        <QuickAddModal
          product={quickAddProduct}
          isOpen={Boolean(quickAddProduct)}
          onClose={() => setQuickAddProduct(null)}
        />
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Floating Circular Toggle Button (Strictly HIDDEN on Mobile <768px) ── */}
      <button
        type="button"
        id="chatbot-widget-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close DEEN Assistant" : "Open DEEN AI Concierge & Chatbot"}
        title="DEEN Assistant · AI Stylist & Quick Order"
        style={{
          position: "fixed",
          bottom: 24,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
          color: "#FFFFFF",
          border: "none",
          boxShadow: "0 6px 22px rgba(79, 70, 229, 0.45)",
          cursor: "pointer",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>✕</span>
        ) : (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24 }}>💬</span>
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

      {/* ── DESKTOP Floating Window Panel (≥ 769px) ── */}
      {isOpen && (
        <div
          className="chatbot-panel chatbot-panel--desktop"
          style={{
            position: "fixed",
            bottom: 90,
            right: 28,
            width: 420,
            height: 640,
            maxHeight: "calc(100vh - 110px)",
            background: "var(--surface)",
            borderRadius: 20,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
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
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--indigo) 0%, #3b82f6 100%)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
                }}
              >
                👖
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "var(--ink)" }}>
                    DEEN Concierge
                  </h4>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      padding: "1px 6px",
                      borderRadius: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    LIVE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--sub)" }}>
                  AI Stylist · Direct Order · Live Tracking
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Language pill */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "2px 7px",
                  color: "var(--sub)",
                }}
              >
                {detectedLang}
              </span>

              {/* Reset session button */}
              <button
                type="button"
                onClick={handleResetSession}
                title="Restart conversation (clean session)"
                aria-label="Restart conversation"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  color: "var(--sub)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ↺
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat (Esc)"
                aria-label="Close chat"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 17,
                  color: "var(--sub)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel Bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarWidth: "none",
              flexShrink: 0,
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onOrderProduct={handleOrderProduct}
                onAddToCart={handleAddToCart}
                onAction={handleAction}
                onSelectQuickReply={(reply) => sendMessage(reply)}
                isLatest={index === messages.length - 1}
              />
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span style={{ fontSize: 12, color: "var(--sub)", fontStyle: "italic" }}>
                  DEEN Assistant is checking catalog &amp; orders…
                </span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {errorMsg}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
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
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <input
              ref={desktopInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for jeans, order status, or type to buy…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 22,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: input.trim() && !loading ? "var(--indigo)" : "var(--border)",
                color: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "background 0.15s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── MOBILE Full-Screen Slide-Up Drawer (< 769px) ── */}
      {isOpen && (
        <div
          className="chatbot-sheet--mobile"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            animation: "chatSheetUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Mobile Top Header (≥ 44dp touch targets) */}
          <div
            style={{
              height: 56,
              padding: "0 16px",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--indigo) 0%, #3b82f6 100%)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                👖
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>
                    DEEN Concierge
                  </h4>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      padding: "1px 5px",
                      borderRadius: 10,
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 10.5, color: "var(--sub)" }}>
                  AI Stylist · Direct Order · Live Tracking
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Reset button */}
              <button
                type="button"
                onClick={handleResetSession}
                title="Reset conversation"
                aria-label="Restart conversation"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  color: "var(--sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ↺
              </button>

              {/* Close Button - 44x44 minimum touch target */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: 16,
                  fontWeight: 900,
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel Bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarWidth: "none",
              flexShrink: 0,
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "5px 12px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Mobile Messages Body */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onOrderProduct={handleOrderProduct}
                onAddToCart={handleAddToCart}
                onAction={handleAction}
                onSelectQuickReply={(reply) => sendMessage(reply)}
                isLatest={index === messages.length - 1}
              />
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span style={{ fontSize: 12, color: "var(--sub)", fontStyle: "italic" }}>
                  DEEN Assistant is checking catalog &amp; orders…
                </span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {errorMsg}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Bottom Input Bar (Sticky, respects safe-area insets) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            style={{
              padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))",
              background: "var(--surface-2)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <input
              ref={mobileInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for jeans, order status, or type to buy…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 24,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: input.trim() && !loading ? "var(--indigo)" : "var(--border)",
                color: "#FFFFFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "default",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Quick Add Modal for in-chat Cart Adding ── */}
      <QuickAddModal
        product={quickAddProduct}
        isOpen={Boolean(quickAddProduct)}
        onClose={() => setQuickAddProduct(null)}
      />
    </>
  );
}
