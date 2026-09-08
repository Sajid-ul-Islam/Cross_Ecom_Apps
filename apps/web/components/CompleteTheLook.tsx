"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, bdt, resolveProductImage } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface CompleteTheLookProps {
  currentProduct: Product;
  allProducts: Product[];
}

export default function CompleteTheLook({
  currentProduct,
  allProducts,
}: CompleteTheLookProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // Find 2 matching items from complementary categories
  const complementaryCategories = (() => {
    switch (currentProduct.category) {
      case "JEANS":
        return ["T-SHIRT", "SHIRT", "POLO"];
      case "PANJABI":
        return ["TROUSERS", "ACCESSORIES", "SHIRT"];
      case "SHIRT":
      case "T-SHIRT":
      case "POLO":
        return ["JEANS", "TROUSERS", "ACCESSORIES"];
      default:
        return ["JEANS", "T-SHIRT", "SHIRT"];
    }
  })();

  const matchingItems = allProducts
    .filter(
      (p) =>
        p.id !== currentProduct.id &&
        complementaryCategories.includes(p.category) &&
        p.stockStatus === "instock"
    )
    .slice(0, 2);

  if (matchingItems.length === 0) return null;

  const fullLook = [currentProduct, ...matchingItems];
  const regularTotal = fullLook.reduce((s, p) => s + (p.salePrice ?? p.price), 0);
  const bundleDiscount = Math.round(regularTotal * 0.1); // 10% Bundle Discount
  const bundleTotal = regularTotal - bundleDiscount;

  const handleAddFullLook = () => {
    fullLook.forEach((item) => {
      const size = item.sizes?.[0] || "FREE";
      addItem(item, size);
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div
      style={{
        marginTop: 32,
        padding: "20px 24px",
        borderRadius: 12,
        border: "1.5px solid var(--border)",
        background: "var(--surface-1)",
      }}
      className="complete-the-look-card"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 12,
              background: "var(--indigo)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            ✨ STYLIST CURATION
          </span>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: 0.5,
              margin: 0,
              color: "var(--text-main)",
            }}
          >
            COMPLETE THE LOOK
          </h3>
        </div>

        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(16, 185, 129, 0.12)",
            color: "var(--emerald)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          🏷️ SAVE 10% BUNDLE
        </span>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-sub)",
          margin: "0 0 16px 0",
        }}
      >
        Curated menswear pairing by DEEN Dhaka stylists. Buy the complete outfit & enjoy an automatic 10% bundle discount.
      </p>

      {/* Outfit Thumbnails Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {fullLook.map((item, idx) => {
          const itemPrice = item.salePrice ?? item.price;
          const isMain = idx === 0;

          return (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "var(--indigo)",
                  }}
                >
                  +
                </span>
              )}
              <Link
                href={`/product/${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: isMain ? "1.5px solid var(--indigo)" : "1px solid var(--border)",
                  background: "var(--surface-2)",
                  minWidth: 170,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 44,
                    height: 52,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={resolveProductImage(item.images[0])}
                    alt={item.name}
                    fill
                    sizes="44px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ overflow: "hidden" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 800,
                      color: isMain ? "var(--indigo)" : "var(--text-sub)",
                      textTransform: "uppercase",
                    }}
                  >
                    {isMain ? "THIS PIECE" : item.category}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-main)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 110,
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "var(--indigo)",
                    }}
                  >
                    {bdt(itemPrice)}
                  </span>
                </div>
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      {/* Pricing & CTA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "var(--text-sub)", display: "block" }}>
            3-Piece Curated Look Price:
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "var(--emerald)",
              }}
            >
              {bdt(bundleTotal)}
            </span>
            <span
              style={{
                fontSize: 13,
                textDecoration: "line-through",
                color: "var(--text-sub)",
              }}
            >
              {bdt(regularTotal)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--emerald)",
              }}
            >
              (Save {bdt(bundleDiscount)})
            </span>
          </div>
        </div>

        <button
          onClick={handleAddFullLook}
          disabled={added}
          className="btn btn--primary"
          style={{
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 800,
            background: added ? "var(--emerald)" : "var(--indigo)",
            borderColor: added ? "var(--emerald)" : "var(--indigo)",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {added ? "✓ FULL OUTFIT ADDED TO BAG!" : `🛍️ ADD COMPLETE OUTFIT · ${bdt(bundleTotal)}`}
        </button>
      </div>
    </div>
  );
}
