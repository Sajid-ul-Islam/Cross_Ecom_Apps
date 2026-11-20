"use client";

import React, { useState } from "react";
import { WebGeminiNanoEngine, type WebGeminiNanoResponse } from "@/lib/ai/GeminiNanoEngine";

export interface GeminiNanoAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  category?: string;
}

export default function GeminiNanoAssistantModal({
  isOpen,
  onClose,
  productName = "DEEN Artisanal Selvedge Denim",
  category = "Denim",
}: GeminiNanoAssistantModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<WebGeminiNanoResponse | null>(null);

  const engine = WebGeminiNanoEngine.getInstance();

  const handleQuickAction = async (type: "styling" | "care" | "exchange" | "delivery") => {
    setLoading(true);
    try {
      if (type === "styling") {
        const res = await engine.generateStylingAdvice(productName, "Regular");
        setResponse(res);
      } else if (type === "care") {
        const res = await engine.generateCareGuide();
        setResponse(res);
      } else if (type === "exchange") {
        const res = await engine.answerQuery("What is the 7-day exchange policy?");
        setResponse(res);
      } else {
        const res = await engine.answerQuery("What are the delivery charges?");
        setResponse(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await engine.answerQuery(query);
      setResponse(res);
      setQuery("");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card, #12141e)",
          color: "var(--ink, #ffffff)",
          borderRadius: 16,
          border: "1px solid var(--border, #262b3d)",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--border, #262b3d)",
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.15)",
                  color: "#c084fc",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                ✨ GOOGLE GEMINI NANO
              </span>
              <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>On-Device SLM</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>On-Device Denim Concierge</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--sub, #9ca3af)",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Quick Prompts */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.5px", marginBottom: 8 }}>
            RECOMMENDED QUESTIONS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => handleQuickAction("styling")}
              style={{
                backgroundColor: "var(--surface-2, #161926)",
                border: "1px solid var(--border, #262b3d)",
                color: "var(--ink, #ffffff)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              👖 How to style {productName.slice(0, 20)}...
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("care")}
              style={{
                backgroundColor: "var(--surface-2, #161926)",
                border: "1px solid var(--border, #262b3d)",
                color: "var(--ink, #ffffff)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🧼 Raw Denim First Soak &amp; Wash Care
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("exchange")}
              style={{
                backgroundColor: "var(--surface-2, #161926)",
                border: "1px solid var(--border, #262b3d)",
                color: "var(--ink, #ffffff)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🔄 7-Day Doorstep Size Exchange
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("delivery")}
              style={{
                backgroundColor: "var(--surface-2, #161926)",
                border: "1px solid var(--border, #262b3d)",
                color: "var(--ink, #ffffff)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🚚 64 Districts Delivery Rates
            </button>
          </div>
        </div>

        {/* Response Box */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#f59e0b", fontSize: 13 }}>
            Google Gemini Nano synthesizing on-device response...
          </div>
        ) : response ? (
          <div
            style={{
              backgroundColor: "var(--surface-2, #161926)",
              borderRadius: 12,
              border: "1px solid var(--border, #262b3d)",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 12 }}>
              {response.content}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#10b981",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{response.metadata.latencyMs}ms response time</span>
              <span>🔒 {response.metadata.privacy}</span>
            </div>
          </div>
        ) : null}

        {/* Query Input */}
        <form onSubmit={handleAsk} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Gemini Nano anything about DEEN products..."
            style={{
              flex: 1,
              height: 44,
              backgroundColor: "var(--surface-2, #161926)",
              color: "var(--ink, #ffffff)",
              border: "1px solid var(--border, #262b3d)",
              borderRadius: 8,
              padding: "0 14px",
              fontSize: 13,
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#f59e0b",
              color: "#000000",
              border: "none",
              borderRadius: 8,
              padding: "0 18px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Ask →
          </button>
        </form>
      </div>
    </div>
  );
}
