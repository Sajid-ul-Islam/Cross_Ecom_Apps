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

import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Gift, ShieldCheck } from "../../src/components/Icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { CashbackBanner } from "../../src/components/Banner";
import { useTheme } from "../../src/context/ThemeContext";
import { useCart } from "../../src/context/CartContext";
import { bdt, DELIVERY_OPTIONS } from "../../src/services/gateway";
import { DeliveryArea, DeliveryOptionKey } from "../../src/types";
import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";

export default function BagScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const {
    cart,
    updateQty,
    removeFromCart,
    subtotal,
    getDeliveryFee,
    calculateTotal,
  } = useCart();
  const [selectedArea, setSelectedArea] = useState<DeliveryArea>("dhaka_standard");
  const styles = createStyles(colors, s);

  const deliveryFee = getDeliveryFee(selectedArea);
  const total = calculateTotal(selectedArea);

  const emptyContent = (
    <View style={[styles.emptyContainer, { flex: 1 }]}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.indigoLight }]}>
        <ShoppingBag size={36} color={colors.indigo} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>Your Cart is Empty</Text>
      <Text style={[styles.emptySub, { color: colors.sub }]}>
        Explore our artisanal selvedge jeans, dobby panjabis, and heavyweight tees.
      </Text>
      <TouchableOpacity
        style={[styles.shopBtn, { backgroundColor: colors.indigo }]}
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/shop")}
      >
        <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenShell
      title="CART"
      showBag={false}
      empty={cart.length === 0}
      emptyContent={emptyContent}
    >

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <CashbackBanner />
        {/* Cart Item Cards */}
        <View style={styles.itemsList}>
          {cart.map((item) => {
            const unitPrice = item.product.salePrice ?? item.product.price;
            return (
              <View key={`${item.productId}-${item.size}`} style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image
                  source={{ uri: item.product.images[0] }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />

                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={[styles.itemCategory, { color: colors.sub }]}>{item.product.category}</Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.productId, item.size)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={colors.crimson} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.itemName, { color: colors.ink }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>

                  <View style={styles.itemMetaRow}>
                    <View style={[styles.sizeBadge, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
                      <Text style={[styles.sizeBadgeText, { color: colors.indigoDark }]}>SIZE: {item.size}</Text>
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.sub }]}>{bdt(unitPrice)}</Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperRow}>
                    <View style={[styles.stepper, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.productId, item.size, -1)}
                      >
                        <Minus size={14} color={colors.ink} />
                      </TouchableOpacity>
                      <Text style={[styles.stepQty, { color: colors.ink }]}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.productId, item.size, 1)}
                      >
                        <Plus size={14} color={colors.ink} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.itemLineTotal, { color: colors.indigoDark }]}>{bdt(unitPrice * item.qty)}</Text>
                  </View>
                </View>
              </View>
            );
          })}

        </View>

        {/* Delivery Area Selector */}
        <View style={[styles.areaSelectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.areaTitle, { color: colors.ink }]}>SELECT DELIVERY METHOD</Text>
          <View style={styles.areaGrid}>
            {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const isSelected = selectedArea === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.areaOption,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    isSelected && [styles.areaOptionActive, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }],
                  ]}
                  onPress={() => setSelectedArea(key)}
                >
                  <View style={styles.areaOptionHeader}>
                    <Text style={[
                      styles.areaOptionText,
                      { color: colors.ink },
                      isSelected && styles.areaOptionTextActive,
                    ]}>
                      {opt.name}
                    </Text>
                    <Text style={[
                      styles.areaOptionFee,
                      { color: colors.sub },
                      isSelected && styles.areaOptionFeeActive,
                    ]}>
                      {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.areaOptionSub,
                    { color: colors.sub },
                    isSelected && styles.areaOptionSubActive,
                  ]}>
                    {opt.estimatedDays}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order Breakdown */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.ink }]}>ORDER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>Subtotal ({cart.length} items)</Text>
            <Text style={[styles.summaryValue, { color: colors.ink }]}>{bdt(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>
              Delivery ({DELIVERY_OPTIONS[selectedArea as DeliveryOptionKey]?.name || "Standard"})
            </Text>
            <Text style={[styles.summaryValue, { color: colors.ink }]}>{deliveryFee === 0 ? "FREE" : bdt(deliveryFee)}</Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.summaryTotalRow}>
            <Text style={[styles.totalLabel, { color: colors.ink }]}>TOTAL AMOUNT</Text>
            <Text style={[styles.totalValue, { color: colors.indigoDark }]}>{bdt(total)}</Text>
          </View>
        </View>

        <View style={styles.securityNote}>
          <ShieldCheck size={16} color={colors.emerald} />
          <Text style={[styles.securityNoteText, { color: colors.sub }]}>
            Official DEEN checkout · Cash on delivery & bKash / Card accepted.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomTotalContainer}>
          <Text style={[styles.bottomTotalLabel, { color: colors.sub }]}>Total Payable</Text>
          <Text style={[styles.bottomTotalAmount, { color: colors.indigoDark }]}>{bdt(total)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.indigo }]}
          activeOpacity={0.88}
          onPress={() => router.push({ pathname: "/checkout", params: { area: selectedArea } })}
        >
          <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    scrollContent: { ...s.scrollContent, paddingBottom: 30 },
    emptyContainer: s.emptyContainer,
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
    },
    emptySub: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 8,
    },
    shopBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
      borderRadius: 8,
      padding: 10,
      gap: 12,
    },
    itemImage: {
      width: 84,
      height: 100,
      borderRadius: 6,
      backgroundColor: colors.cardSecondary,
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
      letterSpacing: 0.6,
    },
    itemName: {
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    itemMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sizeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    sizeBadgeText: {
      fontSize: 9,
      fontWeight: "700",
    },
    itemPrice: {
      fontSize: 12,
      fontWeight: "600",
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
      borderRadius: 4,
      borderWidth: 1,
    },
    stepBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    stepQty: {
      fontSize: 12,
      fontWeight: "700",
      minWidth: 20,
      textAlign: "center",
    },
    itemLineTotal: {
      fontSize: 13,
      fontWeight: "800",
    },
    giftCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
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
      letterSpacing: 0.8,
    },
    giftName: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    giftPrice: {
      fontSize: 11,
      fontWeight: "800",
      marginTop: 2,
    },
    areaSelectorCard: {
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12,
      borderWidth: 1,
    },
    areaTitle: {
      fontSize: 11,
      fontWeight: "800",
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
      borderWidth: 1,
    },
    areaOptionActive: {},
    areaOptionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    areaOptionText: {
      fontSize: 11,
      fontWeight: "700",
    },
    areaOptionTextActive: {
      color: colors.indigoDark,
    },
    areaOptionFee: {
      fontSize: 11,
      fontWeight: "800",
    },
    areaOptionFeeActive: {
      color: colors.indigoDark,
    },
    areaOptionSub: {
      fontSize: 9,
      marginTop: 2,
    },
    areaOptionSubActive: {
      color: colors.indigoDark,
    },
    summaryCard: {
      borderRadius: 8,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 12,
      borderWidth: 1,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: "800",
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
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: "600",
    },
    summaryDivider: {
      height: 1,
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
      letterSpacing: 0.5,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: "900",
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
      flex: 1,
    },
    bottomBar: {
      borderTopWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    bottomTotalContainer: {
      flexDirection: "column",
    },
    bottomTotalLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    bottomTotalAmount: {
      fontSize: 18,
      fontWeight: "900",
    },
    checkoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
}
