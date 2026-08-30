"use client";

import React from "react";
import { type Product } from "@/lib/api";

const OUTLETS = [
  {
    id: "mirpur",
    name: "DEEN Mirpur 12 (Flagship Outlet)",
    tag: "CENTRAL STUDIO & STORE",
    address: "2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216",
    hours: "Open Daily: 10:00 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (Ready for Pickup)",
    units: 8,
    mapQuery: "Ramzannesa Super Market, Mirpur 12, Dhaka",
  },
  {
    id: "wari",
    name: "DEEN Wari Outlet",
    tag: "DHAKA SOUTH OUTLET",
    address: "Ground Floor, 41 A.K Famous Tower, Rankin Street, Wari, Dhaka-1203",
    hours: "Open Daily: 10:30 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (5 Units Available)",
    units: 5,
    mapQuery: "41 A.K Famous Tower, Rankin Street, Wari, Dhaka",
  },
  {
    id: "cumilla",
    name: "DEEN Cumilla Outlet",
    tag: "CUMILLA SHOWROOM",
    address: "4th Floor, QR Tower, Badurtola, Cumilla",
    hours: "Open Daily: 10:30 AM - 09:00 PM",
    phone: "+8801952700500",
    stockText: "In Stock (4 Units Available)",
    units: 4,
    mapQuery: "QR Tower, Badurtola, Cumilla",
  },
  {
    id: "sylhet",
    name: "DEEN Sylhet Outlet",
    tag: "SYLHET SHOWROOM",
    address: "Block-A, House-54/2, Kumar Para, Sylhet",
    hours: "Open Daily: 10:30 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (6 Units Available)",
    units: 6,
    mapQuery: "House 54/2, Kumar Para, Sylhet",
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
          {OUTLETS.map((o) => (
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
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.mapQuery)}`}
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
