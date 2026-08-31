"use client";

import React, { useEffect, useState } from "react";
import { API_URL, bdt } from "@/lib/api";

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "sales" | "logistics" | "stock" | "customers" | "orders";
type TimeframeType = "today" | "7d" | "30d" | "90d";

export default function AdminAnalyticsModal({ isOpen, onClose }: AdminAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [timeframe, setTimeframe] = useState<TimeframeType>("30d");
  const [data, setData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = {
        "x-gateway-key": "deen_mobile_gateway_secret_2026",
      };

      const [resAnalytics, resOrders, resProducts] = await Promise.all([
        fetch(`${API_URL}/v1/deen/admin/analytics?timeframe=${timeframe}`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/v1/deen/admin/orders?limit=100`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/v1/deen/admin/products`, { headers }).then((r) => r.json()),
      ]);

      if (resAnalytics?.success) setData(resAnalytics);
      if (resOrders?.orders) setOrdersData(resOrders.orders);
      if (resProducts?.products) setProductsData(resProducts.products);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, timeframe]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/v1/deen/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-gateway-key": "deen_mobile_gateway_secret_2026",
        },
        body: JSON.stringify({
          status: newStatus,
          pathaoStatus: newStatus === "delivered" ? "Delivered" : newStatus === "returned" ? "Returned" : "In Transit",
        }),
      });
      if (res.ok) {
        setOrdersData((prev) =>
          prev.map((o) =>
            o.id === orderId || o.orderNumber === orderId
              ? { ...o, status: newStatus, pathaoStatus: newStatus === "delivered" ? "Delivered" : newStatus === "returned" ? "Returned" : "In Transit" }
              : o
          )
        );
      }
    } catch {}
    setStatusUpdatingId(null);
  };

  if (!isOpen) return null;

  const sales = data?.sales;
  const logistics = data?.logistics;
  const inventory = data?.inventory;
  const customers = data?.customers;

  // Filtered orders list
  const filteredOrders = ordersData.filter((o) => {
    const matchesStatus = orderStatusFilter === "ALL" || o.status.toLowerCase() === orderStatusFilter.toLowerCase() || o.pathaoStatus.toLowerCase() === orderStatusFilter.toLowerCase();
    const s = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.phone.toLowerCase().includes(s) ||
      o.pathaoConsignmentId.toLowerCase().includes(s) ||
      o.districtName.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 960, width: "95vw", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
                EXECUTIVE BI
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
                STORE BI & OPERATIONS PULSE
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 2 }}>
              Pathao Logistics Fulfillment, Realized Net Revenue, Inventory Valuation & Order Management
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", padding: "10px 0", overflowX: "auto" }}>
          {[
            { id: "sales", label: "📈 Sales & Forecast", badge: null },
            { id: "logistics", label: "🚚 Pathao & Returns", badge: logistics ? `${logistics.deliverySuccessRate}% Deliv` : null },
            { id: "stock", label: "📦 Stock & Valuation", badge: inventory ? `${inventory.lowStockCount} Low` : null },
            { id: "customers", label: "👥 VIP Customers", badge: null },
            { id: "orders", label: `📋 Orders (${ordersData.length})`, badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: activeTab === tab.id ? "1px solid var(--indigo)" : "1px solid var(--border)",
                background: activeTab === tab.id ? "var(--indigo)" : "var(--surface-2)",
                color: activeTab === tab.id ? "#fff" : "var(--ink)",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  style={{
                    background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "var(--border)",
                    color: activeTab === tab.id ? "#fff" : "var(--sub)",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Timeframe Bar */}
        {(activeTab === "sales" || activeTab === "logistics") && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 10px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)" }}>Report Window:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "90d", label: "90 Days" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id as TimeframeType)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: timeframe === tf.id ? "1px solid var(--indigo)" : "1px solid var(--border)",
                    background: timeframe === tf.id ? "rgba(99,102,241,0.12)" : "var(--surface)",
                    color: timeframe === tf.id ? "var(--indigo)" : "var(--sub)",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "var(--sub)", fontSize: 13 }}>Aggregating store metrics & logistics state…</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            {/* ---------------- 1. SALES & FORECAST TAB ---------------- */}
            {activeTab === "sales" && sales && (
              <>
                {/* KPI Matrix Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>GROSS SALES</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: "4px 0 0" }}>
                      {bdt(sales.grossRevenue)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>{sales.totalOrders} total orders</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>NET REALIZED SALES</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--emerald)", margin: "4px 0 0" }}>
                      {bdt(sales.netSales)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Excl. returned & RTO value</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>AVG ORDER VALUE (AOV)</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--indigo)", margin: "4px 0 0" }}>
                      {bdt(sales.aov)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>{sales.itemsSold} items sold</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 800 }}>30-DAY FORECAST RUN-RATE</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--amber)", margin: "4px 0 0" }}>
                      {bdt(sales.projected30dRevenue)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Daily rate: {bdt(sales.dailyRunRate)}/day</span>
                  </div>
                </div>

                {/* Sales Trend Bar visualizer */}
                {sales.salesTrend && sales.salesTrend.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
                        📊 REVENUE & DAILY ORDER RUN-RATE
                      </h4>
                      <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>
                        ↑ +{sales.growthRatePct}% Growth Index
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, paddingBottom: 10 }}>
                      {sales.salesTrend.map((t: any, idx: number) => {
                        const maxVal = Math.max(...sales.salesTrend.map((x: any) => x.revenue || 1), 10000);
                        const pct = Math.max(12, Math.round(((t.revenue || 1200) / maxVal) * 100));
                        return (
                          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                            <div
                              style={{
                                width: "100%",
                                height: `${pct}%`,
                                background: "var(--indigo)",
                                borderRadius: "4px 4px 0 0",
                                minHeight: 8,
                                transition: "height 0.3s ease",
                              }}
                              title={`${t.date}: ${bdt(t.revenue)} (${t.orders} orders)`}
                            />
                            <span style={{ fontSize: 9, color: "var(--sub)", fontWeight: 700 }}>{t.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Revenue Breakdown */}
                {sales.categoryMatrix && sales.categoryMatrix.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", marginBottom: 12 }}>
                      🗂️ CATEGORY REVENUE DISTRIBUTION
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sales.categoryMatrix.map((cat: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                            <span style={{ color: "var(--ink)" }}>{cat.category}</span>
                            <span style={{ color: "var(--indigo)" }}>
                              {bdt(cat.revenue)} ({cat.units} units · {cat.sharePct}%)
                            </span>
                          </div>
                          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, cat.sharePct || 20)}%`, background: "var(--indigo)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------------- 2. LOGISTICS & PATHAO RETURNS TAB ---------------- */}
            {activeTab === "logistics" && logistics && (
              <>
                {/* Logistics KPI Matrix */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>DELIVERY SUCCESS RATE</span>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "var(--emerald)", margin: "4px 0 0" }}>
                      {logistics.deliverySuccessRate}%
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>
                      {logistics.deliveredCount} delivered ({bdt(logistics.deliveredValue)})
                    </span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--crimson)", fontWeight: 800 }}>RETURN / RTO RATE</span>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "var(--crimson)", margin: "4px 0 0" }}>
                      {logistics.returnRate}%
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>
                      {logistics.returnedCount} returned ({bdt(logistics.returnedValue)})
                    </span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 800 }}>PARTIAL DELIVERIES</span>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "var(--amber)", margin: "4px 0 0" }}>
                      {logistics.partialRate}%
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>
                      {logistics.partialCount} orders ({bdt(logistics.partialValue)})
                    </span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>COURIER LOSS (RTO)</span>
                    <p style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", margin: "4px 0 0" }}>
                      {bdt(logistics.rtoLossCost)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Lost return charges</span>
                  </div>
                </div>

                {/* Pathao Logistics Status Overview */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", marginBottom: 12 }}>
                    🚚 PATHAO LOGISTICS DISPATCH STATUS
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--emerald)" }}>DELIVERED</span>
                      <p style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "var(--emerald)" }}>{logistics.deliveredCount}</p>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)" }}>IN TRANSIT</span>
                      <p style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "var(--indigo)" }}>{logistics.inTransitCount}</p>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--amber)" }}>PROCESSING</span>
                      <p style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "var(--amber)" }}>{logistics.pendingCount}</p>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--crimson)" }}>RETURNED / RTO</span>
                      <p style={{ fontSize: 18, fontWeight: 900, margin: "4px 0 0", color: "var(--crimson)" }}>{logistics.returnedCount}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---------------- 3. STOCK & INVENTORY TAB ---------------- */}
            {activeTab === "stock" && inventory && (
              <>
                {/* Stock KPI Matrix */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>INVENTORY VALUATION</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--indigo)", margin: "4px 0 0" }}>
                      {bdt(inventory.inventoryValuation)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>{inventory.totalUnits} total units in stock</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>STOCK HEALTH SCORE</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--emerald)", margin: "4px 0 0" }}>
                      {inventory.stockHealthScore}%
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>{inventory.inStockCount} / {inventory.totalSkus} SKUs available</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 800 }}>LOW STOCK ALERTS</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--amber)", margin: "4px 0 0" }}>
                      {inventory.lowStockCount} SKUs
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Stock ≤ 5 units</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--crimson)", fontWeight: 800 }}>OUT OF STOCK</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--crimson)", margin: "4px 0 0" }}>
                      {inventory.outOfStockCount} SKUs
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Requires urgent reorder</span>
                  </div>
                </div>

                {/* Low Stock Reorder Alerts */}
                {inventory.lowStockAlerts && inventory.lowStockAlerts.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>
                      ⚠️ URGENT REORDER ALERTS (LOW STOCK)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {inventory.lowStockAlerts.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 8, fontSize: 12 }}>
                          <div>
                            <strong style={{ color: "var(--ink)" }}>{item.name}</strong>
                            <p style={{ color: "var(--sub)", margin: "2px 0 0", fontSize: 11 }}>SKU: {item.sku} · Category: {item.category}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ background: "rgba(245,158,11,0.15)", color: "var(--amber)", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
                              {item.stock} left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------------- 4. CUSTOMERS & VIP TAB ---------------- */}
            {activeTab === "customers" && customers && (
              <>
                {/* Customer KPI Matrix */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 800 }}>TOTAL CUSTOMERS</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", margin: "4px 0 0" }}>
                      {customers.totalCustomers}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Profiles & purchasers</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--indigo)", fontWeight: 800 }}>REPEAT BUYER RATE</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--indigo)", margin: "4px 0 0" }}>
                      {customers.repeatRate}%
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>{customers.repeatCustomers} repeat buyers</span>
                  </div>

                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 14, borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 800 }}>AVG CUSTOMER LTV</span>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "var(--emerald)", margin: "4px 0 0" }}>
                      {bdt(customers.averageLtv)}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--sub)" }}>Lifetime value per shopper</span>
                  </div>
                </div>

                {/* VIP Leaderboard */}
                {customers.vipCustomers && customers.vipCustomers.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>
                      👑 TOP VIP CUSTOMERS (LIFETIME VALUE)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {customers.vipCustomers.map((vip: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 6, fontSize: 12 }}>
                          <div>
                            <span style={{ fontWeight: 800, color: "var(--ink)" }}>#{idx + 1} {vip.name}</span>
                            <span style={{ color: "var(--sub)", marginLeft: 8, fontSize: 11 }}>📱 {vip.phone}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <strong style={{ color: "var(--indigo)" }}>{bdt(vip.totalSpent)}</strong>
                            <span style={{ color: "var(--sub)", marginLeft: 6, fontSize: 11 }}>({vip.totalOrders} orders)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* District Distribution */}
                {customers.districtDistribution && customers.districtDistribution.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16, background: "var(--surface)" }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>
                      📍 BANGLADESH 64-DISTRICT SALES GEOGRAPHY
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      {customers.districtDistribution.map((d: any, idx: number) => (
                        <div key={idx} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: 10, borderRadius: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink)" }}>{d.districtName} ({d.district})</span>
                          <p style={{ fontSize: 14, fontWeight: 900, color: "var(--indigo)", margin: "4px 0 0" }}>{bdt(d.revenue)}</p>
                          <span style={{ fontSize: 10, color: "var(--sub)" }}>{d.orderCount} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------------- 5. ORDERS & PRODUCT MANAGEMENT TAB ---------------- */}
            {activeTab === "orders" && (
              <>
                {/* Search & Filter Bar */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <input
                    type="text"
                    placeholder="Search by Order #, Name, Phone, Pathao ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 220,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 12,
                    }}
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                    <option value="returned">Returned / RTO</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>

                {/* Orders List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredOrders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sub)", fontSize: 13 }}>
                      No matching orders found.
                    </div>
                  ) : (
                    filteredOrders.map((ord: any) => (
                      <div
                        key={ord.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: 14,
                          background: "var(--surface)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong style={{ fontSize: 14, color: "var(--ink)" }}>Order #{ord.orderNumber}</strong>
                              <span
                                style={{
                                  background:
                                    ord.status === "delivered" || ord.pathaoStatus === "Delivered"
                                      ? "rgba(16,185,129,0.15)"
                                      : ord.status === "returned"
                                      ? "rgba(239,68,68,0.15)"
                                      : "rgba(99,102,241,0.15)",
                                  color:
                                    ord.status === "delivered" || ord.pathaoStatus === "Delivered"
                                      ? "var(--emerald)"
                                      : ord.status === "returned"
                                      ? "var(--crimson)"
                                      : "var(--indigo)",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                {ord.pathaoStatus || ord.status}
                              </span>
                            </div>
                            <p style={{ color: "var(--sub)", fontSize: 12, margin: "2px 0 0" }}>
                              {ord.customerName} · 📱 {ord.phone} · 📍 {ord.districtName} ({ord.city})
                            </p>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>{bdt(ord.total)}</span>
                            <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>{ord.paymentTitle}</p>
                          </div>
                        </div>

                        {/* Customer Instructions Note */}
                        {ord.customerNote && (
                          <div style={{ background: "var(--surface-2)", padding: "6px 10px", borderRadius: 6, fontSize: 11, color: "var(--ink)", borderLeft: "3px solid var(--indigo)" }}>
                            <strong>📝 Special Delivery Note:</strong> {ord.customerNote}
                          </div>
                        )}

                        {/* Pathao Tracking Bar */}
                        {ord.pathaoConsignmentId ? (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                            <span style={{ color: "var(--sub)" }}>
                              🚚 Pathao Consignment: <strong style={{ color: "var(--ink)" }}>{ord.pathaoConsignmentId}</strong>
                            </span>
                            <a
                              href={ord.pathaoTrackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${ord.pathaoConsignmentId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "var(--indigo)", fontWeight: 800, textDecoration: "none" }}
                            >
                              Live Pathao Status →
                            </a>
                          </div>
                        ) : null}

                        {/* Status update buttons */}
                        <div style={{ display: "flex", gap: 6, paddingTop: 6, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 700 }}>Update Status:</span>
                          {["processing", "delivered", "returned", "partial"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              disabled={statusUpdatingId === ord.id}
                              onClick={() => handleUpdateOrderStatus(ord.id, st)}
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                border: ord.status === st ? "1px solid var(--indigo)" : "1px solid var(--border)",
                                background: ord.status === st ? "var(--indigo)" : "var(--surface-2)",
                                color: ord.status === st ? "#fff" : "var(--ink)",
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: "pointer",
                                textTransform: "capitalize",
                              }}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Export CSV CTA Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <a
                href={`${API_URL}/v1/deen/admin/export-orders?format=csv`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--outline"
                style={{ fontSize: 12, padding: "8px 16px", fontWeight: 800 }}
              >
                📥 Export Orders CSV
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
