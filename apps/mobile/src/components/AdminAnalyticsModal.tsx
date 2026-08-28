import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { X, TrendingUp, ShoppingBag, Users, AlertCircle, Save, Layers } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { fetchAdminAnalytics, AdminAnalyticsResult, bdt, GATEWAY_URL } from "../services/gateway";

interface AdminAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d">("30d");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminAnalyticsResult | null>(null);

  const loadAnalytics = async (tf: "today" | "7d" | "30d") => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics(tf);
      if (res) setData(res);
    } catch {
      Alert.alert("Error", "Could not load BI analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadAnalytics(timeframe);
    }
  }, [visible, timeframe]);

  const m = data?.metrics;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <Layers size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>STORE BI & ANALYTICS</Text>
                <Text style={[styles.subTitle, { color: colors.sub }]}>
                  Live Executive Sales & Operations Pulse
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.sub} />
            </TouchableOpacity>
          </View>

          {/* Timeframe Selector */}
          <View style={[styles.timeframeRow, { borderBottomColor: colors.borderLight }]}>
            {(["today", "7d", "30d"] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeBtn,
                  timeframe === tf
                    ? { backgroundColor: colors.indigo, borderColor: colors.indigo }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text
                  style={[
                    styles.timeframeBtnText,
                    timeframe === tf ? { color: "#FFFFFF" } : { color: colors.ink },
                  ]}
                >
                  {tf === "today" ? "TODAY" : tf === "7d" ? "LAST 7 DAYS" : "LAST 30 DAYS"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Body */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.indigo} />
                <Text style={[styles.loadingText, { color: colors.sub }]}>Computing BI metrics...</Text>
              </View>
            ) : m ? (
              <>
                {/* Primary Revenue Card */}
                <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <TrendingUp size={16} color={colors.emerald} />
                    <Text style={[styles.cardTag, { color: colors.emerald }]}>GROSS REVENUE</Text>
                  </View>
                  <Text style={[styles.largeValue, { color: colors.ink }]}>{bdt(m.grossRevenue)}</Text>
                  <Text style={[styles.cardMeta, { color: colors.sub }]}>
                    Average Order Value: <Text style={[styles.bold, { color: colors.indigo }]}>{bdt(m.aov)}</Text>
                  </Text>
                </View>

                {/* 2-Column Metrics Grid */}
                <View style={styles.gridRow}>
                  <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ShoppingBag size={16} color={colors.indigo} />
                    <Text style={[styles.gridLabel, { color: colors.sub }]}>TOTAL ORDERS</Text>
                    <Text style={[styles.gridValue, { color: colors.ink }]}>{m.totalOrders}</Text>
                    <Text style={[styles.gridSub, { color: colors.sub }]}>
                      {m.codOrders} COD · {m.prepaidOrders} Prepaid
                    </Text>
                  </View>

                  <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Users size={16} color={colors.indigo} />
                    <Text style={[styles.gridLabel, { color: colors.sub }]}>ACTIVE SHOPPERS</Text>
                    <Text style={[styles.gridValue, { color: colors.ink }]}>{m.activeCustomersCount}</Text>
                    <Text style={[styles.gridSub, { color: colors.sub }]}>Registered customers</Text>
                  </View>
                </View>

                {/* Inventory Health */}
                <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <AlertCircle size={16} color={m.outOfStockCount > 0 ? colors.crimson : colors.amber} />
                    <Text style={[styles.cardTag, { color: m.outOfStockCount > 0 ? colors.crimson : colors.amber }]}>
                      INVENTORY STATUS
                    </Text>
                  </View>
                  <View style={styles.inventoryRow}>
                    <View style={styles.inventoryItem}>
                      <Text style={[styles.inventoryNumber, { color: colors.amber }]}>{m.lowStockCount}</Text>
                      <Text style={[styles.inventoryDesc, { color: colors.sub }]}>Low Stock Items (≤ 5 units)</Text>
                    </View>
                    <View style={styles.inventoryItem}>
                      <Text style={[styles.inventoryNumber, { color: colors.crimson }]}>{m.outOfStockCount}</Text>
                      <Text style={[styles.inventoryDesc, { color: colors.sub }]}>Out of Stock</Text>
                    </View>
                  </View>
                </View>

                {/* Category Performance */}
                {data?.categoryPerformance && data.categoryPerformance.length > 0 && (
                  <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.ink }]}>CATEGORY REVENUE BREAKDOWN</Text>
                    {data.categoryPerformance.map((cat, idx) => (
                      <View key={idx} style={[styles.categoryRow, { borderTopColor: colors.borderLight }]}>
                        <Text style={[styles.categoryName, { color: colors.ink }]}>{cat.category}</Text>
                        <Text style={[styles.categoryRevenue, { color: colors.indigo }]}>{bdt(cat.revenue)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* CSV Download Action */}
                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert(
                      "Order CSV Export",
                      "You can download the full orders ledger with Pathao consignment IDs directly via the gateway export endpoint.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Export URL", onPress: () => Linking.openURL(`${GATEWAY_URL}/v1/deen/admin/export-orders`) },
                      ]
                    );
                  }}
                >
                  <Save size={15} color={colors.indigo} />
                  <Text style={[styles.exportBtnText, { color: colors.indigo }]}>EXPORT ORDERS AS CSV</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.sub }]}>No orders found in this timeframe.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      maxHeight: "88%",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingBottom: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    subTitle: {
      fontSize: 10,
    },
    timeframeRow: {
      flexDirection: "row",
      padding: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    timeframeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    timeframeBtnText: {
      fontSize: 10,
      fontWeight: "800",
    },
    scrollContent: {
      padding: 16,
      gap: 12,
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: "center",
      gap: 10,
    },
    loadingText: {
      fontSize: 12,
    },
    metricCard: {
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    cardTag: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    largeValue: {
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 11,
    },
    bold: {
      fontWeight: "800",
    },
    gridRow: {
      flexDirection: "row",
      gap: 10,
    },
    gridCard: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      gap: 4,
    },
    gridLabel: {
      fontSize: 9,
      fontWeight: "800",
    },
    gridValue: {
      fontSize: 18,
      fontWeight: "900",
    },
    gridSub: {
      fontSize: 9,
    },
    inventoryRow: {
      flexDirection: "row",
      gap: 16,
      marginTop: 6,
    },
    inventoryItem: {
      flex: 1,
    },
    inventoryNumber: {
      fontSize: 18,
      fontWeight: "900",
    },
    inventoryDesc: {
      fontSize: 10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 8,
    },
    categoryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: 1,
    },
    categoryName: {
      fontSize: 11,
      fontWeight: "600",
    },
    categoryRevenue: {
      fontSize: 11,
      fontWeight: "800",
    },
    exportBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
    },
    exportBtnText: {
      fontSize: 11,
      fontWeight: "800",
    },
    emptyWrap: {
      paddingVertical: 30,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 12,
    },
  });
}
