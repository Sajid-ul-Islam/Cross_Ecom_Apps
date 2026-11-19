"use client";

import React, { useState, useEffect } from "react";
import { bdt } from "@/lib/api";

interface GiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AMOUNTS = [1000, 2500, 5000, 10000];

const CARD_THEMES = [
  {
    id: "eid",
    name: "Eid Special",
    bg: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    accent: "#FBBF24",
    sub: "Joyous Eid Celebrations",
  },
  {
    id: "denim",
    name: "Cross Hatch Denim",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
    accent: "#60A5FA",
    sub: "Artisanal Denim Heritage",
  },
  {
    id: "gold",
    name: "VIP Connoisseur",
    bg: "linear-gradient(135deg, #31102f 0%, #1c051a 100%)",
    accent: "#F472B6",
    sub: "Exclusive Menswear Gift",
  },
];

export default function GiftCardModal({ isOpen, onClose }: GiftCardModalProps) {
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [amount, setAmount] = useState<number>(2500);
  const [recipientName, setRecipientName] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGeneratedCode(null);
      setCopied(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const code = `DEEN-GIFT-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${amount}`;
    setGeneratedCode(code);
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(generatedCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          overflow: "hidden",
          color: "var(--ink)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="DEEN Digital Gift Cards"
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>DEEN Digital Gift Card</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--sub)" }}>
              Share artisanal menswear with someone special
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "var(--sub)",
            }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: "80vh", overflowY: "auto" }}>
          {/* Live Card Preview */}
          <div
            style={{
              background: selectedTheme.bg,
              borderRadius: "14px",
              padding: "20px",
              color: "#FFFFFF",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              border: `1px solid ${selectedTheme.accent}40`,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: selectedTheme.accent, fontWeight: 800 }}>
                  {selectedTheme.sub}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "1px", marginTop: "2px" }}>
                  DEEN COMMERCE
                </div>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: selectedTheme.accent }}>
                {bdt(amount)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase" }}>Recipient</div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                  {recipientName.trim() || "Dear Patron"}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "10px", opacity: 0.8 }}>
                Valid across Bangladesh
              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)", display: "block", marginBottom: "8px" }}>
              Select Card Theme
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: `1.5px solid ${selectedTheme.id === theme.id ? "var(--indigo)" : "var(--border)"}`,
                    background: selectedTheme.id === theme.id ? "var(--cardSecondary, rgba(255,255,255,0.06))" : "transparent",
                    color: "var(--ink)",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Selector */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)", display: "block", marginBottom: "8px" }}>
              Gift Amount
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: `1.5px solid ${amount === amt ? "var(--indigo)" : "var(--border)"}`,
                    background: amount === amt ? "var(--indigo)" : "transparent",
                    color: amount === amt ? "#FFFFFF" : "var(--ink)",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {bdt(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Details */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)", display: "block", marginBottom: "6px" }}>
              Recipient Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Tanvir Ahmed"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--ink)",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action */}
          {generatedCode ? (
            <div
              style={{
                backgroundColor: "var(--cardSecondary, rgba(255,255,255,0.05))",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--sub)", marginBottom: "4px" }}>
                Gift Voucher Generated
              </div>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "var(--indigo)", letterSpacing: "1px", marginBottom: "10px" }}>
                {generatedCode}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: copied ? "var(--emerald, #10B981)" : "var(--indigo)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Voucher Code Copied!" : "Copy Voucher Code"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "var(--indigo)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              }}
            >
              Generate Digital Gift Card · {bdt(amount)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
