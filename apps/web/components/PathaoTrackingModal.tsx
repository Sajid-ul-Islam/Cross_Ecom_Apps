"use client";

import React, { useEffect, useState } from "react";
import { fetchPathaoTracking, type PathaoTrackingResult } from "@/lib/api";

interface PathaoTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  consignmentId: string;
}

export default function PathaoTrackingModal({
  isOpen,
  onClose,
  consignmentId,
}: PathaoTrackingModalProps) {
  const [data, setData] = useState<PathaoTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && consignmentId) {
      setLoading(true);
      fetchPathaoTracking(consignmentId)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }
  }, [isOpen, consignmentId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              🚚 PATHAO COURIER LIVE TRACKING
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              Consignment ID: <strong>{consignmentId}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 12 }}>Contacting Pathao Courier API…</p>
          </div>
        ) : data ? (
          <div>
            <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: "var(--radius)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--sub)", textTransform: "uppercase", fontWeight: 800 }}>Status</span>
                <p style={{ fontSize: 15, fontWeight: 900, color: "var(--indigo)", margin: 0 }}>{data.summary || data.status}</p>
              </div>
              <a
                href={data.trackingUrl || `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--outline"
                style={{ fontSize: 12, padding: "6px 12px", fontWeight: 700 }}
              >
                External Link ↗
              </a>
            </div>

            {/* Timeline Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px 0" }}>
              {data.steps && data.steps.length > 0 ? (
                data.steps.map((st, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: st.completed ? "var(--emerald)" : st.current ? "var(--indigo)" : "var(--border)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 900,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      {st.completed ? "✓" : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: st.current ? 800 : 600, color: st.current ? "var(--indigo)" : "var(--ink)", margin: 0 }}>
                        {st.label}
                      </p>
                      {st.timestamp && (
                        <span style={{ fontSize: 11, color: "var(--sub)" }}>
                          {new Date(st.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--sub)", fontSize: 13 }}>
                  Parcel allocated. Courier rider pickup scheduled.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--sub)" }}>
            Unable to fetch tracking info. Please check the external tracking link.
          </div>
        )}
      </div>
    </div>
  );
}
