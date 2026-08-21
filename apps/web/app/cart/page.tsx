"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { bdt } from "@/lib/api";
import { useState } from "react";

const DELIVERY_OPTIONS = [
  {
    id: "dhaka_standard",
    label: "Dhaka Standard",
    sub: "24–48 hours",
    fee: 50,
    icon: "🛵",
  },
  {
    id: "outside",
    label: "Outside Dhaka",
    sub: "3–5 business days",
    fee: 90,
    icon: "📦",
  },
  {
    id: "pickup",
    label: "Store Pickup",
    sub: "Banani, Dhaka — Same day",
    fee: 0,
    icon: "🏪",
  },
];

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem, totalItems } = useCart();
  const [deliveryArea, setDeliveryArea] = useState("dhaka_standard");
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryArea)!;
  const total = subtotal + delivery.fee;
  const freeTeeGap = 3500 - subtotal;


  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ padding: "120px 24px" }}>
          <div className="empty-state__icon">🛒</div>
          <h2 className="empty-state__title">Your bag is empty</h2>
          <p className="empty-state__sub">Add some items and come back here</p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
        Your Bag
      </h1>
      <p style={{ color: "var(--sub)", fontSize: 14, marginBottom: 28 }}>
        {totalItems} item{totalItems !== 1 ? "s" : ""}
      </p>

      {/* Free Tee Progress */}
      {subtotal > 0 && (
        <div className="free-tee-banner">
          <span style={{ fontSize: 24 }}>🎁</span>
          <div style={{ flex: 1 }}>
            {subtotal >= 3500 ? (
              <p>
                <strong>Free Heavyweight Tee unlocked! 🎉</strong> Added to your order.
              </p>
            ) : (
              <>
                <p>
                  Add <strong style={{ color: "var(--indigo)" }}>{bdt(freeTeeGap)}</strong> more to unlock a{" "}
                  <strong>FREE 240 GSM T-Shirt</strong>
                </p>
                <div
                  style={{
                    marginTop: 6,
                    height: 5,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (subtotal / 3500) * 100)}%`,
                      background: "var(--indigo)",
                      borderRadius: 3,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items">
          {items.map((item) => {
            const unitPrice = item.product.salePrice ?? item.product.price;
            return (
              <div key={`${item.product.id}-${item.size}`} className="cart-item">
                {/* Image */}
                <Link href={`/product/${item.product.id}`}>
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="cart-item__img"
                    />
                  ) : (
                    <div
                      className="cart-item__img"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}
                    >
                      👕
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="cart-item__info">
                  <p className="cart-item__name">{item.product.name}</p>
                  <p className="cart-item__meta">
                    Size: <strong>{item.size}</strong> · SKU: {item.product.sku}
                  </p>
                  <p className="cart-item__price">{bdt(unitPrice * item.qty)}</p>
                  {item.qty > 1 && (
                    <p style={{ fontSize: 11, color: "var(--sub)" }}>
                      {bdt(unitPrice)} × {item.qty}
                    </p>
                  )}

                  {/* Qty controls */}
                  <div className="cart-item__qty-row">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.product.id, item.size, item.qty - 1)}
                    >
                      −
                    </button>
                    <span className="qty-display">{item.qty}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.product.id, item.size, item.qty + 1)}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id, item.size)}
                      style={{
                        marginLeft: 8, background: "none", border: "none",
                        color: "var(--crimson)", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {/* Delivery options */}
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Delivery
          </p>
          <div className="delivery-options">
            {DELIVERY_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`delivery-option${deliveryArea === opt.id ? " delivery-option--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={opt.id}
                  checked={deliveryArea === opt.id}
                  onChange={() => setDeliveryArea(opt.id)}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <p className="delivery-option__label">{opt.label}</p>
                  <p className="delivery-option__sub">{opt.sub}</p>
                </div>
                <span className="delivery-option__fee">
                  {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                </span>
              </label>
            ))}
          </div>

          <div className="summary-row"><span>Subtotal</span><span>{bdt(subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{delivery.fee === 0 ? "FREE" : bdt(delivery.fee)}</span></div>
          {subtotal >= 3500 && (
            <div className="summary-row" style={{ color: "var(--emerald)" }}>
              <span>🎁 Free Tee</span><span>৳0</span>
            </div>
          )}
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span style={{ color: "var(--indigo)" }}>{bdt(total)}</span>
          </div>

          <Link
            href={`/checkout?area=${deliveryArea}`}
            className="btn btn-primary btn-full"
            style={{ marginTop: 16 }}
          >
            Proceed to Checkout →
          </Link>

          <Link
            href="/shop"
            className="btn btn-ghost btn-full"
            style={{ marginTop: 8 }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
