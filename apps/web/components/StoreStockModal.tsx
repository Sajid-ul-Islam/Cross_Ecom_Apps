"use client";

import React, { useState, useEffect } from "react";
import { type Product, fetchOutlets, type Outlet } from "@/lib/api";

const FALLBACK_OUTLETS: Outlet[] = [];

interface StoreStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedSize: string;
}

export default function StoreStockModal({
  isOpen,
  onClose,
  product,
  selectedSize,
}: StoreStockModalProps) {
  const [outlets, setOutlets] = useState<Outlet[]>(FALLBACK_OUTLETS);

  useEffect(() => {
    if (!isOpen) return;
    fetchOutlets().then((apiOutlets) => {
      if (apiOutlets.length > 0) setOutlets(apiOutlets);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              🏪 OUTLET STOCK & STORE PICKUP
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              {product.name} {selectedSize ? `· Size ${selectedSize}` : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {outlets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 16px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚚</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
                Online-First Fashion Store
              </h3>
              <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, maxWidth: 440, margin: "0 auto 16px" }}>
                DEEN operates exclusively as an online store delivering to all 64 districts across Bangladesh with Cash on Delivery (COD) and 7-day doorstep size exchange. Currently we do not operate physical walk-in retail outlets.
              </p>
              <a
                href="https://wa.me/8801952700500"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ fontSize: 13, padding: "10px 18px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6, margin: "0 auto" }}
              >
                💬 WhatsApp Concierge (+880 1952-700500)
              </a>
            </div>
          ) : (
            outlets.map((o) => (
              <div
                key={o.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 16,
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--indigo)", background: "var(--indigo-light)", padding: "2px 6px", borderRadius: 4 }}>
                      {o.tag}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>{o.name}</h3>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--emerald)", background: "var(--emerald-light)", padding: "3px 8px", borderRadius: 12 }}>
                    ✓ {o.stockText}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: "var(--sub)", margin: 0 }}>📍 {o.address}</p>
                <p style={{ fontSize: 12, color: "var(--sub)", margin: 0 }}>🕒 {o.hours}</p>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.mapQuery || o.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--outline"
                    style={{ fontSize: 12, padding: "6px 12px", fontWeight: 700 }}
                  >
                    🗺️ View Map
                  </a>
                  <a
                    href={`tel:${o.phone}`}
                    className="btn btn--outline"
                    style={{ fontSize: 12, padding: "6px 12px", fontWeight: 700 }}
                  >
                    📞 Call Store
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
