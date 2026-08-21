import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package, Clock, CheckCircle2, Truck, ShoppingBag, ArrowRight, RotateCcw, Camera, FileText, ShieldCheck } from "../../src/components/Icons";
import { Header } from "../../src/components/Header";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { useOrders } from "../../src/context/OrderContext";
import { useReturns } from "../../src/context/ReturnContext";
import { ReturnExchangeModal } from "../../src/components/ReturnExchangeModal";
import { CourierTrackingModal } from "../../src/components/CourierTrackingModal";
import { bdt, DELIVERY_OPTIONS } from "../../src/services/gateway";
import { OrderStatus, Order } from "../../src/types";

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { orders, loading, refreshOrders } = useOrders();
  const { returns, getReturnForOrder } = useReturns();
  const [refreshing, setRefreshing] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const getStepIndex = (st: OrderStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === st);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
        <Header title="MY ORDERS" showSearch={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
        <Header title="MY ORDERS" showSearch={false} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Package size={36} color={Colors.indigo} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>
            Your placed orders and live parcel tracking updates will appear here.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopBtnText}>BROWSE CATALOG</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      <Header title="MY ORDERS" showSearch={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.indigo}
            colors={[colors.indigo]}
          />
        }
      >
        <View style={styles.ordersList}>
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const pathaoId = order.pathaoConsignmentId || `PT-${order.number.replace(/[^0-9]/g, "")}921`;

            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header */}
                <View style={[styles.orderHeader, { borderBottomColor: colors.borderLight }]}>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.orderNumber, { color: colors.indigo }]}>{order.number}</Text>
                      {order.wooId && (
                        <View style={{ backgroundColor: colors.indigoLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: colors.indigo }}>
                            STORE #{order.wooId}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.orderDate, { color: colors.sub }]}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: colors.indigoLight }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.indigo }]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Pathao Consignment Bar */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.cardSecondary || colors.paper,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginVertical: 6,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Truck size={13} color={colors.indigo} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.ink }}>
                      Pathao: <Text style={{ color: colors.indigo, fontWeight: "800" }}>{pathaoId}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOrderForTracking(order);
                      setTrackingModalVisible(true);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>
                      Track →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Stepper */}
                <View style={styles.stepperContainer}>
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <React.Fragment key={step.key}>
                        <View style={styles.stepNode}>
                          <View
                            style={[
                              styles.stepDot,
                              { backgroundColor: colors.paper, borderColor: colors.border },
                              isDone && { backgroundColor: colors.emerald, borderColor: colors.emerald },
                              isCurrent && { backgroundColor: colors.indigo, borderColor: colors.indigo },
                            ]}
                          >
                            {isDone ? (
                              <CheckCircle2 size={12} color="#FFFFFF" />
                            ) : (
                              <View style={[styles.stepDotInner, { backgroundColor: colors.border }]} />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              { color: colors.faint },
                              isDone && { color: colors.ink, fontWeight: "700" },
                              isCurrent && { color: colors.indigo, fontWeight: "800" },
                            ]}
                          >
                            {step.label}
                          </Text>
                        </View>

                        {idx < STATUS_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              { backgroundColor: colors.borderLight },
                              idx < currentStepIdx && { backgroundColor: colors.emerald },
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* Items preview */}
                <View style={[styles.itemsSummary, { backgroundColor: colors.paper }]}>
                  {order.lines.map((l, i) => (
                    <View key={i} style={styles.orderLineItem}>
                      <Text style={[styles.orderLineQty, { color: colors.indigo }]}>{l.qty}x</Text>
                      <Text style={[styles.orderLineName, { color: colors.ink }]} numberOfLines={1}>
                        {l.name} {l.size ? `(${l.size})` : ""}
                      </Text>
                      <Text style={[styles.orderLinePrice, { color: colors.ink }]}>
                        {l.gift ? "FREE" : bdt(l.unit * l.qty)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Price Breakdown: Subtotal & Delivery Charge */}
                <View
                  style={{
                    backgroundColor: colors.paper,
                    padding: 8,
                    borderRadius: 6,
                    gap: 3,
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: colors.sub }}>Subtotal:</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.ink }}>{bdt(order.subtotal)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: colors.sub }}>Delivery Charge:</Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.indigo }}>
                      {order.delivery === 0 ? "FREE" : bdt(order.delivery)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: colors.ink }}>Total Payable:</Text>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: colors.indigo }}>{bdt(order.total)}</Text>
                  </View>
                </View>

                {/* Payment & Address */}
                <View style={styles.orderFooter}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <Text style={[styles.paymentInfo, { color: colors.sub }]}>
                        Payment:{" "}
                        <Text style={{ fontWeight: "800", color: order.payment === "cod" ? colors.amber : colors.emerald }}>
                          {order.payment === "cod" ? "CASH ON DELIVERY" : order.payment.toUpperCase()}
                        </Text>
                      </Text>
                      {order.payment === "cod" && (
                        <View style={{ backgroundColor: colors.amberLight || "#FEF3C7", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                          <Text style={{ fontSize: 8, fontWeight: "800", color: colors.amber || "#D97706" }}>
                            UNPAID · PAY AT DOOR
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.addressInfo, { color: colors.sub }]} numberOfLines={1}>
                      📍 {order.address}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={[styles.orderActionsRow, { borderTopColor: colors.borderLight }]}>
                  <TouchableOpacity
                    style={[styles.trackBtn, { backgroundColor: colors.indigo }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedOrderForTracking(order);
                      setTrackingModalVisible(true);
                    }}
                  >
                    <Truck size={13} color="#FFFFFF" />
                    <Text style={styles.trackBtnText}>TRACK ON PATHAO</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.returnBtn, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedOrderForReturn(order);
                      setReturnModalVisible(true);
                    }}
                  >
                    <RotateCcw size={13} color={colors.indigo} />
                    <Text style={[styles.returnBtnText, { color: colors.indigo }]}>EXCHANGE / RETURN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Live Courier Tracking Modal */}
      <CourierTrackingModal
        visible={trackingModalVisible}
        order={selectedOrderForTracking}
        onClose={() => {
          setTrackingModalVisible(false);
          setSelectedOrderForTracking(null);
        }}
      />

      {/* Return & Exchange Modal */}
      <ReturnExchangeModal
        visible={returnModalVisible}
        order={selectedOrderForReturn}
        onClose={() => {
          setReturnModalVisible(false);
          setSelectedOrderForReturn(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
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
  orderActionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
    marginTop: 4,
  },
  trackBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.indigo,
    paddingVertical: 8,
    borderRadius: 6,
  },
  trackBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  returnActionRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
    marginTop: 4,
  },
  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: Colors.indigoLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  returnBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
  },
  activeReturnBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
    backgroundColor: "#FAFBFD",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  activeReturnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeReturnTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
  },
  retStatusBadge: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retStatusBadgeText: {
    color: Colors.amber,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  retTicketLine: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  retNotes: {
    fontSize: 10,
    color: Colors.sub,
    fontStyle: "italic",
  },
  retMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 4,
  },
  retMetaText: {
    fontSize: 9,
    color: Colors.sub,
    fontWeight: "600",
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.indigo,
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  stepNode: {
    alignItems: "center",
    width: 54,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.paper,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  stepDotCurrent: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigo,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.faint,
  },
  stepLabelDone: {
    color: Colors.ink,
    fontWeight: "700",
  },
  stepLabelCurrent: {
    color: Colors.indigoDark,
    fontWeight: "800",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: Colors.emerald,
  },
  itemsSummary: {
    backgroundColor: Colors.paper,
    borderRadius: 6,
    padding: 10,
    gap: 6,
    marginVertical: 8,
  },
  orderLineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderLineQty: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.indigo,
  },
  orderLineName: {
    flex: 1,
    fontSize: 11,
    color: Colors.ink,
  },
  orderLinePrice: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 8,
  },
  paymentInfo: {
    fontSize: 11,
    color: Colors.sub,
  },
  delOptionBadge: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delOptionBadgeText: {
    color: Colors.indigoDark,
    fontSize: 9,
    fontWeight: "700",
  },
  guestBadge: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  guestBadgeText: {
    color: Colors.amber,
    fontSize: 8,
    fontWeight: "800",
  },
  addressInfo: {
    fontSize: 10,
    color: Colors.faint,
    maxWidth: 200,
    marginTop: 2,
  },
  bold: {
    fontWeight: "700",
    color: Colors.ink,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
});
