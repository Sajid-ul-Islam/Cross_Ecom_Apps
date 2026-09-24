"use client";

import React from "react";
import Image from "next/image";
import { ProductCard } from "@/lib/types";
import { bdt } from "@/lib/api";
import QuickReplies from "./QuickReplies";

export interface MessageItem {
  id: string;
  role: "user" | "bot";
  text: string;
  products?: ProductCard[];
  quickReplies?: string[];
  ts: number;
}

interface ChatMessageProps {
  message: MessageItem;
  onOrderProduct?: (product: ProductCard) => void;
  onSelectQuickReply?: (reply: string) => void;
  isLatest?: boolean;
}

export default function ChatMessage({
  message,
  onOrderProduct,
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
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--indigo)",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🤖
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sub)" }}>Assistant</span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        style={{
          maxWidth: "85%",
          padding: "10px 14px",
          borderRadius: 14,
          borderBottomRightRadius: isUser ? 2 : 14,
          borderBottomLeftRadius: isUser ? 14 : 2,
          background: isUser ? "var(--indigo)" : "var(--surface)",
          color: isUser ? "#FFFFFF" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--border)",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          fontSize: 13.5,
          lineHeight: 1.45,
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}
      >
        {message.text}
      </div>

      {/* Attached Product Cards Carousel / Grid */}
      {message.products && message.products.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            maxWidth: "100%",
            marginTop: 10,
            paddingBottom: 4,
          }}
        >
          {message.products.map((p) => {
            const currentPrice = p.salePrice ?? p.price;
            return (
              <div
                key={p.id}
                style={{
                  minWidth: 160,
                  maxWidth: 180,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: 120, background: "var(--surface-2)" }}>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="180px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 28 }}>
                      👖
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--sub)", textTransform: "uppercase" }}>
                      {p.category || "Apparel"}
                    </span>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--ink)",
                        margin: "2px 0 4px",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.name}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "var(--indigo)" }}>
                      {bdt(currentPrice)}
                    </p>
                  </div>

                  {/* Order Now Button */}
                  <button
                    type="button"
                    onClick={() => onOrderProduct?.(p)}
                    style={{
                      marginTop: 8,
                      width: "100%",
                      padding: "6px 0",
                      background: "var(--indigo)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Order Now 🛒
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attached Quick Replies */}
      {isLatest && message.quickReplies && message.quickReplies.length > 0 && onSelectQuickReply && (
        <QuickReplies replies={message.quickReplies} onSelect={onSelectQuickReply} />
      )}
    </div>
  );
}
