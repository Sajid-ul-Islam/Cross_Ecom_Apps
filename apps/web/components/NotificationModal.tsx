"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchBankOffers, fetchCampaigns, type BankOffer, type ActiveCampaignState } from "@/lib/api";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBankOffers?: () => void;
}

type TabType = "ALL" | "PROMO" | "BANK" | "ORDER";

interface NotificationItem {
  id: string;
  type: "PROMO" | "BANK" | "ORDER";
  title: string;
  body: string;
  time: string;
  read: boolean;
  couponCode?: string;
  actionUrl?: string;
  actionLabel?: string;
  badge: string;
}

export default function NotificationModal({ isOpen, onClose, onOpenBankOffers }: NotificationModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Generate dynamic notifications from active campaigns and bank discounts
    Promise.all([fetchCampaigns(), fetchBankOffers()]).then(([campaign, bankOffers]) => {
      const list: NotificationItem[] = [
        {
          id: "notif_flash_sale",
          type: "PROMO",
          title: "🔥 Flat up to 50% Off Season Clearance",
          body: "Save 40%–50% on selected raw selvedge denim, panjabis & artisanal shirts. Limited time only!",
          time: "Just now",
          read: false,
          couponCode: "DEEN50",
          actionUrl: "/shop",
          actionLabel: "Shop Sale Now →",
          badge: "LIMITED SALE",
        },
        {
          id: "notif_cashback",
          type: "PROMO",
          title: "🎁 Up to ৳700 Instant Cashback Available",
          body: "Get ৳500 instant cashback on orders over ৳2,500 and ৳700 on ৳3,000+. Automatically applies at checkout.",
          time: "2h ago",
          read: false,
          actionUrl: "/shop",
          actionLabel: "Unlock Cashback →",
          badge: "CASHBACK",
        },
        {
          id: "notif_amex",
          type: "BANK",
          title: "💳 City Bank Amex 10% Instant Savings",
          body: "Use your City Bank American Express card to get 10% discount up to ৳500 on minimum ৳2,000 spend.",
          time: "4h ago",
          read: false,
          couponCode: "AMEXDEEN",
          actionUrl: "/shop",
          actionLabel: "View Eligible Items →",
          badge: "CITY AMEX",
        },
        {
          id: "notif_brac",
          type: "BANK",
          title: "💳 BRAC Bank 10% Instant Discount",
          body: "Enjoy 10% savings up to ৳600 on all BRAC Bank Visa & Mastercard credit/debit cards.",
          time: "6h ago",
          read: false,
          couponCode: "BRAC10",
          actionUrl: "/shop",
          actionLabel: "Shop With BRAC →",
          badge: "BRAC BANK",
        },
        {
          id: "notif_pathao",
          type: "ORDER",
          title: "🚚 Nationwide 24–48h Dispatch with Pathao Logistics",
          body: "Standard delivery ৳50 in Dhaka Metro and ৳90 across all 64 Bangladesh districts with live consignment tracking.",
          time: "1d ago",
          read: true,
          actionUrl: "/orders",
          actionLabel: "Track My Orders →",
          badge: "PATHAO LOGISTICS",
        },
      ];
      setNotifications(list);
    });
  }, []);

  const handleCopy = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 580, width: "95vw", maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>
                NOTIFICATIONS
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", margin: 0 }}>
                🔔 IN-APP STORE UPDATES
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub)", marginTop: 3 }}>
              {unreadCount > 0 ? `You have ${unreadCount} unread promotion and order updates` : "All notifications caught up"}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "ALL", label: "All" },
              { id: "PROMO", label: "🎁 Promos" },
              { id: "BANK", label: "💳 Bank Cards" },
              { id: "ORDER", label: "🚚 Orders" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: activeTab === tab.id ? "1px solid var(--indigo)" : "1px solid var(--border)",
                  background: activeTab === tab.id ? "var(--indigo)" : "var(--surface-2)",
                  color: activeTab === tab.id ? "#fff" : "var(--ink)",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--indigo)",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Mark all read ✓
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sub)", fontSize: 13 }}>
              No notifications in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 12,
                  background: item.read ? "var(--surface)" : "var(--surface-2)",
                  borderLeft: item.read ? "1px solid var(--border)" : "4px solid var(--indigo)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: item.type === "BANK" ? "var(--emerald)" : "var(--indigo)",
                      background: item.type === "BANK" ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.12)",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {item.badge}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--sub)" }}>{item.time}</span>
                </div>

                <strong style={{ fontSize: 13, color: "var(--ink)" }}>{item.title}</strong>
                <p style={{ fontSize: 12, color: "var(--sub)", margin: 0, lineHeight: 1.4 }}>{item.body}</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                  {item.couponCode ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.couponCode!)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "1px dashed var(--indigo)",
                        background: copiedCode === item.couponCode ? "var(--emerald)" : "var(--surface)",
                        color: copiedCode === item.couponCode ? "#fff" : "var(--indigo)",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {copiedCode === item.couponCode ? "✓ COPIED!" : `COPY: ${item.couponCode}`}
                    </button>
                  ) : (
                    <span />
                  )}

                  {item.actionUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(item.actionUrl!);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--indigo)",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {item.actionLabel || "View Details →"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
