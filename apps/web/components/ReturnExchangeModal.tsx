"use client";

import React, { useState } from "react";
import { API_URL, type OrderResult } from "@/lib/api";

interface ReturnExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResult;
  onSuccess?: () => void;
}

export default function ReturnExchangeModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReturnExchangeModalProps) {
  const [reason, setReason] = useState("size_exchange");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch(`${API_URL}/v1/deen/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.number,
          phone: order.billing?.phone || order.phone || "",
          reason,
          details: details.trim(),
          items: order.lines || [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: "success", text: "✓ Return/Exchange request submitted! Our concierge team will contact you within 24 hours." });
        setTimeout(() => {
          setSubmitting(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setSubmitting(false);
        setNotice({ type: "error", text: data.message || "Failed to submit request. Please try again." });
      }
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Network error submitting return request." });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>
              🔄 REQUEST RETURN OR SIZE EXCHANGE
            </h2>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>
              Order #{order.number} · 7-Day Doorstep Guarantee
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {notice && (
          <div className={`alert alert--${notice.type === "success" ? "success" : "error"}`} style={{ marginBottom: 14 }}>
            {notice.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Reason</label>
            <select
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="size_exchange">Size Exchange (Need bigger/smaller size)</option>
              <option value="defective_item">Damaged / Manufacturing Defect</option>
              <option value="wrong_item">Received Wrong Item</option>
              <option value="color_preference">Color / Wash Exchange</option>
              <option value="refund">Store Credit / Return</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Details / Requested Replacement Size</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Please exchange the size 32 jeans for size 34 in Dhaka delivery address."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>

          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8, fontSize: 12, color: "var(--sub)", marginBottom: 16 }}>
            🛡️ <strong>DEEN Policy:</strong> Garments must be unworn with original tags attached. For size exchanges within Dhaka, our courier delivers the new size and picks up the previous size at the same doorstep visit.
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: "100%", padding: 12, fontWeight: 800 }}
            disabled={submitting}
          >
            {submitting ? "Submitting Request…" : "SUBMIT RETURN REQUEST"}
          </button>
        </form>
      </div>
    </div>
  );
}
