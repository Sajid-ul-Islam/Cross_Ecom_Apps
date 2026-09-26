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
  "👖 Suggest jeans under ৳2500",
  "📏 How to choose my waist size for DEEN jeans?",
  "📦 Where is my order #1041?",
  "🛒 I want to order a shirt",
  "🔄 How does the 7-day size exchange work?",
  "🚚 Chittagong delivery charge & time?",
  "📍 Do you have retail outlets or showrooms?",
  "💬 WhatsApp Concierge Hotline",
];

export default function ChatAssistant({ isEmbedded = false }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>("EN");
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const embeddedInputRef = useRef<HTMLInputElement | null>(null);
  const isMinimizedRef = useRef(isMinimized);
  isMinimizedRef.current = isMinimized;

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
      text: "👋 **আসসালামু আলাইকুম! Welcome to DEEN Denim Concierge.**\n\nI can recommend menswear from our live catalog (premium denim jeans, shirts, panjabis), guide you on sizes, explain our 7-day doorstep swap, calculate delivery charges across Bangladesh, or help you **order directly in chat**!\n\nHow can I help you today?",
      quickReplies: [
        "জিন্স কালেকশন 👖",
        "পাঞ্জাবি কালেকশন 🕌",
        "শার্ট কালেকশন 👔",
        "সাইজ গাইড 📏",
        "অর্ডার স্ট্যাটাস চেক 📦",
      ],
      ts: Date.now(),
    };
    setMessages([initialGreeting]);
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Global events to open / close / minimize chat from anywhere in the app
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
    };
    const handleClose = () => {
      setIsOpen(false);
    };

    window.addEventListener("deen_open_chat", handleOpen);
    window.addEventListener("deen_close_chat", handleClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (!isMinimized) {
          setIsMinimized(true);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("deen_open_chat", handleOpen);
      window.removeEventListener("deen_close_chat", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMinimized]);

  // Focus input when chatbox is opened or restored
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        if (isEmbedded) {
          embeddedInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized, isEmbedded]);

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

        // If chatbox is currently minimized, increment unread badge
        if (isMinimizedRef.current) {
          setUnreadCount((c) => c + 1);
        }
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
      setUnreadCount(0);
    } catch (e) {
      console.warn("Reset failed:", e);
    }
  };

  const handleOrderProduct = (product: ProductCard) => {
    sendMessage(`I want to order ${product.name}`);
  };

  const handleAddToCart = (product: ProductCard) => {
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

  // ── Standalone Dedicated Embedded Page (/chat) ──
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
                background: "linear-gradient(135deg, var(--indigo) 0%, #ea580c 100%)",
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
                  DEEN Denim Concierge
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
                <span style={{ color: "var(--denim-stitch)", fontWeight: 700 }}>দেশের প্রথম ডেনিম ব্র্যান্ড</span> · AI Stylist &amp; Live Tracking
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
        <div className="fb-chatbox-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="fb-prompt-pill"
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
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "8px 0" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--indigo) 0%, #c2410c 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                👖
              </div>
              <div className="fb-typing-bubble" aria-label="DEEN Assistant is checking catalog...">
                <span className="fb-typing-dot" />
                <span className="fb-typing-dot" />
                <span className="fb-typing-dot" />
              </div>
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
            ref={embeddedInputRef}
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

  // ── Global Floating Facebook-Style Chat Assistant ──
  return (
    <>
      {/* ── Circular Launcher Floating Button (when closed, strictly hidden on mobile < 768px) ── */}
      {!isOpen && (
        <button
          type="button"
          id="chatbot-widget-btn"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadCount(0);
          }}
          aria-label="Open DEEN Denim Concierge · AI Stylist & Chat"
          title="DEEN Denim Concierge · দেশের প্রথম ডেনিম ব্র্যান্ড"
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24 }}>💬</span>
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#c93b36",
                border: "2px solid #ffffff",
              }}
              title="Signature Red-Line Selvedge"
            />
          </div>
        </button>
      )}

      {/* ── Facebook-Style Minimized Docked Tab / Pill (when minimized) ── */}
      {isOpen && isMinimized && (
        <div
          className="fb-chatbox-minimized"
          onClick={() => {
            setIsMinimized(false);
            setUnreadCount(0);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsMinimized(false);
              setUnreadCount(0);
            }
          }}
          aria-label="Restore DEEN Denim Concierge Chat"
          title="Click to restore chat"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--indigo) 0%, #c2410c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#ffffff",
                }}
              >
                👖
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  border: "1.5px solid var(--surface)",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                DEEN Concierge
              </span>
              <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>
                Active now
              </span>
            </div>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "var(--crimson)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 10,
                  padding: "1px 6px",
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setIsMinimized(false);
                setUnreadCount(0);
              }}
              title="Expand chat"
              aria-label="Expand chat"
              className="fb-header-icon-btn"
              style={{ fontSize: 13 }}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
                setUnreadCount(0);
              }}
              title="Close chat"
              aria-label="Close chat"
              className="fb-header-icon-btn"
              style={{ fontSize: 15 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Facebook-Style Floating Chatbox Window (when open & expanded) ── */}
      {isOpen && !isMinimized && (
        <>
          {/* Mobile Backdrop (tapping outside dismisses on mobile) */}
          <div
            className="fb-chatbox-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fb-chatbox-window"
            role="dialog"
            aria-label="DEEN Denim Concierge Chat"
          >
            {/* Facebook-Style Header */}
            <div
              style={{
                height: 54,
                padding: "0 12px 0 14px",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                userSelect: "none",
              }}
            >
              {/* Left: Avatar + Title + Active Status (clicking title minimizes) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  flex: 1,
                  minWidth: 0,
                }}
                onClick={() => setIsMinimized(true)}
                title="Click to minimize"
              >
                <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--indigo) 0%, #ea580c 100%)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 900,
                      boxShadow: "0 2px 8px rgba(224, 83, 5, 0.35)",
                    }}
                  >
                    👖
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2px solid var(--surface)",
                    }}
                    title="Active now"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      DEEN Denim Concierge
                    </h4>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10.5,
                      color: "var(--sub)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: "#10b981", fontWeight: 700 }}>● Active now</span>
                    <span>·</span>
                    <span>AI Stylist</span>
                  </p>
                </div>
              </div>

              {/* Right: Actions (Language, Reset, Minimize, Close) */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "2px 6px",
                    color: "var(--sub)",
                    marginRight: 4,
                  }}
                >
                  {detectedLang}
                </span>

                <button
                  type="button"
                  onClick={handleResetSession}
                  title="Restart conversation (new session)"
                  aria-label="Restart conversation"
                  className="fb-header-icon-btn"
                >
                  ↺
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize chat"
                  aria-label="Minimize chat"
                  className="fb-header-icon-btn"
                  style={{ fontSize: 18, fontWeight: 700 }}
                >
                  ─
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  title="Close chat"
                  aria-label="Close chat"
                  className="fb-header-icon-btn"
                  style={{ fontSize: 16, fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Prompts Carousel Bar */}
            <div className="fb-chatbox-prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="fb-prompt-pill"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div
              style={{
                flex: 1,
                padding: "14px 16px",
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
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "6px 0 10px" }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--indigo) 0%, #c2410c 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    👖
                  </div>
                  <div className="fb-typing-bubble" aria-label="DEEN Assistant is typing...">
                    <span className="fb-typing-dot" />
                    <span className="fb-typing-dot" />
                    <span className="fb-typing-dot" />
                  </div>
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

            {/* Facebook-Style Footer Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              style={{
                padding: "10px 12px",
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => window.open("https://wa.me/8801952700500", "_blank")}
                title="WhatsApp Concierge Hotline (+8801952700500)"
                aria-label="WhatsApp Concierge Hotline"
                className="fb-composer-icon-btn"
              >
                <span style={{ fontSize: 16 }}>💬</span>
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message DEEN Assistant…"
                disabled={loading}
                className="fb-composer-input"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className={`fb-composer-send-btn ${input.trim() && !loading ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </>
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
