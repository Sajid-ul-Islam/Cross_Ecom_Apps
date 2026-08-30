"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchOrders, bdt, type OrderResult } from "@/lib/api";
import PathaoTrackingModal from "@/components/PathaoTrackingModal";
import ReturnExchangeModal from "@/components/ReturnExchangeModal";

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

export default function OrdersLookupPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Modals
  const [trackingConsignment, setTrackingConsignment] = useState<string | null>(null);
  const [returnOrder, setReturnOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.phone) {
          setPhone(p.phone);
          setLoading(true);
          setSearched(true);
          fetchOrders(p.phone)
            .then((list) => setOrders(list))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
        }
      }
    } catch {}
  }, []);

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
          <button type="submit" className="btn btn--primary" disabled={loading} style={{ fontWeight: 800 }}>
            {loading ? "Searching…" : "Track Orders"}
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
          <Link href="/shop" className="btn btn--primary">Start Shopping</Link>
        </div>
      ) : orders && orders.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>
          {orders.map((order) => {
            const hasPathao = Boolean(order.pathaoConsignmentId);
            const pathaoId = order.pathaoConsignmentId || "";

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

                {/* Pathao Consignment Tracker */}
                {hasPathao ? (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5, textTransform: "uppercase", margin: 0 }}>
                        🚚 Pathao Consignment ID
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)", marginTop: 2, margin: 0 }}>
                        {pathaoId}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setTrackingConsignment(pathaoId)}
                        className="btn btn--primary"
                        style={{ fontSize: 12, padding: "8px 14px", fontWeight: 800 }}
                      >
                        ⚡ Live Timeline
                      </button>
                      <a
                        href={order.pathaoTrackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${pathaoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--outline"
                        style={{ fontSize: 12, padding: "8px 14px", fontWeight: 800 }}
                      >
                        Pathao ↗
                      </a>
                    </div>
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
                    <span style={{ fontSize: 16 }}>📦</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", letterSpacing: 0.5, margin: 0 }}>
                        DELIVERY STATUS
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2, margin: 0 }}>
                        Preparing Dispatch at Central Studio
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Breakdown */}
                {order.lines && order.lines.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {order.lines.map((l, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          padding: "6px 0",
                          borderBottom: "1px solid var(--border-light)",
                          color: "var(--ink)",
                        }}
                      >
                        <span>{l.qty}x {l.name} {l.size ? `(${l.size})` : ""}</span>
                        <span style={{ fontWeight: 700 }}>{l.gift ? "FREE" : bdt(l.unit * l.qty)}</span>
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
                      fontSize: 15,
                      fontWeight: 900,
                      color: "var(--ink)",
                      borderTop: "1px dashed var(--border)",
                      paddingTop: 8,
                      marginTop: 4,
                    }}
                  >
                    <span>Total Paid / Payable</span>
                    <span style={{ color: "var(--indigo)" }}>{bdt(order.total)}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--sub)" }}>
                    Payment Mode:{" "}
                    <strong style={{ color: order.payment === "cod" ? "var(--amber)" : "var(--emerald)" }}>
                      {order.paymentTitle || (order.payment === "cod" ? "Cash on Delivery (Pay at Doorstep)" : order.payment.toUpperCase())}
                    </strong>
                  </div>
                </div>

                {/* Order Action Footer */}
                <div style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setReturnOrder(order)}
                    className="btn btn--outline"
                    style={{ flex: 1, fontSize: 12, padding: "8px 12px", fontWeight: 800 }}
                  >
                    🔄 Size Exchange / Return
                  </button>
                  <a
                    href={`https://wa.me/8801952700500?text=${encodeURIComponent(`Salam DEEN team, I need help with my Order #${order.number} (Phone: ${order.phone || phone}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--outline"
                    style={{ flex: 1, fontSize: 12, padding: "8px 12px", fontWeight: 800, color: "#25D366", borderColor: "rgba(37, 211, 102, 0.3)", textAlign: "center" }}
                  >
                    💬 WhatsApp Help
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Tracking Modal */}
      {trackingConsignment && (
        <PathaoTrackingModal
          isOpen={Boolean(trackingConsignment)}
          onClose={() => setTrackingConsignment(null)}
          consignmentId={trackingConsignment}
        />
      )}

      {/* Return & Exchange Modal */}
      {returnOrder && (
        <ReturnExchangeModal
          isOpen={Boolean(returnOrder)}
          onClose={() => setReturnOrder(null)}
          order={returnOrder}
          onSuccess={() => {
            if (phone) {
              fetchOrders(phone.replace(/[^0-9]/g, "")).then((list) => setOrders(list));
            }
          }}
        />
      )}
    </div>
  );
}
