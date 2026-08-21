import React, { useState } from "react";
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
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { Order } from "../types";

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

  const trackingId = `ST-${order.number.replace(/[^0-9]/g, "")}921-DH`;
  const riderName = "Kamal Hossain";
  const riderPhone = "+8801711223344";

  const handleCallRider = () => {
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
                <Text style={[styles.title, { color: colors.ink }]}>LIVE COURIER TRACKING</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Steadfast Express · Tracking #{trackingId}</Text>
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
                  <Text style={styles.hubLabel}>Tejgaon Hub</Text>
                </View>

                {/* Courier Bike / Van in transit */}
                <View style={styles.riderNode}>
                  <View style={styles.riderPill}>
                    <Navigation size={12} color="#FFFFFF" />
                    <Text style={styles.riderPillText}>Rider Moving</Text>
                  </View>
                </View>

                {/* Destination Node */}
                <View style={styles.destNode}>
                  <MapPin size={18} color={Colors.crimson} />
                  <Text style={styles.destLabel}>Your Address</Text>
                </View>
              </View>

              <View style={styles.etaBar}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color={Colors.emerald} />
                  <Text style={styles.etaText}>ESTIMATED ARRIVAL: <Text style={styles.bold}>TODAY, 3:30 PM - 5:00 PM</Text></Text>
                </View>
              </View>
            </View>

            {/* Delivery Rider Contact Card */}
            <View style={styles.riderCard}>
              <View style={styles.riderInfoLeft}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderAvatarText}>KH</Text>
                </View>
                <View>
                  <Text style={styles.riderName}>{riderName}</Text>
                  <Text style={styles.riderRole}>Steadfast Courier Rider · ⭐ 4.9 (840+ drops)</Text>
                  <Text style={styles.riderVehicle}>Bike No: Dhaka Metro-HA 24-8902</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.callBtn} onPress={handleCallRider}>
                <PhoneCall size={14} color="#FFFFFF" />
                <Text style={styles.callBtnText}>CALL</Text>
              </TouchableOpacity>
            </View>

            {/* Delivery Milestones Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>SHIPMENT MILESTONES</Text>

              <View style={styles.milestoneItem}>
                <View style={[styles.milestoneDot, styles.milestoneDotDone]}>
                  <CheckCircle2 size={12} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneHeading}>Out for Delivery with Courier Rider</Text>
                  <Text style={styles.milestoneSub}>Rider Kamal Hossain is on route to your delivery address in Dhaka</Text>
                  <Text style={styles.milestoneTime}>Today, 11:20 AM</Text>
                </View>
              </View>

              <View style={styles.milestoneItem}>
                <View style={[styles.milestoneDot, styles.milestoneDotDone]}>
                  <CheckCircle2 size={12} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneHeading}>Departed DEEN Tejgaon Fulfillment Center</Text>
                  <Text style={styles.milestoneSub}>Sorted and assigned to express delivery dispatch</Text>
                  <Text style={styles.milestoneTime}>Today, 08:45 AM</Text>
                </View>
              </View>

              <View style={styles.milestoneItem}>
                <View style={[styles.milestoneDot, styles.milestoneDotDone]}>
                  <CheckCircle2 size={12} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneHeading}>Quality Inspection &amp; Packing Completed</Text>
                  <Text style={styles.milestoneSub}>Handcrafted Japanese-grade selvedge inspected &amp; sealed</Text>
                  <Text style={styles.milestoneTime}>Yesterday, 06:15 PM</Text>
                </View>
              </View>
            </View>

            {/* Delivery Address Summary */}
            <View style={styles.addressBox}>
              <MapPin size={16} color={Colors.indigo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>DELIVERING TO:</Text>
                <Text style={styles.addressText}>{order.name} · {order.phone}</Text>
                <Text style={styles.addressSub}>{order.address}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.paper,
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
    borderBottomColor: Colors.borderLight,
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
    backgroundColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSecondary,
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
    backgroundColor: Colors.indigo,
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
    backgroundColor: Colors.emerald,
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
    backgroundColor: Colors.indigo,
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
    color: Colors.emerald,
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  riderAvatarText: {
    color: Colors.indigoDark,
    fontSize: 14,
    fontWeight: "900",
  },
  riderName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  riderRole: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
  riderVehicle: {
    fontSize: 9,
    color: Colors.faint,
    marginTop: 1,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.emerald,
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
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
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
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  milestoneDotDone: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  milestoneContent: {
    flex: 1,
    gap: 2,
  },
  milestoneHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  milestoneSub: {
    fontSize: 10,
    color: Colors.sub,
    lineHeight: 14,
  },
  milestoneTime: {
    fontSize: 9,
    color: Colors.faint,
    marginTop: 1,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
  },
  addressSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
});
