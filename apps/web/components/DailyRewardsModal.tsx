"use client";

import React, { useState, useEffect } from "react";

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REWARDS_STORAGE_KEY = "deen_web_rewards_v1";

const REWARD_OPTIONS = [
  {
    title: "৳150 OFF Voucher",
    code: "STREAK150",
    coins: 150,
    sub: "Valid on all Selvedge Denim & Panjabis",
  },
  {
    title: "Free Express Dhaka Delivery",
    code: "FREEDHAKA",
    coins: 200,
    sub: "Save ৳150 on same-day express delivery",
  },
  {
    title: "15% OFF Japanese Selvedge",
    code: "JAPAN15",
    coins: 250,
    sub: "Exclusive 15% discount on all 13.5 oz denim",
  },
  {
    title: "+500 VIP Bonus Coins",
    code: "COIN500",
    coins: 500,
    sub: "Instantly redeemable for ৳250 checkout discount",
  },
];

export default function DailyRewardsModal({ isOpen, onClose }: DailyRewardsModalProps) {
  const [coins, setCoins] = useState(250);
  const [streak, setStreak] = useState(3);
  const [claimedToday, setClaimedToday] = useState(false);
  const [selectedReward, setSelectedReward] = useState(REWARD_OPTIONS[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const data = localStorage.getItem(REWARDS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.streak !== undefined) setStreak(parsed.streak);
        if (parsed.lastClaimDate) {
          const isToday = new Date(parsed.lastClaimDate).toDateString() === new Date().toDateString();
          setClaimedToday(isToday);
        }
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClaim = () => {
    const nextCoins = coins + 50;
    const nextStreak = claimedToday ? streak : streak + 1;
    setCoins(nextCoins);
    setStreak(nextStreak);
    setClaimedToday(true);

    try {
      localStorage.setItem(
        REWARDS_STORAGE_KEY,
        JSON.stringify({
          coins: nextCoins,
          streak: nextStreak,
          lastClaimDate: new Date().toISOString(),
        })
      );
    } catch {}
  };

  const copyVoucher = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          overflow: "hidden",
          color: "var(--ink)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Daily Rewards and Streaks"
      >
        {/* Header banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#FFFFFF",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>🎁</span>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Daily Rewards & Streaks</h3>
            </div>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>
              Check in daily to build your streak and earn VIP vouchers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--cardSecondary, rgba(255,255,255,0.04))",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--sub)", fontWeight: 700, textTransform: "uppercase" }}>
                Current Streak
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--indigo)" }}>
                🔥 {streak} Days
              </div>
            </div>
            <div
              style={{
                backgroundColor: "var(--cardSecondary, rgba(255,255,255,0.04))",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--sub)", fontWeight: 700, textTransform: "uppercase" }}>
                DEEN Coins
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#D97706" }}>
                🪙 {coins}
              </div>
            </div>
          </div>

          {/* Daily Check-in Action */}
          <div style={{ marginBottom: "20px" }}>
            <button
              type="button"
              disabled={claimedToday}
              onClick={handleClaim}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: claimedToday
                  ? "var(--border)"
                  : "linear-gradient(135deg, var(--indigo) 0%, #4338ca 100%)",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 800,
                cursor: claimedToday ? "default" : "pointer",
                boxShadow: claimedToday ? "none" : "0 4px 14px rgba(79, 70, 229, 0.35)",
              }}
            >
              {claimedToday ? "✓ Claimed Today (+50 Coins)" : "Tap to Claim Today's Bonus (+50 Coins)"}
            </button>
          </div>

          {/* Redeemable Vouchers */}
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--sub)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Available Vouchers
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {REWARD_OPTIONS.map((opt) => (
                <div
                  key={opt.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--cardSecondary, rgba(255,255,255,0.02))",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)" }}>{opt.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--sub)" }}>{opt.sub}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyVoucher(opt.code)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--indigo)",
                      background: copiedCode === opt.code ? "var(--indigo)" : "transparent",
                      color: copiedCode === opt.code ? "#FFFFFF" : "var(--indigo)",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copiedCode === opt.code ? "COPIED!" : `USE: ${opt.code}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
