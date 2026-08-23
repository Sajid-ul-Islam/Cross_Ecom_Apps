"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/api";
import { bdt } from "@/lib/api";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const price = product.salePrice ?? product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const size = product.sizes[0] || "Free";
    addItem(product, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/product/${product.id}`} className="product-card" id={`product-${product.id}`}>
      {/* Image */}
      <div className="product-card__image-wrap">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--faint)",
              fontSize: 32,
            }}
          >
            👕
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

        {/* Quick add overlay */}
        {product.stockStatus !== "outofstock" && (
          <button
            onClick={handleAddToCart}
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              right: 10,
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
          <span className="product-card__price">{bdt(price)}</span>
          {product.regularPrice && product.regularPrice > price && (
            <span className="product-card__original">{bdt(product.regularPrice)}</span>
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
      `}</style>
    </Link>
  );
}
