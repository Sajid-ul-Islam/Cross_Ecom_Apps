"use client";

import React from "react";

interface WhatsAppButtonProps {
  productName?: string;
  size?: string;
  sku?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function WhatsAppButton({
  productName,
  size,
  sku,
  className = "",
  style,
}: WhatsAppButtonProps) {
  const phone = "8801952700500";
  const defaultText = productName
    ? `Salam, I would like to inquire about "${productName}"${size ? ` (Size: ${size})` : ""}${sku ? ` [SKU: ${sku}]` : ""}. Is it currently in stock for delivery?`
    : "Salam DEEN team, I need assistance with an order or product inquiry.";

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(defaultText)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn ${className}`}
      style={{
        background: "#25D366",
        color: "#FFFFFF",
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "none",
        textDecoration: "none",
        ...style,
      }}
    >
      <span style={{ fontSize: 16 }}>💬</span>
      <span>WhatsApp Concierge</span>
    </a>
  );
}
