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
} from "react-native";
import { X, Store, MapPin, PhoneCall, CheckCircle2, Navigation } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { Product } from "../types";

const { width, height } = Dimensions.get("window");

const OUTLETS = [
  {
    id: "mirpur",
    name: "DEEN Mirpur 12 (Flagship Outlet)",
    tag: "CENTRAL STUDIO & STORE",
    address: "2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216",
    hours: "Open Daily: 10:00 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (Ready for Pickup)",
    units: 8,
    mapQuery: "Ramzannesa Super Market, Mirpur 12, Dhaka",
  },
  {
    id: "wari",
    name: "DEEN Wari Outlet",
    tag: "DHAKA SOUTH OUTLET",
    address: "Ground Floor, 41 A.K Famous Tower, Rankin Street, Wari, Dhaka-1203",
    hours: "Open Daily: 10:30 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (5 Units Available)",
    units: 5,
    mapQuery: "41 A.K Famous Tower, Rankin Street, Wari, Dhaka",
  },
  {
    id: "cumilla",
    name: "DEEN Cumilla Outlet",
    tag: "CUMILLA SHOWROOM",
    address: "4th Floor, QR Tower, Badurtola, Cumilla",
    hours: "Open Daily: 10:30 AM - 09:00 PM",
    phone: "+8801952700500",
    stockText: "In Stock (4 Units Available)",
    units: 4,
    mapQuery: "QR Tower, Badurtola, Cumilla",
  },
  {
    id: "sylhet",
    name: "DEEN Sylhet Outlet",
    tag: "SYLHET SHOWROOM",
    address: "Block-A, House-54/2, Kumar Para, Sylhet",
    hours: "Open Daily: 10:30 AM - 09:30 PM",
    phone: "+8801952700500",
    stockText: "In Stock (6 Units Available)",
    units: 6,
    mapQuery: "House 54/2, Kumar Para, Sylhet",
  },
];

interface StoreStockModalProps {
  visible: boolean;
  product: Product;
  selectedSize: string;
  onClose: () => void;
}

export const StoreStockModal: React.FC<StoreStockModalProps> = ({
  visible,
  product,
  selectedSize,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const handleOpenMap = (query: string) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <Store size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>PHYSICAL STORE AVAILABILITY</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Check real-time stock at DEEN Dhaka outlets</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Product Summary */}
            <View style={styles.prodSummary}>
              <Text style={styles.prodLabel}>CHECKING INVENTORY FOR:</Text>
              <Text style={styles.prodName}>{product.name}</Text>
              <Text style={styles.prodSku}>
                Selected Size: <Text style={styles.bold}>{selectedSize || product.sizes[0]}</Text> · Fabric: {product.fabric}
              </Text>
            </View>

            {/* Outlets List */}
            <View style={styles.outletsList}>
              {OUTLETS.map((outlet) => (
                <View key={outlet.id} style={styles.outletCard}>
                  <View style={styles.outletHeader}>
                    <View>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{outlet.tag}</Text>
                      </View>
                      <Text style={styles.outletName}>{outlet.name}</Text>
                    </View>

                    <View style={styles.stockBadge}>
                      <View style={styles.stockDot} />
                      <Text style={styles.stockText}>{outlet.units} IN STOCK</Text>
                    </View>
                  </View>

                  <View style={styles.outletDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={13} color={Colors.sub} />
                      <Text style={styles.detailText}>{outlet.address}</Text>
                    </View>
                    <Text style={styles.hoursText}>🕒 {outlet.hours}</Text>
                  </View>

                  <View style={styles.outletActions}>
                    <TouchableOpacity
                      style={styles.dirBtn}
                      onPress={() => handleOpenMap(outlet.mapQuery)}
                    >
                      <Navigation size={13} color={Colors.indigoDark} />
                      <Text style={styles.dirBtnText}>DIRECTIONS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(outlet.phone)}
                    >
                      <PhoneCall size={13} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>CALL STORE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
    maxHeight: height * 0.88,
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
  prodSummary: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  prodLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  prodName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  prodSku: {
    fontSize: 11,
    color: Colors.sub,
  },
  bold: {
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  outletsList: {
    gap: 12,
  },
  outletCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  outletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tagPill: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  tagPillText: {
    color: Colors.indigoDark,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  outletName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald,
  },
  stockText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  outletDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
  },
  hoursText: {
    fontSize: 10,
    color: Colors.faint,
    marginTop: 2,
  },
  outletActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  dirBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.indigoLight,
    paddingVertical: 9,
    borderRadius: 6,
  },
  dirBtnText: {
    color: Colors.indigoDark,
    fontSize: 10,
    fontWeight: "800",
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.indigo,
    paddingVertical: 9,
    borderRadius: 6,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
