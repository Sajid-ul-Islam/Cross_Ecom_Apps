import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Modal } from "react-native";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Check,
  Lock,
  MapPin,
} from "../src/components/Icons";
import { useTheme } from "../src/context/ThemeContext";
import { sharedStyles } from "../src/theme/sharedStyles";
import { ScreenShell } from "../src/components/ScreenShell";
import { useCart } from "../src/context/CartContext";
import { useOrders } from "../src/context/OrderContext";
import { useProfile } from "../src/context/ProfileContext";
import { useRewards } from "../src/context/RewardsContext";
import { bdt, DELIVERY_OPTIONS, createGuestSession, getGuestSession, fetchPaymentMethods, fetchCoupon, getCashbackAmount } from "../src/services/gateway";

import { BD_DISTRICTS, BdDistrict } from "../src/data/districts";
import {
  DeliveryOptionKey,
  DeliverySlot,
} from "../src/types";

const DELIVERY_SLOTS: { key: DeliverySlot; label: string; time: string }[] = [
  { key: "any", label: "Anytime", time: "9:00 AM – 9:00 PM" },
  { key: "morning", label: "Morning", time: "9:00 AM – 1:00 PM" },
  { key: "afternoon", label: "Afternoon", time: "1:00 PM – 6:00 PM" },
  { key: "evening", label: "Evening", time: "6:00 PM – 9:00 PM" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ area?: string }>();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const { cart, subtotal, clearCart, cashbackAmount = 0, bogoDiscount = 0 } = useCart();
  const { placeOrder } = useOrders();
  const { profile } = useProfile();
  const { coins, tierLabel, redeemCoins, earnCoins } = useRewards();
  const styles = createStyles(colors, s);

  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [district, setDistrict] = useState<BdDistrict>(
    BD_DISTRICTS.find((d) => d.code === "BD-13") || BD_DISTRICTS[0]
  );
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [address, setAddress] = useState(profile.address || "");
  const [selectedArea, setSelectedArea] = useState<DeliveryOptionKey>(
    (params.area as DeliveryOptionKey) || profile.area || "dhaka_standard"
  );
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>(profile.deliverySlot || "any");
  const [deliveryNotes, setDeliveryNotes] = useState(profile.deliveryNotes || "");
  const [payment, setPayment] = useState<string>("cod"); // Woo gateway id (cod / bkash-for-woocommerce / sslcommerz)
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; title: string; description: string; type: "cod" | "redirect" }[]>([]);
  const [trxId, setTrxId] = useState("");
  const [isGuestMode, setIsGuestMode] = useState<boolean>(profile.isGuest);
  const [guestSession, setGuestSession] = useState<null | Awaited<ReturnType<typeof getGuestSession>>>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Customer coupon (validated against Woo, exactly like the website).
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState<{ code: string; type: string; amount: number; description: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");


  // Eagerly load any persisted guest session.
  useEffect(() => {
    getGuestSession().then(setGuestSession);
  }, []);

  useEffect(() => {
    if (!profile.isGuest) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  // Source of truth: real, ENABLED payment gateways from Woo (cod / bKash / sslcommerz).
  useEffect(() => {
    fetchPaymentMethods()
      .then((m) => { if (m.length) setPaymentMethods(m); })
      .catch(() => {});
  }, []);

  const deliveryOpt = DELIVERY_OPTIONS[selectedArea] || DELIVERY_OPTIONS.dhaka_standard;
  const deliveryFee = deliveryOpt.fee;
  const maxCoinDiscount = Math.min(Math.floor(coins / 2), Math.floor(subtotal * 0.2));
  const coinDiscountBDT = redeemPoints ? maxCoinDiscount : 0;
  const cashbackBDT = cashbackAmount ?? getCashbackAmount(subtotal);
  const couponDiscountBDT = couponInfo
    ? (couponInfo.type === "percent"
        ? Math.round((subtotal * couponInfo.amount) / 100)
        : Math.min(couponInfo.amount, subtotal))
    : 0;
  const total = Math.max(
    0,
    subtotal + deliveryFee - coinDiscountBDT - cashbackBDT - (bogoDiscount || 0) - couponDiscountBDT
  );

  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetchCoupon(code);
      if (res) {
        setCouponInfo(res);
      } else {
        setCouponInfo(null);
        setCouponError("This coupon code is invalid or expired.");
      }
    } catch {
      setCouponError("Could not verify coupon. Try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!name.trim()) {
      setErrorMsg("Please provide your full name");
      return;
    }
    let digits = phone.replace(/[^0-9]/g, "");
    if (digits.startsWith("880") && digits.length === 13) {
      digits = digits.slice(2);
    }
    if (digits.length !== 11 || !digits.startsWith("0") || !/^01[3-9]\d{8}$/.test(digits)) {
      setErrorMsg("Phone number must be an 11-digit Bangladeshi mobile number starting with 0 (e.g. 01XXXXXXXXX)");
      return;
    }
    if (selectedArea !== "store_pickup" && (!address.trim() || address.trim().length < 8)) {
      setErrorMsg("Please enter full delivery address (house/flat, road, area)");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      // Build order item lines
      const lines = cart.map((i) => ({
        productId: i.productId,
        variationId: i.variationId,
        name: i.product.name,
        sku: i.product.sku,
        size: i.size,
        qty: i.qty,
        unit: i.product.salePrice ?? i.product.price,
      }));

      const created = await placeOrder({
        name: name.trim(),
        phone: digits,
        email: email.trim() || undefined,
        address: selectedArea === "store_pickup" ? "DEEN Flagship Outlet, Ramzannesa Super Market, Mirpur 12, Dhaka (Store Pickup)" : address.trim(),
        city: selectedArea === "store_pickup" ? "Dhaka" : (city.trim() || district.name),
        district: district.code,
        state: district.code,
        postcode: "1200",
        area: selectedArea,
        deliveryOption: selectedArea,
        deliverySlot,
        deliveryNotes: deliveryNotes.trim() || undefined,
        payment,
        trxId: trxId.trim() || undefined,
        coupon: couponInfo ? couponInfo.code : undefined,
        lines,
        subtotal,
        delivery: deliveryFee,
        total,
        isGuestOrder: isGuestMode,
        ...(guestSession?.token ? { guestToken: guestSession.token } : {}),
      } as any);


      // Deduct coins if redeemed & earn coins for order
      if (redeemPoints && coinDiscountBDT > 0) {
        await redeemCoins(coinDiscountBDT * 2);
      }
      await earnCoins(total, `Order #${created.number}`);

      clearCart();
      router.replace({
        pathname: "/order-success",
        params: {
          orderId: created.id,
          orderNumber: created.wooNumber || created.number,
          gatewayRef: created.number,
          total: String(created.total),
          paymentUrl: created.paymentUrl || "",
          paymentMethodId: payment,
          guestName: isGuestMode ? name.trim() : undefined,
          guestPhone: isGuestMode ? digits : undefined,
        },
      });
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to process order. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkoutNav = (
    <View style={[styles.navBar, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.iconBtn, { backgroundColor: colors.cardSecondary }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={20} color={colors.ink} />
      </TouchableOpacity>

      <Text style={[styles.navTitle, { color: colors.ink }]}>SECURE CHECKOUT</Text>

      <View style={styles.lockBadge}>
        <Lock size={13} color={colors.emerald} />
        <Text style={[styles.lockText, { color: colors.emerald }]}>256-BIT SSL</Text>
      </View>
    </View>
  );

  return (
    <ScreenShell renderNav={checkoutNav}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.crimsonLight, borderColor: colors.crimson }]}>
            <Text style={[styles.errorText, { color: colors.crimson }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* User Mode Banner */}
        <View style={[styles.modeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modeHeader}>
            <View
              style={[
                styles.modeTag,
                isGuestMode ? [styles.modeTagGuest, { backgroundColor: colors.amberLight }] : [styles.modeTagCustomer, { backgroundColor: colors.emeraldLight }],
              ]}
            >
              <Text
                style={[
                  styles.modeTagText,
                  isGuestMode ? [styles.modeTagTextGuest, { color: colors.amber }] : [styles.modeTagTextCustomer, { color: colors.emerald }],
                ]}
              >
                {isGuestMode ? "GUEST CHECKOUT" : "REGISTERED CUSTOMER"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                if (!isGuestMode) {
                  // Switching to guest: mint (or reuse) a real anonymous session
                  const sess = await createGuestSession();
                  setGuestSession(sess);
                  setName(sess.name || "");
                  setPhone(sess.phone || "");
                  setEmail("");
                  setAddress("");
                  setIsGuestMode(true);
                } else {
                  // Switching to registered: prefill from profile
                  setGuestSession(null);
                  setName(profile.name);
                  setPhone(profile.phone);
                  setEmail(profile.email || "");
                  setAddress(profile.address);
                  setIsGuestMode(false);
                }
              }}
            >
              <Text style={[styles.modeSwitchText, { color: colors.indigo }]}>
                {isGuestMode ? "Switch to Registered" : "Switch to Guest"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.modeDesc, { color: colors.sub }]}>
            {isGuestMode
              ? "Fast checkout without creating a password. No registration required."
              : `Logged in as ${profile.name || "Member"}. Addresses and fit preferences are auto-applied.`}
          </Text>

          {/* Saved Addresses for Registered Users */}
          {!isGuestMode && profile.savedAddresses && profile.savedAddresses.length > 0 && (
            <View style={styles.savedAddressesWrap}>
              <Text style={[styles.savedAddrTitle, { color: colors.sub }]}>Select Saved Address:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedAddrList}>
                {profile.savedAddresses.map((sa) => (
                  <TouchableOpacity
                    key={sa.id}
                    style={[
                      styles.savedAddrChip,
                      { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                      address === sa.address && [styles.savedAddrChipActive, { backgroundColor: colors.indigo, borderColor: colors.indigo }],
                    ]}
                    onPress={() => {
                      setAddress(sa.address);
                      if (sa.area) setSelectedArea(sa.area);
                    }}
                  >
                    <MapPin size={12} color={address === sa.address ? "#FFFFFF" : colors.sub} />
                    <Text style={[
                      styles.savedAddrChipText, { color: address === sa.address ? "#FFFFFF" : colors.ink },
                      address === sa.address && styles.savedAddrChipTextActive,
                    ]}>
                      {sa.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 1. Recipient Information */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepTitle, { color: colors.indigoDark }]}>1. RECIPIENT INFORMATION</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. First Name Last Name"
              placeholderTextColor={colors.faint}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Bangladeshi Mobile Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="017XX-XXXXXX"
              placeholderTextColor={colors.faint}
            />
            <Text style={[styles.helperText, { color: colors.sub }]}>
              Delivery rider will contact this number prior to arrival
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Email Address (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="e.g. yourname@email.com"
              placeholderTextColor={colors.faint}
            />
          </View>
        </View>

        {/* 2. Advanced Delivery Options */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[styles.stepTitle, { color: colors.indigoDark }]}>2. DELIVERY METHOD & SPEED</Text>
            <Truck size={16} color={colors.indigo} />
          </View>

          <View style={styles.deliveryGrid}>
            {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const isSelected = selectedArea === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.deliveryCard,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    isSelected && [styles.deliveryCardActive, { borderColor: colors.indigo, backgroundColor: colors.indigoLight }],
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedArea(key)}
                >
                  <View style={styles.radioRow}>
                    <View style={[styles.radioOuter, { borderColor: colors.indigo }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.indigo }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.deliveryName, { color: isSelected ? colors.indigoDark : colors.ink }]}>
                          {opt.name}
                        </Text>
                        {opt.badge && (
                          <View
                            style={[
                              styles.delBadge,
                              opt.badge === "FREE" ? [styles.delBadgeFree, { backgroundColor: colors.emerald }] : [styles.delBadgeFast, { backgroundColor: colors.crimson }],
                            ]}
                          >
                            <Text style={styles.delBadgeText}>{opt.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.deliverySub, { color: isSelected ? colors.indigoDark : colors.sub }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    <Text style={[styles.deliveryFee, { color: isSelected ? colors.indigoDark : colors.ink }]}>
                      {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Delivery Address Fields (if not Store Pickup) */}
          {selectedArea !== "store_pickup" ? (
            <View style={{ marginTop: 14, gap: 10 }}>
              {/* District / State Selector */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.ink }]}>District / State (All 64 BD Districts) *</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: colors.card,
                      borderColor: colors.indigo,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setDistrictModalOpen(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>
                    📍 {district.name} ({district.code})
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: colors.indigo }}>
                    CHANGE ▼
                  </Text>
                </TouchableOpacity>
              </View>

              {/* City / Thana Field */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.ink }]}>City / Thana / Area *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.ink }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Banani / Mirpur / Dhanmondi / Agrabad"
                  placeholderTextColor={colors.faint}
                />
              </View>

              {/* Street Address */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.ink }]}>Street Delivery Address *</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.ink }]}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  placeholder="House / Flat #, Road #, Sector / Area details..."
                  placeholderTextColor={colors.faint}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.pickupNotice, { backgroundColor: colors.emeraldLight, borderColor: colors.emerald }]}>
              <Text style={[styles.pickupNoticeTitle, { color: colors.emerald }]}>📍 Outlet Collection Point:</Text>
              <Text style={[styles.pickupNoticeText, { color: colors.ink }]}>
                DEEN Mirpur 12 Outlet, 2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216. Open 10 AM - 9:30 PM daily.
              </Text>
            </View>
          )}

          {/* Preferred Delivery Time Slot */}
          <Text style={[styles.label, { color: colors.ink, marginTop: 12 }]}>Preferred Delivery Time Slot</Text>
          <View style={styles.slotsRow}>
            {DELIVERY_SLOTS.map((s) => {
              const active = deliverySlot === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.slotChip,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    active && [styles.slotChipActive, { backgroundColor: colors.indigo, borderColor: colors.indigo }],
                  ]}
                  onPress={() => setDeliverySlot(s.key)}
                >
                  <Text style={[styles.slotChipLabel, { color: active ? "#FFFFFF" : colors.ink }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.slotChipTime, { color: active ? "#E2E8F0" : colors.sub }]}>
                    {s.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Delivery Notes */}
          <View style={[styles.field, { marginTop: 12 }]}>
            <Text style={[styles.label, { color: colors.ink }]}>Special Delivery Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="e.g. Leave with gate security, Call before arrival..."
              placeholderTextColor={colors.faint}
            />
          </View>
        </View>

        {/* 3. Payment Method — sourced from Woo (real enabled gateways) */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepTitle, { color: colors.indigoDark }]}>3. PAYMENT METHOD</Text>

          {paymentMethods.length === 0 ? (
            // Fallback while loading / if fetch fails: safe default = COD only.
            <TouchableOpacity
              style={[styles.payOption, { backgroundColor: colors.paper, borderColor: colors.border }, payment === "cod" && [styles.payOptionActive, { borderColor: colors.indigo, backgroundColor: colors.indigoLight }]]}
              onPress={() => setPayment("cod")}
            >
              <View style={[styles.radioOuter, { borderColor: colors.indigo }]}>{payment === "cod" && <View style={[styles.radioInner, { backgroundColor: colors.indigo }]} />}</View>
              <View style={styles.payInfo}>
                <Text style={[styles.payTitle, { color: colors.ink }]}>Cash on Delivery (COD)</Text>
                <Text style={[styles.paySub, { color: colors.sub }]}>Pay cash upon receiving and inspecting your parcel</Text>
              </View>
              <View style={[styles.payTag, { backgroundColor: colors.indigo }]}><Text style={styles.payTagText}>MOST POPULAR</Text></View>
            </TouchableOpacity>
          ) : (
            paymentMethods.map((m) => {
              const active = payment === m.id;
              const isCod = m.type === "cod";
              return (
                <View key={m.id}>
                  <TouchableOpacity
                    style={[styles.payOption, { backgroundColor: colors.paper, borderColor: colors.border }, active && [styles.payOptionActive, { borderColor: colors.indigo, backgroundColor: colors.indigoLight }]]}
                    onPress={() => setPayment(m.id)}
                  >
                    <View style={[styles.radioOuter, { borderColor: colors.indigo }]}>{active && <View style={[styles.radioInner, { backgroundColor: colors.indigo }]} />}</View>
                    <View style={styles.payInfo}>
                      <Text style={[styles.payTitle, { color: colors.ink }]}>{m.title}</Text>
                      {m.description ? <Text style={[styles.paySub, { color: colors.sub }]}>{m.description}</Text> : null}
                      {!isCod && <Text style={[styles.paySub, { color: colors.sub }]}>You'll be taken to the secure {m.title} page to complete payment.</Text>}
                    </View>
                    {isCod && <View style={[styles.payTag, { backgroundColor: colors.indigo }]}><Text style={styles.payTagText}>MOST POPULAR</Text></View>}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* 4. Order Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepTitle, { color: colors.indigoDark }]}>4. ORDER REVIEW</Text>

          {cart.map((item) => (
            <View key={`${item.productId}-${item.size}`} style={styles.reviewItem}>
              <Text style={[styles.reviewItemName, { color: colors.ink }]} numberOfLines={1}>
                {item.qty}x {item.product.name} ({item.size})
              </Text>
              <Text style={[styles.reviewItemPrice, { color: colors.ink }]}>
                {bdt((item.product.salePrice ?? item.product.price) * item.qty)}
              </Text>
            </View>
          ))}

          {/* 3.5 DEEN VIP Club Loyalty Point Redemption */}
          {coins > 0 && maxCoinDiscount > 0 && (
            <TouchableOpacity
              style={[
                styles.coinsCard,
                { backgroundColor: colors.indigoLight, borderColor: colors.indigo },
                redeemPoints && [styles.coinsCardActive, { borderColor: colors.emerald, backgroundColor: colors.emeraldLight }],
              ]}
              activeOpacity={0.88}
              onPress={() => setRedeemPoints(!redeemPoints)}
            >
              <View style={styles.coinsHeader}>
                <View style={styles.coinsHeaderLeft}>
                  <Text style={styles.coinIcon}>🪙</Text>
                  <View>
                    <Text style={[styles.coinsTitle, { color: colors.ink }]}>REDEEM DEEN VIP COINS</Text>
                    <Text style={[styles.coinsSub, { color: colors.sub }]}>
                      Balance: {coins} Coins ({tierLabel})
                    </Text>
                  </View>
                </View>
                <View style={[styles.coinsCheckbox, { borderColor: colors.indigo, backgroundColor: colors.paper }]}>
                  {redeemPoints && <Check size={12} color={colors.emerald} />}
                </View>
              </View>
              <Text style={[styles.coinsDiscountNotice, { color: colors.indigoDark }]}>
                {redeemPoints
                  ? `✓ Applied ৳${coinDiscountBDT} instant checkout discount (-${coinDiscountBDT * 2} Coins)`
                  : `Redeem up to ${maxCoinDiscount * 2} Coins for ৳${maxCoinDiscount} off this order`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Coupon code — customer may have a code written down, like the website */}
          <View style={[styles.couponCard, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
            <Text style={[styles.couponTitle, { color: colors.ink }]}>Have a coupon?</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.couponInput, { borderColor: couponError ? "#D14343" : colors.border, color: colors.ink, backgroundColor: colors.cardSecondary }]}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.sub}
                autoCapitalize="characters"
                value={coupon}
                editable={!couponInfo && !couponBusy}
                onChangeText={(t) => { setCoupon(t); if (couponInfo || couponError) { setCouponInfo(null); setCouponError(""); } }}
              />
              {couponInfo ? (
                <TouchableOpacity style={[styles.couponBtn, { backgroundColor: colors.emerald }]} onPress={() => { setCouponInfo(null); setCoupon(""); }}>
                  <Text style={styles.couponBtnText}>✓ REMOVE</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.couponBtn, { backgroundColor: colors.indigo }]} onPress={handleApplyCoupon} disabled={couponBusy || !coupon.trim()}>
                  <Text style={styles.couponBtnText}>{couponBusy ? "…" : "APPLY"}</Text>
                </TouchableOpacity>
              )}
            </View>
            {couponInfo && (
              <Text style={[styles.couponOk, { color: colors.emerald }]}>
                ✓ {couponInfo.code} applied{couponInfo.description ? ` — ${couponInfo.description}` : ""}
              </Text>
            )}
            {couponError ? <Text style={[styles.couponErr, { color: "#D14343" }]}>{couponError}</Text> : null}
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>
              Subtotal ({cart.length} items)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.ink }]}>{bdt(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>
              Delivery ({deliveryOpt.name})
            </Text>
            <Text style={[styles.summaryValue, { color: colors.ink }]}>
              {deliveryFee === 0 ? "FREE" : bdt(deliveryFee)}
            </Text>
          </View>

          {cashbackBDT > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.emerald, fontWeight: "700" }]}>
                🎁 Instant Cashback ({subtotal >= 3000 ? "৳700 on ৳3,000+" : "৳500 on ৳2,500+"})
              </Text>
              <Text style={[styles.summaryValue, { color: colors.emerald, fontWeight: "800" }]}>
                -{bdt(cashbackBDT)}
              </Text>
            </View>
          )}

          {redeemPoints && coinDiscountBDT > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.emerald }]}>
                🪙 DEEN Coins Discount
              </Text>
              <Text style={[styles.summaryValue, { color: colors.emerald }]}>
                -{bdt(coinDiscountBDT)}
              </Text>
            </View>
          )}

          {couponInfo && couponDiscountBDT > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.emerald }]}>
                🎟️ Coupon ({couponInfo.code})
              </Text>
              <Text style={[styles.summaryValue, { color: colors.emerald }]}>
                -{bdt(couponDiscountBDT)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.indigoDark }]}>TOTAL PAYABLE</Text>
            <Text style={[styles.totalValue, { color: colors.indigoDark }]}>{bdt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm & Place Order Footer */}
      <View style={[styles.bottomBar, { backgroundColor: colors.paper, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: colors.indigo }]}
          activeOpacity={0.88}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <ShieldCheck size={18} color="#FFFFFF" />
              <Text style={styles.placeOrderBtnText}>
                CONFIRM ORDER · {bdt(total)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* District Selection Modal */}
      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.paper,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "85%",
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink }}>
                  SELECT DISTRICT (64 DISTRICTS)
                </Text>
                <Text style={{ fontSize: 12, color: colors.sub }}>
                  Used for WooCommerce state & Pathao delivery routing
                </Text>
              </View>
              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={() => setDistrictModalOpen(false)}
              >
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.ink,
                marginBottom: 12,
              }}
              placeholder="Search district name..."
              placeholderTextColor={colors.faint}
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {BD_DISTRICTS.filter((d) =>
                d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
                d.code.toLowerCase().includes(districtSearch.toLowerCase())
              ).map((d) => {
                const isSelected = district.code === d.code;
                return (
                  <TouchableOpacity
                    key={d.code}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      backgroundColor: isSelected ? colors.indigoLight : "transparent",
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    }}
                    onPress={() => {
                      setDistrict(d);
                      if (d.code === "BD-13") {
                        setSelectedArea("dhaka_standard");
                        if (city === "Chittagong" || !city) setCity("Dhaka");
                      } else {
                        setSelectedArea("outside_standard");
                        if (city === "Dhaka" || !city) setCity(d.name);
                      }
                      setDistrictModalOpen(false);
                      setDistrictSearch("");
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? "800" : "600", color: isSelected ? colors.indigo : colors.ink }}>
                        {d.name}
                      </Text>
                      {d.code === "BD-13" && (
                        <View style={{ backgroundColor: colors.indigo, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: "#FFFFFF" }}>DHAKA ৳80</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? colors.indigo : colors.sub }}>
                      {d.code} {isSelected ? "✓" : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: any, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    navTitle: {
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    lockBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    lockText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    scrollContent: s.scrollContent,
    errorBanner: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
    },
    errorText: {
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    modeCard: {
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
    },
    modeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    modeTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    modeTagGuest: {},
    modeTagCustomer: {},
    modeTagText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    modeTagTextGuest: {},
    modeTagTextCustomer: {},
    modeSwitchText: {
      fontSize: 11,
      fontWeight: "700",
    },
    modeDesc: {
      fontSize: 11,
      lineHeight: 16,
    },
    savedAddressesWrap: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
    },
    savedAddrTitle: {
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 6,
      textTransform: "uppercase",
    },
    savedAddrList: {
      gap: 8,
    },
    savedAddrChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    savedAddrChipActive: {},
    savedAddrChipText: {
      fontSize: 11,
      fontWeight: "600",
    },
    savedAddrChipTextActive: {
      color: "#FFFFFF",
    },
    card: {
      borderRadius: 10,
      padding: 16,
      borderWidth: 1,
    },
    stepTitle: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    field: s.field,
    label: {
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 6,
    },
    helperText: {
      fontSize: 10,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
    },
    multilineInput: s.multilineInput,
    deliveryGrid: {
      gap: 8,
    },
    deliveryCard: {
      padding: 12,
      borderRadius: 8,
    },
    deliveryCardActive: {},
    radioRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    deliveryName: {
      fontSize: 12,
      fontWeight: "700",
    },
    deliveryNameActive: {},
    deliverySub: {
      fontSize: 10,
      marginTop: 2,
    },
    delBadge: {
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 3,
    },
    delBadgeFast: {},
    delBadgeFree: {},
    delBadgeText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "800",
    },
    deliveryFee: {
      fontSize: 13,
      fontWeight: "800",
    },
    deliveryFeeActive: {},
    pickupNotice: {
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      marginTop: 12,
    },
    pickupNoticeTitle: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 2,
    },
    pickupNoticeText: {
      fontSize: 11,
      lineHeight: 16,
    },
    slotsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    slotChip: {
      flex: 1,
      minWidth: "48%",
      padding: 8,
      borderWidth: 1,
      borderRadius: 6,
    },
    slotChipActive: {},
    slotChipLabel: {
      fontSize: 11,
      fontWeight: "700",
    },
    slotChipLabelActive: {
      color: "#FFFFFF",
    },
    slotChipTime: {
      fontSize: 9,
      marginTop: 2,
    },
    slotChipTimeActive: {
      color: "#E2E8F0",
    },
    payOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      gap: 10,
    },
    payOptionActive: {},
    payInfo: {
      flex: 1,
    },
    payTitle: {
      fontSize: 13,
      fontWeight: "700",
    },
    paySub: {
      fontSize: 10,
      marginTop: 2,
    },
    payTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    payTagText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "800",
    },
    reviewItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    reviewItemName: {
      fontSize: 12,
      fontWeight: "600",
      flex: 1,
      paddingRight: 10,
    },
    reviewItemPrice: {
      fontSize: 12,
      fontWeight: "700",
    },
    coinsCard: {
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      marginVertical: 10,
      gap: 6,
    },
    coinsCardActive: {},
    coinsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    coinsHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    coinIcon: {
      fontSize: 20,
    },
    coinsTitle: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    coinsSub: {
      fontSize: 10,
    },
    coinsCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    coinsCheckboxActive: {},
    coinsDiscountNotice: {
      fontSize: 10,
      fontWeight: "700",
    },
    couponCard: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    couponTitle: {
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8,
    },
    couponRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    couponInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontWeight: "600",
    },
    couponBtn: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    couponBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    couponOk: {
      fontSize: 12,
      fontWeight: "700",
      marginTop: 8,
    },
    couponErr: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 8,
    },
    summaryDivider: {
      height: 1,
      marginVertical: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 12,
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: "700",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 8,
      marginTop: 4,
      borderTopWidth: 1,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: "900",
    },
    totalValue: {
      fontSize: 16,
      fontWeight: "900",
    },
    bottomBar: {
      borderTopWidth: 1,
      padding: 16,
    },
    placeOrderBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
    },
    placeOrderBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
  });
}
