"use client";

import React from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "var(--crimson)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
              FAVORITES
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
              My Wishlist ({wishlist.length})
            </h1>
          </div>
          <p style={{ color: "var(--sub)", fontSize: 14, marginTop: 4 }}>
            Saved artisanal pieces and seasonal drops.
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--crimson)",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div className="empty-state" style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
          <div style={{ fontSize: 50, marginBottom: 14 }}>🤍</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>
            Your Wishlist is Empty
          </h2>
          <p style={{ color: "var(--sub)", fontSize: 13, marginBottom: 20 }}>
            You haven&apos;t saved any products to your wishlist yet. Browse our catalog and tap the heart icon to save items.
          </p>
          <Link href="/shop" className="btn btn--primary" style={{ fontWeight: 800 }}>
            Discover Products →
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
