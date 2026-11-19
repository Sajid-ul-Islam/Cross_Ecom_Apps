"use client";

import React, { useState, useEffect } from "react";

function ShieldCheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LockIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export interface WebPaymentDrawerProps {
  isOpen: boolean;
  paymentUrl: string;
  orderId: string | number;
  orderNumber: string;
  total: number;
  onSuccess: (orderId: string | number, orderNumber: string) => void;
  onClose: () => void;
  onSwitchToCod?: () => void;
}

export default function PaymentDrawer({
  isOpen,
  paymentUrl,
  orderId,
  orderNumber,
  total,
  onSuccess,
  onClose,
  onSwitchToCod,
}: WebPaymentDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setIsCompleted(false);
      // Prevent background scrolling while drawer is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Listen to postMessage from iframe if merchant portal supports postMessage handshake
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data &&
        (e.data.status === "success" ||
          e.data.type === "PAYMENT_SUCCESS" ||
          e.data.action === "order_completed")
      ) {
        setIsCompleted(true);
        setTimeout(() => onSuccess(orderId, orderNumber), 1200);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [orderId, orderNumber, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm transition-opacity">
      {/* Drawer / Modal Container */}
      <div className="w-full sm:max-w-2xl h-[92vh] sm:h-[85vh] bg-[#0d0d12] border border-[#222533] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center py-2.5">
          <div className="w-11 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#12141f] border-b border-[#1f2333]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs tracking-wider text-white uppercase">
                  DEEN Secure Payment
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <LockIcon className="w-2.5 h-2.5" />
                  256-BIT SSL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Order #{orderNumber} · ৳{Number(total).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (
                window.confirm(
                  `Cancel Payment?\n\nYour Order #${orderNumber} is reserved. You can complete payment later from My Orders or choose Cash on Delivery.`
                )
              ) {
                onClose();
              }
            }}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            aria-label="Close payment drawer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {loading && !isCompleted && (
          <div className="h-0.5 w-full bg-amber-500/20 overflow-hidden">
            <div className="h-full bg-amber-400 w-1/2 animate-pulse" />
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 relative bg-[#090a0f] flex flex-col">
          {isCompleted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
                <CheckIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Payment Confirmed!</h2>
              <p className="text-xs text-zinc-400 max-w-sm mb-6">
                Thank you! Your payment for Order #{orderNumber} has been verified. Redirecting to your order confirmation...
              </p>
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paymentUrl ? (
            <iframe
              src={paymentUrl}
              className="w-full h-full border-none bg-transparent"
              title="DEEN Secure Checkout Portal"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-zinc-400">Loading payment gateway...</p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        {!isCompleted && (
          <div className="p-3 bg-[#0d0d12] border-t border-[#1f2333] flex flex-col items-center gap-1.5 text-center">
            {onSwitchToCod && (
              <button
                type="button"
                onClick={onSwitchToCod}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Prefer Cash on Delivery?{" "}
                <span className="text-amber-400 font-medium underline">
                  Switch to COD
                </span>
              </button>
            )}
            <p className="text-[10px] text-zinc-400">
              Encrypted bank checkout. No sensitive card numbers are stored on DEEN servers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
