"use client";

import React from "react";
import type { OrderResult } from "@/lib/api";

interface OrderStatusStepperProps {
  order: OrderResult;
  onTrackPathao?: (consignmentId: string) => void;
}

interface StepInfo {
  index: number;
  label: string;
  sub: string;
  icon: string;
}

const STEPS: StepInfo[] = [
  { index: 0, label: "Order Placed", sub: "Order received", icon: "📝" },
  { index: 1, label: "Confirmed", sub: "Verified & queued", icon: "✓" },
  { index: 2, label: "Packed", sub: "Quality checked & packed", icon: "📦" },
  { index: 3, label: "In Transit", sub: "Pathao Logistics courier", icon: "🚚" },
  { index: 4, label: "Delivered", sub: "Received by customer", icon: "🏠" },
];

function getActiveStepIndex(status: string, hasPathao: boolean): { currentStep: number; isFailed: boolean; isCancelled: boolean; isReturned: boolean } {
  const norm = (status || "").toLowerCase().replace(/[-_]/g, "");

  if (norm.includes("cancel")) {
    return { currentStep: 0, isFailed: true, isCancelled: true, isReturned: false };
  }
  if (norm.includes("return") || norm.includes("rto")) {
    return { currentStep: 3, isFailed: true, isCancelled: false, isReturned: true };
  }
  if (norm.includes("fail") || norm.includes("reject")) {
    return { currentStep: 0, isFailed: true, isCancelled: false, isReturned: false };
  }

  // Normal flow
  if (norm.includes("deliver") || norm === "completed") {
    return { currentStep: 4, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("transit") || norm.includes("shipped") || norm.includes("dispatch") || (hasPathao && norm !== "pending")) {
    return { currentStep: 3, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("process") || norm.includes("pack")) {
    return { currentStep: 2, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("confirm") || norm.includes("verified")) {
    return { currentStep: 1, isFailed: false, isCancelled: false, isReturned: false };
  }

  // default pending
  return { currentStep: 0, isFailed: false, isCancelled: false, isReturned: false };
}

export default function OrderStatusStepper({ order, onTrackPathao }: OrderStatusStepperProps) {
  const hasPathao = Boolean(order.pathaoConsignmentId);
  const pathaoId = order.pathaoConsignmentId || "";
  const trackingUrl = order.pathaoTrackingUrl || (pathaoId ? `https://merchant.pathao.com/tracking?consignment_id=${pathaoId}` : null);

  const { currentStep, isCancelled, isReturned, isFailed } = getActiveStepIndex(order.status, hasPathao);

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "18px 16px",
        margin: "14px 0",
      }}
    >
      {/* Status Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--ink)" }}>
            ORDER STATUS:
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              padding: "3px 10px",
              borderRadius: 20,
              textTransform: "uppercase",
              background: isCancelled || isFailed
                ? "rgba(225, 41, 62, 0.12)"
                : isReturned
                ? "rgba(245, 158, 11, 0.12)"
                : currentStep === 4
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(99, 102, 241, 0.15)",
              color: isCancelled || isFailed
                ? "var(--crimson)"
                : isReturned
                ? "var(--amber)"
                : currentStep === 4
                ? "var(--emerald)"
                : "var(--indigo)",
            }}
          >
            {isCancelled ? "CANCELLED" : isReturned ? "RETURNED / RTO" : order.status.toUpperCase()}
          </span>
        </div>

        {/* Estimated delivery window */}
        <span style={{ fontSize: 11, color: "var(--sub)" }}>
          Estimated Delivery: <strong>{(order.address || "").toLowerCase().includes("dhaka") ? "24–48 Hours" : "3–5 Days"}</strong>
        </span>
      </div>

      {/* Stepper Graphic */}
      <div style={{ position: "relative", padding: "10px 0 6px" }}>
        {/* Background Connecting Line */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 20,
            right: 20,
            height: 3,
            background: "var(--border)",
            zIndex: 1,
          }}
        />

        {/* Active Connecting Progress Line */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 20,
            width: `${Math.min(100, (currentStep / (STEPS.length - 1)) * 100)}%`,
            maxWidth: "calc(100% - 40px)",
            height: 3,
            background: isCancelled || isFailed ? "var(--crimson)" : "var(--indigo)",
            zIndex: 2,
            transition: "width 0.4s ease",
          }}
        />

        {/* Milestone Steps */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 3,
          }}
        >
          {STEPS.map((step) => {
            const isCompleted = step.index <= currentStep && !isCancelled && !isFailed;
            const isCurrent = step.index === currentStep && !isCancelled && !isFailed;

            return (
              <div
                key={step.index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 60,
                  textAlign: "center",
                }}
              >
                {/* Circle Icon Indicator */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    background: isCompleted
                      ? "var(--indigo)"
                      : isCurrent
                      ? "var(--indigo)"
                      : "var(--surface)",
                    color: isCompleted || isCurrent ? "#FFFFFF" : "var(--sub)",
                    border: isCompleted || isCurrent ? "2px solid var(--indigo)" : "2px solid var(--border)",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(99,102,241,0.2)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isCompleted && step.index < currentStep ? "✓" : step.icon}
                </div>

                {/* Milestone Label */}
                <strong
                  style={{
                    fontSize: 11,
                    fontWeight: isCompleted || isCurrent ? 800 : 600,
                    color: isCompleted || isCurrent ? "var(--ink)" : "var(--sub)",
                    marginTop: 6,
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </strong>
                <span style={{ fontSize: 9, color: "var(--sub)", marginTop: 2, display: "none" }}>
                  {step.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pathao Logistics Live Tracking Bar */}
      {hasPathao && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🚚</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", textTransform: "uppercase" }}>
                Pathao Consignment: <strong>{pathaoId}</strong>
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--sub)" }}>
                Live dispatch &amp; courier milestone updates active
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {onTrackPathao && (
              <button
                type="button"
                onClick={() => onTrackPathao(pathaoId)}
                className="btn btn--secondary"
                style={{ fontSize: 11, padding: "5px 10px", fontWeight: 800 }}
              >
                In-App Tracker
              </button>
            )}
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ fontSize: 11, padding: "5px 12px", fontWeight: 800, textDecoration: "none" }}
              >
                Live Pathao Link ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
