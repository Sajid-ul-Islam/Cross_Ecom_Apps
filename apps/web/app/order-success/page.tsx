"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bdt, fetchAppSettings, type OrderResult } from "@/lib/api";
import OrderStatusStepper from "@/components/OrderStatusStepper";

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

function OrderSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id") || "";
  const number = params.get("number") || "DC-???";
  const total = Number(params.get("total") || 0);
  const delivery = Number(params.get("delivery") || 50);
  const wooId = params.get("wooId");
  const payment = params.get("payment") || "Cash on Delivery (COD)";
  const consignment = params.get("consignment");
  const hasConsignment = Boolean(consignment && consignment.trim().length > 0);
  const [whatsapp, setWhatsapp] = useState("01952700500");
  useEffect(() => { fetchAppSettings().then(s => { if (s?.contact?.whatsapp) setWhatsapp(s.contact.whatsapp.replace(/[^0-9]/g, '')); }); }, []);
  const trackingUrl =
    params.get("tracking") ||
    (hasConsignment ? `https://merchant.pathao.com/tracking?consignment_id=${consignment}` : "");

  const guestName = params.get("guestName") || "";
  const guestPhone = params.get("guestPhone") || "";
  const isGuestOrder = Boolean(guestName && guestPhone);

  const [guestSaved, setGuestSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check if already saved in profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.phone === guestPhone && !p?.isGuest) {
          setGuestSaved(true);
        }
      }
    } catch {}
  }, [guestPhone]);

  const handleSaveGuestProfile = () => {
    setSaveLoading(true);
    try {
      const updated = {
        name: guestName,
        phone: guestPhone,
        email: "",
        address: "",
        city: "Dhaka",
        district: "BD-13",
        jeansSize: "32",
        topSize: "L",
        isGuest: false,
        role: "customer",
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      setGuestSaved(true);
    } catch {}
    setSaveLoading(false);
  };

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <div className="order-success-wrapper">
        {/* Animated Celebration Icon */}
        <div className="order-success-icon-wrap">
          <span className="order-success-icon-symbol">🎉</span>
        </div>

        <h1 className="order-success-title">ORDER PLACED SUCCESSFULLY!</h1>
        <p className="order-success-sub">
          Thank you for shopping with DEEN. Your parcel is now queued for fulfillment and dispatch at our Mirpur central studio.
        </p>

        {/* Order Details Card */}
        <div className="order-success-card">
          <div className="order-success-card-row">
            <span className="success-row-label">ORDER NUMBER</span>
            <span className="success-row-val success-row-val--highlight">{number}</span>
          </div>

          {wooId && (
            <div className="order-success-card-row">
              <span className="success-row-label">WOOCOMMERCE STORE #</span>
              <span className="success-row-val">#{wooId}</span>
            </div>
          )}

          <div className="order-success-card-row">
            <span className="success-row-label">DELIVERY CHARGE</span>
            <span className="success-row-val">{delivery === 0 ? "FREE" : bdt(delivery)}</span>
          </div>

          <div className="order-success-card-row">
            <span className="success-row-label">PAYMENT METHOD</span>
            <span className="success-row-val" style={{ color: "var(--emerald)", fontWeight: 800 }}>
              {payment}
            </span>
          </div>

          <div className="order-success-card-divider" />

          <div className="order-success-card-row">
            <span className="success-row-label" style={{ fontSize: 13, fontWeight: 800 }}>TOTAL PAYABLE</span>
            <span className="success-row-val success-row-val--total">{bdt(total)}</span>
          </div>

          <div className="order-success-card-row" style={{ marginTop: 8 }}>
            <span className="success-row-label">STATUS</span>
            <span className="success-status-pill">✅ RECEIVED & QUEUED</span>
          </div>
        </div>

        {/* Graphical 5-Step Order Status Stepper */}
        <OrderStatusStepper
          order={{
            id: orderId || number,
            number: number,
            wooId: wooId ? Number(wooId) : undefined,
            status: "processing",
            total: total,
            subtotal: Math.max(0, total - delivery),
            delivery: delivery,
            payment: payment,
            paymentTitle: payment,
            pathaoConsignmentId: consignment || undefined,
            pathaoTrackingUrl: trackingUrl || undefined,
            createdAt: new Date().toISOString(),
            lines: [],
            name: guestName,
            phone: guestPhone,
            address: "",
          }}
        />

        {/* Pathao Logistics Live Tracking Section */}
        {hasConsignment ? (
          <div className="pathao-tracking-success-box">
            <div className="pathao-tracking-header">
              <span className="pathao-tracking-title">🚚 PATHAO COURIER TRACKING</span>
              <span className="pathao-tracking-badge">EXPRESS</span>
            </div>
            <p className="pathao-consignment-txt">
              Consignment ID: <strong>{consignment}</strong>
            </p>
            <p className="pathao-estimate-txt">
              Estimated delivery: <strong>24–48 hours</strong> (Dhaka) / <strong>3–5 days</strong> (Outside Dhaka).
            </p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-full pathao-track-btn"
            >
              🔍 Track Live on Pathao Courier →
            </a>
          </div>
        ) : (
          <div className="dispatch-prep-box">
            <span style={{ fontSize: 24 }}>📦</span>
            <div>
              <p className="dispatch-prep-title">Preparing for Courier Dispatch</p>
              <p className="dispatch-prep-sub">
                Your garments are being inspected and packed. Your Pathao tracking link will activate once handed over to the courier.
              </p>
            </div>
          </div>
        )}

        {/* 3-Step What Happens Next Guide */}
        <div className="what-next-card">
          <h3 className="what-next-title">WHAT HAPPENS NEXT?</h3>

          <div className="what-next-step">
            <span className="what-next-num">1</span>
            <p className="what-next-desc">
              Our customer verification desk will call or SMS you shortly to confirm sizing and address details.
            </p>
          </div>

          <div className="what-next-step">
            <span className="what-next-num">2</span>
            <p className="what-next-desc">
              Your garments will be carefully quality-checked, folded in premium packaging, and handed over to Pathao.
            </p>
          </div>

          <div className="what-next-step">
            <span className="what-next-num">3</span>
            <p className="what-next-desc">
              Have cash ready (if Cash on Delivery) upon parcel hand-over at your doorstep. Inspect before payment!
            </p>
          </div>
        </div>

        {/* Guest Profile Save Prompt */}
        {isGuestOrder && !guestSaved && (
          <div className="guest-save-prompt-card">
            <h4 className="guest-save-title">Save this order to your DEEN profile?</h4>
            <p className="guest-save-sub">
              Save your details so next time DEEN greets you by name ({guestName}) and automatically remembers your addresses.
            </p>
            <div className="guest-save-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: "10px 16px", fontSize: 13, fontWeight: 800 }}
                onClick={handleSaveGuestProfile}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving…" : "Save My Profile"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "10px 16px", fontSize: 13 }}
                onClick={() => setGuestSaved(true)}
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="success-action-buttons">
          <Link href="/orders" className="btn btn-primary btn-full btn-lg">
            📋 Track My Orders & History
          </Link>
          <a
            href={`https://wa.me/88${whatsapp}?text=${encodeURIComponent(`Salam DEEN team, I just placed Order #${number} (Total: ৳${total}). Can you please confirm?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-full"
            style={{ color: "#25D366", borderColor: "rgba(37, 211, 102, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <span>💬</span> WhatsApp Order Concierge
          </a>
          <Link href="/shop" className="btn btn-ghost btn-full">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Loading order details…</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
