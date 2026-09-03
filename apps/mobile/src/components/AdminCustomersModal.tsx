import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import {
  X,
  Search,
  Users,
  Package,
  Truck,
  PhoneCall,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
} from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { sharedStyles } from "../theme/sharedStyles";
import {
  fetchAdminCustomersAPI,
  AdminCustomerRecord,
  AdminCustomerOrder,
  bdt,
} from "../services/gateway";

const { width, height } = Dimensions.get("window");

interface AdminCustomersModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminCustomersModal: React.FC<AdminCustomersModalProps> = ({
  visible,
  onClose,
}) => {
  if (!visible) return null;
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const loadCustomers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetchAdminCustomersAPI(q);
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch {
      /* offline or network issue */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadCustomers(searchQuery);
    }
  }, [visible]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadCustomers(text);
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomer((prev) => (prev === id ? null : id));
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return colors.emerald;
      case "cancelled":
      case "failed":
        return colors.crimson;
      case "processing":
        return colors.indigo;
      case "on-hold":
      case "pending":
        return colors.amber;
      default:
        return colors.sub;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: colors.borderLight }]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.indigoDark },
                ]}
              >
                <Users size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>
                  CUSTOMER DIRECTORY · ADMIN
                </Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  {customers.length} Registered Customer Profiles & Histories
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: colors.cardSecondary },
              ]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Search size={16} color={colors.sub} />
              <TextInput
                style={[styles.searchInput, { color: colors.ink }]}
                placeholder="Search name, 01XXXXXXXXX, order #, consignment..."
                placeholderTextColor={colors.faint}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <X size={16} color={colors.sub} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Customer Profiles List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.indigo} />
                <Text style={[styles.loadingText, { color: colors.sub }]}>
                  Loading Customer Records & Orders...
                </Text>
              </View>
            ) : customers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={40} color={colors.faint} />
                <Text style={[styles.emptyTitle, { color: colors.ink }]}>
                  No customer profiles found
                </Text>
                <Text style={[styles.emptySub, { color: colors.sub }]}>
                  Try searching for another phone number, name, or order ID.
                </Text>
              </View>
            ) : (
              customers.map((c) => {
                const isExpanded = expandedCustomer === c.id;
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.customerCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isExpanded ? colors.indigo : colors.border,
                      },
                    ]}
                  >
                    {/* Customer Summary Card Header */}
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => toggleCustomer(c.id)}
                      style={styles.customerCardHeader}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={[
                              styles.customerName,
                              { color: colors.ink },
                            ]}
                          >
                            {c.name}
                          </Text>
                          <View
                            style={[
                              styles.orderCountBadge,
                              { backgroundColor: colors.indigoLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.orderCountText,
                                { color: colors.indigoDark },
                              ]}
                            >
                              {c.totalOrders} Orders
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <PhoneCall size={12} color={colors.sub} />
                          <Text
                            style={[
                              styles.customerMeta,
                              { color: colors.sub },
                            ]}
                          >
                            {c.phone || "No phone"}
                          </Text>
                          {c.email ? (
                            <>
                              <Text style={{ color: colors.borderLight }}>
                                •
                              </Text>
                              <Mail size={12} color={colors.sub} />
                              <Text
                                style={[
                                  styles.customerMeta,
                                  { color: colors.sub },
                                ]}
                                numberOfLines={1}
                              >
                                {c.email}
                              </Text>
                            </>
                          ) : null}
                        </View>

                        {c.address ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <MapPin size={12} color={colors.sub} />
                            <Text
                              style={[
                                styles.customerAddress,
                                { color: colors.sub },
                              ]}
                              numberOfLines={1}
                            >
                              {c.address}, {c.city} ({c.district})
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Right column: Total Spent & Expand Chevron */}
                      <View
                        style={{ alignItems: "flex-end", marginLeft: 10 }}
                      >
                        <Text
                          style={[
                            styles.spentLabel,
                            { color: colors.sub },
                          ]}
                        >
                          LIFETIME SPENT
                        </Text>
                        <Text
                          style={[
                            styles.spentValue,
                            { color: colors.emerald },
                          ]}
                        >
                          {bdt(c.totalSpent)}
                        </Text>
                        <View style={{ marginTop: 6 }}>
                          {isExpanded ? (
                            <ChevronUp size={18} color={colors.indigo} />
                          ) : (
                            <ChevronDown size={18} color={colors.sub} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Customer Order History */}
                    {isExpanded && (
                      <View
                        style={[
                          styles.customerDetails,
                          {
                            borderTopColor: colors.borderLight,
                            backgroundColor: colors.paper,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <Text
                            style={[
                              styles.sectionSubtitle,
                              { color: colors.ink },
                            ]}
                          >
                            📦 COMPLETE ORDER HISTORY ({c.orders.length})
                          </Text>
                          {c.lastOrderDate && (
                            <Text
                              style={{ fontSize: 10, color: colors.sub }}
                            >
                              Last order:{" "}
                              {new Date(c.lastOrderDate).toLocaleDateString()}
                            </Text>
                          )}
                        </View>

                        {c.orders.length === 0 ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.sub,
                              fontStyle: "italic",
                            }}
                          >
                            No historical orders placed yet.
                          </Text>
                        ) : (
                          c.orders.map((ord) => {
                            const isOrderExpanded = expandedOrders.has(
                              ord.id || ord.orderNumber
                            );
                            const statusColor = getStatusColor(ord.status);
                            return (
                              <View
                                key={ord.id || ord.orderNumber}
                                style={[
                                  styles.orderItemCard,
                                  {
                                    backgroundColor: colors.card,
                                    borderColor: colors.borderLight,
                                  },
                                ]}
                              >
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    toggleOrderDetails(
                                      ord.id || ord.orderNumber
                                    )
                                  }
                                  style={styles.orderHeader}
                                >
                                  <View style={{ flex: 1 }}>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.orderNum,
                                          { color: colors.ink },
                                        ]}
                                      >
                                        #{ord.orderNumber}
                                      </Text>
                                      <View
                                        style={[
                                          styles.statusPill,
                                          {
                                            backgroundColor: `${statusColor}18`,
                                            borderColor: statusColor,
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.statusPillText,
                                            { color: statusColor },
                                          ]}
                                        >
                                          {ord.status.toUpperCase()}
                                        </Text>
                                      </View>
                                    </View>
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.sub,
                                        marginTop: 2,
                                      }}
                                    >
                                      {new Date(
                                        ord.date
                                      ).toLocaleDateString()}{" "}
                                      · {ord.paymentMethod.toUpperCase()}
                                    </Text>
                                  </View>

                                  <View
                                    style={{
                                      alignItems: "flex-end",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.orderTotal,
                                        { color: colors.ink },
                                      ]}
                                    >
                                      {bdt(ord.total)}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        color: colors.sub,
                                      }}
                                    >
                                      {ord.items.length} items
                                    </Text>
                                  </View>

                                  {isOrderExpanded ? (
                                    <ChevronUp
                                      size={16}
                                      color={colors.sub}
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={16}
                                      color={colors.sub}
                                    />
                                  )}
                                </TouchableOpacity>

                                {/* Pathao Tracking Action */}
                                {ord.pathaoConsignmentId ? (
                                  <View
                                    style={[
                                      styles.pathaoRow,
                                      {
                                        backgroundColor:
                                          colors.cardSecondary,
                                        borderColor: colors.borderLight,
                                      },
                                    ]}
                                  >
                                    <Truck
                                      size={14}
                                      color={colors.indigo}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.ink,
                                        flex: 1,
                                        fontWeight: "600",
                                      }}
                                    >
                                      Pathao: {ord.pathaoConsignmentId}
                                    </Text>
                                    {ord.pathaoTrackingUrl && (
                                      <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() =>
                                          Linking.openURL(
                                            ord.pathaoTrackingUrl!
                                          )
                                        }
                                        style={styles.trackBtn}
                                      >
                                        <Text style={styles.trackBtnText}>
                                          TRACK
                                        </Text>
                                        <ArrowRight
                                          size={10}
                                          color="#FFFFFF"
                                        />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                ) : null}

                                {/* Item List */}
                                {isOrderExpanded && (
                                  <View
                                    style={[
                                      styles.orderItemsList,
                                      {
                                        borderTopColor:
                                          colors.borderLight,
                                      },
                                    ]}
                                  >
                                    {ord.items.map((it, idx) => (
                                      <View
                                        key={idx}
                                        style={styles.itemRow}
                                      >
                                        <View style={{ flex: 1 }}>
                                          <Text
                                            style={[
                                              styles.itemName,
                                              { color: colors.ink },
                                            ]}
                                          >
                                            {it.name}
                                          </Text>
                                          <Text
                                            style={[
                                              styles.itemMeta,
                                              { color: colors.sub },
                                            ]}
                                          >
                                            Size: {it.size || "Standard"} ·
                                            Qty: {it.quantity}
                                          </Text>
                                        </View>
                                        <Text
                                          style={[
                                            styles.itemTotal,
                                            { color: colors.ink },
                                          ]}
                                        >
                                          {bdt(it.total || it.price)}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(
  colors: ThemeColors,
  s: ReturnType<typeof sharedStyles>
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      height: height * 0.9,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 11,
      marginTop: 2,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      padding: 0,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 30,
      gap: 12,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
      gap: 12,
    },
    loadingText: {
      fontSize: 12,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
    },
    emptySub: {
      fontSize: 12,
      textAlign: "center",
      paddingHorizontal: 30,
    },
    customerCard: {
      borderRadius: 10,
      borderWidth: 1,
      overflow: "hidden",
    },
    customerCardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: 14,
    },
    customerName: {
      fontSize: 14,
      fontWeight: "800",
    },
    orderCountBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    orderCountText: {
      fontSize: 9,
      fontWeight: "800",
    },
    customerMeta: {
      fontSize: 11,
    },
    customerAddress: {
      fontSize: 11,
      maxWidth: width * 0.55,
    },
    spentLabel: {
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    spentValue: {
      fontSize: 13,
      fontWeight: "900",
      marginTop: 2,
    },
    customerDetails: {
      padding: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    sectionSubtitle: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    orderItemCard: {
      borderRadius: 8,
      borderWidth: 1,
      overflow: "hidden",
      marginBottom: 6,
    },
    orderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
    },
    orderNum: {
      fontSize: 12,
      fontWeight: "800",
    },
    statusPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    orderTotal: {
      fontSize: 12,
      fontWeight: "800",
    },
    pathaoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderTopWidth: 1,
      gap: 6,
    },
    trackBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.indigo,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    trackBtnText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    orderItemsList: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      gap: 6,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemName: {
      fontSize: 11,
      fontWeight: "600",
    },
    itemMeta: {
      fontSize: 10,
      marginTop: 1,
    },
    itemTotal: {
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
