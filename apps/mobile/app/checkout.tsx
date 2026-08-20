import React, { useState } from "react";
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
} from "lucide-react-native";
import { Colors } from "../src/theme/colors";
import { useCart } from "../src/context/CartContext";
import { useOrders } from "../src/context/OrderContext";
import { useProfile } from "../src/context/ProfileContext";
import { bdt } from "../src/services/gateway";
import { DeliveryArea, PaymentMethod, OrderItemLine } from "../src/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ area?: string }>();
  const { cart, subtotal, freeTeeEligible, getDeliveryFee, calculateTotal, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { profile } = useProfile();

  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");
  const [area, setArea] = useState<DeliveryArea>((params.area as DeliveryArea) || profile.area || "dhaka");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const deliveryFee = getDeliveryFee(area);
  const total = calculateTotal(area);

  const handlePlaceOrder = async () => {
    if (!name.trim()) {
      setErrorMsg("Please provide your full name");
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg("Please enter a valid 11-digit Bangladeshi mobile number");
      return;
    }
    if (!address.trim() || address.trim().length < 6) {
      setErrorMsg("Please enter a detailed delivery address");
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
      }));

      // Add free promotional gift if eligible
      if (freeTeeEligible) {
        lines.push({
          productId: "dn-06",
          name: "DEEN 240 GSM Heavyweight Tee",
          sku: "DN-TSH-HVY01",
          size: profile.topSize || "L",
          qty: 1,
          unit: 0,
          gift: true,
        });
      }

      const created = await placeOrder({
        name,
        phone,
        address,
        area,
        payment,
        lines,
        subtotal,
        delivery: deliveryFee,
        total,
      });

      clearCart();
      router.replace({
        pathname: "/order-success",
        params: { orderId: created.id, orderNumber: created.number, total: String(created.total) },
      });
    } catch (e) {
      setErrorMsg("Failed to process order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={Colors.ink} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>SECURE CHECKOUT</Text>

        <View style={styles.lockBadge}>
          <Lock size={14} color={Colors.emerald} />
          <Text style={styles.lockText}>256-BIT SSL</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* 1. Recipient Details */}
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
            <Text style={styles.label}>Bangladeshi Mobile Phone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="017XX-XXXXXX"
              placeholderTextColor={Colors.faint}
            />
            <Text style={styles.helperText}>Delivery agent will call this number prior to parcel drop-off</Text>
          </View>
        </View>

        {/* 2. Delivery Address & Destination */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>2. DELIVERY ADDRESS &amp; REGION</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholder="House #, Road #, Area, City, Post Code"
              placeholderTextColor={Colors.faint}
            />
          </View>

          <Text style={[styles.label, { marginTop: 4 }]}>Delivery Zone</Text>
          <View style={styles.zoneRow}>
            <TouchableOpacity
              style={[styles.zoneOption, area === "dhaka" && styles.zoneOptionActive]}
              onPress={() => setArea("dhaka")}
            >
              <View style={styles.radioCircle}>
                {area === "dhaka" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.zoneText}>
                <Text style={styles.zoneName}>Inside Dhaka (৳70)</Text>
                <Text style={styles.zoneSub}>Delivered within 24-48 Hours</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.zoneOption, area === "outside" && styles.zoneOptionActive]}
              onPress={() => setArea("outside")}
            >
              <View style={styles.radioCircle}>
                {area === "outside" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.zoneText}>
                <Text style={styles.zoneName}>Outside Dhaka (৳130)</Text>
                <Text style={styles.zoneSub}>Delivered within 3-5 Days (Pathao/Steadfast)</Text>
              </View>
            </TouchableOpacity>
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
            <View style={styles.radioCircle}>
              {payment === "cod" && <View style={styles.radioDot} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={styles.payTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paySub}>Pay cash in hand upon receiving your parcel</Text>
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
            <View style={styles.radioCircle}>
              {payment === "bkash" && <View style={styles.radioDot} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, { color: Colors.bkash }]}>bKash Online Payment</Text>
              <Text style={styles.paySub}>Instant mobile wallet payment</Text>
            </View>
          </TouchableOpacity>

          {/* Nagad */}
          <TouchableOpacity
            style={[styles.payOption, payment === "nagad" && styles.payOptionActive]}
            onPress={() => setPayment("nagad")}
          >
            <View style={styles.radioCircle}>
              {payment === "nagad" && <View style={styles.radioDot} />}
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payTitle, { color: Colors.nagad }]}>Nagad Payment</Text>
              <Text style={styles.paySub}>Pay via Nagad digital postal wallet</Text>
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
                1x DEEN Heavyweight 240 GSM Tee (Complimentary Gift)
              </Text>
              <Text style={[styles.reviewItemPrice, { color: Colors.emerald }]}>FREE</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{bdt(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{bdt(deliveryFee)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.totalValue}>{bdt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
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
                CONFIRM ORDER ({bdt(total)})
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
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 9,
    fontWeight: "800",
    color: Colors.emerald,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  errorBanner: {
    backgroundColor: Colors.crimsonLight,
    borderWidth: 1,
    borderColor: Colors.crimson,
    padding: 10,
    borderRadius: 6,
  },
  errorText: {
    color: Colors.crimson,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 8,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  helperText: {
    fontSize: 10,
    color: Colors.faint,
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
    minHeight: 60,
    textAlignVertical: "top",
  },
  zoneRow: {
    gap: 8,
    marginTop: 6,
  },
  zoneOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  zoneOptionActive: {
    backgroundColor: Colors.indigoLight,
    borderColor: Colors.indigo,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.sub,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.indigo,
  },
  zoneText: {
    flex: 1,
  },
  zoneName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  zoneSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 10,
  },
  payOptionActive: {
    backgroundColor: Colors.indigoLight,
    borderColor: Colors.indigo,
  },
  payInfo: {
    flex: 1,
  },
  payTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  paySub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
  payTag: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.amber,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewItemName: {
    flex: 1,
    fontSize: 11,
    color: Colors.ink,
    marginRight: 8,
  },
  reviewItemPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.sub,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.ink,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  bottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.indigo,
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
