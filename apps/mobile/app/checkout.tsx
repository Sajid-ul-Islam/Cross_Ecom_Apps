import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  Check,
  Lock,
  User,
  Clock,
  MapPin,
  Sparkles,
} from "../src/components/Icons";
import { Colors } from "../src/theme/colors";
import { useTheme } from "../src/context/ThemeContext";
import { useCart } from "../src/context/CartContext";
import { useOrders } from "../src/context/OrderContext";
import { useProfile } from "../src/context/ProfileContext";
import { useRewards } from "../src/context/RewardsContext";
import { bdt, DELIVERY_OPTIONS, createGuestSession, getGuestSession } from "../src/services/gateway";
import {
  DeliveryOptionKey,
  DeliverySlot,
  PaymentMethod,
  OrderItemLine,
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
  const { cart, subtotal, freeTeeEligible, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { profile } = useProfile();
  const { coins, tierLabel, redeemCoins, earnCoins } = useRewards();

  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [address, setAddress] = useState(profile.address || "");
  const [selectedArea, setSelectedArea] = useState<DeliveryOptionKey>(
    (params.area as DeliveryOptionKey) || profile.area || "dhaka_standard"
  );
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>(profile.deliverySlot || "any");
  const [deliveryNotes, setDeliveryNotes] = useState(profile.deliveryNotes || "");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [isGuestMode, setIsGuestMode] = useState<boolean>(profile.isGuest);
  const [guestSession, setGuestSession] = useState<null | Awaited<ReturnType<typeof getGuestSession>>>(null);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const deliveryOpt = DELIVERY_OPTIONS[selectedArea] || DELIVERY_OPTIONS.dhaka_standard;
  const deliveryFee = deliveryOpt.fee;
  const maxCoinDiscount = Math.min(Math.floor(coins / 2), Math.floor(subtotal * 0.2));
  const coinDiscountBDT = redeemPoints ? maxCoinDiscount : 0;
  const total = Math.max(0, subtotal + deliveryFee - coinDiscountBDT);

  const handlePlaceOrder = async () => {
    if (!name.trim()) {
      setErrorMsg("Please provide your full name");
      return;
    }
    const digits = phone.replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(digits)) {
      setErrorMsg("Please enter a valid 11-digit BD mobile number (01XXXXXXXXX)");
      return;
    }
    if (selectedArea !== "store_pickup" && (!address.trim() || address.trim().length < 12)) {
      setErrorMsg("Please enter full delivery address (house/flat, road, area)");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      // Build order item lines
      const lines: OrderItemLine[] = cart.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        size: item.size,
        qty: item.qty,
        unit: item.product.salePrice ?? item.product.price,
        variationId: item.variationId,
      }));

      // Add promotional gift line if eligible
      if (freeTeeEligible) {
        lines.push({
          productId: "gift-tee",
          name: "Free Cotton T-shirt · Summer Fest",
          sku: "GIFT-TEE",
          size: profile.topSize || "L",
          qty: 1,
          unit: 0,
          gift: true,
        });
      }

      const created = await placeOrder({
        name: name.trim(),
        phone: digits,
        email: email.trim() || undefined,
        address: selectedArea === "store_pickup" ? "DEEN Flagship Studio, Banani, Dhaka (Store Pickup)" : address.trim(),
        area: selectedArea,
        deliveryOption: selectedArea,
        deliverySlot,
        deliveryNotes: deliveryNotes.trim() || undefined,
        payment,
        lines,
        subtotal,
        delivery: deliveryFee,
        total,
        isGuestOrder: isGuestMode,
        ...(guestSession?.token ? { guestToken: guestSession.token } : {}),
      });

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
          orderNumber: created.number,
          total: String(created.total),
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      {/* Top Header */}
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
          <Lock size={13} color={Colors.emerald} />
          <Text style={styles.lockText}>256-BIT SSL</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* User Mode Banner */}
        <View style={styles.modeCard}>
          <View style={styles.modeHeader}>
            <View
              style={[
                styles.modeTag,
                isGuestMode ? styles.modeTagGuest : styles.modeTagCustomer,
              ]}
            >
              <Text
                style={[
                  styles.modeTagText,
                  isGuestMode ? styles.modeTagTextGuest : styles.modeTagTextCustomer,
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
              <Text style={styles.modeSwitchText}>
                {isGuestMode ? "Switch to Registered" : "Switch to Guest"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modeDesc}>
            {isGuestMode
              ? "Fast checkout without creating a password. No registration required."
              : `Logged in as ${profile.name || "Member"}. Addresses and fit preferences are auto-applied.`}
          </Text>

          {/* Saved Addresses for Registered Users */}
          {!isGuestMode && profile.savedAddresses && profile.savedAddresses.length > 0 && (
            <View style={styles.savedAddressesWrap}>
              <Text style={styles.savedAddrTitle}>Select Saved Address:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedAddrList}>
                {profile.savedAddresses.map((sa) => (
                  <TouchableOpacity
                    key={sa.id}
                    style={[
                      styles.savedAddrChip,
                      address === sa.address && styles.savedAddrChipActive,
                    ]}
                    onPress={() => {
                      setAddress(sa.address);
                      if (sa.area) setSelectedArea(sa.area);
                    }}
                  >
                    <MapPin size={12} color={address === sa.address ? "#FFFFFF" : Colors.sub} />
                    <Text
                      style={[
                        styles.savedAddrChipText,
                        address === sa.address && styles.savedAddrChipTextActive,
                      ]}
                    >
                      {sa.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 1. Recipient Information */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>1. RECIPIENT INFORMATION</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tanvir Ahmed"
              placeholderTextColor={Colors.faint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bangladeshi Mobile Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="017XX-XXXXXX"
              placeholderTextColor={Colors.faint}
            />
            <Text style={styles.helperText}>
              Delivery rider will contact this number prior to arrival
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="e.g. yourname@email.com"
              placeholderTextColor={Colors.faint}
            />
          </View>
        </View>

        {/* 2. Advanced Delivery Options */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.stepTitle}>2. DELIVERY METHOD &amp; SPEED</Text>
            <Truck size={16} color={Colors.indigo} />
          </View>

          <View style={styles.deliveryGrid}>
            {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const isSelected = selectedArea === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.deliveryCard, isSelected && styles.deliveryCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedArea(key)}
                >
                  <View style={styles.radioRow}>
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.deliveryName, isSelected && styles.deliveryNameActive]}>
                          {opt.name}
                        </Text>
                        {opt.badge && (
                          <View
                            style={[
                              styles.delBadge,
                              opt.badge === "FREE" ? styles.delBadgeFree : styles.delBadgeFast,
                            ]}
                          >
                            <Text style={styles.delBadgeText}>{opt.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.deliverySub}>{opt.sub}</Text>
                    </View>
                    <Text style={[styles.deliveryFee, isSelected && styles.deliveryFeeActive]}>
                      {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Delivery Address Field (if not Store Pickup) */}
          {selectedArea !== "store_pickup" ? (
            <View style={[styles.field, { marginTop: 14 }]}>
              <Text style={styles.label}>Street Delivery Address *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                placeholder="House / Flat #, Road #, Sector / Area, District, Postcode"
                placeholderTextColor={Colors.faint}
              />
            </View>
          ) : (
            <View style={styles.pickupNotice}>
              <Text style={styles.pickupNoticeTitle}>📍 Outlet Collection Point:</Text>
              <Text style={styles.pickupNoticeText}>
                DEEN Flagship Studio, Plot 68, Kemal Ataturk Ave, Banani, Dhaka. Open 10 AM - 9 PM daily.
              </Text>
            </View>
          )}

          {/* Preferred Delivery Time Slot */}
          <Text style={[styles.label, { marginTop: 12 }]}>Preferred Delivery Time Slot</Text>
          <View style={styles.slotsRow}>
            {DELIVERY_SLOTS.map((s) => {
              const active = deliverySlot === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.slotChip, active && styles.slotChipActive]}
                  onPress={() => setDeliverySlot(s.key)}
                >
                  <Text style={[styles.slotChipLabel, active && styles.slotChipLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.slotChipTime, active && styles.slotChipTimeActive]}>
                    {s.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Delivery Notes */}
          <View style={[styles.field, { marginTop: 12 }]}>
            <Text style={styles.label}>Special Delivery Instructions (Optional)</Text>
            <TextInput
              style={styles.input}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="e.g. Leave with gate security, Call before arrival..."
              placeholderTextColor={Colors.faint}
            />
          </View>
        </View>

        {/* 3. Payment Method */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>3. PAYMENT METHOD</Text>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[styles.payOption, payment === "cod" && styles.payOptionActive]}
            onPress={() => setPayment("cod")}
          >
            <View style={styles.radioOuter}>
              {payment === "cod" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={styles.payTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paySub}>Pay cash upon receiving and inspecting your parcel</Text>
            </View>
            <View style={styles.payTag}>
              <Text style={styles.payTagText}>MOST POPULAR</Text>
            </View>
          </TouchableOpacity>

          {/* bKash */}
          <TouchableOpacity
            style={[styles.payOption, payment === "bkash" && styles.payOptionActive]}
            onPress={() => setPayment("bkash")}
          >
            <View style={styles.radioOuter}>
              {payment === "bkash" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, { color: Colors.bkash }]}>bKash Direct Pay</Text>
              <Text style={styles.paySub}>Instant mobile wallet payment</Text>
            </View>
          </TouchableOpacity>

          {/* Nagad */}
          <TouchableOpacity
            style={[styles.payOption, payment === "nagad" && styles.payOptionActive]}
            onPress={() => setPayment("nagad")}
          >
            <View style={styles.radioOuter}>
              {payment === "nagad" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, { color: Colors.nagad }]}>Nagad Postal Pay</Text>
              <Text style={styles.paySub}>Pay via Nagad digital postal gateway</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Order Summary */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>4. ORDER REVIEW</Text>

          {cart.map((item) => (
            <View key={`${item.productId}-${item.size}`} style={styles.reviewItem}>
              <Text style={styles.reviewItemName} numberOfLines={1}>
                {item.qty}x {item.product.name} ({item.size})
              </Text>
              <Text style={styles.reviewItemPrice}>
                {bdt((item.product.salePrice ?? item.product.price) * item.qty)}
              </Text>
            </View>
          ))}

          {freeTeeEligible && (
            <View style={styles.reviewItem}>
              <Text style={[styles.reviewItemName, { color: Colors.emerald }]}>
                1x Free Heavyweight 240 GSM Tee (Promotion)
              </Text>
              <Text style={[styles.reviewItemPrice, { color: Colors.emerald }]}>FREE</Text>
            </View>
          )}

          {/* 3.5 DEEN VIP Club Loyalty Point Redemption */}
          {coins > 0 && maxCoinDiscount > 0 && (
            <TouchableOpacity
              style={[styles.coinsCard, redeemPoints && styles.coinsCardActive]}
              activeOpacity={0.88}
              onPress={() => setRedeemPoints(!redeemPoints)}
            >
              <View style={styles.coinsHeader}>
                <View style={styles.coinsHeaderLeft}>
                  <Text style={styles.coinIcon}>🪙</Text>
                  <View>
                    <Text style={styles.coinsTitle}>REDEEM DEEN VIP COINS</Text>
                    <Text style={styles.coinsSub}>
                      Balance: {coins} Coins ({tierLabel})
                    </Text>
                  </View>
                </View>

                <View style={[styles.coinsCheckbox, redeemPoints && styles.coinsCheckboxActive]}>
                  {redeemPoints && <Check size={12} color="#FFFFFF" />}
                </View>
              </View>

              <Text style={styles.coinsDiscountNotice}>
                {redeemPoints
                  ? `✓ Applied ৳${coinDiscountBDT} instant checkout discount (-${coinDiscountBDT * 2} Coins)`
                  : `Redeem up to ${maxCoinDiscount * 2} Coins for ৳${maxCoinDiscount} off this order`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text>
            <Text style={styles.summaryValue}>{bdt(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery ({deliveryOpt.name})
            </Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? "FREE" : bdt(deliveryFee)}
            </Text>
          </View>

          {redeemPoints && coinDiscountBDT > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.emerald }]}>
                🪙 DEEN Coins Discount
              </Text>
              <Text style={[styles.summaryValue, { color: Colors.emerald }]}>
                -{bdt(coinDiscountBDT)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.totalValue}>{bdt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm & Place Order Footer */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: Colors.ink,
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
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lockText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  errorBanner: {
    backgroundColor: Colors.crimsonLight,
    borderWidth: 1,
    borderColor: Colors.crimson,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: Colors.crimson,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modeCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
  modeTagGuest: {
    backgroundColor: Colors.amberLight,
  },
  modeTagCustomer: {
    backgroundColor: Colors.emeraldLight,
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modeTagTextGuest: {
    color: Colors.amber,
  },
  modeTagTextCustomer: {
    color: Colors.emerald,
  },
  modeSwitchText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.indigo,
  },
  modeDesc: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
  },
  savedAddressesWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  savedAddrTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sub,
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
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  savedAddrChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  savedAddrChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.ink,
  },
  savedAddrChipTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: Colors.indigoDark,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.ink,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  deliveryGrid: {
    gap: 8,
  },
  deliveryCard: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
  },
  deliveryCardActive: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoLight,
  },
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
    borderColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.indigo,
  },
  deliveryName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  deliveryNameActive: {
    color: Colors.indigoDark,
  },
  deliverySub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
  },
  delBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  delBadgeFast: {
    backgroundColor: Colors.crimson,
  },
  delBadgeFree: {
    backgroundColor: Colors.emerald,
  },
  delBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  deliveryFee: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  deliveryFeeActive: {
    color: Colors.indigoDark,
  },
  pickupNotice: {
    backgroundColor: Colors.emeraldLight,
    borderWidth: 1,
    borderColor: Colors.emerald,
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
  },
  pickupNoticeTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.emerald,
    marginBottom: 2,
  },
  pickupNoticeText: {
    fontSize: 11,
    color: Colors.ink,
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
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  slotChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  slotChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  slotChipLabelActive: {
    color: "#FFFFFF",
  },
  slotChipTime: {
    fontSize: 9,
    color: Colors.sub,
    marginTop: 2,
  },
  slotChipTimeActive: {
    color: "#E2E8F0",
  },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  payOptionActive: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoLight,
  },
  payInfo: {
    flex: 1,
  },
  payTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
  },
  paySub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
  },
  payTag: {
    backgroundColor: Colors.indigo,
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
    color: Colors.ink,
    flex: 1,
    paddingRight: 10,
  },
  reviewItemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  coinsCard: {
    backgroundColor: Colors.indigoLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.indigo,
    marginVertical: 10,
    gap: 6,
  },
  coinsCardActive: {
    borderColor: Colors.emerald,
    backgroundColor: Colors.emeraldLight,
  },
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
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  coinsSub: {
    fontSize: 10,
    color: Colors.sub,
  },
  coinsCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  coinsCheckboxActive: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  coinsDiscountNotice: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.indigoDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
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
    color: Colors.sub,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  bottomBar: {
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  placeOrderBtn: {
    backgroundColor: Colors.indigo,
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
