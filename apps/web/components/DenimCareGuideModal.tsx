"use client";

import React from "react";

interface DenimCareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DenimCareGuideModal({ isOpen, onClose }: DenimCareGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              📖 RAW DENIM CARE & FADING GUIDE
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              Artisanal Japanese Selvedge Handbook
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Philosophy Banner */}
          <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", color: "#fff", padding: 18, borderRadius: "var(--radius)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 4 }}>
              RAW SELVEDGE PHILOSOPHY
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginTop: 8, marginBottom: 4 }}>
              A Canvas That Evolves With Your Life
            </h3>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              Unlike pre-distressed mass market jeans, DEEN 13.5 oz raw selvedge denim is unwashed and untreated. Every crease, whisker, and fade will form uniquely to your body.
            </p>
          </div>

          {/* Steps */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                1
              </span>
              <strong style={{ fontSize: 14, color: "var(--ink)" }}>THE FIRST COLD SOAK</strong>
            </div>
            <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, paddingLeft: 34 }}>
              Fill a tub with cold or lukewarm water. Turn your selvedge jeans inside out and submerge for 30–45 minutes with a pinch of sea salt. Hang dry outdoors in shade. Never machine dry.
            </p>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                2
              </span>
              <strong style={{ fontSize: 14, color: "var(--ink)" }}>BREAK-IN & HIGH CONTRAST FADING</strong>
            </div>
            <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, paddingLeft: 34 }}>
              Wear your raw denim continuously for the first 3 to 6 months before your first deep wash. Daily friction wears off the surface indigo, creating sharp contrast honeycombs behind your knees and authentic lap whiskers.
            </p>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                3
              </span>
              <strong style={{ fontSize: 14, color: "var(--ink)" }}>WASHING & PRESERVATION</strong>
            </div>
            <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, paddingLeft: 34 }}>
              When washing is required, use mild detergent or wool wash in cold water (≤ 30°C). Avoid bleach or fabric softeners. Always hang dry upside down by the cuffs to preserve the custom roping effect on the chain-stitched hem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
