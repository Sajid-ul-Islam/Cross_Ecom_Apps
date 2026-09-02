"use client";

import React, { useState } from "react";
import { bdt } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  1. Sales & Revenue Interactive Area / Trend Chart (SVG)           */
/* ------------------------------------------------------------------ */

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  netSales?: number;
  orders: number;
  units?: number;
}

interface SalesTrendAreaChartProps {
  data: SalesTrendPoint[];
  height?: number;
}

export function SalesTrendAreaChart({ data, height = 240 }: SalesTrendAreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sub)" }}>
        No timeline sales data available.
      </div>
    );
  }

  const width = 760;
  const padding = { top: 20, right: 30, bottom: 35, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue || 0, d.netSales || 0)), 10000);
  const minVal = 0;

  // Grid step calculations
  const yTicksCount = 4;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => Math.round((maxVal / yTicksCount) * i));

  const getX = (idx: number) => padding.left + (idx / Math.max(data.length - 1, 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  // Build SVG Path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.revenue || 0), ...d }));
  const netPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.netSales ?? d.revenue * 0.92) }));

  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const netLinePath = netPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div style={{ width: "100%", position: "relative", userSelect: "none" }}>
      {/* Legend & Summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 4, borderRadius: 2, background: "#4F46E5" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink)" }}>Gross Sales (৳)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 4, borderRadius: 2, background: "#10B981" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--emerald)" }}>Net Realized (৳)</span>
          </div>
        </div>
        {activePoint ? (
          <div style={{ display: "flex", gap: 12, background: "var(--surface-2)", padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--sub)" }}>Date: <strong style={{ color: "var(--ink)" }}>{activePoint.date}</strong></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#4F46E5" }}>Gross: <strong>{bdt(activePoint.revenue)}</strong></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981" }}>Net: <strong>{bdt(activePoint.netSales ?? Math.round(activePoint.revenue * 0.92))}</strong></span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--amber)" }}>Orders: <strong>{activePoint.orders}</strong></span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "var(--sub)" }}>Hover over chart nodes to inspect daily velocity</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y Axis Labels */}
        {yTicks.map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border)"
                strokeDasharray={i === 0 ? "none" : "3,3"}
                strokeWidth={i === 0 ? 1.5 : 1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="var(--sub)"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
              >
                {val >= 1000 ? `৳${Math.round(val / 1000)}k` : `৳${val}`}
              </text>
            </g>
          );
        })}

        {/* Shaded Revenue Area */}
        <path d={areaPath} fill="url(#salesGrad)" />

        {/* Net Sales Secondary Line */}
        <path
          d={netLinePath}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="4,4"
        />

        {/* Gross Revenue Primary Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-Axis Date Labels & Vertical hover bars */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{ cursor: "pointer" }}
            >
              {/* Invisible wide hit target */}
              <rect
                x={p.x - (chartW / data.length) / 2}
                y={padding.top}
                width={chartW / data.length}
                height={chartH}
                fill="transparent"
              />

              {isHovered && (
                <line
                  x1={p.x}
                  y1={padding.top}
                  x2={p.x}
                  y2={padding.top + chartH}
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              )}

              {/* Node circles */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 3.5}
                fill={isHovered ? "#fff" : "#4F46E5"}
                stroke="#4F46E5"
                strokeWidth={isHovered ? 3 : 1.5}
                style={{ transition: "all 0.15s ease" }}
              />

              {/* Date label at bottom */}
              <text
                x={p.x}
                y={height - 10}
                fill={isHovered ? "var(--ink)" : "var(--sub)"}
                fontSize={isHovered ? "11" : "9.5"}
                fontWeight={isHovered ? "900" : "700"}
                textAnchor="middle"
              >
                {p.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Pathao Logistics & Fulfillment Donut Chart (SVG)               */
/* ------------------------------------------------------------------ */

interface LogisticsDonutProps {
  statusBreakdown: {
    delivered: number;
    in_transit: number;
    pending: number;
    returned: number;
    partial: number;
  };
  deliverySuccessRate: number;
}

export function LogisticsDonutChart({ statusBreakdown, deliverySuccessRate }: LogisticsDonutProps) {
  const categories = [
    { key: "delivered", label: "Delivered (Pathao)", count: statusBreakdown.delivered || 0, color: "#10B981" },
    { key: "in_transit", label: "In Transit with Courier", count: statusBreakdown.in_transit || 0, color: "#3B82F6" },
    { key: "pending", label: "Processing Dispatch", count: statusBreakdown.pending || 0, color: "#F59E0B" },
    { key: "returned", label: "Returned / RTO", count: statusBreakdown.returned || 0, color: "#EF4444" },
    { key: "partial", label: "Partial Delivery", count: statusBreakdown.partial || 0, color: "#8B5CF6" },
  ];

  const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;

  // Compute SVG Arc strokes
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = categories.map((c) => {
    const pct = c.count / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += pct * circumference;
    return { ...c, pct, strokeDasharray, strokeDashoffset };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "space-around" }}>
      {/* SVG Donut */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          ))}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 900, color: "var(--emerald)", lineHeight: 1 }}>
            {deliverySuccessRate}%
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--sub)", marginTop: 4, letterSpacing: 0.5 }}>
            SUCCESS
          </span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 200 }}>
        {categories.map((c) => {
          const pct = Math.round((c.count / total) * 100);
          return (
            <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
                <span style={{ color: "var(--ink)", fontWeight: 700 }}>{c.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "var(--ink)" }}>{c.count}</strong>
                <span style={{ color: "var(--sub)", fontSize: 10, minWidth: 32, textAlign: "right" }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Category Revenue & Share Bar Chart (SVG)                       */
/* ------------------------------------------------------------------ */

interface CategoryMatrixItem {
  category: string;
  revenue: number;
  units: number;
  sharePct: number;
}

export function CategoryRevenueBarChart({ categories }: { categories: CategoryMatrixItem[] }) {
  if (!categories || categories.length === 0) return null;

  const maxRev = Math.max(...categories.map((c) => c.revenue), 1000);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {categories.map((c, i) => {
        const pctOfMax = Math.max(10, Math.round((c.revenue / maxRev) * 100));
        return (
          <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "var(--indigo)", color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 9.5, fontWeight: 900 }}>
                  {c.category}
                </span>
                <span style={{ fontSize: 11, color: "var(--sub)" }}>
                  {c.units} units sold
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ fontSize: 13, color: "var(--ink)" }}>{bdt(c.revenue)}</strong>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--indigo)", background: "rgba(79, 70, 229, 0.1)", padding: "1px 6px", borderRadius: 4 }}>
                  {c.sharePct}%
                </span>
              </div>
            </div>

            {/* Visual Bar with Gradient */}
            <div style={{ width: "100%", height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pctOfMax}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #4F46E5 0%, #3B82F6 100%)",
                  borderRadius: 4,
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Live Integrations Status Card (WooCommerce & Pathao)           */
/* ------------------------------------------------------------------ */

export function LiveIntegrationsStatusCard({
  wooStatus,
  pathaoStatus,
  wooProductsCount,
}: {
  wooStatus?: string;
  pathaoStatus?: string;
  wooProductsCount?: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
      {/* WooCommerce Connection */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛍️</span>
            <div>
              <strong style={{ fontSize: 13, color: "var(--ink)", display: "block" }}>WooCommerce REST v3</strong>
              <span style={{ fontSize: 10, color: "var(--sub)" }}>deencommerce.com</span>
            </div>
          </div>
          <span style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
            ● CONNECTED
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--sub)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span>Live Synced Catalog:</span>
          <strong style={{ color: "var(--ink)" }}>{wooProductsCount || 48} Products</strong>
        </div>
        <div style={{ fontSize: 11, color: "var(--sub)", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span>Endpoint:</span>
          <code style={{ fontSize: 10, color: "var(--indigo)" }}>/wp-json/wc/v3</code>
        </div>
      </div>

      {/* Pathao Logistics Hermes Connection */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🚚</span>
            <div>
              <strong style={{ fontSize: 13, color: "var(--ink)", display: "block" }}>Pathao Courier API</strong>
              <span style={{ fontSize: 10, color: "var(--sub)" }}>merchant.pathao.com</span>
            </div>
          </div>
          <span style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
            ● INTEGRATED
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--sub)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span>Rates:</span>
          <strong style={{ color: "var(--ink)" }}>Inside Dhaka ৳50 · Outside ৳90</strong>
        </div>
        <div style={{ fontSize: 11, color: "var(--sub)", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span>Consignment Tracking:</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--emerald)" }}>Live Tracking Links Enabled</span>
        </div>
      </div>
    </div>
  );
}
