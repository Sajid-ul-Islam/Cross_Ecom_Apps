"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useCart } from "@/lib/cart";
import { placeOrder, bdt, API_URL, fetchCampaigns, fetchDistricts, type ActiveCampaignState, type BdDistrict } from "@/lib/api";
import { BD_DISTRICTS } from "@/lib/districts";

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
    title: "bKash Direct / Merchant",
    description: "Pay securely via official bKash merchant gateway or send-money.",
    icon: "📱",
  },
  {
    id: "nagad",
    title: "Nagad",
    description: "Instant payment using Nagad digital financial service.",
    icon: "📲",
  },
  {
    id: "card",
    title: "Debit / Credit Card / Net Banking",
    description: "256-bit encrypted Visa, Mastercard, Amex, or bank portal.",
    icon: "💳",
  },
];

const PROFILE_STORAGE_KEY = "deen_web_user_profile";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();

  // User Profile & Guest mode
  const [isGuestMode, setIsGuestMode] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<any>(null);

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

  useEffect(() => {
    fetchCampaigns().then((data) => {
      if (data) setCampaign(data);
    });
    // Fetch districts from API (single source of truth)
    fetchDistricts().then((data) => {
      if (data.length > 0) setDistricts(data);
    });
  }, []);

  // Coupon State
  const initialCoupon = searchParams.get("coupon") || "";
  const [coupon, setCoupon] = useState(initialCoupon);
  const [couponInfo, setCouponInfo] = useState<{ code: string; type: string; amount: number; description?: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

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
  }, []);

  // Check initial coupon if passed in query
  useEffect(() => {
    if (initialCoupon) {
      applyCouponCode(initialCoupon);
    }
  }, [initialCoupon]);

  // Delivery Option calculation
  const deliveryOpt = DELIVERY_OPTIONS[selectedArea] || DELIVERY_OPTIONS.dhaka_standard;
  const deliveryFee = deliveryOpt.fee;

  // BOGO calculation on Jeans
  const jeansItems: number[] = [];
  items.forEach((it) => {
    const cat = (it.product.category || "").toUpperCase();
    if (cat === "JEANS" || cat === "DENIM") {
      const unit = it.product.salePrice ?? it.product.price;
      for (let i = 0; i < it.qty; i++) jeansItems.push(unit);
    }
  });
  jeansItems.sort((a, b) => a - b);
  const bogoPairs = Math.floor(jeansItems.length / 2);
  let bogoDiscount = 0;
  for (let i = 0; i < bogoPairs; i++) {
    bogoDiscount += Math.round(jeansItems[i] * 0.5);
  }

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
      const res = await fetch(`${API_URL}/v1/deen/coupon/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponInfo({
          code: data.code,
          type: data.type || "fixed",
          amount: data.amount,
          description: data.description || (data.type === "percent" ? `${data.amount}% OFF` : `৳${data.amount} discount`),
        });
      } else {
        setCouponInfo(null);
        setCouponError(data.message || "This coupon code is invalid or expired.");
      }
    } catch {
      // Fallback local coupon check for mock/offline resilience
      if (code === "DEEN20") {
        setCouponInfo({ code: "DEEN20", type: "percent", amount: 20, description: "20% OFF Selvedge Drop" });
      } else if (code === "DEEN100") {
        setCouponInfo({ code: "DEEN100", type: "fixed", amount: 100, description: "৳100 Welcome Discount" });
      } else {
        setCouponError("Could not verify coupon. Please check your network and try again.");
      }
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
      const orderResult = await placeOrder({
        name: name.trim(),
        phone: cleanPhoneDigits,
        email: email.trim() || undefined,
        address:
          selectedArea === "store_pickup"
            ? "DEEN Flagship Outlet, Ramzannesa Super Market, Mirpur 12, Dhaka (Store Pickup)"
            : address.trim(),
        city: selectedArea === "store_pickup" ? "Dhaka" : (city.trim() || district.name),
        district: district.code,
        state: district.code,
        postcode: "1200",
        area: selectedArea,
        payment,
        deliverySlot,
        deliveryNotes: deliveryNotes.trim() || undefined,
        coupon: couponInfo ? couponInfo.code : undefined,
        isGuestOrder: isGuestMode,
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
    <div className="container checkout-page-container" style={{ paddingBottom: 100 }}>
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
                      // Switch to registered
                      setIsGuestMode(false);
                      if (profileData) {
                        setName(profileData.name || "");
                        setPhone(profileData.phone || "");
                        setEmail(profileData.email || "");
                        setAddress(profileData.address || "");
                        if (profileData.city) setCity(profileData.city);
                      }
                    } else {
                      // Switch to guest
                      setIsGuestMode(true);
                    }
                  }}
                >
                  {isGuestMode ? "Switch to Saved Profile ↗" : "Switch to Guest Checkout"}
                </button>
              </div>

              <p className="user-mode-desc">
                {isGuestMode
                  ? "Fast 1-tap checkout without creating a password. Your order will be placed instantly."
                  : `Logged in as ${name || profileData?.name || "Customer"}. Addresses and fit preferences are auto-applied.`}
              </p>

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
                    <label className="form-label">Street Delivery Address *</label>
                    <textarea
                      className={`form-textarea ${errors.address ? "form-input--error" : ""}`}
                      placeholder="House / Flat #, Road #, Sector / Area landmark details…"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    {errors.address && <p className="form-error">{errors.address}</p>}
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

              {/* Delivery Notes */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Special Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Leave parcel with gate security, Call before arriving…"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
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
