"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Product, bdt, resolveProductImage, getInStockSizes, fetchProduct, decodeHtmlEntities } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface QuickAddModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialSize?: string;
}

export default function QuickAddModal({
  product,
  isOpen,
  onClose,
  initialSize,
}: QuickAddModalProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Active product is detailedProduct (with fresh variations) or initial product
  const activeProduct = detailedProduct || product;

  // Derive in-stock sizes (strictly filtering out any out of stock sizes)
  const inStockSizes = useMemo(() => {
    return getInStockSizes(activeProduct);
  }, [activeProduct]);

  // When opened with a product, fetch fresh variations if not already loaded
  useEffect(() => {
    if (!isOpen || !product) {
      setDetailedProduct(null);
      setSelectedSize("");
      setQty(1);
      setAdded(false);
      return;
    }

    // Set initial size if valid and in stock
    const initialAvailable = getInStockSizes(product);
    if (initialSize && initialAvailable.includes(initialSize)) {
      setSelectedSize(initialSize);
    } else if (initialAvailable.length === 1) {
      setSelectedSize(initialAvailable[0]);
    } else {
      setSelectedSize("");
    }
    setQty(1);
    setAdded(false);

    // If product doesn't have variations loaded yet, fetch them to ensure live stock accuracy
    if (!product.variations || product.variations.length === 0) {
      setLoadingVariations(true);
      fetchProduct(product.id)
        .then((fresh) => {
          if (fresh && fresh.id === product.id) {
            setDetailedProduct(fresh);
            const freshSizes = getInStockSizes(fresh);
            // If current selectedSize is now out of stock, clear it
            setSelectedSize((prev) => (prev && freshSizes.includes(prev) ? prev : freshSizes.length === 1 ? freshSizes[0] : ""));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingVariations(false));
    }
  }, [isOpen, product, initialSize]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const currentPrice = product.salePrice ?? product.price;
  const originalPrice =
    product.regularPrice && product.regularPrice > currentPrice
      ? product.regularPrice
      : product.salePrice && product.price > product.salePrice
      ? product.price
      : null;
  const hasDiscount = Boolean(originalPrice && originalPrice > currentPrice);
  const discountPct =
    product.salePct ||
    (hasDiscount && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0);

  const isOOS = product.stockStatus === "outofstock" || inStockSizes.length === 0;
  const primaryImg = resolveProductImage(product.images?.[0] || product.gallery?.[0] || "");

  const handleAddToCart = () => {
    if (!selectedSize || isOOS) return;
    addItem(product, selectedSize, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div
      className="quick-add-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick Add ${product.name}`}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        className="quick-add-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--surface)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "20px 20px 28px",
          boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.3)",
          position: "relative",
          animation: "slideUpQuickAdd 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Swipe Pill / Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            margin: "0 auto 16px auto",
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Quick Add"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--ink)",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* Product Snippet Header */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 90,
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--surface-2)",
              flexShrink: 0,
            }}
          >
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              sizes="72px"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--sub)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {product.category}
              </span>
              {product.brand && product.brand !== "DEEN" && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    color: "var(--indigo)",
                    textTransform: "uppercase",
                    background: "rgba(79, 70, 229, 0.1)",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  {product.brand}
                </span>
              )}
            </div>

            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--ink)",
                lineHeight: 1.25,
                marginBottom: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {decodeHtmlEntities(product.name)}
            </h3>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "var(--indigo)" }}>
                {bdt(currentPrice)}
              </span>
              {hasDiscount && originalPrice && (
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--sub)",
                    textDecoration: "line-through",
                  }}
                >
                  {bdt(originalPrice)}
                </span>
              )}
              {discountPct > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--crimson)",
                    background: "rgba(239, 68, 68, 0.1)",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  -{discountPct}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />

        {/* Size Selection Section */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              SELECT SIZE {selectedSize ? `· ${selectedSize}` : ""}
            </span>
            <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600 }}>
              {isOOS ? "Unavailable" : `${inStockSizes.length} size${inStockSizes.length > 1 ? "s" : ""} in stock`}
            </span>
          </div>

          {isOOS ? (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--surface-2)",
                borderRadius: 8,
                color: "var(--sub)",
                fontSize: 13,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              ⚠️ This item is currently out of stock in all sizes.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {inStockSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={isSelected}
                    style={{
                      minWidth: 50,
                      minHeight: 44,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `2px solid ${
                        isSelected ? "var(--indigo)" : "var(--border)"
                      }`,
                      background: isSelected ? "var(--indigo)" : "var(--surface-2)",
                      color: isSelected ? "#FFFFFF" : "var(--ink)",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          {loadingVariations && (
            <p style={{ fontSize: 10.5, color: "var(--sub)", marginTop: 6 }}>
              Verifying real-time stock…
            </p>
          )}
        </div>

        {/* Quantity Stepper */}
        {!isOOS && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              padding: "10px 14px",
              background: "var(--surface-2)",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
              Quantity
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: qty <= 1 ? "not-allowed" : "pointer",
                  opacity: qty <= 1 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span style={{ fontSize: 14, fontWeight: 900, color: "var(--ink)", minWidth: 20, textAlign: "center" }}>
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                disabled={qty >= 10}
                aria-label="Increase quantity"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: qty >= 10 ? "not-allowed" : "pointer",
                  opacity: qty >= 10 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedSize || isOOS || added}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 8,
            border: "none",
            background: added
              ? "var(--emerald)"
              : !selectedSize || isOOS
              ? "var(--surface-2)"
              : "var(--indigo)",
            color: !selectedSize || isOOS ? "var(--sub)" : "#FFFFFF",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 0.5,
            cursor: !selectedSize || isOOS || added ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          {added
            ? `✓ ADDED (SIZE ${selectedSize})`
            : isOOS
            ? "OUT OF STOCK"
            : !selectedSize
            ? "SELECT A SIZE TO ADD"
            : `ADD TO BAG · ${bdt(currentPrice * qty)}`}
        </button>

        {/* Link to Full PDP */}
        <div style={{ textAlign: "center" }}>
          <Link
            href={`/product/${product.id}`}
            onClick={onClose}
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--sub)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            View Full Product Specifications →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideUpQuickAdd {
          from {
            transform: translateY(100%);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (min-width: 768px) {
          .quick-add-modal-backdrop {
            align-items: center !important;
          }
          .quick-add-modal-sheet {
            border-radius: 16px !important;
            animation: zoomInQuickAdd 0.2s ease forwards !important;
          }
        }
        @keyframes zoomInQuickAdd {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
