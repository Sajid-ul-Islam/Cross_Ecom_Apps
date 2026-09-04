"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { API_URL, bdt, resolveProductImage } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface AiMessage {
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
}

const QUICK_PROMPTS = [
  "🔥 What is the current offer & discount?",
  "✨ What are the new products?",
  "👖 Suggest selvedge jeans under ৳2500",
  "🚚 Chittagong delivery charge & time?",
  "🔄 How does the 7-day size exchange work?",
  "📍 Where are your retail showrooms in Dhaka?",
];

export default function AiConciergeDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Welcome to **DEEN Assistant**! I can recommend menswear outfits from our live catalog, calculate Bangladesh delivery charges, explain our 7-day doorstep size exchange, or locate our 4 retail showrooms.\n\nHow can I help you today?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("deen_open_chat", handleOpenChat);
    return () => window.removeEventListener("deen_open_chat", handleOpenChat);
  }, []);

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    let userPhone: string | undefined;
    try {
      const savedProfile = typeof window !== "undefined" ? localStorage.getItem("deen_web_user_profile") : null;
      if (savedProfile) {
        userPhone = JSON.parse(savedProfile)?.phone;
      }
    } catch {}

    const userMsg: AiMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/v1/deen/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          phone: userPhone,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to consult AI");

      const data = await res.json();
      const aiMsg: AiMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply,
        products: data.suggestedProducts,
        actions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: "I experienced a brief connection blip with our catalog knowledge base. You can also chat directly with our Dhaka stylists on WhatsApp at **01952-700500**!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (p: any) => {
    const size = p.sizes?.[0] || "32";
    addItem(p, size);
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  return (
    <>
      <style>{`
        .floating-chat-trigger {
          position: fixed;
          z-index: 999;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--indigo) 0%, #3730a3 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.38);
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.3px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .floating-chat-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(79, 70, 229, 0.48);
        }
        /* Desktop: sits in bottom right */
        @media (min-width: 769px) {
          .floating-chat-trigger {
            bottom: 28px;
            right: 28px;
          }
        }
        /* Mobile: hidden because Chat is placed directly in the mobile bottom navigation bar */
        @media (max-width: 768px) {
          .floating-chat-trigger {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Trigger Button (Named Chat) */}
      <button
        type="button"
        className="floating-chat-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open Chat"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Chat</span>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 6px #10b981",
          }}
        />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
            display: "flex",
            justifyContent: "flex-end",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Drawer Body */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="DEEN Assistant"
            style={{
              width: "100%",
              maxWidth: 420,
              height: "100%",
              background: "var(--surface)",
              backgroundColor: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.4)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--surface-2)",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--indigo)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 16,
                  }}
                >
                  ✨
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>
                    DEEN Assistant
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 700 }}>
                    ● RAG Knowledge &amp; Live Catalog Active
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* WhatsApp Icon Button */}
                <a
                  href="https://wa.me/8801952700500"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Direct WhatsApp Support"
                  title="Direct WhatsApp Support (01952-700500)"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(37, 211, 102, 0.14)",
                    border: "1px solid rgba(37, 211, 102, 0.4)",
                    color: "#25D366",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </a>

                {/* Facebook Messenger Icon Button */}
                <a
                  href="https://m.me/deencommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Direct Facebook Messenger Support"
                  title="Direct Facebook Messenger Support"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0, 132, 255, 0.14)",
                    border: "1px solid rgba(0, 132, 255, 0.4)",
                    color: "#0084FF",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </a>

                <button
                  type="button"
                  aria-label="Close DEEN Assistant"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 20,
                    color: "var(--sub)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "var(--surface)",
                backgroundColor: "var(--surface)",
              }}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: 14,
                      borderBottomRightRadius: m.sender === "user" ? 2 : 14,
                      borderBottomLeftRadius: m.sender === "ai" ? 2 : 14,
                      background: m.sender === "user" ? "var(--indigo)" : "var(--surface-2)",
                      color: m.sender === "user" ? "#FFFFFF" : "var(--ink)",
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      border: m.sender === "ai" ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Embedded Suggested Products */}
                  {m.products && m.products.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        width: "100%",
                      }}
                    >
                      {m.products.map((p) => {
                        const price = p.salePrice ?? p.price;
                        const isAdded = addedIds[p.id];

                        return (
                          <div
                            key={p.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: 10,
                              borderRadius: 8,
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                                width: 48,
                                height: 58,
                                borderRadius: 6,
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src={resolveProductImage(p.image)}
                                alt={p.name}
                                fill
                                sizes="48px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--sub)", textTransform: "uppercase" }}>
                                {p.category}
                              </span>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "var(--ink)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {p.name}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--indigo)" }}>
                                {bdt(price)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "none",
                                background: isAdded ? "var(--emerald)" : "var(--indigo)",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isAdded ? "✓ Added" : "+ Bag"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Chips */}
                  {m.actions && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {m.actions.map((act) => (
                        <button
                          key={act.action}
                          type="button"
                          onClick={() => {
                            if (act.action === "open_url" && act.payload?.url) {
                              window.open(act.payload.url, "_blank");
                            } else if (act.action === "open_messenger") {
                              window.open("https://m.me/deencommerce", "_blank");
                            } else if (act.action === "open_whatsapp") {
                              window.open("https://wa.me/8801952700500", "_blank");
                            } else if (act.action === "navigate_shop") {
                              router.push("/shop");
                            } else if (act.action === "navigate_orders") {
                              router.push("/orders");
                            } else if (act.action === "navigate_checkout") {
                              router.push("/checkout");
                            }
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--indigo)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
                  <span style={{ fontSize: 14 }}>✨</span>
                  <span style={{ fontSize: 12, color: "var(--sub)", fontStyle: "italic" }}>
                    Retrieving catalog &amp; knowledge base…
                  </span>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            {messages.length <= 2 && (
              <div style={{ padding: "0 16px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--sub)", letterSpacing: 0.5 }}>
                  SUGGESTED QUESTIONS:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp}
                      type="button"
                      onClick={() => handleSend(qp)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--ink)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              style={{
                padding: 12,
                borderTop: "1px solid var(--border)",
                background: "var(--surface-2)",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                aria-label="Type your message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in Bengali or English…"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
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
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--indigo)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: !input.trim() || loading ? 0.6 : 1,
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
