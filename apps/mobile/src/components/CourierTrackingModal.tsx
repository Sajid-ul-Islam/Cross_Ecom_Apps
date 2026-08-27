import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Truck,
  MapPin,
  PhoneCall,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
} from "./Icons";
import { LottieAnimation } from "./LottieAnimation";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { Order } from "../types";
import { requestTracking } from "../services/gateway";

const { width, height } = Dimensions.get("window");

interface CourierTrackingModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

export const CourierTrackingModal: React.FC<CourierTrackingModalProps> = ({
  visible,
  order,
  onClose,
}) => {
  if (!order) return null;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const hasConsignment = Boolean(order.pathaoConsignmentId);
  const trackingId = order.pathaoConsignmentId || "Awaiting Courier Dispatch";
  const trackingUrl =
    order.pathaoTrackingUrl ||
    (hasConsignment ? `https://merchant.pathao.com/tracking?consignment_id=${trackingId}` : "");

  // Live tracking info from the gateway (fetched via GET /v1/deen/pathao/track/:id)
  const [trackingInfo, setTrackingInfo] = useState<any>(order.pathaoTrackingInfo || null);
  const [fetchingTracking, setFetchingTracking] = useState(false);

  useEffect(() => {
    if (hasConsignment && !order.pathaoTrackingInfo) {
      setFetchingTracking(true);
      requestTracking(order.pathaoConsignmentId as string)
        .then(setTrackingInfo)
        .catch(() => setTrackingInfo(null))
        .finally(() => setFetchingTracking(false));
    }
  }, [order.pathaoConsignmentId]);

  // Determine which milestone is current/completed from live data
  const liveSteps = trackingInfo?.steps || [];
  const liveSummary = trackingInfo?.summary || (hasConsignment ? "Tracking dispatched" : "Preparing Dispatch");

  const riderName = "Pathao Express Delivery";
  const riderPhone = "+8801877076200";

  const handleOpenPathao = () => {
    if (trackingUrl) {
      Linking.openURL(trackingUrl).catch(() => {});
    }
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${riderPhone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <Truck size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>PATHAO PARCEL TRACKING</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Consignment #{trackingId}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Visual Simulated Map View */}
            <View style={styles.mapContainer}>
              <View style={styles.mapGraphic}>
                {/* Route Line */}
                <View style={styles.mapRouteLine} />

                {/* Hub Node */}
                <View style={styles.hubNode}>
                  <View style={styles.hubDot} />
                  <Text style={styles.hubLabel}>Pathao Hub</Text>
                </View>

                {/* Courier in transit */}
                <View style={styles.riderNode}>
                  <LottieAnimation type="truck" size={44} loop={true} />
                </View>

                {/* Destination Node */}
                <View style={styles.destNode}>
                  <MapPin size={18} color={colors.crimson} />
                  <Text style={styles.destLabel}>Your Address</Text>
                </View>
              </View>

              <View style={styles.etaBar}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color={colors.emerald} />
                  <Text style={styles.etaText}>
                    LIVE STATUS: <Text style={styles.bold}>{liveSummary}</Text>
                  </Text>
                </View>
                {trackingInfo && (
                  <Text style={{ fontSize: 10, color: colors.sub, marginTop: 2 }}>
                    Last updated: {new Date(trackingInfo.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                )}
                {fetchingTracking && (
                  <ActivityIndicator size="small" color={colors.indigo} style={{ marginTop: 4 }} />
                )}
              </View>
            </View>

            {/* Pathao Courier Action Bar */}
            <View style={[styles.riderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.riderInfoLeft}>
                <View style={[styles.riderAvatar, { backgroundColor: colors.indigoLight }]}>
                  <Text style={[styles.riderAvatarText, { color: colors.indigo }]}>PT</Text>
                </View>
                <View>
                  <Text style={[styles.riderName, { color: colors.ink }]}>{riderName}</Text>
                  <Text style={[styles.riderRole, { color: colors.sub }]}>Consignment: {trackingId}</Text>
                  <Text style={[styles.riderVehicle, { color: colors.indigo }]}>
                    Payment: {order.payment === "cod" ? "COD (Pay on Delivery)" : "Paid"} · ৳{order.total}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: colors.indigo }]}
                  onPress={handleOpenPathao}
                >
                  <Text style={styles.callBtnText}>TRACK LIVE</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delivery Milestones Timeline — driven by live Pathao API data */}
            <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.timelineTitle, { color: colors.sub }]}>SHIPMENT MILESTONES</Text>

              {liveSteps.length > 0 ? (
                liveSteps.map((step: any, idx: number) => {
                  const isDone = step.completed;
                  const isCurrent = step.current;
                  return (
                    <React.Fragment key={step.status}>
                      <View style={styles.milestoneItem}>
                        <View
                          style={[
                            styles.milestoneDot,
                            isDone && styles.milestoneDotDone,
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
                        <View style={styles.milestoneContent}>
                          <Text style={[styles.milestoneHeading, { color: colors.ink }]}>
                            {step.label}
                          </Text>
                          {step.location ? (
                            <Text style={[styles.milestoneSub, { color: colors.sub }]}>
                              {step.location}
                            </Text>
                          ) : null}
                          {step.timestamp ? (
                            <Text style={[styles.milestoneTime, { color: colors.sub }]}>
                              {new Date(step.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          ) : (
                            <Text style={[styles.milestoneTime, { color: colors.faint }]}>
                              {isCurrent ? "In progress…" : "Pending"}
                            </Text>
                          )}
                        </View>
                      </View>
                      {idx < liveSteps.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            { backgroundColor: colors.borderLight },
                            isDone && { backgroundColor: colors.emerald },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <View style={styles.milestoneItem}>
                  <View style={[styles.milestoneDot, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                    <Clock size={12} color={colors.sub} />
                  </View>
                  <View style={styles.milestoneContent}>
                    <Text style={[styles.milestoneHeading, { color: colors.ink }]}>
                      {liveSummary}
                    </Text>
                    <Text style={[styles.milestoneSub, { color: colors.sub }]}>
                      {hasConsignment
                        ? "Live tracking data will appear once Pathao updates the status."
                        : "Awaiting Pathao courier dispatch."}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Delivery & Payment Summary */}
            <View style={[styles.addressBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MapPin size={16} color={colors.indigo} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.addressTitle, { color: colors.sub }]}>DELIVERING TO:</Text>
                <Text style={[styles.addressText, { color: colors.ink }]}>{order.name} · {order.phone}</Text>
                <Text style={[styles.addressSub, { color: colors.sub }]}>{order.address}</Text>
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight, flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: colors.sub }}>Delivery Fee: <Text style={{ fontWeight: "700", color: colors.ink }}>৳{order.delivery}</Text></Text>
                  <Text style={{ fontSize: 12, color: colors.sub }}>Method: <Text style={{ fontWeight: "700", color: colors.emerald }}>{order.payment === "cod" ? "Cash on Delivery" : "Prepaid"}</Text></Text>
                </View>
              </View>
            </View>
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
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.9,
      paddingTop: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.indigo,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    subtitle: {
      fontSize: 11,
      color: colors.sub,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 18,
      gap: 14,
      paddingBottom: 36,
    },
    mapContainer: {
      backgroundColor: "#161B2E",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    mapGraphic: {
      height: 140,
      position: "relative",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    mapRouteLine: {
      position: "absolute",
      left: 40,
      right: 40,
      height: 3,
      backgroundColor: colors.indigo,
      top: "50%",
      borderRadius: 2,
    },
    hubNode: {
      position: "absolute",
      left: 20,
      top: "32%",
      alignItems: "center",
      gap: 4,
    },
    hubDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.emerald,
      borderWidth: 2,
      borderColor: "#FFFFFF",
    },
    hubLabel: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
    },
    riderNode: {
      position: "absolute",
      left: "52%",
      top: "22%",
      alignItems: "center",
    },
    riderPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.indigo,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FFFFFF",
    },
    riderPillText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "800",
    },
    destNode: {
      position: "absolute",
      right: 20,
      top: "30%",
      alignItems: "center",
      gap: 2,
    },
    destLabel: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
    },
    etaBar: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    etaText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    bold: {
      fontWeight: "900",
      color: colors.emerald,
    },
    riderCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    riderInfoLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    riderAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.indigoLight,
      alignItems: "center",
      justifyContent: "center",
    },
    riderAvatarText: {
      color: colors.indigoDark,
      fontSize: 14,
      fontWeight: "900",
    },
    riderName: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.ink,
    },
    riderRole: {
      fontSize: 10,
      color: colors.sub,
      marginTop: 1,
    },
    riderVehicle: {
      fontSize: 9,
      color: colors.faint,
      marginTop: 1,
    },
    callBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.emerald,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
    },
    callBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    timelineCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    timelineTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.sub,
      letterSpacing: 0.6,
    },
    milestoneItem: {
      flexDirection: "row",
      gap: 10,
    },
    milestoneDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.paper,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    milestoneDotDone: {
      backgroundColor: colors.indigo,
      borderColor: colors.indigo,
    },
    stepDotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.borderLight,
      marginBottom: 12,
    },
    milestoneContent: {
      flex: 1,
      gap: 2,
    },
    milestoneHeading: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
    },
    milestoneSub: {
      fontSize: 10,
      color: colors.sub,
      lineHeight: 14,
    },
    milestoneTime: {
      fontSize: 9,
      color: colors.faint,
      marginTop: 1,
    },
    addressBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressTitle: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.sub,
      letterSpacing: 0.5,
    },
    addressText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.ink,
    },
    addressSub: {
      fontSize: 10,
      color: colors.sub,
      marginTop: 1,
    },
  });
}
