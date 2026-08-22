"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useCart } from "@/lib/cart";
import { placeOrder, bdt } from "@/lib/api";
import { BD_DISTRICTS } from "@/lib/districts";

const DELIVERY_FEES: Record<string, number> = {
  dhaka_standard: 50,
  outside: 90,
  pickup: 0,
};

const DELIVERY_LABELS: Record<string, string> = {
  dhaka_standard: "Home Delivery (24–48h) · ৳50",
  outside: "Home Delivery (Outside Dhaka, 3–5 days) · ৳90",
  pickup: "Store Pickup (Mirpur 12 Outlet) · FREE",
};

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on Delivery (COD)", icon: "💵" },
  { id: "bkash", label: "bKash", icon: "📱" },
  { id: "nagad", label: "Nagad", icon: "📲" },
  { id: "card", label: "Card / Bank", icon: "💳" },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();

  const [area, setArea] = useState(searchParams.get("area") || "dhaka_standard");
  const [district, setDistrict] = useState("BD-13"); // default Dhaka
  const [city, setCity] = useState("Dhaka");
  const [payment, setPayment] = useState("cod");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const delivery = DELIVERY_FEES[area] ?? 50;
  const total = subtotal + delivery;

  // Auto sync delivery fee if district changes
  const handleDistrictChange = (dCode: string) => {
    setDistrict(dCode);
    if (dCode === "BD-13") {
      setArea("dhaka_standard");
      if (city === "Chittagong" || !city) setCity("Dhaka");
    } else {
      setArea("outside");
      const dObj = BD_DISTRICTS.find((d) => d.code === dCode);
      if (city === "Dhaka" || !city) setCity(dObj ? dObj.name : "");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    let digits = form.phone.replace(/[^0-9]/g, "");
    if (digits.startsWith("880") && digits.length === 13) {
      digits = digits.slice(2);
    }
    if (digits.length !== 11 || !digits.startsWith("0") || !/^01[3-9]\d{8}$/.test(digits)) {
      e.phone = "Must be an 11-digit Bangladeshi number starting with 0 (e.g. 01XXXXXXXXX)";
    }
    if (form.address.trim().length < 8) e.address = "Full delivery address required (house, road, area)";
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
      let cleanPhone = form.phone.replace(/[^0-9]/g, "");
      if (cleanPhone.startsWith("880") && cleanPhone.length === 13) {
        cleanPhone = cleanPhone.slice(2);
      }
      const result = await placeOrder({
        name: form.name.trim(),
        phone: cleanPhone,
        address: form.address.trim(),

        city: city.trim() || (BD_DISTRICTS.find((d) => d.code === district)?.name || "Dhaka"),
        district,
        state: district,
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
        `/order-success?id=${result.id}&number=${result.number}&total=${result.total}&wooId=${result.wooId || ""}&delivery=${result.delivery}&payment=${encodeURIComponent(result.paymentTitle || result.payment)}&consignment=${result.pathaoConsignmentId || ""}&tracking=${encodeURIComponent(result.pathaoTrackingUrl || "")}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Order failed. Please try again.";
      setApiError(msg);
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

              {/* District Dropdown (All 64 BD Districts) */}
              <div className="form-group">
                <label className="form-label">District / State (All 64 BD Districts) *</label>
                <select
                  className="form-select"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name} ({d.code}) {d.code === "BD-13" ? "— Standard Delivery (৳50)" : "— Regional Shipping (৳90)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* City / Thana Field */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">City / Thana / Area *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Banani, Mirpur, Dhanmondi, Agrabad…"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              {/* Street Address */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Street Address *</label>
                <textarea
                  className="form-textarea"
                  placeholder="House/flat no., road details, landmark…"
                  value={form.address}
                  onChange={set("address")}
                />
                {errors.address && <p className="form-error">{errors.address}</p>}
              </div>

              {/* Delivery Method */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Delivery Service</label>
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
                <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                    💵 Cash on Delivery (COD)
                  </p>
                  <p style={{ fontSize: 12, color: "var(--sub)" }}>
                    Pay total {bdt(total)} cash when your parcel is delivered to your doorstep.
                  </p>
                </div>
              )}
              {(payment === "bkash" || payment === "nagad") && (
                <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 12 }}>
                  Our team will call you with the official merchant number after order confirmation.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? "Placing Order…" : `Confirm Order · ${bdt(total)}`}
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
              <div className="summary-row">
                <span>Delivery ({area === "outside" ? "Outside Dhaka" : "Dhaka"})</span>
                <span style={{ fontWeight: 700, color: "var(--indigo)" }}>
                  {delivery === 0 ? "FREE" : bdt(delivery)}
                </span>
              </div>
              {subtotal >= 3500 && (
                <div className="summary-row" style={{ color: "var(--emerald)" }}>
                  <span>🎁 Free Summer Tee</span><span>৳0</span>
                </div>
              )}
              <div className="summary-row summary-row--total">
                <span>Total Payable</span>
                <span style={{ color: "var(--indigo)" }}>{bdt(total)}</span>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: "12px", background: "var(--surface-2)", borderRadius: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5 }}>
                🚚 PATHAO COURIER DISPATCH
              </p>
              <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 4 }}>
                Instant consignment creation with real-time SMS & GPS parcel tracking.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Loading checkout…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
