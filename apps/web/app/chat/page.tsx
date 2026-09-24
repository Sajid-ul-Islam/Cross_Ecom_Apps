"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { API_URL, bdt, resolveProductImage, getInStockSizes, type Product } from "@/lib/api";
import { useCart } from "@/lib/cart";
import QuickAddModal from "@/components/QuickAddModal";

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
}

export interface QuickChip {
  id: string;
  label: string;
  query: string;
}

const QUICK_SUGGESTION_CHIPS: QuickChip[] = [
  {
    id: "sizing",
    label: "👖 Jeans Sizing & Fit",
    query: "How does jeans sizing and waist fit work?",
  },
  {
    id: "exchange",
    label: "🔄 7-Day Doorstep Exchange",
    query: "How does the 7-day doorstep size exchange work?",
  },
  {
    id: "delivery",
    label: "🚚 Delivery Charges & Times",
    query: "What are the delivery charges inside and outside Dhaka?",
  },
  {
    id: "showrooms",
    label: "📍 Showroom Addresses",
    query: "Where are your retail showrooms in Dhaka and Bangladesh?",
  },
  {
    id: "drops",
    label: "✨ Latest Drops & Arrivals",
    query: "What are the new products and latest drops?",
  },
  {
    id: "cashback",
    label: "🔥 Offers & Cashback",
    query: "What are the current offers, discounts, and cashback tiers?",
  },
];

/**
 * Connects to live gateway POST /v1/deen/ai/chat.
 */
async function sendAiChatMessage(
  message: string,
  history?: Array<{ role: string; content: string }>,
  phone?: string
) {
  const res = await fetch(`${API_URL}/v1/deen/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      phone,
      history,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gateway returned HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Lightweight, zero-dependency formatted text parser.
 * Parses **bold**, ~~strikethrough~~, `code`, and \n- / • bullet points into styled elements.
 */
function renderFormattedText(text: string, isUser: boolean = false): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");

  const parseInline = (lineText: string, keyPrefix: string): React.ReactNode[] => {
    const parts = lineText.split(/(\*\*[\s\S]+?\*\*|~~[\s\S]+?~~|`[\s\S]+?`)/g);
    return parts.map((part, idx) => {
      const key = `${keyPrefix}_${idx}`;
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const content = part.slice(2, -2);
        return (
          <strong
            key={key}
            style={{
              fontWeight: 700,
              color: isUser ? "inherit" : "var(--ink)",
            }}
          >
            {content}
          </strong>
        );
      }
      if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
        const content = part.slice(2, -2);
        return (
          <del
            key={key}
            style={{
              textDecoration: "line-through",
              opacity: 0.75,
            }}
          >
            {content}
          </del>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        const content = part.slice(1, -1);
        return (
          <code
            key={key}
            style={{
              backgroundColor: isUser ? "rgba(255,255,255,0.22)" : "rgba(128,128,128,0.14)",
              border: isUser ? "none" : "1px solid var(--border)",
              padding: "1px 5px",
              borderRadius: 4,
              fontSize: "0.9em",
              fontFamily: "monospace",
              color: isUser ? "#FFFFFF" : "var(--indigo)",
            }}
          >
            {content}
          </code>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
  };

  const renderedLines: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      renderedLines.push(<div key={`spacer_${i}`} style={{ height: 6 }} />);
      continue;
    }

    const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const bulletContent = bulletMatch[3];
      renderedLines.push(
        <div
          key={`bullet_${i}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            marginLeft: indent > 0 ? indent * 8 : 2,
            marginTop: 1,
            marginBottom: 1,
            lineHeight: 1.55,
          }}
        >
          <span
            style={{
              color: isUser ? "rgba(255,255,255,0.85)" : "var(--indigo)",
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1.4,
              userSelect: "none",
            }}
          >
            •
          </span>
          <div style={{ flex: 1 }}>{parseInline(bulletContent, `b_${i}`)}</div>
        </div>
      );
      continue;
    }

    renderedLines.push(
      <div key={`line_${i}`} style={{ lineHeight: 1.55 }}>
        {parseInline(line, `l_${i}`)}
      </div>
    );
  }

  return renderedLines;
}

export default function WebChatPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Welcome to **DEEN Assistant**! I am your live AI shopping concierge connected to our live catalog, warehouse stock, and store policies.\n\nI can help you with:\n• **Jeans sizing & fit guide** (waist & length recommendations)\n• **7-day doorstep size exchange** policy\n• **Delivery charges & times** across all 64 Bangladesh districts\n• **Retail showroom locations** & opening hours\n• **Live order tracking** & Pathao logistics updates\n• **New drops & instant cashback** offers\n\nHow can I assist you today?",
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const data = await sendAiChatMessage(text, history, userPhone);

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
          text: "I experienced a brief connection blip with our catalog gateway. You can also chat directly with our Dhaka stylists on WhatsApp at **01952-700500**!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleQuickAdd = (p: any) => {
    const inStock = getInStockSizes(p);
    if (inStock.length === 1) {
      addItem(p, inStock[0]);
      setAddedIds((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [p.id]: false }));
      }, 2000);
      return;
    }
    setQuickAddProduct(p);
    setQuickAddOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        backgroundColor: "var(--background)",
        color: "var(--ink)",
        paddingTop: 16,
        paddingBottom: 80,
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          paddingLeft: 16,
          paddingRight: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--sub)" }}>
          <Link href="/" style={{ color: "var(--sub)", textDecoration: "none" }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 700 }}>AI Concierge & Chat</span>
        </div>

        {/* Header Card */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--indigo) 0%, #3730a3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 20,
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
            >
              ✨
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
                  DEEN Assistant
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--emerald)",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "var(--emerald)",
                      boxShadow: "0 0 6px var(--emerald)",
                    }}
                  />
                  Live Gateway
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--sub)" }}>
                Menswear recommendations, 7-day exchange rules, 64-district delivery fees & showroom locator
              </p>
            </div>
          </div>

          {/* Direct Support Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <a
              href="https://wa.me/8801952700500"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Direct WhatsApp Support (01952-700500)"
              title="Chat with Stylist on WhatsApp"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(37, 211, 102, 0.12)",
                border: "1px solid rgba(37, 211, 102, 0.35)",
                color: "#25D366",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp (01952-700500)</span>
            </a>

            <a
              href="https://m.me/deencommerce"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Direct Facebook Messenger Support"
              title="Chat on Facebook Messenger"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(0, 132, 255, 0.12)",
                border: "1px solid rgba(0, 132, 255, 0.35)",
                color: "#0084FF",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Messenger</span>
            </a>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--sub)", letterSpacing: 0.4 }}>
              QUICK SHOPPING INQUIRIES:
            </span>
            <span style={{ fontSize: 11, color: "var(--sub)" }}>Click any chip to ask DEEN Assistant</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSend(chip.query)}
                disabled={loading}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-2)",
                  color: "var(--ink)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Conversation Card */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            height: "560px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
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
                {/* Bubble Container */}
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 18px",
                    borderRadius: 14,
                    borderBottomRightRadius: m.sender === "user" ? 2 : 14,
                    borderBottomLeftRadius: m.sender === "ai" ? 2 : 14,
                    backgroundColor: m.sender === "user" ? "var(--indigo)" : "var(--surface-2)",
                    color: m.sender === "user" ? "#FFFFFF" : "var(--ink)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    border: m.sender === "ai" ? "1px solid var(--border)" : "none",
                    wordBreak: "break-word",
                  }}
                >
                  {renderFormattedText(m.text, m.sender === "user")}
                </div>

                {/* Embedded Suggested Products */}
                {m.products && m.products.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 10,
                      width: "100%",
                      maxWidth: "85%",
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
                            borderRadius: 10,
                            backgroundColor: "var(--surface-2)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: 52,
                              height: 64,
                              borderRadius: 6,
                              overflow: "hidden",
                              flexShrink: 0,
                              backgroundColor: "var(--surface)",
                            }}
                          >
                            <Image
                              src={resolveProductImage(p.image)}
                              alt={p.name}
                              fill
                              sizes="52px"
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
                            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--indigo)", marginTop: 2 }}>
                              {bdt(price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              backgroundColor: isAdded ? "var(--emerald)" : "var(--indigo)",
                              color: "#FFFFFF",
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

                {/* Suggested Action Buttons */}
                {m.actions && m.actions.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
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
                          padding: "6px 12px",
                          borderRadius: 14,
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface)",
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
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ fontSize: 12, color: "var(--sub)", fontStyle: "italic" }}>
                  DEEN Assistant is querying live catalog and knowledge base…
                </span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            style={{
              padding: 14,
              borderTop: "1px solid var(--border)",
              backgroundColor: "var(--surface-2)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              aria-label="Type your shopping inquiry"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in Bengali or English (e.g. 'আমার সাইজ ৩২, জিন্স সাজেস্ট করো' or 'delivery fee')..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--indigo)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 800,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>Send</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <QuickAddModal
        product={quickAddProduct}
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  );
}
