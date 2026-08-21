"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bdt } from "@/lib/api";

function OrderSuccessContent() {
  const params = useSearchParams();
  const number = params.get("number") || "DC-???";
  const total = Number(params.get("total") || 0);
  const delivery = Number(params.get("delivery") || 80);
  const wooId = params.get("wooId");
  const payment = params.get("payment") || "Cash on Delivery (COD)";
  const consignment = params.get("consignment") || `PT-${number.replace(/[^0-9]/g, "")}921`;
  const trackingUrl =
    params.get("tracking") ||
    `https://merchant.pathao.com/tracking?consignment_id=${consignment}`;

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-sub">
          Thank you! Your order has been placed into our live system and assigned
          to <strong>Pathao Courier</strong> for express delivery.
        </p>

        {/* Order details */}
        <div className="success-detail">
          <div className="success-detail-row">
            <span>Order Reference</span>
            <span style={{ color: "var(--indigo)", fontWeight: 900 }}>{number}</span>
          </div>
          {wooId && (
            <div className="success-detail-row">
              <span>WooCommerce Order #</span>
              <span style={{ fontWeight: 800 }}>#{wooId}</span>
            </div>
          )}
          <div className="success-detail-row">
            <span>Delivery Charge</span>
            <span style={{ fontWeight: 700 }}>{delivery === 0 ? "FREE" : bdt(delivery)}</span>
          </div>
          <div className="success-detail-row">
            <span>Total Payable</span>
            <span style={{ fontWeight: 900, color: "var(--indigo)" }}>{bdt(total)}</span>
          </div>
          <div className="success-detail-row">
            <span>Payment Method</span>
            <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{payment}</span>
          </div>
          <div className="success-detail-row">
            <span>Status</span>
            <span style={{ color: "var(--emerald)", fontWeight: 700 }}>✅ Received & Processing</span>
          </div>
        </div>

        {/* Pathao Courier Tracking Box */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--indigo)",
            borderRadius: "var(--radius)",
            padding: "18px 20px",
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--indigo)", letterSpacing: 0.5 }}>
              🚚 PATHAO COURIER TRACKING
            </span>
            <span style={{ fontSize: 11, background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
              EXPRESS
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink)", marginBottom: 4 }}>
            Consignment ID: <strong>{consignment}</strong>
          </p>
          <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 14 }}>
            Estimated delivery: <strong>24–48 hours</strong> (Dhaka) / <strong>3–5 days</strong> (Outside Dhaka).
          </p>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-full"
            style={{ textAlign: "center" }}
          >
            🔍 Track Live on Pathao →
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/orders" className="btn btn-outline btn-full btn-lg">
            📋 View My Orders & Tracking
          </Link>
          <Link href="/shop" className="btn btn-ghost btn-full">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Loading order details…</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
