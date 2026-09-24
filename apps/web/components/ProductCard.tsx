"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/lib/api";
import { bdt, resolveProductImage, getInStockSizes } from "@/lib/api";
import QuickAddModal from "./QuickAddModal";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPreselectSize, setModalPreselectSize] = useState<string>("");
  const [showDesktopTray, setShowDesktopTray] = useState(false);
  const [addedSize, setAddedSize] = useState<string | null>(null);

  const inStockSizes = useMemo(() => getInStockSizes(product), [product]);
  const isOutOfStock = product.stockStatus === "outofstock" || inStockSizes.length === 0;

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

  const isSaved = isInWishlist(product.id);
  const isSelvedge = (product.category === "JEANS" || /selvedge/i.test(product.name) || /selvedge/i.test(product.fabric || "")) && product.segment !== "select";

  const primaryImg = resolveProductImage(product.images[0]);
  const secondaryImg = resolveProductImage(product.images[1] || product.images[0]);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // If only 1 size is in stock, add it directly
    if (inStockSizes.length === 1) {
      const singleSize = inStockSizes[0];
      addItem(product, singleSize, 1);
      setAddedSize(singleSize);
      setTimeout(() => setAddedSize(null), 1500);
      return;
    }

    // On mobile (< 768px), open the Quick Add bottom sheet modal
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setModalPreselectSize("");
      setModalOpen(true);
      return;
    }

    // On desktop (>= 768px), expand inline size selector tray
    setShowDesktopTray(true);
  };

  const handleAddDirectSize = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setModalPreselectSize(size);
      setModalOpen(true);
      return;
    }

    addItem(product, size, 1);
    setAddedSize(size);
    setTimeout(() => {
      setAddedSize(null);
      setShowDesktopTray(false);
    }, 1200);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <>
      <Link
        href={`/product/${product.id}`}
        className="product-card"
        id={`product-${product.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowDesktopTray(false);
        }}
      >
        {/* Image */}
        <div
          className="product-card__image-wrap"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3/4",
            overflow: "hidden",
          }}
        >
          {!imgError ? (
            <Image
              src={isHovered && secondaryImg !== primaryImg ? secondaryImg : primaryImg}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgError(true)}
              style={{
                objectFit: "cover",
                transition: "transform 0.3s ease, opacity 0.2s ease",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-2)",
                color: "var(--indigo)",
                fontSize: 36,
              }}
            >
              👖
            </div>
          )}

          {product.segment === "select" && (
            <span
              className="product-card__badge"
              style={{
                left: 8,
                top: 8,
                background: "#1e1b4b",
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.4)",
              }}
            >
              ⚡ SELECT
            </span>
          )}
          {isSelvedge && (
            <span
              className="product-card__badge"
              style={{
                left: 8,
                top: 8,
                background: "#090d16",
                color: "#f8fafc",
                borderLeft: "3px solid #c93b36",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                borderRight: "1px solid rgba(255,255,255,0.15)",
                borderBottom: "1px solid rgba(255,255,255,0.15)",
                fontSize: "9.5px",
                fontWeight: 900,
                letterSpacing: "0.5px",
              }}
            >
              🧵 SELVEDGE
            </span>
          )}
          {product.isNew && (
            <span
              className="product-card__badge product-card__badge--new"
              style={product.segment === "select" || isSelvedge ? { top: 32 } : undefined}
            >
              NEW
            </span>
          )}
          {discountPct > 0 && (
            <span className="product-card__badge product-card__badge--sale">
              -{discountPct}%
            </span>
          )}
          {isOutOfStock && (
            <span className="product-card__badge product-card__badge--oos">OUT OF STOCK</span>
          )}

          {/* Wishlist Heart Button - positioned at bottom right corner */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleToggleWishlist}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            title={isSaved ? "Saved in Wishlist" : "Save to Wishlist"}
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              zIndex: 3,
              transition: "transform 0.15s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isSaved ? "var(--crimson)" : "none"}
              stroke={isSaved ? "var(--crimson)" : "#334155"}
              strokeWidth="2.2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>

          {/* Inline Desktop Size Tray */}
          {showDesktopTray && !isOutOfStock && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                padding: "8px 10px 10px",
                zIndex: 4,
                borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    color: "#cbd5e1",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {addedSize ? `✓ ADDED (${addedSize})` : "SELECT SIZE:"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDesktopTray(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: "2px 4px",
                  }}
                  title="Close size selector"
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                {inStockSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={(e) => handleAddDirectSize(e, s)}
                    style={{
                      flex: 1,
                      minWidth: 34,
                      height: 28,
                      background: addedSize === s ? "var(--emerald)" : "rgba(255, 255, 255, 0.15)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: 4,
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={`Add size ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick add trigger button */}
          {!isOutOfStock && !showDesktopTray && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleQuickAddClick}
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                right: 48,
                padding: "8px",
                borderRadius: 6,
                border: "none",
                background: addedSize ? "var(--emerald)" : "var(--indigo)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                cursor: "pointer",
                opacity: 0,
                transition: "opacity 0.2s ease, background 0.2s ease",
                textAlign: "center",
                zIndex: 2,
              }}
              className="product-card__quick-add"
            >
              {addedSize
                ? `✓ ADDED (${addedSize})`
                : inStockSizes.length === 1
                ? `+ QUICK ADD (${inStockSizes[0]})`
                : "+ QUICK ADD"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-card__info">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <p className="product-card__category">{product.category}</p>
            {product.brand && product.brand !== "DEEN" && (
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--indigo)", textTransform: "uppercase" }}>
                {product.brand}
              </span>
            )}
          </div>
          <p className="product-card__name">{product.name}</p>
          {product.sku && (
            <p style={{ fontSize: 10, color: "var(--sub)", fontFamily: "monospace", letterSpacing: 0.3, marginBottom: 4, opacity: 0.75 }}>
              SKU: {product.sku}
            </p>
          )}
          <div className="product-card__price-row">
            <span className="product-card__price">{bdt(currentPrice)}</span>
            {hasDiscount && originalPrice && (
              <span className="product-card__original">{bdt(originalPrice)}</span>
            )}
          </div>
          {inStockSizes.length > 0 && (
            <div className="product-card__sizes">
              {inStockSizes.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => handleAddDirectSize(e, s)}
                  className="product-card__size-chip-btn"
                  title={`Quick add size ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .product-card:hover .product-card__quick-add {
            opacity: 1 !important;
          }
          .product-card__size-chip-btn {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 4px;
            background: var(--surface-2);
            color: var(--sub);
            border: 1px solid var(--border);
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .product-card__size-chip-btn:hover {
            background: var(--indigo);
            color: #fff;
            border-color: var(--indigo);
          }
          @media (max-width: 768px), (hover: none) {
            .product-card__quick-add {
              opacity: 1 !important;
              bottom: 8px !important;
              left: 8px !important;
              right: 42px !important;
              padding: 6px 8px !important;
              font-size: 10px !important;
            }
          }
        `}</style>
      </Link>

      {/* Mobile Slide-Up Quick Add Modal */}
      <QuickAddModal
        product={product}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSize={modalPreselectSize}
      />
    </>
  );
}
