"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { bdt, resolveProductImage } from "@/lib/api";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  const router = useRouter();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [movingId, setMovingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleMoveToCart = (product: any) => {
    setMovingId(product.id);
    const size = product.sizes?.[0] || "M";
    addItem(product, size);
    setTimeout(() => {
      removeFromWishlist(product.id);
      setMovingId(null);
    }, 400);
  };

  const handleViewProduct = (productId: string) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 580, width: "95vw", maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "var(--crimson)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
                SAVED ITEMS
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
                ❤️ MY WISHLIST ({wishlist.length})
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 3 }}>
              Your saved styles &amp; denim drops. Add them to bag before stock sells out!
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* List Content */}
        <div style={{ padding: "14px 0" }}>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🤍</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
                Your wishlist is empty
              </h3>
              <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 18 }}>
                Explore the latest drops and tap the heart icon on any product to save it.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  onClose();
                  router.push("/shop");
                }}
                style={{ fontSize: 12, fontWeight: 800, padding: "8px 18px" }}
              >
                Explore Shop →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {wishlist.map((item) => {
                const img = resolveProductImage(item.images?.[0], "/icon.png");
                const price = item.salePrice || item.price;
                const isMoving = movingId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 10,
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={item.name}
                      onClick={() => handleViewProduct(item.id)}
                      style={{
                        width: 60,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "var(--surface-2)",
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        onClick={() => handleViewProduct(item.id)}
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--ink)",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                        }}
                      >
                        {item.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: "var(--sub)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {item.category}
                        </span>
                        {item.salePct && item.salePct > 0 && (
                          <span style={{ fontSize: 10, color: "#fff", background: "var(--crimson)", padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>
                            -{item.salePct}%
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong style={{ fontSize: 13, color: "var(--indigo)" }}>
                          {bdt(price)}
                        </strong>
                        {item.salePrice && item.salePrice < item.price && (
                          <span style={{ fontSize: 10, color: "var(--sub)", textDecoration: "line-through", marginLeft: 6 }}>
                            {bdt(item.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        style={{
                          background: isMoving ? "var(--emerald)" : "var(--indigo)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isMoving ? "✓ Added!" : "+ Move to Bag"}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--sub)",
                          fontSize: 10,
                          cursor: "pointer",
                          padding: "2px 4px",
                        }}
                      >
                        Remove ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <button
              type="button"
              onClick={clearWishlist}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--crimson)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear All Wishlist
            </button>

            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onClose();
                router.push("/cart");
              }}
              style={{ fontSize: 12, padding: "8px 16px", fontWeight: 800 }}
            >
              Go to Bag / Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
