"use client";

import React from "react";
import type { OrderResult } from "@/lib/api";

export interface CustomerShoppingKPIs {
  totalSpend: number;
  totalItemsPurchased: number;
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  returnExchangeCount: number;
  retentionRate: number;
}

export interface CustomerAnalyticsKPIsProps {
  orders?: OrderResult[];
  returns?: any[];
  onOrdersClick?: () => void;
  onReturnsClick?: () => void;
}

/**
 * Genuine computation of executive shopping analytics metrics from customer order history.
 * Supports clean zero-state for new and guest shoppers.
 */
export function computeCustomerKPIs(
  orders?: OrderResult[] | null,
  returns?: any[] | null
): CustomerShoppingKPIs {
  const list = Array.isArray(orders) ? orders : [];
  if (list.length === 0) {
    return {
      totalSpend: 0,
      totalItemsPurchased: 0,
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      returnExchangeCount: 0,
      retentionRate: 100,
    };
  }

  // 1. Filter out cancelled or failed orders
  const validOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s !== "cancelled" && s !== "failed";
  });

  // 2. Total Spend (৳): Sum of valid order totals
  const totalSpend = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // 3. Total Items Purchased: Sum of physical garment pieces across valid orders
  const totalItemsPurchased = validOrders.reduce((sum, o) => {
    const lines = o.lines;
    if (Array.isArray(lines) && lines.length > 0) {
      return sum + lines.reduce((lineSum: number, item: any) => lineSum + (Number(item.qty) || 1), 0);
    }
    return sum + 1; // Fallback to 1 item if line breakdown not present
  }, 0);

  // 4. Completed / Delivered Orders
  const completedOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  }).length;

  // 5. Active In-Flight Orders
  const activeOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return (
      s === "processing" ||
      s === "shipped" ||
      s === "in_transit" ||
      s === "received" ||
      s === "confirmed"
    );
  }).length;

  // 6. Return / Exchange Count
  const returnList = Array.isArray(returns) ? returns : [];
  const returnedOrderIds = new Set(
    returnList.map((r) => String(r.orderId || r.orderNumber || r.id || ""))
  );
  const returnOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return (
      s === "returned" ||
      s === "exchange_requested" ||
      s === "return_processing" ||
      returnedOrderIds.has(String(o.id)) ||
      returnedOrderIds.has(String(o.number))
    );
  });
  const returnExchangeCount = Math.max(returnOrders.length, returnList.length);

  // 7. Retention Rate
  const retentionRate =
    validOrders.length > 0
      ? Math.max(0, Math.round(((validOrders.length - returnExchangeCount) / validOrders.length) * 100))
      : 100;

  return {
    totalSpend,
    totalItemsPurchased,
    totalOrders: list.length,
    completedOrders,
    activeOrders,
    returnExchangeCount,
    retentionRate,
  };
}

export default function CustomerAnalyticsKPIs({
  orders,
  returns,
  onOrdersClick,
  onReturnsClick,
}: CustomerAnalyticsKPIsProps) {
  const kpi = computeCustomerKPIs(orders, returns);

  // Dynamic context microcopy
  const spendTierLabel =
    kpi.totalSpend >= 5000
      ? "💎 Platinum Tier (৳5k+)"
      : kpi.totalSpend >= 2500
      ? "✨ Gold Tier (৳2.5k+)"
      : kpi.totalSpend > 0
      ? "👕 Silver Club Member"
      : "৳0 · New Guest Shopper";

  const itemsAvgLabel =
    kpi.totalItemsPurchased > 0
      ? `Avg ৳${Math.round(kpi.totalSpend / kpi.totalItemsPurchased).toLocaleString("en-BD")} / piece`
      : "0 Garments · Ready to Explore";

  const ordersContextLabel =
    kpi.totalOrders > 0
      ? `${kpi.totalOrders} ${kpi.totalOrders === 1 ? "Order" : "Orders"} Placed Total`
      : "0 Orders Placed";

  const returnsContextLabel =
    kpi.totalOrders > 0
      ? `${kpi.retentionRate}% Retained Guarantee`
      : "7-Day Doorstep Guarantee";

  return (
    <section
      className="customer-analytics-section"
      aria-label="Executive Shopping Analytics Summary"
      role="region"
    >
      <div className="customer-analytics-header">
        <div className="customer-analytics-title-group">
          <span className="customer-analytics-icon" aria-hidden="true">
            📊
          </span>
          <div>
            <h3 className="customer-analytics-title">Executive Shopping Intelligence</h3>
            <span className="customer-analytics-subtitle">DEEN CLUB PERSONAL KPI</span>
          </div>
        </div>
        <div className="customer-analytics-badge" role="status" aria-label="Status: Live Metrics">
          <span className="customer-analytics-badge-dot" aria-hidden="true" />
          <span>LIVE METRICS</span>
        </div>
      </div>

      <div className="customer-analytics-grid">
        {/* Card 1: Total Spend (৳) */}
        <div
          className="customer-kpi-card"
          role="region"
          aria-label={`Total Spend: ৳${kpi.totalSpend.toLocaleString("en-BD")}, ${spendTierLabel}`}
          tabIndex={0}
        >
          <div className="customer-kpi-top">
            <span className="customer-kpi-chip customer-kpi-chip--indigo" aria-hidden="true">
              ৳
            </span>
            <span className="customer-kpi-label">TOTAL SPEND</span>
          </div>
          <div className="customer-kpi-value customer-kpi-value--indigo">
            ৳{kpi.totalSpend.toLocaleString("en-BD")}
          </div>
          <div className="customer-kpi-subtext" title={spendTierLabel}>
            {spendTierLabel}
          </div>
        </div>

        {/* Card 2: Total Items Purchased */}
        <div
          className="customer-kpi-card"
          role="region"
          aria-label={`Items Purchased: ${kpi.totalItemsPurchased} Pieces, ${itemsAvgLabel}`}
          tabIndex={0}
        >
          <div className="customer-kpi-top">
            <span className="customer-kpi-chip customer-kpi-chip--emerald" aria-hidden="true">
              🛍️
            </span>
            <span className="customer-kpi-label">ITEMS PURCHASED</span>
          </div>
          <div className="customer-kpi-value customer-kpi-value--emerald">
            {kpi.totalItemsPurchased} {kpi.totalItemsPurchased === 1 ? "Piece" : "Pieces"}
          </div>
          <div className="customer-kpi-subtext" title={itemsAvgLabel}>
            {itemsAvgLabel}
          </div>
        </div>

        {/* Card 3: Total Completed Orders */}
        <div
          className={`customer-kpi-card ${onOrdersClick ? "customer-kpi-card--clickable" : ""}`}
          role={onOrdersClick ? "button" : "region"}
          onClick={onOrdersClick}
          onKeyDown={(e) => {
            if (onOrdersClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onOrdersClick();
            }
          }}
          aria-label={`Completed Orders: ${kpi.completedOrders} Delivered of ${ordersContextLabel}`}
          tabIndex={0}
        >
          <div className="customer-kpi-top">
            <span className="customer-kpi-chip customer-kpi-chip--ink" aria-hidden="true">
              📦
            </span>
            <span className="customer-kpi-label">COMPLETED ORDERS</span>
          </div>
          <div className="customer-kpi-value customer-kpi-value--ink">
            {kpi.completedOrders} Completed
          </div>
          <div className="customer-kpi-subtext" title={ordersContextLabel}>
            {ordersContextLabel}
          </div>
        </div>

        {/* Card 4: Return / Exchange Status */}
        <div
          className={`customer-kpi-card ${onReturnsClick ? "customer-kpi-card--clickable" : ""}`}
          role={onReturnsClick ? "button" : "region"}
          onClick={onReturnsClick}
          onKeyDown={(e) => {
            if (onReturnsClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onReturnsClick();
            }
          }}
          aria-label={`Returns and Exchanges: ${kpi.returnExchangeCount} Active, ${returnsContextLabel}`}
          tabIndex={0}
        >
          <div className="customer-kpi-top">
            <span className="customer-kpi-chip customer-kpi-chip--amber" aria-hidden="true">
              🔄
            </span>
            <span className="customer-kpi-label">RETURN / EXCHANGE</span>
          </div>
          <div className="customer-kpi-value customer-kpi-value--amber">
            {kpi.returnExchangeCount} Active
          </div>
          <div className="customer-kpi-subtext" title={returnsContextLabel}>
            {returnsContextLabel}
          </div>
        </div>
      </div>

      <style jsx>{`
        .customer-analytics-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .customer-analytics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-light);
        }

        .customer-analytics-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .customer-analytics-icon {
          font-size: 18px;
          line-height: 1;
        }

        .customer-analytics-title {
          font-size: 12.5px;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0;
          line-height: 1.2;
        }

        .customer-analytics-subtitle {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: var(--sub);
          text-transform: uppercase;
          display: block;
          margin-top: 2px;
        }

        .customer-analytics-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.4px;
          color: var(--emerald);
          background: rgba(46, 125, 91, 0.12);
          padding: 4px 9px;
          border-radius: 999px;
          border: 1px solid rgba(46, 125, 91, 0.25);
        }

        [data-theme="dark"] .customer-analytics-badge {
          background: rgba(52, 211, 153, 0.12);
          border-color: rgba(52, 211, 153, 0.28);
        }

        .customer-analytics-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--emerald);
          display: inline-block;
        }

        .customer-analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 620px) {
          .customer-analytics-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
        }

        .customer-kpi-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 96px;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          outline: none;
        }

        .customer-kpi-card:focus-visible {
          border-color: var(--indigo);
          box-shadow: 0 0 0 2px rgba(4, 107, 210, 0.35);
        }

        .customer-kpi-card--clickable {
          cursor: pointer;
        }

        .customer-kpi-card--clickable:hover {
          transform: translateY(-1px);
          border-color: var(--border);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .customer-kpi-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .customer-kpi-chip {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
        }

        .customer-kpi-chip--indigo {
          background: rgba(4, 107, 210, 0.12);
          color: var(--indigo);
        }

        .customer-kpi-chip--emerald {
          background: rgba(46, 125, 91, 0.12);
          color: var(--emerald);
        }

        .customer-kpi-chip--ink {
          background: rgba(15, 23, 42, 0.08);
          color: var(--ink);
        }

        [data-theme="dark"] .customer-kpi-chip--ink {
          background: rgba(255, 255, 255, 0.12);
        }

        .customer-kpi-chip--amber {
          background: rgba(217, 119, 6, 0.12);
          color: var(--amber);
        }

        .customer-kpi-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--sub);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .customer-kpi-value {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.2px;
          line-height: 1.2;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .customer-kpi-value--indigo {
          color: var(--indigo);
        }

        .customer-kpi-value--emerald {
          color: var(--emerald);
        }

        .customer-kpi-value--ink {
          color: var(--ink);
        }

        .customer-kpi-value--amber {
          color: var(--amber);
        }

        .customer-kpi-subtext {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--sub);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.1px;
        }
      `}</style>
    </section>
  );
}
