"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchOrders, bdt, type OrderResult } from "@/lib/api";

export default function OrdersLookupPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, "");
    if (!digits) return;
    setLoading(true);
    setSearched(true);
    try {
      const list = await fetchOrders(digits);
      setOrders(list);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, maxWidth: 640 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
          Track Orders & Consignment
        </h1>
        <p style={{ color: "var(--sub)", fontSize: 14 }}>
          Enter your Bangladeshi phone number to view your order history, delivery charges, COD payment status, and live Pathao courier tracking.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ maxWidth: 500, marginBottom: 36 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="tel"
            className="form-input"
            placeholder="Enter phone number (e.g. 017XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching…" : "Track"}
          </button>
        </div>
      </form>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14, marginTop: 12 }}>Looking up your orders…</p>
        </div>
      ) : searched && (!orders || orders.length === 0) ? (
        <div className="empty-state" style={{ maxWidth: 500, margin: "0 auto", padding: "40px 20px" }}>
          <div className="empty-state__icon">📦</div>
          <h2 className="empty-state__title">No orders found</h2>
          <p className="empty-state__sub">
            No active or past orders found for phone <strong>{phone}</strong>.
          </p>
          <Link href="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : orders && orders.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
          {orders.map((order) => {
            const hasPathao = Boolean(order.pathaoConsignmentId);
            const pathaoId = order.pathaoConsignmentId || "";
            const trackingUrl =
              order.pathaoTrackingUrl ||
              (hasPathao ? `https://merchant.pathao.com/tracking?consignment_id=${pathaoId}` : "");

            return (
              <div
                key={order.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 24,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 10,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 14,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "var(--indigo)" }}>
                        {order.number}
                      </span>
                      {order.wooId && (
                        <span
                          style={{
                            fontSize: 11,
                            background: "var(--indigo-light)",
                            color: "var(--indigo)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 800,
                          }}
                        >
                          STORE #{order.wooId}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--sub)" }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <span
                    style={{
                      background: "var(--emerald-light)",
                      color: "var(--emerald)",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 20,
                      textTransform: "uppercase",
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Pathao Consignment Tracker — only when real consignment exists */}
                {hasPathao ? (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "12px 16px",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5 }}>
                          🚚 PATHAO EXPRESS COURIER
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
                          Consignment ID: {pathaoId}
                        </p>
                      </div>
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        Track on Pathao →
                      </a>
                    </div>

                    {/* Live Tracking Milestones — when tracking info is embedded by gateway */}
                    {order.pathaoTrackingInfo ? (
                      <div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--sub)" }}>Live Status:</span>
                          <strong style={{ fontSize: 12, color: "var(--indigo)" }}>{order.pathaoTrackingInfo.summary}</strong>
                          <span style={{ fontSize: 10, color: "var(--faint)", marginLeft: "auto" }}>
                            Updated: {new Date(order.pathaoTrackingInfo.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {order.pathaoTrackingInfo.steps.map((step) => (
                            <div
                              key={step.status}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "2px 0",
                              }}
                            >
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: step.completed
                                  ? "var(--emerald)"
                                  : step.current
                                  ? "var(--indigo)"
                                  : "var(--border)",
                                flexShrink: 0,
                              }} />
                              <span style={{
                                fontSize: 11,
                                fontWeight: step.current || step.completed ? 700 : 400,
                                color: step.completed
                                  ? "var(--emerald)"
                                  : step.current
                                  ? "var(--indigo)"
                                  : "var(--sub)",
                              }}>
                                {step.label}
                              </span>
                              {step.location && (
                                <span style={{ fontSize: 10, color: "var(--sub)", marginLeft: 4 }}>
                                  • {step.location}
                                </span>
                              )}
                              {step.timestamp && (
                                <span style={{ fontSize: 10, color: "var(--faint)", marginLeft: "auto" }}>
                                  {new Date(step.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                        <span style={{ fontSize: 14 }}>📦</span>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5 }}>
                            Delivery Status
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
                            Preparing Dispatch
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📦</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5 }}>
                        Delivery Status
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
                        Preparing Dispatch
                      </p>
                    </div>
                  </div>
                )}

                {/* Lines */}
                {order.lines && order.lines.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {order.lines.map((l, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          padding: "4px 0",
                          color: "var(--ink)",
                        }}
                      >
                        <span>{l.qty}x {l.name} {l.size ? `(${l.size})` : ""}</span>
                        <span style={{ fontWeight: 600 }}>{l.gift ? "FREE" : bdt(l.unit * l.qty)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price Breakdown */}
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sub)" }}>
                    <span>Subtotal</span>
                    <span>{bdt(order.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sub)" }}>
                    <span>Delivery Charge</span>
                    <span style={{ fontWeight: 700, color: "var(--indigo)" }}>
                      {order.delivery === 0 ? "FREE" : bdt(order.delivery)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ink)",
                      borderTop: "1px dashed var(--border)",
                      paddingTop: 6,
                      marginTop: 2,
                    }}
                  >
                    <span>Total Amount</span>
                    <span style={{ color: "var(--indigo)", fontWeight: 900 }}>{bdt(order.total)}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--sub)" }}>
                    Payment:{" "}
                    <strong style={{ color: order.payment === "cod" ? "var(--amber)" : "var(--emerald)" }}>
                      {order.paymentTitle || (order.payment === "cod" ? "Cash on Delivery (Pay at doorstep)" : order.payment.toUpperCase())}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
