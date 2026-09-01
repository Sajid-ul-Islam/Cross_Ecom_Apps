"use client";

import React, { useEffect, useState } from "react";
import { fetchBankOffers, type BankOffer } from "@/lib/api";

interface BankOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BankOffersModal({ isOpen, onClose }: BankOffersModalProps) {
  const [offers, setOffers] = useState<BankOffer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchBankOffers()
        .then((data) => {
          if (data && data.length > 0) setOffers(data);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleCopy = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 640, width: "95vw", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
                PARTNER DISCOUNTS
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
                💳 BANK CARDS &amp; MFS OFFERS
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 3 }}>
              Save up to 15% instant discount and 0% EMI with our partner banks and payment gateways
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 0" }}>
          {loading && offers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sub)", fontSize: 13 }}>
              Loading active bank card offers…
            </div>
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 14,
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 30,
                        borderRadius: 6,
                        background: offer.color || "var(--indigo)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {offer.logoText || "CARD"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ fontSize: 14, color: "var(--ink)" }}>{offer.bankName}</strong>
                        <span
                          style={{
                            background: "rgba(99,102,241,0.12)",
                            color: "var(--indigo)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {offer.badge}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--sub)" }}>{offer.cardType}</span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: "var(--emerald)",
                      background: "rgba(16,185,129,0.1)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {offer.discount}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "var(--ink)", margin: "2px 0", lineHeight: 1.4 }}>
                  {offer.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 8,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--sub)" }}>
                    Min Spend: <strong>৳{offer.minSpend.toLocaleString()}</strong> · Valid till {offer.validTill}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(offer.couponCode)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: "1px dashed var(--indigo)",
                      background: copiedCode === offer.couponCode ? "var(--emerald)" : "var(--surface-2)",
                      color: copiedCode === offer.couponCode ? "#fff" : "var(--indigo)",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {copiedCode === offer.couponCode ? "✓ COPIED!" : `CODE: ${offer.couponCode}`}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <span style={{ fontSize: 11, color: "var(--sub)" }}>
            ℹ️ Discount applies at checkout or via gateway payment page.
          </span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onClose}
            style={{ fontSize: 12, padding: "8px 16px", fontWeight: 800 }}
          >
            Got it, Back to Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
