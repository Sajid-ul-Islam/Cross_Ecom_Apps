"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/lib/api";
import { bdt, resolveProductImage } from "@/lib/api";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const currentPrice = product.salePrice ?? product.price;
  const price = currentPrice;
  const originalPrice = product.regularPrice && product.regularPrice > currentPrice
    ? product.regularPrice
    : product.salePrice && product.price > product.salePrice
    ? product.price
    : null;
  const hasDiscount = Boolean(originalPrice && originalPrice > currentPrice);
  const discountPct = product.salePct || (hasDiscount && originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);

  const isSaved = isInWishlist(product.id);

  const primaryImg = resolveProductImage(product.images[0]);
  const secondaryImg = resolveProductImage(product.images[1] || product.images[0]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const size = product.sizes[0] || "Free";
    addItem(product, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="product-card"
      id={`product-${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="product-card__image-wrap" style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
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
        {product.isNew && (
          <span className="product-card__badge product-card__badge--new" style={product.segment === "select" ? { top: 32 } : undefined}>
            NEW
          </span>
        )}
        {discountPct > 0 && (
          <span className="product-card__badge product-card__badge--sale">
            -{discountPct}%
          </span>
        )}
        {product.stockStatus === "outofstock" && (
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
            zIndex: 2,
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

        {/* Quick add overlay */}
        {product.stockStatus !== "outofstock" && (
          <div
            role="button"
            tabIndex={0}
            onClick={handleAddToCart}
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              right: 48,
              padding: "8px",
              borderRadius: 6,
              border: "none",
              background: added ? "var(--emerald)" : "var(--indigo)",
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
            {added ? "✓ ADDED TO BAG" : "+ QUICK ADD"}
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
        {product.sizes.length > 0 && (
          <div className="product-card__sizes">
            {product.sizes.slice(0, 6).map((s) => (
              <span key={s} className="product-card__size-chip">{s}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .product-card:hover .product-card__quick-add {
          opacity: 1 !important;
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
  );
}
