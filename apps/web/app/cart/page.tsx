"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { bdt, API_URL } from "@/lib/api";
import { useState } from "react";

const DELIVERY_OPTIONS = [
  {
    id: "dhaka_standard",
    label: "Home Delivery (Dhaka Standard)",
    sub: "24–48 hours",
    fee: 50,
    icon: "🛵",
  },
  {
    id: "dhaka_express",
    label: "Dhaka Express (Same-Day / Next-Morning)",
    sub: "Delivered within 12–18 hours",
    fee: 110,
    icon: "⚡",
  },
  {
    id: "outside",
    label: "Home Delivery (Outside Dhaka)",
    sub: "3–5 business days · 64 Districts",
    fee: 90,
    icon: "📦",
  },
  {
    id: "pickup",
    label: "Store Pickup",
    sub: "Mirpur 12 Outlet — Ready in 2h",
    fee: 0,
    icon: "🏪",
  },
];

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem, totalItems } = useCart();
  const [deliveryArea, setDeliveryArea] = useState("dhaka_standard");
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryArea) || DELIVERY_OPTIONS[0];

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number; type: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // BOGO Jeans discount (Buy 1 Get 2nd Jean 50% Off)
  const jeansItems: number[] = [];
  items.forEach((it) => {
    const cat = (it.product.category || "").toUpperCase();
    if (cat === "JEANS" || cat === "DENIM") {
      const unit = it.product.salePrice ?? it.product.price;
      for (let i = 0; i < it.qty; i++) jeansItems.push(unit);
    }
  });
  jeansItems.sort((a, b) => a - b);
  const bogoPairs = Math.floor(jeansItems.length / 2);
  let bogoDiscount = 0;
  for (let i = 0; i < bogoPairs; i++) {
    bogoDiscount += Math.round(jeansItems[i] * 0.5);
  }

  // Instant Cashback Tiers
  const cashback = subtotal >= 3000 ? 700 : subtotal >= 2500 ? 500 : 0;
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((subtotal * appliedCoupon.amount) / 100)
      : appliedCoupon.amount
    : 0;

  const totalDiscount = cashback + bogoDiscount + couponDiscount;
  const total = Math.max(0, subtotal - totalDiscount) + delivery.fee;
  const progress = Math.min(100, (subtotal / 3000) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/v1/deen/coupon/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({ code: data.code, amount: data.amount, type: data.type });
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || "Invalid or expired coupon code.");
      }
    } catch {
      setCouponError("Network error validating coupon.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ padding: "120px 24px" }}>
          <div className="empty-state__icon">🛒</div>
          <h2 className="empty-state__title">Your bag is empty</h2>
          <p className="empty-state__sub">Explore our selvedge denim, shirts and new seasonal drops.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
        Shopping Bag
      </h1>
      <p style={{ color: "var(--sub)", fontSize: 14, marginBottom: 24 }}>
        {totalItems} item{totalItems !== 1 ? "s" : ""} in your bag
      </p>

      {/* Instant Cashback Progress Bar */}
      {subtotal > 0 && (
        <div className="free-tee-banner" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18, marginBottom: 28 }}>
          <span style={{ fontSize: 28 }}>🎁</span>
          <div style={{ flex: 1 }}>
            {subtotal >= 3000 ? (
              <p style={{ color: "var(--emerald)", fontWeight: 900, margin: 0 }}>
                Maximum ৳700 Instant Cashback Unlocked! 🎉 Applied automatically.
              </p>
            ) : subtotal >= 2500 ? (
              <p style={{ margin: 0 }}>
                <strong style={{ color: "var(--emerald)" }}>✨ ৳500 Cashback Unlocked!</strong> Add{" "}
                <strong style={{ color: "var(--indigo)" }}>{bdt(3000 - subtotal)}</strong> more to reach <strong>৳700 Tier</strong>.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                Add <strong style={{ color: "var(--indigo)" }}>{bdt(2500 - subtotal)}</strong> more to unlock{" "}
                <strong style={{ color: "var(--emerald)" }}>৳500 Instant Cashback</strong>
              </p>
            )}
            <div
              style={{
                marginTop: 10,
                height: 8,
                background: "var(--surface-2)",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: subtotal >= 3000 ? "var(--emerald)" : "var(--indigo)",
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="cart-layout">
        {/* Items List */}
        <div className="cart-items">
          {items.map((item) => {
            const unitPrice = item.product.salePrice ?? item.product.price;
            const isJean = (item.product.category || "").toUpperCase() === "JEANS";
            return (
              <div key={`${item.product.id}-${item.size}`} className="cart-item">
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
                      👖
                    </div>
                  )}
                </Link>

                <div className="cart-item__info">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p className="cart-item__name">{item.product.name}</p>
                    {isJean && bogoPairs > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--indigo)", background: "var(--indigo-light)", padding: "2px 6px", borderRadius: 4 }}>
                        BOGO 50%
                      </span>
                    )}
                  </div>
                  <p className="cart-item__meta">
                    Size: <strong>{item.size}</strong> · SKU: {item.product.sku}
                  </p>
                  <p className="cart-item__price">{bdt(unitPrice * item.qty)}</p>
                  {item.qty > 1 && (
                    <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>
                      {bdt(unitPrice)} × {item.qty}
                    </p>
                  )}

                  <div className="cart-item__qty-row">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQty(item.product.id, item.size, item.qty - 1)}
                    >
                      −
                    </button>
                    <span className="qty-display">{item.qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQty(item.product.id, item.size, item.qty + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id, item.size)}
                      style={{
                        marginLeft: 12,
                        background: "none",
                        border: "none",
                        color: "var(--crimson)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Coupon Entry Section */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18, background: "var(--surface)", marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>
              🎟️ COUPON & PROMO CODE
            </h3>
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter promo code (e.g. DEEN20)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ flex: 1, textTransform: "uppercase" }}
              />
              <button
                type="submit"
                className="btn btn--outline"
                disabled={validatingCoupon || !couponCode.trim()}
                style={{ fontWeight: 800, padding: "8px 16px" }}
              >
                {validatingCoupon ? "Checking…" : "Apply"}
              </button>
            </form>

            {appliedCoupon && (
              <p style={{ color: "var(--emerald)", fontSize: 12, fontWeight: 800, marginTop: 8, margin: 0 }}>
                ✓ Coupon &quot;{appliedCoupon.code}&quot; applied! ({appliedCoupon.type === "percent" ? `${appliedCoupon.amount}% OFF` : `-${bdt(appliedCoupon.amount)}`})
              </p>
            )}
            {couponError && (
              <p style={{ color: "var(--crimson)", fontSize: 12, fontWeight: 700, marginTop: 8, margin: 0 }}>
                ✕ {couponError}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {/* Delivery Options */}
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Shipping Destination
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

          <div className="summary-row"><span>Garment Subtotal</span><span>{bdt(subtotal)}</span></div>
          <div className="summary-row"><span>Delivery Charge</span><span>{delivery.fee === 0 ? "FREE" : bdt(delivery.fee)}</span></div>

          {cashback > 0 && (
            <div className="summary-row" style={{ color: "var(--emerald)", fontWeight: 700 }}>
              <span>🎁 Instant Cashback</span><span>-{bdt(cashback)}</span>
            </div>
          )}

          {bogoDiscount > 0 && (
            <div className="summary-row" style={{ color: "var(--indigo)", fontWeight: 700 }}>
              <span>🔥 BOGO Selvedge Discount</span><span>-{bdt(bogoDiscount)}</span>
            </div>
          )}

          {couponDiscount > 0 && (
            <div className="summary-row" style={{ color: "var(--emerald)", fontWeight: 700 }}>
              <span>🎟️ Promo Coupon</span><span>-{bdt(couponDiscount)}</span>
            </div>
          )}

          <div className="summary-row summary-row--total">
            <span>Estimated Total</span>
            <span style={{ color: "var(--indigo)" }}>{bdt(total)}</span>
          </div>

          <Link
            href={`/checkout?area=${deliveryArea}${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ""}`}
            className="btn btn--primary btn-full"
            style={{ marginTop: 16, padding: 14, fontWeight: 900, fontSize: 14, textAlign: "center" }}
          >
            PROCEED TO CHECKOUT · {bdt(total)} →
          </Link>

          <Link
            href="/shop"
            className="btn btn-ghost btn-full"
            style={{ marginTop: 8, textAlign: "center" }}
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
