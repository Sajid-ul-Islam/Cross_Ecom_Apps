"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/lib/types";
import { bdt } from "@/lib/api";
import QuickReplies from "./QuickReplies";

export interface MessageItem {
  id: string;
  role: "user" | "bot";
  text: string;
  products?: ProductCard[];
  quickReplies?: string[];
  actions?: Array<{ label: string; action: string; payload?: any }>;
  ts: number;
}

interface ChatMessageProps {
  message: MessageItem;
  onOrderProduct?: (product: ProductCard) => void;
  onAddToCart?: (product: ProductCard) => void;
  onAction?: (action: string, payload?: any) => void;
  onSelectQuickReply?: (reply: string) => void;
  isLatest?: boolean;
}

/**
 * Lightweight formatted text parser for bold, strike, code, and bullet points.
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
            lineHeight: 1.5,
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
      <div key={`line_${i}`} style={{ lineHeight: 1.5 }}>
        {parseInline(line, `l_${i}`)}
      </div>
    );
  }

  return renderedLines;
}

export default function ChatMessage({
  message,
  onOrderProduct,
  onAddToCart,
  onAction,
  onSelectQuickReply,
  isLatest = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 14,
        maxWidth: "100%",
      }}
    >
      {/* Sender indicator */}
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--indigo) 0%, #3b82f6 100%)",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
            }}
          >
            👖
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sub)" }}>DEEN Concierge</span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        style={{
          maxWidth: "88%",
          padding: "11px 15px",
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 3 : 16,
          borderBottomLeftRadius: isUser ? 16 : 3,
          background: isUser ? "var(--indigo)" : "var(--surface)",
          color: isUser ? "#FFFFFF" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--border)",
          boxShadow: isUser ? "0 3px 10px rgba(79, 70, 229, 0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
          fontSize: 13.5,
          wordBreak: "break-word",
        }}
      >
        {renderFormattedText(message.text, isUser)}
      </div>

      {/* Attached Product Cards Carousel / Grid */}
      {message.products && message.products.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            maxWidth: "100%",
            marginTop: 10,
            paddingBottom: 6,
            scrollbarWidth: "thin",
          }}
        >
          {message.products.map((p) => {
            const currentPrice = p.salePrice ?? p.price;
            const hasSale = p.salePrice && p.salePrice < p.price;
            return (
              <div
                key={p.id}
                style={{
                  minWidth: 175,
                  maxWidth: 195,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: 130, background: "var(--surface-2)" }}>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="195px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32 }}>
                      👖
                    </div>
                  )}
                  {hasSale && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        background: "var(--crimson)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      SALE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--sub)", textTransform: "uppercase" }}>
                      {p.category || "DEEN"}
                    </span>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "var(--ink)",
                        margin: "2px 0 4px",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: "var(--indigo)" }}>
                        {bdt(currentPrice)}
                      </span>
                      {hasSale && (
                        <span style={{ fontSize: 11, color: "var(--sub)", textDecoration: "line-through" }}>
                          {bdt(p.price)}
                        </span>
                      )}
                    </div>

                    {/* Sizes chips */}
                    {p.sizes && p.sizes.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                        {p.sizes.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: 9.5,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              color: "var(--sub)",
                              fontWeight: 700,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => onOrderProduct?.(p)}
                      style={{
                        width: "100%",
                        padding: "7px 0",
                        background: "var(--indigo)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 7,
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                      }}
                    >
                      <span>⚡</span> Order in Chat
                    </button>

                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={() => onAddToCart(p)}
                        style={{
                          width: "100%",
                          padding: "6px 0",
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "1px solid var(--border)",
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <span>🛒</span> Add to Bag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggested Action Chips (WhatsApp, Shop, etc.) */}
      {message.actions && message.actions.length > 0 && onAction && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {message.actions.map((act, i) => (
            <button
              key={`${act.action}_${i}`}
              type="button"
              onClick={() => onAction(act.action, act.payload)}
              style={{
                background: "var(--surface-2)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}

      {/* Attached Quick Replies */}
      {isLatest && message.quickReplies && message.quickReplies.length > 0 && onSelectQuickReply && (
        <QuickReplies replies={message.quickReplies} onSelect={onSelectQuickReply} />
      )}
    </div>
  );
}
