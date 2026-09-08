"use client";

import React, { useState, useEffect } from "react";
import { type Product, fetchOutlets, type Outlet } from "@/lib/api";

const FALLBACK_OUTLETS: Outlet[] = [
  {
    id: "mirpur-12",
    name: "DEEN Mirpur 12 (Flagship Outlet)",
    tag: "CENTRAL STUDIO & STORE PICKUP",
    address: "Level 3, Ramzannesa Super Market, Mirpur 12 Bus Stand, Dhaka-1216",
    hours: "Open Daily: 10:00 AM – 09:30 PM",
    phone: "01972-627981",
    stockText: "In Stock (Ready for Pickup)",
    units: 8,
    mapQuery: "Ramzannesa+Super+Market+Mirpur+12+Dhaka",
  },
  {
    id: "wari-outlet",
    name: "DEEN Wari Outlet",
    tag: "DHAKA SOUTH SHOWROOM",
    address: "Ground Floor, 41 A.K Famous Tower, Rankin Street, Wari, Dhaka-1203",
    hours: "Open Daily: 10:30 AM – 09:30 PM",
    phone: "01972-627983",
    stockText: "In Stock (5 Units Available)",
    units: 5,
    mapQuery: "Rankin+Street+Wari+Dhaka",
  },
  {
    id: "cumilla-outlet",
    name: "DEEN Cumilla Outlet",
    tag: "CUMILLA REGIONAL SHOWROOM",
    address: "4th Floor, QR Tower, Badurtola (Dharmasagor Side), Kandirpar, Cumilla-3500",
    hours: "Open Daily: 10:30 AM – 09:00 PM",
    phone: "01972-627984",
    stockText: "In Stock (4 Units Available)",
    units: 4,
    mapQuery: "QR+Tower+Badurtola+Cumilla",
  },
  {
    id: "sylhet-outlet",
    name: "DEEN Sylhet Outlet",
    tag: "SYLHET REGIONAL SHOWROOM",
    address: "54/A, Level 2, Block-A, Kumarpara, Zindabazar, Sylhet",
    hours: "Open Daily: 10:30 AM – 09:30 PM",
    phone: "01972-627985",
    stockText: "In Stock (6 Units Available)",
    units: 6,
    mapQuery: "Kumarpara+Sylhet",
  },
];

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
          {outlets.map((o) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
