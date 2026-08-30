"use client";

import React, { useEffect, useState } from "react";
import { API_URL, bdt } from "@/lib/api";

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAnalyticsModal({ isOpen, onClose }: AdminAnalyticsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${API_URL}/v1/deen/admin/analytics`, {
        headers: {
          "x-gateway-key": "deen_mobile_gateway_secret_2026",
        },
      })
        .then((r) => r.json())
        .then((res) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              📊 STORE BI & REVENUE ANALYTICS
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              Real-time WooCommerce Store Performance
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 12 }}>Aggregating store metrics…</p>
          </div>
        ) : data?.analytics ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>TOTAL REVENUE</span>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--indigo)", margin: "4px 0 0" }}>
                  {bdt(data.analytics.totalRevenue || 0)}
                </p>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>TOTAL ORDERS</span>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--emerald)", margin: "4px 0 0" }}>
                  {data.analytics.totalOrders || 0}
                </p>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>AVG ORDER VALUE</span>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--amber)", margin: "4px 0 0" }}>
                  {bdt(data.analytics.averageOrderValue || 0)}
                </p>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>ACTIVE CUSTOMERS</span>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--ink)", margin: "4px 0 0" }}>
                  {data.analytics.totalCustomers || 0}
                </p>
              </div>
            </div>

            {/* Top Selling Products */}
            {data.analytics.topProducts && data.analytics.topProducts.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>
                  🏆 TOP SELLING GARMENTS
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.analytics.topProducts.slice(0, 5).map((p: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{idx + 1}. {p.name}</span>
                      <span style={{ color: "var(--indigo)", fontWeight: 800 }}>{p.quantity} units ({bdt(p.revenue)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export CSV CTA */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <a
                href={`${API_URL}/v1/deen/admin/export-orders?format=csv`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ fontSize: 12, padding: "8px 16px", fontWeight: 800 }}
              >
                📥 Export Orders CSV
              </a>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--sub)" }}>
            Unable to load analytics. Ensure administrator authorization credentials.
          </div>
        )}
      </div>
    </div>
  );
}
