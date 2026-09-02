"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useCart } from "@/lib/cart";
import {
  placeOrder,
  bdt,
  API_URL,
  fetchCampaigns,
  fetchDistricts,
  fetchProduct,
  loginWithGoogle,
  loginWithFacebook,
  validateCoupon,
  type ActiveCampaignState,
  type BdDistrict,
  type AuthResult,
} from "@/lib/api";
import { BD_DISTRICTS } from "@/lib/districts";
import BankOffersModal from "@/components/BankOffersModal";
import SocialAuthModal from "@/components/SocialAuthModal";

interface DeliveryOption {
  id: string;
  name: string;
  sub: string;
  fee: number;
  badge?: string;
  icon: string;
}

const DELIVERY_OPTIONS: Record<string, DeliveryOption> = {
  dhaka_standard: {
    id: "dhaka_standard",
    name: "Dhaka Standard (24–48h)",
    sub: "Standard home delivery inside Dhaka metropolitan",
    fee: 50,
    badge: "STANDARD",
    icon: "🛵",
  },
  dhaka_express: {
    id: "dhaka_express",
    name: "Dhaka Express (Same-Day / 12h)",
    sub: "Priority delivery within 12–18 hours inside Dhaka",
    fee: 110,
    badge: "FAST",
    icon: "⚡",
  },
  outside: {
    id: "outside",
    name: "Outside Dhaka (3–5 days)",
    sub: "Fast express courier across all 64 BD Districts",
    fee: 90,
    badge: "REGIONAL",
    icon: "📦",
  },
  store_pickup: {
    id: "store_pickup",
    name: "Store Pickup (Mirpur 12)",
    sub: "Ready in 2h · Ramzannesa Super Market, Mirpur 12",
    fee: 0,
    badge: "FREE",
    icon: "🏪",
  },
};

const DELIVERY_SLOTS = [
  { key: "any", label: "Anytime", time: "9:00 AM – 9:00 PM" },
  { key: "morning", label: "Morning", time: "9:00 AM – 1:00 PM" },
  { key: "afternoon", label: "Afternoon", time: "1:00 PM – 6:00 PM" },
  { key: "evening", label: "Evening", time: "6:00 PM – 9:00 PM" },
];

const PAYMENT_METHODS = [
  {
    id: "cod",
    title: "Cash on Delivery (COD)",
    description: "Pay cash upon receiving and inspecting your parcel at your doorstep.",
    tag: "MOST POPULAR",
    icon: "💵",
  },
  {
    id: "bkash",
    title: "bKash Direct / Send Money",
    description: "Pay securely via bKash personal send-money with instant TrxID entry.",
    icon: "📱",
  },
  {
    id: "card",
    title: "Debit / Credit Card (SSLCommerz)",
    description: "256-bit encrypted Visa, Mastercard, Amex, or bank portal.",
    icon: "💳",
  },
];

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, addItem } = useCart();

  // User Profile & Guest mode
  const [isGuestMode, setIsGuestMode] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Auto-add product if navigating directly with ?productId=...
  useEffect(() => {
    const paramPid = searchParams.get("productId");
    const paramSize = searchParams.get("size");
    const paramQty = Number(searchParams.get("qty") || "1");
    if (paramPid && items.length === 0) {
      fetchProduct(paramPid).then((p) => {
        if (p) {
          const size = paramSize || p.sizes?.[0] || "M";
          for (let i = 0; i < paramQty; i++) addItem(p, size);
        }
      });
    }
  }, [searchParams, items.length, addItem]);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);
  const [district, setDistrict] = useState<BdDistrict>(
    BD_DISTRICTS.find((d) => d.code === "BD-13") || BD_DISTRICTS[0]
  );
  const [selectedArea, setSelectedArea] = useState<string>(
    searchParams.get("area") || "dhaka_standard"
  );
  const [deliverySlot, setDeliverySlot] = useState<string>("any");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [payment, setPayment] = useState<string>("cod");
  const [bkashNumber, setBkashNumber] = useState("");
  const [trxId, setTrxId] = useState("");

  // Gift / Separate Shipping
  const [isGift, setIsGift] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftPhone, setGiftPhone] = useState("");
  const [giftAddress, setGiftAddress] = useState("");
  const [giftCity, setGiftCity] = useState("Dhaka");
  const [giftDistrict, setGiftDistrict] = useState<BdDistrict>(
    BD_DISTRICTS.find((d) => d.code === "BD-13") || BD_DISTRICTS[0]
  );

  // Modals & UI States
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // VIP Coins & Loyalty
  const [coins] = useState<number>(450);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);

  // Campaign state from REST API
  const [campaign, setCampaign] = useState<ActiveCampaignState | null>(null);
  const [checkoutSocialProvider, setCheckoutSocialProvider] = useState<"google" | "facebook" | null>(null);

  useEffect(() => {
    fetchCampaigns().then((data) => {
      if (data) setCampaign(data);
    });
    // Fetch districts from API (single source of truth)
    fetchDistricts().then((data) => {
      if (data.length > 0) setDistricts(data);
    });
  }, []);

  // Social Login Handler directly at checkout - opens account chooser modal
  const handleSocialLoginAtCheckout = (provider: "google" | "facebook") => {
    setCheckoutSocialProvider(provider);
  };

  const handleSocialSuccessAtCheckout = (res: AuthResult) => {
    if (res.success && res.user) {
      if (res.token) {
        try {
          localStorage.setItem("deen_web_guest_token", res.token);
          localStorage.setItem("deen_web_auth_token", res.token);
        } catch {}
      }
      const updated = {
        name: res.user.name || name || "Customer",
        email: res.user.email || email,
        phone: phone || profileData?.phone || "",
        address: address || profileData?.address || "",
        district: district.code,
        city: city || "Dhaka",
        role: "customer" as const,
        isGuest: false,
      };
      setProfileData(updated);
      setIsGuestMode(false);
      setName(res.user.name || name);
      if (res.user.email) setEmail(res.user.email);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setCheckoutSocialProvider(null);
    }
  };

  // Coupon State
  const initialCoupon = searchParams.get("coupon") || "";
  const [coupon, setCoupon] = useState(initialCoupon);
  const [couponInfo, setCouponInfo] = useState<{ code: string; type: string; amount: number; description?: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [bankOffersOpen, setBankOffersOpen] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        setProfileData(p);
        if (p.isGuest === false) {
          setIsGuestMode(false);
          if (p.name) setName(p.name);
          if (p.phone) setPhone(p.phone);
          if (p.email) setEmail(p.email);
          if (p.address) setAddress(p.address);
          if (p.city) setCity(p.city);
          if (p.district) {
            const found = districts.find((d) => d.code === p.district);
            if (found) {
              setDistrict(found);
              if (found.code !== "BD-13") setSelectedArea("outside");
            }
          }
        }
      }
    } catch {}
  }, [districts]);

  // Check initial coupon if passed in query
  useEffect(() => {
    if (initialCoupon) {
      applyCouponCode(initialCoupon);
    }
  }, [initialCoupon]);

  // Delivery Option calculation
  const deliveryOpt = DELIVERY_OPTIONS[selectedArea] || DELIVERY_OPTIONS.dhaka_standard;
  const deliveryFee = deliveryOpt.fee;

  // BOGO: buy 2+ same category → cheapest is free (matches API calculateBogo)
  const bogoByCat = new Map<string, { unit: number; qty: number }[]>();
  items.forEach((it) => {
    const cat = (it.product.category || "OTHER").toUpperCase();
    const unit = it.product.salePrice ?? it.product.price;
    const existing = bogoByCat.get(cat) || [];
    existing.push({ unit, qty: it.qty });
    bogoByCat.set(cat, existing);
  });
  let bogoDiscount = 0;
  Array.from(bogoByCat.values()).forEach((catItems) => {
    if (catItems.length < 2) return;
    let cheapestIdx = 0;
    for (let i = 1; i < catItems.length; i++) {
      if (catItems[i].unit < catItems[cheapestIdx].unit) cheapestIdx = i;
    }
    bogoDiscount += catItems[cheapestIdx].unit * catItems[cheapestIdx].qty;
  });

  // Instant Cashback Tiers — ONLY if enabled in the REST API
  const isCashbackActive = campaign?.cashback?.enabled ?? false;
  const tier1Min = campaign?.cashback?.tier1?.minSpend ?? 2500;
  const tier1Amt = campaign?.cashback?.tier1?.amount ?? 500;
  const tier2Min = campaign?.cashback?.tier2?.minSpend ?? 3000;
  const tier2Amt = campaign?.cashback?.tier2?.amount ?? 700;

  const cashbackBDT = isCashbackActive
    ? subtotal >= tier2Min
      ? tier2Amt
      : subtotal >= tier1Min
      ? tier1Amt
      : 0
    : 0;

  // Coins Discount (up to 20% of subtotal or half of coin balance)
  const maxCoinDiscount = Math.min(Math.floor(coins / 2), Math.floor(subtotal * 0.2));
  const coinDiscountBDT = redeemPoints ? maxCoinDiscount : 0;

  // Coupon Discount
  const couponDiscountBDT = couponInfo
    ? couponInfo.type === "percent"
      ? Math.round((subtotal * couponInfo.amount) / 100)
      : Math.min(couponInfo.amount, subtotal)
    : 0;

  // Total Calculation
  const total = Math.max(
    0,
    subtotal + deliveryFee - cashbackBDT - bogoDiscount - coinDiscountBDT - couponDiscountBDT
  );

  // Validate Bangladeshi phone number inline
  const cleanPhoneDigits = useMemo(() => {
    let digits = phone.replace(/[^0-9]/g, "");
    if (digits.startsWith("880") && digits.length === 13) {
      digits = digits.slice(2);
    }
    return digits;
  }, [phone]);

  const isPhoneValid = useMemo(() => {
    return cleanPhoneDigits.length === 11 && cleanPhoneDigits.startsWith("01") && /^01[3-9]\d{8}$/.test(cleanPhoneDigits);
  }, [cleanPhoneDigits]);

  // Handle District selection
  const handleSelectDistrict = (d: BdDistrict) => {
    setDistrict(d);
    if (d.code === "BD-13") {
      setSelectedArea("dhaka_standard");
      if (city === "Chittagong" || !city) setCity("Dhaka");
    } else {
      setSelectedArea("outside");
      if (city === "Dhaka" || !city) setCity(d.name);
    }
    setDistrictModalOpen(false);
    setDistrictSearch("");
  };

  // Coupon verification
  const applyCouponCode = async (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const data = await validateCoupon(code);
      if (data.valid) {
        setCouponInfo({
          code: data.code || code,
          type: data.type || "fixed",
          amount: data.amount || 0,
          description: data.description || (data.type === "percent" ? `${data.amount}% OFF` : `৳${data.amount} discount`),
        });
      } else {
        setCouponInfo(null);
        setCouponError(data.message || "This coupon code is invalid or expired.");
      }
    } catch {
      setCouponError("Could not verify coupon. Please check your network and try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const handleValidateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!isPhoneValid) {
      errs.phone = "Must be an 11-digit Bangladeshi mobile number starting with 01 (e.g. 01XXXXXXXXX)";
    }
    if (selectedArea !== "store_pickup" && (!address.trim() || address.trim().length < 8)) {
      errs.address = "Full delivery address required (house #, road #, sector/area)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidateForm()) return;
    if (items.length === 0) {
      router.push("/shop");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const isManualMfs = payment.includes("bkash");

      if (isManualMfs) {
        if (!bkashNumber.trim() || !trxId.trim()) {
          setApiError("Please enter your bKash mobile number and Transaction ID (TrxID).");
          setLoading(false);
          return;
        }
      }

      const finalDeliveryNotes = isManualMfs
        ? `[bKash Payment]\nSender Phone: ${bkashNumber.trim()}\nTrxID: ${trxId.trim()}\n${deliveryNotes.trim()}`
        : deliveryNotes.trim();

      const orderResult = await placeOrder({
        name: isGift ? (giftName.trim() || name.trim()) : name.trim(),
        phone: isGift ? (giftPhone.replace(/[^0-9]/g, "").slice(-11) || cleanPhoneDigits) : cleanPhoneDigits,
        email: email.trim() || undefined,
        address:
          selectedArea === "store_pickup"
            ? "DEEN Flagship Outlet, Ramzannesa Super Market, Mirpur 12, Dhaka (Store Pickup)"
            : isGift ? giftAddress.trim() : address.trim(),
        city: selectedArea === "store_pickup" ? "Dhaka" : isGift ? (giftCity.trim() || giftDistrict.name) : (city.trim() || district.name),
        district: isGift ? giftDistrict.code : district.code,
        state: isGift ? giftDistrict.code : district.code,
        postcode: "1200",
        area: selectedArea,
        payment,
        trxId: trxId.trim() || undefined,
        deliverySlot,
        deliveryNotes: finalDeliveryNotes || undefined,
        customerNote: finalDeliveryNotes || undefined,
        coupon: couponInfo ? couponInfo.code : undefined,
        isGuestOrder: isGuestMode,
        isGiftOrder: isGift,
        giftRecipientName: isGift ? giftName.trim() : undefined,
        giftRecipientPhone: isGift ? giftPhone.replace(/[^0-9]/g, "").slice(-11) : undefined,
        items: items.map((i) => ({
          productId: i.product.id,
          size: i.size,
          qty: i.qty,
        })),
      });

      clearCart();
      router.push(
        `/order-success?id=${orderResult.id}&number=${orderResult.number}&total=${orderResult.total}&wooId=${orderResult.wooId || ""}&delivery=${orderResult.delivery}&payment=${encodeURIComponent(orderResult.paymentTitle || orderResult.payment)}&consignment=${orderResult.pathaoConsignmentId || ""}&tracking=${encodeURIComponent(orderResult.pathaoTrackingUrl || "")}&guestName=${encodeURIComponent(isGuestMode ? name.trim() : "")}&guestPhone=${encodeURIComponent(isGuestMode ? cleanPhoneDigits : "")}`
      );
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Order failed. Please try again.";
      setApiError(msg);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ padding: "120px 24px" }}>
          <div className="empty-state__icon">🛒</div>
          <h2 className="empty-state__title">Your bag is empty</h2>
          <p className="empty-state__sub">Add selvedge jeans, shirts, or accessories before proceeding.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page-container" style={{ paddingBottom: 140 }}>
      {/* Top Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 700 }}>Secure Checkout</span>
      </nav>

      {/* Checkout Header Bar */}
      <div className="checkout-top-header">
        <div className="checkout-top-left">
          <Link href="/cart" className="checkout-back-link">
            ← Back to Cart
          </Link>
          <h1 className="checkout-page-title">SECURE CHECKOUT</h1>
        </div>
        <div className="checkout-ssl-pill">
          <span className="ssl-lock-icon">🔒</span>
          <span className="ssl-lock-text">256-BIT SSL ENCRYPTION</span>
        </div>
      </div>

      {apiError && (
        <div className="alert alert--error" style={{ marginBottom: 20 }}>
          <strong>⚠️ Checkout Error:</strong> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="checkout-layout-grid">
          {/* LEFT COLUMN: Stepped Checkout Form */}
          <div className="checkout-steps-column">
            {/* User Identity Mode Card */}
            <div className="checkout-step-card checkout-user-mode-card">
              <div className="user-mode-header">
                <span className={`user-mode-badge ${isGuestMode ? "user-mode-badge--guest" : "user-mode-badge--customer"}`}>
                  {isGuestMode ? "🛍️ GUEST CHECKOUT" : "💎 REGISTERED CUSTOMER"}
                </span>
                <button
                  type="button"
                  className="user-mode-switch-btn"
                  onClick={() => {
                    if (isGuestMode) {
                      setIsGuestMode(false);
                      if (profileData) {
                        setName(profileData.name || "");
                        setPhone(profileData.phone || "");
                        setEmail(profileData.email || "");
                        setAddress(profileData.address || "");
                        if (profileData.city) setCity(profileData.city);
                      }
                    } else {
                      setIsGuestMode(true);
                    }
                  }}
                >
                  {isGuestMode ? "Switch to Saved Profile ↗" : "Switch to Guest Checkout"}
                </button>
              </div>

              <p className="user-mode-desc">
                {isGuestMode
                  ? "Fast 1-tap checkout without creating a password. Or link your Google/Facebook account for automatic order tracking."
                  : `Logged in as ${name || profileData?.name || "Customer"}. Addresses and fit preferences are auto-applied.`}
              </p>

              {/* 1-Tap Google & Facebook Checkout */}
              {isGuestMode && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>
                      ⚡ EXPRESS 1-TAP SOCIAL SIGN IN
                    </span>
                    <span style={{ fontSize: 11, color: "var(--sub)" }}>
                      Syncs past orders & rewards
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleSocialLoginAtCheckout("google")}
                      disabled={socialLoading !== null}
                      style={{
                        background: "var(--surface)",
                        color: "var(--ink)",
                        border: "1.5px solid var(--border)",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      {socialLoading === "google" ? "Signing In…" : "Continue with Google"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleSocialLoginAtCheckout("facebook")}
                      disabled={socialLoading !== null}
                      style={{
                        background: "#1877F2",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      {socialLoading === "facebook" ? "Signing In…" : "Continue with Facebook"}
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Address Chips for Registered Users */}
              {!isGuestMode && profileData?.address && (
                <div className="saved-addr-chips-wrap">
                  <span className="saved-addr-title">Quick Fill Address:</span>
                  <button
                    type="button"
                    className={`saved-addr-chip ${address === profileData.address ? "saved-addr-chip--active" : ""}`}
                    onClick={() => {
                      setAddress(profileData.address);
                      if (profileData.city) setCity(profileData.city);
                      if (profileData.district) {
                        const found = districts.find((d) => d.code === profileData.district);
                        if (found) handleSelectDistrict(found);
                      }
                    }}
                  >
                    📍 Primary Saved Address
                  </button>
                </div>
              )}
            </div>

            {/* Step 1: Recipient Information */}
            <div className="checkout-step-card">
              <h2 className="step-card-title">1. RECIPIENT INFORMATION</h2>

              <div className="step-fields-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? "form-input--error" : ""}`}
                    placeholder="e.g. Tanvir Ahmed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="form-error">{errors.name}</p>}
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Bangladeshi Mobile Number *</label>
                    {phone.trim().length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: isPhoneValid ? "var(--emerald)" : "var(--crimson)" }}>
                        {isPhoneValid ? "✓ Valid 11-digit BD number" : "11 digits required"}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    className={`form-input ${
                      phone.trim().length > 0
                        ? isPhoneValid
                          ? "form-input--success"
                          : "form-input--error"
                        : ""
                    }`}
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {errors.phone ? (
                    <p className="form-error">{errors.phone}</p>
                  ) : (
                    <p className="form-helper">Delivery rider will call/SMS this number before parcel arrival.</p>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Email Address (Optional for e-invoice)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Send as a Gift Toggle */}
              <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => {
                      setIsGift(e.target.checked);
                      if (!e.target.checked) {
                        setGiftName("");
                        setGiftPhone("");
                        setGiftAddress("");
                        setGiftCity("Dhaka");
                        setGiftDistrict(BD_DISTRICTS.find((d) => d.code === "BD-13") || BD_DISTRICTS[0]);
                      }
                    }}
                    style={{ width: 18, height: 18, accentColor: "var(--indigo)" }}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>🎁 Send as a Gift</span>
                    <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>
                      Different shipping name & address for the recipient?
                    </p>
                  </div>
                </label>
              </div>

              {/* Gift Shipping Fields (shown when Send as Gift is checked) */}
              {isGift && (
                <div style={{ marginTop: 16, padding: 16, background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1.5px solid var(--denim-stitch)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: "var(--denim-stitch)", marginBottom: 14, letterSpacing: 0.5 }}>
                    🎁 GIFT RECIPIENT DETAILS
                  </h3>
                  <div className="step-fields-grid">
                    <div className="form-group">
                      <label className="form-label">Recipient Full Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Rahim Ahmed"
                        value={giftName}
                        onChange={(e) => setGiftName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Recipient Phone *</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="01XXXXXXXXX"
                        value={giftPhone}
                        onChange={(e) => setGiftPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label className="form-label">Gift Shipping Address *</label>
                      <textarea
                        className="form-textarea"
                        placeholder="House / Flat #, Road #, Sector / Area details for the recipient…"
                        value={giftAddress}
                        onChange={(e) => setGiftAddress(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City / Thana *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Banani, Mirpur"
                        value={giftCity}
                        onChange={(e) => setGiftCity(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <select
                        className="form-select"
                        value={giftDistrict.code}
                        onChange={(e) => {
                          const found = districts.find((d) => d.code === e.target.value);
                          if (found) setGiftDistrict(found);
                        }}
                      >
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 10 }}>
                    💡 The billing address above is used for payment. This shipping address is for the gift parcel delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Method & Speed */}
            <div className="checkout-step-card">
              <div className="step-card-header-row">
                <h2 className="step-card-title">2. DELIVERY METHOD & SPEED</h2>
                <span className="step-icon-badge">🚚</span>
              </div>

              {/* Delivery Speed Radio Cards */}
              <div className="delivery-method-grid">
                {Object.values(DELIVERY_OPTIONS).map((opt) => {
                  const isSelected = selectedArea === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`delivery-card-tile ${isSelected ? "delivery-card-tile--selected" : ""}`}
                      onClick={() => setSelectedArea(opt.id)}
                    >
                      <div className="delivery-card-radio">
                        <div className={`radio-circle ${isSelected ? "radio-circle--selected" : ""}`} />
                      </div>
                      <div className="delivery-card-info">
                        <div className="delivery-card-title-row">
                          <span className="delivery-card-name">
                            {opt.icon} {opt.name}
                          </span>
                          {opt.badge && (
                            <span className={`del-badge del-badge--${opt.badge.toLowerCase()}`}>
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="delivery-card-sub">{opt.sub}</p>
                      </div>
                      <span className="delivery-card-fee">
                        {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Address Fields (if not Store Pickup) */}
              {selectedArea !== "store_pickup" ? (
                <div className="delivery-address-form" style={{ marginTop: 20 }}>
                  {/* Interactive District Modal Trigger */}
                  <div className="form-group">
                    <label className="form-label">District / State (All 64 BD Districts) *</label>
                    <button
                      type="button"
                      className="district-select-btn"
                      onClick={() => setDistrictModalOpen(true)}
                    >
                      <span className="district-select-val">
                        📍 {district.name} ({district.code})
                      </span>
                      <span className="district-select-change">CHANGE DISTRICT ▼</span>
                    </button>
                    <p className="form-helper">
                      WooCommerce state routing & Pathao automatic dispatch enabled.
                    </p>
                  </div>

                  {/* City / Thana */}
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">City / Thana / Area *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Banani, Mirpur, Dhanmondi, Agrabad…"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  {/* Street Address */}
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">Full Street Delivery Address *</label>
                    <textarea
                      rows={3}
                      className={`form-textarea ${errors.address ? "form-input--error" : ""}`}
                      placeholder="House/Flat number, Road number, Sector/Block, Area or nearby landmark (e.g. House 14, Road 5, Block C, Mirpur 12)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ width: "100%", minHeight: 76, padding: "10px 14px", fontSize: 13, lineHeight: 1.5, resize: "vertical" }}
                    />
                    {errors.address ? (
                      <p className="form-error">{errors.address}</p>
                    ) : (
                      <p className="form-helper">Full address helps our courier deliver swiftly without delays.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="store-pickup-banner" style={{ marginTop: 20 }}>
                  <div className="pickup-banner-header">
                    <span>📍 Outlet Collection Point:</span>
                  </div>
                  <p className="pickup-banner-text">
                    <strong>DEEN Mirpur 12 Outlet:</strong> 2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216.
                    <br />
                    Open 10:00 AM – 9:30 PM daily. Parcel will be ready for pickup in 2 hours.
                  </p>
                </div>
              )}

              {/* Delivery Time Slot Picker */}
              <div className="delivery-slots-section" style={{ marginTop: 20 }}>
                <label className="form-label">Preferred Delivery Time Slot</label>
                <div className="delivery-slots-grid">
                  {DELIVERY_SLOTS.map((s) => {
                    const active = deliverySlot === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        className={`delivery-slot-chip ${active ? "delivery-slot-chip--active" : ""}`}
                        onClick={() => setDeliverySlot(s.key)}
                      >
                        <span className="slot-label">{s.label}</span>
                        <span className="slot-time">{s.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Notes / Customer Special Instructions */}
              <div className="form-group" style={{ marginTop: 18, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>📝 Customer Order Note / Special Instructions (Optional)</span>
                  <span style={{ fontSize: 11, color: "var(--sub)" }}>Optional</span>
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="e.g. Please call before arrival, leave with apartment security, or deliver after 3:00 PM…"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  style={{ width: "100%", marginTop: 6, minHeight: 52, padding: "8px 12px", fontSize: 12.5, lineHeight: 1.4, resize: "vertical" }}
                />
                <p className="form-helper" style={{ marginTop: 4 }}>
                  Passed directly to our dispatch and courier team.
                </p>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="checkout-step-card">
              <h2 className="step-card-title">3. PAYMENT METHOD</h2>

              <div className="payment-options-grid">
                {PAYMENT_METHODS.map((m) => {
                  const active = payment === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`payment-method-card ${active ? "payment-method-card--active" : ""}`}
                      onClick={() => setPayment(m.id)}
                    >
                      <div className="pay-card-top">
                        <div className="pay-card-left">
                          <div className={`radio-circle ${active ? "radio-circle--selected" : ""}`} />
                          <span className="pay-card-title">
                            {m.icon} {m.title}
                          </span>
                        </div>
                        {m.tag && <span className="pay-popular-tag">{m.tag}</span>}
                      </div>
                      <p className="pay-card-desc">{m.description}</p>
                    </div>
                  );
                })}
              </div>

              {payment === "cod" ? (
                <div className="payment-info-box" style={{ marginTop: 16 }}>
                  <p className="payment-info-title">💵 Cash on Delivery Verified</p>
                  <p className="payment-info-sub">
                    You can pay the full amount of <strong>{bdt(total)}</strong> in cash when the courier hands over the parcel. Zero advance payment required!
                  </p>
                </div>
              ) : payment.includes("bkash") ? (
                <div className="payment-info-box" style={{ marginTop: 16, background: "var(--indigo-light)", borderColor: "var(--indigo)" }}>
                  <p className="payment-info-title" style={{ color: "var(--ink)" }}>📱 Manual bKash Send Money</p>
                  <p className="payment-info-sub" style={{ marginBottom: 12, lineHeight: 1.6 }}>
                    1. Go to your bKash Menu/App & select <strong>Send Money</strong>.<br/>
                    2. Send <strong>{bdt(total)}</strong> to <strong>01952 700 500</strong> (Personal).<br/>
                    3. Enter your bKash number and Transaction ID (TrxID) below:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Your bKash Number (e.g. 017XXXXXXXX)"
                      value={bkashNumber}
                      onChange={(e) => setBkashNumber(e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="text"
                      placeholder="bKash Transaction ID (TrxID)"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="payment-info-box" style={{ marginTop: 16 }}>
                  <p className="payment-info-title">🔒 Digital Merchant Processing</p>
                  <p className="payment-info-sub">
                    After confirming your order, you will be redirected to the secure gateway to complete payment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Order Review & Pricing Summary */}
          <div className="checkout-summary-column">
            <div className="checkout-summary-card">
              <h3 className="summary-card-title">4. ORDER REVIEW</h3>

              {/* Itemized list */}
              <div className="checkout-items-list">
                {items.map((item) => {
                  const unitPrice = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={`${item.product.id}-${item.size}`} className="checkout-item-row">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="checkout-item-img"
                        />
                      ) : (
                        <div className="checkout-item-img-placeholder">👖</div>
                      )}
                      <div className="checkout-item-details">
                        <p className="checkout-item-name">{item.product.name}</p>
                        <p className="checkout-item-meta">
                          Size: <strong>{item.size}</strong> · Qty: {item.qty}
                        </p>
                      </div>
                      <span className="checkout-item-total">{bdt(unitPrice * item.qty)}</span>
                    </div>
                  );
                })}
              </div>

              {/* DEEN VIP Loyalty Coins Redemption Card */}
              {coins > 0 && maxCoinDiscount > 0 && (
                <div
                  className={`vip-coins-card ${redeemPoints ? "vip-coins-card--active" : ""}`}
                  onClick={() => setRedeemPoints(!redeemPoints)}
                >
                  <div className="vip-coins-top">
                    <div className="vip-coins-left">
                      <span className="coin-emoji">🪙</span>
                      <div>
                        <p className="vip-coins-title">REDEEM DEEN VIP COINS</p>
                        <p className="vip-coins-balance">Balance: {coins} Coins (Gold Member)</p>
                      </div>
                    </div>
                    <div className={`coins-checkbox ${redeemPoints ? "coins-checkbox--checked" : ""}`}>
                      {redeemPoints ? "✓" : ""}
                    </div>
                  </div>
                  <p className="vip-coins-notice">
                    {redeemPoints
                      ? `✓ Applied ৳${coinDiscountBDT} instant checkout discount (-${coinDiscountBDT * 2} Coins)`
                      : `Redeem up to ${maxCoinDiscount * 2} Coins for ৳${maxCoinDiscount} off this order`}
                  </p>
                </div>
              )}

              {/* Coupon Entry Section */}
              <div className="checkout-coupon-card">
                <p className="coupon-card-label">Have a coupon code?</p>
                <div className="coupon-input-row">
                  <input
                    type="text"
                    className="coupon-text-input"
                    placeholder="Enter coupon code (e.g. DEEN20)"
                    value={coupon}
                    disabled={couponBusy || Boolean(couponInfo)}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      if (couponInfo || couponError) {
                        setCouponInfo(null);
                        setCouponError("");
                      }
                    }}
                  />
                  {couponInfo ? (
                    <button
                      type="button"
                      className="coupon-action-btn coupon-action-btn--remove"
                      onClick={() => {
                        setCouponInfo(null);
                        setCoupon("");
                      }}
                    >
                      REMOVE
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="coupon-action-btn"
                      disabled={couponBusy || !coupon.trim()}
                      onClick={() => applyCouponCode(coupon)}
                    >
                      {couponBusy ? "…" : "APPLY"}
                    </button>
                  )}
                </div>
                {couponInfo && (
                  <p className="coupon-success-msg">
                    ✓ {couponInfo.code} applied — {couponInfo.description} (-{bdt(couponDiscountBDT)})
                  </p>
                )}
                {couponError && <p className="coupon-error-msg">✕ {couponError}</p>}

                {/* Partner Bank Coupons Quick Select */}
                {!couponInfo && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--sub)", fontWeight: 700 }}>💳 Partner Bank Offers:</span>
                      <button
                        type="button"
                        onClick={() => setBankOffersOpen(true)}
                        style={{ background: "transparent", border: "none", color: "var(--indigo)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                      >
                        View All →
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { code: "AMEXDEEN", label: "City Amex 10%" },
                        { code: "BRAC10", label: "BRAC 10%" },
                        { code: "EBLDEEN", label: "EBL 10%" },
                        { code: "SCBDEEN", label: "SCB 15%" },
                        { code: "BKASH10", label: "bKash 10%" },
                      ].map((chip) => (
                        <button
                          key={chip.code}
                          type="button"
                          onClick={() => {
                            setCoupon(chip.code);
                            applyCouponCode(chip.code);
                          }}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--ink)",
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {chip.label} ({chip.code})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="price-breakdown-table">
                <div className="price-breakdown-row">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{bdt(subtotal)}</span>
                </div>

                <div className="price-breakdown-row">
                  <span>Delivery ({deliveryOpt.name})</span>
                  <span style={{ fontWeight: 700, color: "var(--indigo)" }}>
                    {deliveryFee === 0 ? "FREE" : bdt(deliveryFee)}
                  </span>
                </div>

                {cashbackBDT > 0 && (
                  <div className="price-breakdown-row price-breakdown-row--discount">
                    <span>🎁 Instant Cashback ({subtotal >= tier2Min ? `৳${tier2Amt} Tier` : `৳${tier1Amt} Tier`})</span>
                    <span>-{bdt(cashbackBDT)}</span>
                  </div>
                )}

                {bogoDiscount > 0 && (
                  <div className="price-breakdown-row price-breakdown-row--discount">
                    <span>🔥 BOGO Selvedge 50% Off</span>
                    <span>-{bdt(bogoDiscount)}</span>
                  </div>
                )}

                {redeemPoints && coinDiscountBDT > 0 && (
                  <div className="price-breakdown-row price-breakdown-row--discount">
                    <span>🪙 DEEN VIP Coins Discount</span>
                    <span>-{bdt(coinDiscountBDT)}</span>
                  </div>
                )}

                {couponInfo && couponDiscountBDT > 0 && (
                  <div className="price-breakdown-row price-breakdown-row--discount">
                    <span>🎟️ Coupon ({couponInfo.code})</span>
                    <span>-{bdt(couponDiscountBDT)}</span>
                  </div>
                )}

                <div className="price-breakdown-total-row">
                  <span>TOTAL PAYABLE</span>
                  <span className="price-total-val">{bdt(total)}</span>
                </div>
              </div>

              {/* Pathao Express Banner */}
              <div className="pathao-express-banner">
                <div className="pathao-badge-row">
                  <span className="pathao-badge-title">🚚 PATHAO COURIER DISPATCH</span>
                  <span className="pathao-badge-tag">EXPRESS</span>
                </div>
                <p className="pathao-badge-text">
                  Direct API integration with real-time SMS alerts and GPS live courier tracking upon dispatch.
                </p>
              </div>

              {/* Desktop Submit Button */}
              <div className="desktop-submit-wrap">
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg checkout-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="submit-spinner-text">Placing Order…</span>
                  ) : (
                    <span>
                      {payment === "cod"
                        ? `PLACE CASH ON DELIVERY ORDER · ${bdt(total)}`
                        : `PROCEED TO PAYMENT · ${bdt(total)}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY MOBILE ACTION BAR */}
        <div className="mobile-sticky-checkout-bar">
          <div className="mobile-bar-total-col">
            <span className="mobile-bar-total-lbl">Total Payable</span>
            <span className="mobile-bar-total-val">{bdt(total)}</span>
          </div>
          <button
            type="submit"
            className="mobile-bar-submit-btn"
            disabled={loading}
          >
            {loading ? (
              "Placing…"
            ) : payment === "cod" ? (
              `PLACE COD ORDER · ${bdt(total)}`
            ) : (
              `PAY NOW · ${bdt(total)}`
            )}
          </button>
        </div>
      </form>

      {/* 64 BD DISTRICT SELECTION MODAL */}
      {districtModalOpen && (
        <div className="modal-overlay" onClick={() => setDistrictModalOpen(false)}>
          <div className="district-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="district-modal-header">
              <div>
                <h3 className="district-modal-title">SELECT DISTRICT (64 DISTRICTS)</h3>
                <p className="district-modal-sub">
                  Used for WooCommerce state mapping & Pathao delivery routing
                </p>
              </div>
              <button
                type="button"
                className="district-modal-close"
                onClick={() => setDistrictModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="district-search-wrap">
              <input
                type="text"
                className="district-search-input"
                placeholder="Search district name or code (e.g. Dhaka, BD-13)…"
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* District List Scrollable */}
            <div className="district-list-scroll">
              {districts.filter(
                (d) =>
                  d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
                  d.code.toLowerCase().includes(districtSearch.toLowerCase())
              ).map((d) => {
                const isSelected = district.code === d.code;
                return (
                  <div
                    key={d.code}
                    className={`district-list-item ${isSelected ? "district-list-item--selected" : ""}`}
                    onClick={() => handleSelectDistrict(d)}
                  >                      <div className="district-item-left">
                      <span className="district-name-text">{d.name}</span>
                    </div>
                    <span className="district-code-text">
                      {d.code} {isSelected ? "✓" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bank & Card Offers Modal */}
      <BankOffersModal
        isOpen={bankOffersOpen}
        onClose={() => setBankOffersOpen(false)}
      />

      {/* Social Auth Pop-Up Modal */}
      <SocialAuthModal
        isOpen={Boolean(checkoutSocialProvider)}
        provider={checkoutSocialProvider || "google"}
        onClose={() => setCheckoutSocialProvider(null)}
        onSuccess={handleSocialSuccessAtCheckout}
        currentEmailHint={email || profileData?.email}
        currentNameHint={name || profileData?.name}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Loading secure checkout…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
