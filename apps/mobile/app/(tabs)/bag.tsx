import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Gift, ShieldCheck } from "../../src/components/Icons";
import { Header } from "../../src/components/Header";
import { FreeTeeBanner } from "../../src/components/Banner";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { useCart } from "../../src/context/CartContext";
import { bdt, DELIVERY_OPTIONS } from "../../src/services/gateway";
import { DeliveryArea, DeliveryOptionKey } from "../../src/types";

export default function BagScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    cart,
    updateQty,
    removeFromCart,
    subtotal,
    freeTeeEligible,
    getDeliveryFee,
    calculateTotal,
  } = useCart();

  const [selectedArea, setSelectedArea] = useState<DeliveryArea>("dhaka_standard");

  const deliveryFee = getDeliveryFee(selectedArea);
  const total = calculateTotal(selectedArea);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
        <Header title="SHOPPING BAG" showBag={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={36} color={Colors.indigo} />
          </View>
          <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
          <Text style={styles.emptySub}>
            Explore our artisanal selvedge jeans, dobby panjabis, and heavyweight tees.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopBtnText}>START SHOPPING</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      <Header title="SHOPPING BAG" showBag={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <FreeTeeBanner />

        {/* Cart Item Cards */}
        <View style={styles.itemsList}>
          {cart.map((item) => {
            const unitPrice = item.product.salePrice ?? item.product.price;
            return (
              <View key={`${item.productId}-${item.size}`} style={styles.cartCard}>
                <Image
                  source={{ uri: item.product.images[0] }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />

                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemCategory}>{item.product.category}</Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.productId, item.size)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={Colors.crimson} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>

                  <View style={styles.itemMetaRow}>
                    <View style={styles.sizeBadge}>
                      <Text style={styles.sizeBadgeText}>SIZE: {item.size}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{bdt(unitPrice)}</Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.productId, item.size, -1)}
                      >
                        <Minus size={14} color={Colors.ink} />
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.productId, item.size, 1)}
                      >
                        <Plus size={14} color={Colors.ink} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemLineTotal}>{bdt(unitPrice * item.qty)}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Complimentary Free Tee Badge if unlocked */}
          {freeTeeEligible && (
            <View style={styles.giftCard}>
              <View style={styles.giftIcon}>
                <Gift size={20} color={Colors.emerald} />
              </View>
              <View style={styles.giftInfo}>
                <Text style={styles.giftTitle}>COMPLIMENTARY GIFT ADDED</Text>
                <Text style={styles.giftName}>DEEN 240 GSM Heavyweight Tee (Size matches order)</Text>
                <Text style={styles.giftPrice}>FREE (৳850 value)</Text>
              </View>
            </View>
          )}
        </View>

        {/* Delivery Area Selector */}
        <View style={styles.areaSelectorCard}>
          <Text style={styles.areaTitle}>SELECT DELIVERY METHOD</Text>
          <View style={styles.areaGrid}>
            {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const isSelected = selectedArea === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.areaOption, isSelected && styles.areaOptionActive]}
                  onPress={() => setSelectedArea(key)}
                >
                  <View style={styles.areaOptionHeader}>
                    <Text style={[styles.areaOptionText, isSelected && styles.areaOptionTextActive]}>
                      {opt.name}
                    </Text>
                    <Text style={[styles.areaOptionFee, isSelected && styles.areaOptionFeeActive]}>
                      {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                    </Text>
                  </View>
                  <Text style={[styles.areaOptionSub, isSelected && styles.areaOptionSubActive]}>
                    {opt.estimatedDays}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text>
            <Text style={styles.summaryValue}>{bdt(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Delivery ({DELIVERY_OPTIONS[selectedArea as DeliveryOptionKey]?.name || "Standard"})
            </Text>
            <Text style={styles.summaryValue}>{deliveryFee === 0 ? "FREE" : bdt(deliveryFee)}</Text>
          </View>

          {freeTeeEligible && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.emerald }]}>
                Promotional Gift
              </Text>
              <Text style={[styles.summaryValue, { color: Colors.emerald }]}>FREE</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>{bdt(total)}</Text>
          </View>
        </View>

        <View style={styles.securityNote}>
          <ShieldCheck size={16} color={Colors.emerald} />
          <Text style={styles.securityNoteText}>
            Official DEEN checkout · Cash on delivery &amp; bKash / Nagad accepted.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalContainer}>
          <Text style={styles.bottomTotalLabel}>Total Payable</Text>
          <Text style={styles.bottomTotalAmount}>{bdt(total)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.88}
          onPress={() => router.push({ pathname: "/checkout", params: { area: selectedArea } })}
        >
          <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
          <ArrowRight size={16} color="#FFFFFF" />
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
  scrollContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.sub,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.indigo,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  shopBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  itemsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cartCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 12,
  },
  itemImage: {
    width: 84,
    height: 100,
    borderRadius: 6,
    backgroundColor: Colors.cardSecondary,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCategory: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.sub,
    letterSpacing: 0.6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
    lineHeight: 18,
  },
  itemMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeBadge: {
    backgroundColor: Colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sizeBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.indigoDark,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.sub,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.paper,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepQty: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
    minWidth: 20,
    textAlign: "center",
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  giftCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.emeraldLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.emerald,
    gap: 12,
  },
  giftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  giftInfo: {
    flex: 1,
  },
  giftTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.emerald,
    letterSpacing: 0.8,
  },
  giftName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.ink,
    marginTop: 2,
  },
  giftPrice: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.emerald,
    marginTop: 2,
  },
  areaSelectorCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  areaGrid: {
    gap: 6,
  },
  areaOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaOptionActive: {
    backgroundColor: Colors.indigoLight,
    borderColor: Colors.indigo,
  },
  areaOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaOptionText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  areaOptionTextActive: {
    color: Colors.indigoDark,
  },
  areaOptionFee: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
  },
  areaOptionFeeActive: {
    color: Colors.indigoDark,
  },
  areaOptionSub: {
    fontSize: 9,
    color: Colors.sub,
    marginTop: 2,
  },
  areaOptionSubActive: {
    color: Colors.indigoDark,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.sub,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.ink,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  securityNoteText: {
    fontSize: 11,
    color: Colors.sub,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomTotalContainer: {
    flexDirection: "column",
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: Colors.sub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomTotalAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.indigo,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 6,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
