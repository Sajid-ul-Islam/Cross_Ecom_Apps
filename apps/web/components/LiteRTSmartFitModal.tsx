"use client";

import React, { useState, useMemo } from "react";
import { WebLiteRTEngine, type SmartFitResult } from "@/lib/ai/LiteRTEngine";

export interface LiteRTSmartFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  currentSize?: string;
}

export default function LiteRTSmartFitModal({
  isOpen,
  onClose,
  onSelectSize,
  currentSize,
}: LiteRTSmartFitModalProps) {
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [fitPref, setFitPref] = useState<"slim" | "regular" | "relaxed">("regular");
  const [denimStretch, setDenimStretch] = useState<"rigid_raw" | "comfort_stretch" | "super_stretch">("comfort_stretch");

  const prediction: SmartFitResult = useMemo(() => {
    return WebLiteRTEngine.getInstance().predictSmartFit({
      heightCm,
      weightKg,
      fitPreference: fitPref,
      denimStretch,
    });
  }, [heightCm, weightKg, fitPref, denimStretch]);

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
          maxWidth: 480,
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
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                ⚡ GOOGLE LITE-RT ON-DEVICE AI
              </span>
              <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>0ms Inference</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Smart Sizing &amp; Fit Predictor</h2>
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

        {/* Height Control */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
            <span>Your Height</span>
            <span style={{ color: "#f59e0b", fontWeight: 800 }}>{heightCm} cm</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[165, 170, 175, 180, 185].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setHeightCm(val)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: heightCm === val ? 800 : 600,
                  backgroundColor: heightCm === val ? "#f59e0b" : "var(--surface-2, #1a1e2e)",
                  color: heightCm === val ? "#000000" : "var(--ink, #ffffff)",
                  border: heightCm === val ? "1px solid #f59e0b" : "1px solid var(--border, #262b3d)",
                  cursor: "pointer",
                }}
              >
                {val} cm
              </button>
            ))}
          </div>
        </div>

        {/* Weight Control */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
            <span>Your Weight</span>
            <span style={{ color: "#f59e0b", fontWeight: 800 }}>{weightKg} kg</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[60, 65, 72, 78, 85, 92].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setWeightKg(val)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: weightKg === val ? 800 : 600,
                  backgroundColor: weightKg === val ? "#f59e0b" : "var(--surface-2, #1a1e2e)",
                  color: weightKg === val ? "#000000" : "var(--ink, #ffffff)",
                  border: weightKg === val ? "1px solid #f59e0b" : "1px solid var(--border, #262b3d)",
                  cursor: "pointer",
                }}
              >
                {val} kg
              </button>
            ))}
          </div>
        </div>

        {/* Fit Preference */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>Silhouette Cut Preference</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["slim", "regular", "relaxed"] as const).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setFitPref(pref)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: fitPref === pref ? 800 : 600,
                  backgroundColor: fitPref === pref ? "#f59e0b" : "var(--surface-2, #1a1e2e)",
                  color: fitPref === pref ? "#000000" : "var(--ink, #ffffff)",
                  border: fitPref === pref ? "1px solid #f59e0b" : "1px solid var(--border, #262b3d)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Prediction Card */}
        <div
          style={{
            backgroundColor: "var(--surface-2, #161926)",
            borderRadius: 12,
            border: "1px solid var(--border, #262b3d)",
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 800, letterSpacing: "0.5px" }}>
                RECOMMENDED DEEN SIZE
              </span>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>
                Size {prediction.recommendedSize}
              </div>
            </div>
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: 12,
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {Math.round(prediction.confidence * 100)}% Match
            </span>
          </div>

          <p style={{ fontSize: 12, color: "var(--sub, #9ca3af)", lineHeight: 1.6, margin: "0 0 12px 0" }}>
            {prediction.fitCommentary}
          </p>

          <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#9ca3af" }}>Predicted Inseam:</span>
            <strong>{prediction.recommendedInseam} inches</strong>
          </div>
          <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#9ca3af" }}>Stretch Factor:</span>
            <strong>{prediction.stretchAdjustment}</strong>
          </div>
          <div style={{ fontSize: 10, color: "#10b981", marginTop: 10, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            🔒 100% On-Device AI inference. Zero personal biometric data leaves your browser.
          </div>
        </div>

        {/* Apply CTA */}
        <button
          type="button"
          onClick={() => {
            onSelectSize(prediction.recommendedSize);
            onClose();
          }}
          style={{
            width: "100%",
            backgroundColor: "#f59e0b",
            color: "#000000",
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          ✓ APPLY SIZE {prediction.recommendedSize} TO ITEM
        </button>
      </div>
    </div>
  );
}
