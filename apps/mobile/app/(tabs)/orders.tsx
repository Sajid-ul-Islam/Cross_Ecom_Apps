import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package, Clock, CheckCircle2, Truck, ShoppingBag, ArrowRight } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { Colors } from "../../src/theme/colors";
import { useOrders } from "../../src/context/OrderContext";
import { bdt } from "../../src/services/api";
import { OrderStatus } from "../../src/types";

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading } = useOrders();

  const getStepIndex = (st: OrderStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === st);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header title="MY ORDERS" showSearch={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="MY ORDERS" showSearch={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.ordersList}>
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Header */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{order.number}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
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
                              isDone && styles.stepDotDone,
                              isCurrent && styles.stepDotCurrent,
                            ]}
                          >
                            {isDone ? (
                              <CheckCircle2 size={12} color="#FFFFFF" />
                            ) : (
                              <View style={styles.stepDotInner} />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              isDone && styles.stepLabelDone,
                              isCurrent && styles.stepLabelCurrent,
                            ]}
                          >
                            {step.label}
                          </Text>
                        </View>

                        {idx < STATUS_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              idx < currentStepIdx && styles.stepLineDone,
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* Items preview */}
                <View style={styles.itemsSummary}>
                  {order.lines.map((l, i) => (
                    <View key={i} style={styles.orderLineItem}>
                      <Text style={styles.orderLineQty}>{l.qty}x</Text>
                      <Text style={styles.orderLineName} numberOfLines={1}>
                        {l.name} {l.size ? `(${l.size})` : ""}
                      </Text>
                      <Text style={styles.orderLinePrice}>
                        {l.gift ? "FREE" : bdt(l.unit * l.qty)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Total and Payment */}
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.paymentInfo}>
                      Paid via: <Text style={styles.bold}>{order.payment.toUpperCase()}</Text>
                    </Text>
                    <Text style={styles.addressInfo} numberOfLines={1}>
                      {order.address}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>{bdt(order.total)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
