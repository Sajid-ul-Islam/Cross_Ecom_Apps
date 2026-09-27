import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ThemeColors } from "../../theme/colors";
import { Order } from "../../types";
import { useReturns } from "../../context/ReturnContext";
import { Package, ShoppingBag, RotateCcw, TrendingUp } from "../Icons";

export interface CustomerShoppingKPIs {
  totalSpend: number;
  totalItemsPurchased: number;
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  returnExchangeCount: number;
  retentionRate: number;
}

export interface CustomerAnalyticsKPIsProps {
  orders?: Order[];
  onOrdersPress?: () => void;
  onReturnsPress?: () => void;
}

/**
 * Computes executive customer shopping KPIs from real order history.
 * Seamlessly handles new/guest users with clean zero state.
 */
export function computeCustomerKPIs(
  orders?: Order[] | null,
  returns?: any[] | null
): CustomerShoppingKPIs {
  const list = Array.isArray(orders) ? orders : [];
  if (list.length === 0) {
    return {
      totalSpend: 0,
      totalItemsPurchased: 0,
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      returnExchangeCount: 0,
      retentionRate: 100,
    };
  }

  // 1. Filter out cancelled or failed orders
  const validOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s !== "cancelled" && s !== "failed";
  });

  // 2. Total Spend (৳)
  const totalSpend = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // 3. Total Items Purchased
  const totalItemsPurchased = validOrders.reduce((sum, o) => {
    const lines = o.lines;
    if (Array.isArray(lines) && lines.length > 0) {
      return sum + lines.reduce((lSum, l) => lSum + (Number(l.qty) || 1), 0);
    }
    return sum + 1;
  }, 0);

  // 4. Completed Orders
  const completedOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  }).length;

  // 5. Active In-Flight Orders
  const activeOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return (
      s === "processing" ||
      s === "shipped" ||
      s === "in_transit" ||
      s === "received" ||
      s === "confirmed"
    );
  }).length;

  // 6. Return / Exchange Count
  const returnList = Array.isArray(returns) ? returns : [];
  const returnedOrderIds = new Set(
    returnList.map((r) => String(r.orderId || r.orderNumber || r.id || ""))
  );
  const returnOrders = list.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return (
      s === "returned" ||
      s === "exchange_requested" ||
      s === "return_processing" ||
      returnedOrderIds.has(String(o.id)) ||
      returnedOrderIds.has(String(o.number))
    );
  });
  const returnExchangeCount = Math.max(returnOrders.length, returnList.length);

  // 7. Retention Rate
  const retentionRate =
    validOrders.length > 0
      ? Math.max(0, Math.round(((validOrders.length - returnExchangeCount) / validOrders.length) * 100))
      : 100;

  return {
    totalSpend,
    totalItemsPurchased,
    totalOrders: list.length,
    completedOrders,
    activeOrders,
    returnExchangeCount,
    retentionRate,
  };
}

export const CustomerAnalyticsKPIs: React.FC<CustomerAnalyticsKPIsProps> = ({
  orders,
  onOrdersPress,
  onReturnsPress,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Safely attempt to read returns context if inside provider
  let returnsList: any[] = [];
  try {
    const retCtx = useReturns();
    if (retCtx && Array.isArray(retCtx.returns)) {
      returnsList = retCtx.returns;
    }
  } catch {
    // ReturnProvider fallback for standalone testing
  }

  const kpi = computeCustomerKPIs(orders, returnsList);

  const spendTierLabel =
    kpi.totalSpend >= 5000
      ? "💎 Platinum Tier"
      : kpi.totalSpend >= 2500
      ? "✨ Gold (৳2.5k+)"
      : kpi.totalSpend > 0
      ? "👕 Silver Member"
      : "New Guest Shopper";

  const itemsAvgLabel =
    kpi.totalItemsPurchased > 0
      ? `Avg ৳${Math.round(kpi.totalSpend / kpi.totalItemsPurchased).toLocaleString()} / pc`
      : "Ready to Explore";

  const ordersContextLabel =
    kpi.totalOrders > 0
      ? `${kpi.totalOrders} Placed Total`
      : "0 Orders Placed";

  const returnsContextLabel =
    kpi.totalOrders > 0
      ? `${kpi.retentionRate}% Retained`
      : "7-Day Guarantee";

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel="Customer shopping analytics summary"
    >
      {/* Header bar with Live Status */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.headerIcon}>📊</Text>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>
            EXECUTIVE SHOPPING INTELLIGENCE
          </Text>
        </View>
        <View
          style={[
            styles.liveBadge,
            { backgroundColor: colors.emeraldLight, borderColor: colors.emerald },
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Live metrics active"
        >
          <View style={[styles.liveDot, { backgroundColor: colors.emerald }]} />
          <Text style={[styles.liveBadgeText, { color: colors.emerald }]}>LIVE</Text>
        </View>
      </View>

      {/* 2x2 KPI Card Grid */}
      <View style={styles.grid}>
        {/* Row 1: Total Spend & Total Items */}
        <View style={styles.row}>
          {/* Card 1: Total Spend (৳) */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.paper, borderColor: colors.borderLight },
            ]}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`Total spend: ৳${kpi.totalSpend.toLocaleString()}, ${spendTierLabel}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: "rgba(4, 107, 210, 0.12)" },
                ]}
              >
                <TrendingUp size={12} color={colors.indigo} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.sub }]} numberOfLines={1}>
                TOTAL SPEND
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: colors.indigo }]}
              numberOfLines={1}
            >
              ৳{kpi.totalSpend.toLocaleString()}
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.sub }]} numberOfLines={1}>
              {spendTierLabel}
            </Text>
          </View>

          {/* Card 2: Total Items Purchased */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.paper, borderColor: colors.borderLight },
            ]}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`Items purchased: ${kpi.totalItemsPurchased} pieces, ${itemsAvgLabel}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: "rgba(46, 125, 91, 0.12)" },
                ]}
              >
                <ShoppingBag size={12} color={colors.emerald} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.sub }]} numberOfLines={1}>
                ITEMS BOUGHT
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: colors.emerald }]}
              numberOfLines={1}
            >
              {kpi.totalItemsPurchased} {kpi.totalItemsPurchased === 1 ? "Piece" : "Pieces"}
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.sub }]} numberOfLines={1}>
              {itemsAvgLabel}
            </Text>
          </View>
        </View>

        {/* Row 2: Completed Orders & Return/Exchange */}
        <View style={[styles.row, { marginTop: 8 }]}>
          {/* Card 3: Completed Orders */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: colors.paper, borderColor: colors.borderLight },
            ]}
            activeOpacity={onOrdersPress ? 0.75 : 1}
            onPress={onOrdersPress}
            disabled={!onOrdersPress}
            accessible={true}
            accessibilityRole={onOrdersPress ? "button" : "summary"}
            accessibilityLabel={`Completed orders: ${kpi.completedOrders} completed out of ${ordersContextLabel}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: "rgba(15, 23, 42, 0.08)" },
                ]}
              >
                <Package size={12} color={colors.ink} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.sub }]} numberOfLines={1}>
                COMPLETED
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: colors.ink }]}
              numberOfLines={1}
            >
              {kpi.completedOrders} Delivered
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.sub }]} numberOfLines={1}>
              {ordersContextLabel}
            </Text>
          </TouchableOpacity>

          {/* Card 4: Return / Exchange Status */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: colors.paper, borderColor: colors.borderLight },
            ]}
            activeOpacity={onReturnsPress ? 0.75 : 1}
            onPress={onReturnsPress}
            disabled={!onReturnsPress}
            accessible={true}
            accessibilityRole={onReturnsPress ? "button" : "summary"}
            accessibilityLabel={`Returns and exchanges: ${kpi.returnExchangeCount} active, ${returnsContextLabel}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: "rgba(217, 119, 6, 0.12)" },
                ]}
              >
                <RotateCcw size={12} color={colors.amber} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.sub }]} numberOfLines={1}>
                RETURNS
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: colors.amber }]}
              numberOfLines={1}
            >
              {kpi.returnExchangeCount} Active
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.sub }]} numberOfLines={1}>
              {returnsContextLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CustomerAnalyticsKPIs;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardSecondary,
      padding: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    titleWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerIcon: {
      fontSize: 13,
      lineHeight: 16,
    },
    headerTitle: {
      fontSize: 10.5,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 0.5,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    liveBadgeText: {
      fontSize: 8.5,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    grid: {
      width: "100%",
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    kpiCard: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      padding: 9,
      minHeight: 74,
      justifyContent: "space-between",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 4,
    },
    iconChip: {
      width: 18,
      height: 18,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    cardLabel: {
      fontSize: 9.5,
      fontWeight: "800",
      letterSpacing: 0.4,
      flex: 1,
    },
    cardValue: {
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    cardSubtext: {
      fontSize: 9.5,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
  });
}
