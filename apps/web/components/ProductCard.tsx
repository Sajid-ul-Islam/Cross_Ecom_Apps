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

        {product.isNew && (
          <span className="product-card__badge product-card__badge--new">NEW</span>
        )}
        {product.salePct && product.salePct > 0 && (
          <span className="product-card__badge product-card__badge--sale">
            -{product.salePct}%
          </span>
        )}
        {product.stockStatus === "outofstock" && (
          <span className="product-card__badge product-card__badge--oos">OUT OF STOCK</span>
        )}

        {/* Wishlist Heart Button - positioned at bottom right corner */}
        <button
          type="button"
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
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(4px)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 5,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
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
        </button>

        {/* Quick add overlay */}
        {product.stockStatus !== "outofstock" && (
          <button
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
              transition: "opacity 0.2s, background 0.2s",
            }}
            className="product-card__quick-add"
          >
            {added ? "✓ ADDED" : "+ QUICK ADD"}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="product-card__info">
        <p className="product-card__category">{product.category}</p>
        <p className="product-card__name">{product.name}</p>
        <div className="product-card__price-row">
          <span className="product-card__price">{bdt(currentPrice)}</span>
          {hasDiscount && originalPrice && (
            <>
              <span className="product-card__original">{bdt(originalPrice)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#e11d48", background: "rgba(225, 29, 72, 0.08)", padding: "1px 5px", borderRadius: 3 }}>
                -{discountPct}%
              </span>
            </>
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
