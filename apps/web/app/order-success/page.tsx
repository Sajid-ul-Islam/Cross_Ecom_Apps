"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bdt } from "@/lib/api";

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const number = params.get("number") || "DC-???";
  const total = Number(params.get("total") || 0);
  const wooId = params.get("wooId");

  return (
    <div className="container">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-sub">
          Thank you! Your order has been placed and our team will contact you
          shortly for confirmation.
        </p>

        {/* Order details */}
        <div className="success-detail">
          <div className="success-detail-row">
            <span>Order Reference</span>
            <span style={{ color: "var(--indigo)", fontWeight: 900 }}>{number}</span>
          </div>
          {wooId && (
            <div className="success-detail-row">
              <span>Store Order #</span>
              <span>#{wooId}</span>
            </div>
          )}
          <div className="success-detail-row">
            <span>Total</span>
            <span>{bdt(total)}</span>
          </div>
          <div className="success-detail-row">
            <span>Status</span>
            <span style={{ color: "var(--emerald)" }}>✅ Received</span>
          </div>
        </div>

        {/* What's next */}
        <div
          style={{
            background: "var(--indigo-light)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "16px",
            textAlign: "left",
            marginBottom: 28,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--indigo)", marginBottom: 8 }}>
            What happens next?
          </p>
          {[
            "📞 Our team will call you within 1–2 hours to confirm",
            "📦 Order packed and dispatched same or next day",
            "🚚 Dhaka: 24–48h · Outside Dhaka: 3–5 days",
          ].map((s) => (
            <p key={s} style={{ fontSize: 13, color: "var(--sub)", marginBottom: 6 }}>
              {s}
            </p>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/shop" className="btn btn-primary btn-full btn-lg">
            Continue Shopping
          </Link>
          <a
            href="https://wa.me/8801877076200"
            target="_blank"
            rel="noopener"
            className="btn btn-outline btn-full"
          >
            💬 Message Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
