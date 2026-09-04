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

import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Clock, Package, Truck } from "../../src/components/Icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { CashbackBanner } from "../../src/components/Banner";
import { useTheme } from "../../src/context/ThemeContext";
import { useCart } from "../../src/context/CartContext";
import { useOrders } from "../../src/context/OrderContext";
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
  const { orders } = useOrders();
  const [selectedArea, setSelectedArea] = useState<DeliveryArea>("dhaka_standard");
  const styles = createStyles(colors, s);

  const deliveryFee = getDeliveryFee(selectedArea);
  const total = calculateTotal(selectedArea);

  const emptyContent = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}>
      <View style={[styles.emptyContainer, { paddingTop: 40 }]}>
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

      {/* Orders Under Empty Cart */}
      <View style={styles.recentOrdersSection}>
        <View style={styles.recentOrdersHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Package size={18} color={colors.indigo} />
            <Text style={[styles.recentOrdersTitle, { color: colors.ink }]}>YOUR RECENT ORDERS</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/orders")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.viewAllOrdersText, { color: colors.indigo }]}>
              {orders.length > 0 ? `View All (${orders.length}) →` : "Track Orders →"}
            </Text>
          </TouchableOpacity>
        </View>

        {orders.length > 0 ? (
          orders.slice(0, 3).map((order) => {
            const hasPathao = Boolean(order.pathaoConsignmentId);
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.miniOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.88}
                onPress={() => router.push("/(tabs)/orders")}
              >
                <View style={styles.miniOrderTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.miniOrderNumber, { color: colors.indigo }]}>
                      #{order.wooNumber || order.number}
                    </Text>
                    {order.wooNumber && order.number && order.wooNumber !== order.number && (
                      <View style={{ backgroundColor: colors.indigoLight, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3 }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: colors.indigo }}>
                          APP {order.number}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.miniStatusBadge, { backgroundColor: colors.indigoLight }]}>
                    <Text style={[styles.miniStatusText, { color: colors.indigo }]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.miniOrderBottom}>
                  <Text style={[styles.miniOrderDate, { color: colors.sub }]}>
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {order.lines?.length || 1} item{order.lines?.length === 1 ? "" : "s"}
                  </Text>
                  <Text style={[styles.miniOrderTotal, { color: colors.ink }]}>
                    {bdt(order.total || 0)}
                  </Text>
                </View>

                {hasPathao ? (
                  <View style={[styles.miniPathaoBar, { backgroundColor: colors.cardSecondary }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Truck size={12} color={colors.indigo} />
                      <Text style={[styles.miniPathaoText, { color: colors.sub }]}>
                        Pathao: <Text style={{ color: colors.indigo, fontWeight: "700" }}>{order.pathaoConsignmentId}</Text>
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>Track →</Text>
                  </View>
                ) : (
                  <View style={[styles.miniPathaoBar, { backgroundColor: colors.cardSecondary }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Clock size={12} color={colors.sub} />
                      <Text style={[styles.miniPathaoText, { color: colors.sub }]}>Preparing Dispatch</Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.sub }}>View →</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            style={[styles.ordersCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/orders")}
            accessibilityRole="button"
            accessibilityLabel="Track my existing orders"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={[styles.ordersIconCircle, { backgroundColor: colors.indigoLight }]}>
                <Clock size={18} color={colors.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ordersCardTitle, { color: colors.ink }]}>Looking for past orders?</Text>
                <Text style={[styles.ordersCardSub, { color: colors.sub }]}>Track live shipments & Pathao courier status</Text>
              </View>
            </View>
            <ArrowRight size={16} color={colors.sub} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
            const itemImageUri =
              item.product.thumb ||
              item.product.images?.[0] ||
              item.product.gallery?.[0] ||
              "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";

            return (
              <View key={`${item.productId}-${item.size}`} style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image
                  source={{ uri: itemImageUri }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />

                <View style={styles.itemDetails}>
                  <View style={styles.itemTopRow}>
                    <Text style={[styles.itemCategory, { color: colors.sub }]}>{item.product.category}</Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.productId, item.size)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.product.name} (Size ${item.size}) from cart`}
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
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus size={14} color={colors.ink} />
                      </TouchableOpacity>
                      <Text style={[styles.stepQty, { color: colors.ink }]}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQty(item.productId, item.size, 1)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Increase quantity of ${item.product.name}`}
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

        {/* Orders Under the Cart */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.recentOrdersHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Package size={18} color={colors.indigo} />
              <Text style={[styles.recentOrdersTitle, { color: colors.ink }]}>YOUR RECENT ORDERS</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/orders")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.viewAllOrdersText, { color: colors.indigo }]}>
                {orders.length > 0 ? `View All (${orders.length}) →` : "Track Orders →"}
              </Text>
            </TouchableOpacity>
          </View>

          {orders.length > 0 ? (
            orders.slice(0, 3).map((order) => {
              const hasPathao = Boolean(order.pathaoConsignmentId);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.miniOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.88}
                  onPress={() => router.push("/(tabs)/orders")}
                >
                  <View style={styles.miniOrderTop}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.miniOrderNumber, { color: colors.indigo }]}>
                        #{order.wooNumber || order.number}
                      </Text>
                      {order.wooNumber && order.number && order.wooNumber !== order.number && (
                        <View style={{ backgroundColor: colors.indigoLight, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3 }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: colors.indigo }}>
                            APP {order.number}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.miniStatusBadge, { backgroundColor: colors.indigoLight }]}>
                      <Text style={[styles.miniStatusText, { color: colors.indigo }]}>
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.miniOrderBottom}>
                    <Text style={[styles.miniOrderDate, { color: colors.sub }]}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {order.lines?.length || 1} item{order.lines?.length === 1 ? "" : "s"}
                    </Text>
                    <Text style={[styles.miniOrderTotal, { color: colors.ink }]}>
                      {bdt(order.total || 0)}
                    </Text>
                  </View>

                  {hasPathao ? (
                    <View style={[styles.miniPathaoBar, { backgroundColor: colors.cardSecondary }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Truck size={12} color={colors.indigo} />
                        <Text style={[styles.miniPathaoText, { color: colors.sub }]}>
                          Pathao: <Text style={{ color: colors.indigo, fontWeight: "700" }}>{order.pathaoConsignmentId}</Text>
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>Track →</Text>
                    </View>
                  ) : (
                    <View style={[styles.miniPathaoBar, { backgroundColor: colors.cardSecondary }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Clock size={12} color={colors.sub} />
                        <Text style={[styles.miniPathaoText, { color: colors.sub }]}>Preparing Dispatch</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.sub }}>View →</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <TouchableOpacity
              style={[styles.ordersCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/orders")}
              accessibilityRole="button"
              accessibilityLabel="Track my existing orders"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={[styles.ordersIconCircle, { backgroundColor: colors.indigoLight }]}>
                  <Clock size={18} color={colors.indigo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ordersCardTitle, { color: colors.ink }]}>Looking for past orders?</Text>
                  <Text style={[styles.ordersCardSub, { color: colors.sub }]}>Track live shipments & Pathao courier status</Text>
                </View>
              </View>
              <ArrowRight size={16} color={colors.sub} />
            </TouchableOpacity>
          )}
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
    trackOrdersEmptyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 6,
      borderWidth: 1,
      marginTop: 12,
      width: "100%",
    },
    trackOrdersEmptyBtnText: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    ordersCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 16,
    },
    ordersIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    ordersCardTitle: {
      fontSize: 13,
      fontWeight: "800",
    },
    ordersCardSub: {
      fontSize: 11,
      marginTop: 2,
    },
    recentOrdersSection: {
      marginTop: 20,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    recentOrdersHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    recentOrdersTitle: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    viewAllOrdersText: {
      fontSize: 12,
      fontWeight: "700",
    },
    miniOrderCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
    },
    miniOrderTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    miniOrderNumber: {
      fontSize: 13,
      fontWeight: "800",
    },
    miniStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    miniStatusText: {
      fontSize: 9,
      fontWeight: "800",
    },
    miniOrderBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    miniOrderDate: {
      fontSize: 11,
    },
    miniOrderTotal: {
      fontSize: 13,
      fontWeight: "800",
    },
    miniPathaoBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 4,
    },
    miniPathaoText: {
      fontSize: 10,
    },
    emptyRecentOrdersWrap: {
      width: "100%",
      marginTop: 28,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
  });
}
