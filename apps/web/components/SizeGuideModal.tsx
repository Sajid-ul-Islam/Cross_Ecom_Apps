"use client";

import React, { useState } from "react";

export type UnitType = "in" | "cm";

interface MeasurementRow {
  size: string;
  waist?: { in: number; cm: number };
  length?: { in: number; cm: number };
  hip?: { in: number; cm: number };
  thigh?: { in: number; cm: number };
  legOpening?: { in: number; cm: number };
  chest?: { in: number; cm: number };
  shoulder?: { in: number; cm: number };
  sleeve?: { in: number; cm: number };
}

const JEANS_CHART: MeasurementRow[] = [
  { size: "28", waist: { in: 28, cm: 71 }, length: { in: 32, cm: 81 }, hip: { in: 36, cm: 91 }, thigh: { in: 21, cm: 53 }, legOpening: { in: 13, cm: 33 } },
  { size: "30", waist: { in: 30, cm: 76 }, length: { in: 32, cm: 81 }, hip: { in: 38, cm: 96 }, thigh: { in: 22, cm: 56 }, legOpening: { in: 13.5, cm: 34 } },
  { size: "32", waist: { in: 32, cm: 81 }, length: { in: 32, cm: 81 }, hip: { in: 40, cm: 101 }, thigh: { in: 23, cm: 58 }, legOpening: { in: 14, cm: 35.5 } },
  { size: "34", waist: { in: 34, cm: 86 }, length: { in: 32, cm: 81 }, hip: { in: 42, cm: 106 }, thigh: { in: 24, cm: 61 }, legOpening: { in: 14.5, cm: 37 } },
  { size: "36", waist: { in: 36, cm: 91 }, length: { in: 34, cm: 86 }, hip: { in: 44, cm: 111 }, thigh: { in: 25, cm: 63.5 }, legOpening: { in: 15, cm: 38 } },
  { size: "38", waist: { in: 38, cm: 96 }, length: { in: 34, cm: 86 }, hip: { in: 46, cm: 116 }, thigh: { in: 26, cm: 66 }, legOpening: { in: 15.5, cm: 39 } },
];

const TOPS_CHART: MeasurementRow[] = [
  { size: "S", chest: { in: 38, cm: 96 }, length: { in: 27, cm: 68.5 }, shoulder: { in: 17, cm: 43 }, sleeve: { in: 8.5, cm: 21.5 } },
  { size: "M", chest: { in: 40, cm: 101 }, length: { in: 28, cm: 71 }, shoulder: { in: 18, cm: 45.5 }, sleeve: { in: 9, cm: 23 } },
  { size: "L", chest: { in: 42, cm: 106 }, length: { in: 29, cm: 73.5 }, shoulder: { in: 19, cm: 48 }, sleeve: { in: 9.5, cm: 24 } },
  { size: "XL", chest: { in: 44, cm: 111 }, length: { in: 30, cm: 76 }, shoulder: { in: 20, cm: 50.5 }, sleeve: { in: 10, cm: 25.5 } },
  { size: "XXL", chest: { in: 46, cm: 116 }, length: { in: 31, cm: 78.5 }, shoulder: { in: 21, cm: 53 }, sleeve: { in: 10.5, cm: 26.5 } },
];

const PANJABI_CHART: MeasurementRow[] = [
  { size: "38 (S)", chest: { in: 40, cm: 101 }, length: { in: 40, cm: 101 }, shoulder: { in: 17.5, cm: 44.5 }, sleeve: { in: 24.5, cm: 62 } },
  { size: "40 (M)", chest: { in: 42, cm: 106 }, length: { in: 42, cm: 106 }, shoulder: { in: 18.5, cm: 47 }, sleeve: { in: 25, cm: 63.5 } },
  { size: "42 (L)", chest: { in: 44, cm: 111 }, length: { in: 44, cm: 111 }, shoulder: { in: 19.5, cm: 49.5 }, sleeve: { in: 25.5, cm: 64.5 } },
  { size: "44 (XL)", chest: { in: 46, cm: 116 }, length: { in: 45, cm: 114 }, shoulder: { in: 20.5, cm: 52 }, sleeve: { in: 26, cm: 66 } },
  { size: "46 (XXL)", chest: { in: 48, cm: 122 }, length: { in: 46, cm: 116 }, shoulder: { in: 21.5, cm: 54.5 }, sleeve: { in: 26.5, cm: 67 } },
];

const TROUSERS_CHART: MeasurementRow[] = [
  { size: "30", waist: { in: 30, cm: 76 }, length: { in: 39, cm: 99 }, hip: { in: 39, cm: 99 }, thigh: { in: 23, cm: 58 } },
  { size: "32", waist: { in: 32, cm: 81 }, length: { in: 40, cm: 101 }, hip: { in: 41, cm: 104 }, thigh: { in: 24, cm: 61 } },
  { size: "34", waist: { in: 34, cm: 86 }, length: { in: 40.5, cm: 103 }, hip: { in: 43, cm: 109 }, thigh: { in: 25, cm: 63.5 } },
  { size: "36", waist: { in: 36, cm: 91 }, length: { in: 41, cm: 104 }, hip: { in: 45, cm: 114 }, thigh: { in: 26, cm: 66 } },
];

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  selectedSize: string;
  onSelectSize?: (size: string) => void;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = "JEANS",
  selectedSize,
  onSelectSize,
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<UnitType>("in");

  if (!isOpen) return null;

  const catUpper = (category || "").toUpperCase();
  const isBottom = catUpper === "JEANS" || catUpper === "DENIM" || catUpper === "TROUSERS";
  const isPanjabi = catUpper === "PANJABI";
  const isTrousers = catUpper === "TROUSERS";

  const chartData = isTrousers
    ? TROUSERS_CHART
    : isBottom
    ? JEANS_CHART
    : isPanjabi
    ? PANJABI_CHART
    : TOPS_CHART;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              📐 SIZE GUIDE & MEASUREMENTS
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              {catUpper} Garment Specs (Bangladeshi Standard Fit)
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Unit Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700 }}>Toggle Units:</span>
          <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 6, border: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setUnit("in")}
              style={{
                border: "none",
                background: unit === "in" ? "var(--indigo)" : "transparent",
                color: unit === "in" ? "#fff" : "var(--ink)",
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Inches (in)
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              style={{
                border: "none",
                background: unit === "cm" ? "var(--indigo)" : "transparent",
                color: unit === "cm" ? "#fff" : "var(--ink)",
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 800 }}>Size</th>
                {isBottom ? (
                  <>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Waist</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Length</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Hip</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Thigh</th>
                    {chartData[0].legOpening && <th style={{ padding: "10px 14px", fontWeight: 800 }}>Opening</th>}
                  </>
                ) : (
                  <>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Chest</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Length</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Shoulder</th>
                    <th style={{ padding: "10px 14px", fontWeight: 800 }}>Sleeve</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => {
                const isSelected = selectedSize.toLowerCase().includes(row.size.toLowerCase().split(" ")[0]);
                return (
                  <tr
                    key={row.size}
                    onClick={() => onSelectSize && onSelectSize(row.size.split(" ")[0])}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--indigo-light)" : "transparent",
                      cursor: onSelectSize ? "pointer" : "default",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 800, color: isSelected ? "var(--indigo)" : "var(--ink)" }}>
                      {row.size} {isSelected ? "✓" : ""}
                    </td>
                    {isBottom ? (
                      <>
                        <td style={{ padding: "10px 14px" }}>{row.waist ? row.waist[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.length ? row.length[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.hip ? row.hip[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.thigh ? row.thigh[unit] : "—"}</td>
                        {row.legOpening && <td style={{ padding: "10px 14px" }}>{row.legOpening[unit]}</td>}
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "10px 14px" }}>{row.chest ? row.chest[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.length ? row.length[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.shoulder ? row.shoulder[unit] : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>{row.sleeve ? row.sleeve[unit] : "—"}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tip Box */}
        <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8, fontSize: 12, color: "var(--sub)" }}>
          💡 <strong>Pro Sizing Tip:</strong> For standard slim-straight fit, choose your usual waist size. For a relaxed look or roomier thigh feel, size up by 1. Free 7-day doorstep size exchange available across all 64 districts.
        </div>
      </div>
    </div>
  );
}
