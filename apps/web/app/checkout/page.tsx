"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { placeOrder, bdt } from "@/lib/api";

const DELIVERY_FEES: Record<string, number> = {
  dhaka_standard: 80,
  outside: 150,
  pickup: 0,
};

const DELIVERY_LABELS: Record<string, string> = {
  dhaka_standard: "Dhaka Standard (24–48h) · ৳80",
  outside: "Outside Dhaka (3–5 days) · ৳150",
  pickup: "Store Pickup · FREE",
};

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
  { id: "bkash", label: "bKash", icon: "📱" },
  { id: "nagad", label: "Nagad", icon: "📲" },
  { id: "card", label: "Card / Bank", icon: "💳" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();

  const [area, setArea] = useState(searchParams.get("area") || "dhaka_standard");
  const [payment, setPayment] = useState("cod");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const delivery = DELIVERY_FEES[area] ?? 80;
  const total = subtotal + delivery;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    const digits = form.phone.replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(digits)) e.phone = "Enter a valid BD number — 01XXXXXXXXX";
    if (form.address.trim().length < 12) e.address = "Full delivery address required (house, road, area)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) { router.push("/shop"); return; }
    setLoading(true);
    setApiError("");
    try {
      const result = await placeOrder({
        name: form.name.trim(),
        phone: form.phone.replace(/[^0-9]/g, ""),
        address: form.address.trim(),
        area,
        payment,
        items: items.map((i) => ({
          productId: i.product.id,
          size: i.size,
          qty: i.qty,
        })),
      });
      clearCart();
      router.push(
        `/order-success?id=${result.id}&number=${result.number}&total=${result.total}&wooId=${result.wooId || ""}`
      );
    } catch (err: any) {
      setApiError(err.message || "Order failed. Please try again.");
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ padding: "120px 24px" }}>
          <div className="empty-state__icon">🛒</div>
          <h2 className="empty-state__title">Your bag is empty</h2>
          <Link href="/shop" className="btn btn-primary btn-lg">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>Checkout</span>
      </nav>

      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 28 }}>
        Checkout
      </h1>

      {apiError && <div className="alert alert--error">{apiError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          {/* Left: form */}
          <div className="checkout-form">
            {/* Contact */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 20 }}>
                📋 Contact Details
              </h2>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={set("name")}
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Phone Number *</label>
                <input
                  className="form-input"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={set("phone")}
                  type="tel"
                />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
            </div>

            {/* Address */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 20 }}>
                📍 Delivery Address
              </h2>
              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea
                  className="form-textarea"
                  placeholder="House no., road, area, city…"
                  value={form.address}
                  onChange={set("address")}
                />
                {errors.address && <p className="form-error">{errors.address}</p>}
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Delivery Method</label>
                <select
                  className="form-select"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 20 }}>
                💳 Payment Method
              </h2>
              <div className="payment-options">
                {PAYMENT_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`payment-option${payment === p.id ? " payment-option--selected" : ""}`}
                    onClick={() => setPayment(p.id)}
                  >
                    <div className="payment-option__icon">{p.icon}</div>
                    <div className="payment-option__label">{p.label}</div>
                  </button>
                ))}
              </div>
              {payment === "cod" && (
                <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 12 }}>
                  Pay cash when your order arrives. No advance payment required.
                </p>
              )}
              {(payment === "bkash" || payment === "nagad") && (
                <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 12 }}>
                  Our team will call you with the payment number after order confirmation.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? "Placing Order…" : `Place Order · ${bdt(total)}`}
            </button>
          </div>

          {/* Right: order review */}
          <div className="order-review">
            <h3>Order Review</h3>
            {items.map((item) => {
              const price = item.product.salePrice ?? item.product.price;
              return (
                <div key={`${item.product.id}-${item.size}`} className="order-review-item">
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.images[0]} alt={item.product.name} />
                  ) : (
                    <div
                      style={{
                        width: 52, height: 64,
                        background: "var(--surface-2)",
                        borderRadius: 6,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0,
                      }}
                    >
                      👕
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p className="order-review-item__name">{item.product.name}</p>
                    <p className="order-review-item__meta">
                      {item.size} · qty {item.qty}
                    </p>
                  </div>
                  <span className="order-review-item__price">{bdt(price * item.qty)}</span>
                </div>
              );
            })}

            <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
              <div className="summary-row"><span>Subtotal</span><span>{bdt(subtotal)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? "FREE" : bdt(delivery)}</span></div>
              {subtotal >= 3500 && (
                <div className="summary-row" style={{ color: "var(--emerald)" }}>
                  <span>🎁 Free Tee</span><span>৳0</span>
                </div>
              )}
              <div className="summary-row summary-row--total">
                <span>Total</span>
                <span style={{ color: "var(--indigo)" }}>{bdt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
