import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Truck } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useOrders } from "../../context/OrderContext";
import { bdt } from "../../services/gateway";

interface RecentOrderPreviewProps {
  onTrackingPress: (order: any) => void;
}

export const RecentOrderPreview: React.FC<RecentOrderPreviewProps> = ({ onTrackingPress }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { orders } = useOrders();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);
  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithIcon}>
          <Truck size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>MY ORDERS & PATHAO TRACKING</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
          <Text style={[styles.viewAllLink, { color: colors.indigo }]}>
            ALL ORDERS ({orders.length}) →
          </Text>
        </TouchableOpacity>
      </View>

      {latestOrder ? (
        <View style={[styles.orderPreviewBox, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
          <View style={styles.orderPreviewTop}>
            <Text style={[styles.orderNumberText, { color: colors.indigo }]}>
              #{latestOrder.wooNumber || latestOrder.number}
              {latestOrder.wooNumber && latestOrder.number && latestOrder.wooNumber !== latestOrder.number ? ` (App ${latestOrder.number})` : ""}
            </Text>
            <View style={[styles.orderStatusBadge, { backgroundColor: colors.indigoLight }]}>
              <Text style={[styles.orderStatusText, { color: colors.indigo }]}>
                {latestOrder.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.orderMetaText, { color: colors.sub }]}>
            {latestOrder.pathaoConsignmentId ? (
              <>Pathao Consignment: <Text style={[styles.bold, { color: colors.ink }]}>{latestOrder.pathaoConsignmentId}</Text></>
            ) : (
              <>Delivery Status: <Text style={[styles.bold, { color: colors.ink }]}>Preparing Dispatch</Text></>
            )}
          </Text>

          <Text style={[styles.orderMetaText, { color: colors.sub }]}>
            Delivery: <Text style={[styles.bold, { color: colors.ink }]}>৳{latestOrder.delivery}</Text> · Total: <Text style={[styles.bold, { color: colors.indigo }]}>{bdt(latestOrder.total)}</Text> ({latestOrder.payment === "cod" ? "Cash on Delivery" : "Prepaid"})
          </Text>

          <TouchableOpacity
            style={[styles.orderActionBtn, { backgroundColor: colors.indigo }]}
            activeOpacity={0.88}
            onPress={() => {
              if (latestOrder.pathaoConsignmentId) {
                onTrackingPress(latestOrder);
              } else {
                router.push("/(tabs)/orders");
              }
            }}
          >
            <Truck size={14} color="#FFFFFF" />
            <Text style={styles.orderActionBtnText}>
              {latestOrder.pathaoConsignmentId ? "TRACK ON PATHAO LIVE →" : "VIEW ORDER DETAILS →"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyOrdersWrap}>
          <Text style={[styles.emptyOrdersText, { color: colors.sub }]}>
            No orders placed yet.
          </Text>
          <TouchableOpacity
            style={[styles.continueShoppingBtn, { backgroundColor: colors.indigo }]}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.continueShoppingText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitleWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    viewAllLink: {
      fontSize: 11,
      fontWeight: "800",
    },
    orderPreviewBox: {
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      gap: 6,
    },
    orderPreviewTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    orderNumberText: {
      fontSize: 14,
      fontWeight: "900",
    },
    orderStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    orderStatusText: {
      fontSize: 9,
      fontWeight: "900",
    },
    orderMetaText: {
      fontSize: 11,
    },
    orderActionBtn: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 6,
    },
    orderActionBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },
    emptyOrdersWrap: {
      paddingVertical: 14,
      alignItems: "center",
      gap: 8,
    },
    emptyOrdersText: {
      fontSize: 12,
    },
    continueShoppingBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    continueShoppingText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },
    bold: s.bold,
  });
}
