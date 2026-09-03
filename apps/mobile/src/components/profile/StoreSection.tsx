import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Store, HelpCircle, Sparkles, Users, Shield, Trash2, CheckCircle2 } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { exportUserData, deleteUserAccount, fetchOutlets, fetchAppSettings, type Outlet } from "../../services/gateway";

interface StoreSectionProps {
  onAboutPress: () => void;
  onReportPress: () => void;
  onBroadcastPress: () => void;
  onAnalyticsPress: () => void;
  onCustomersPress: () => void;
}

const FALLBACK_OUTLETS: Outlet[] = [
  { id: "mirpur", name: "DEEN Mirpur 12 (Flagship Outlet)", tag: "CENTRAL STUDIO & STORE", address: "2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216", hours: "Open Daily: 10:00 AM - 09:30 PM", phone: "+8801952700500" },
  { id: "wari", name: "DEEN Wari Outlet", tag: "DHAKA SOUTH OUTLET", address: "Ground Floor, 41 A.K Famous Tower, Rankin Street, Wari, Dhaka-1203", hours: "Open Daily: 10:30 AM - 09:30 PM", phone: "+8801952700500" },
  { id: "cumilla", name: "DEEN Cumilla Outlet", tag: "CUMILLA SHOWROOM", address: "4th Floor, QR Tower, Badurtola, Cumilla", hours: "Open Daily: 10:30 AM - 09:00 PM", phone: "+8801952700500" },
  { id: "sylhet", name: "DEEN Sylhet Outlet", tag: "SYLHET SHOWROOM", address: "Block-A, House-54/2, Kumar Para, Sylhet", hours: "Open Daily: 10:30 AM - 09:30 PM", phone: "+8801952700500" },
];

export const StoreSection: React.FC<StoreSectionProps> = ({
  onAboutPress,
  onReportPress,
  onBroadcastPress,
  onAnalyticsPress,
  onCustomersPress,
}) => {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);
  const [outlets, setOutlets] = useState<Outlet[]>(FALLBACK_OUTLETS);
  const [whatsapp, setWhatsapp] = useState("01952-700500");

  useEffect(() => {
    fetchOutlets().then((o) => { if (o.length > 0) setOutlets(o); });
    fetchAppSettings().then((s) => { if (s?.contact?.whatsapp) setWhatsapp(s.contact.whatsapp); });
  }, []);

  const waNumber = (whatsapp || "01952700500").replace(/[^0-9]/g, "");

  return (
    <>
      {/* Store Outlets & Concierge */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Store size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>DEEN RETAIL OUTLETS</Text>
        </View>

        {outlets.map((outlet) => (
          <View key={outlet.id} style={styles.storeLocation}>
            <Text style={[styles.storeName, { color: colors.ink }]}>📍 {outlet.name}</Text>
            <Text style={[styles.storeAddr, { color: colors.sub }]}>{outlet.address}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.supportBox, { backgroundColor: colors.indigoLight }]}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(`https://wa.me/88${waNumber}`)}
        >
          <HelpCircle size={18} color={colors.indigo} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportText, { color: colors.indigoDark }]}>
              Customer Hotline & WhatsApp: <Text style={styles.bold}>+880 {whatsapp}</Text>
            </Text>
            <Text style={{ fontSize: 10, color: colors.sub, marginTop: 1 }}>
              Tap to Chat on WhatsApp
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={onAboutPress}
          >
            <Store size={15} color={colors.indigo} />
            <Text style={[styles.reportBtnText, { color: colors.indigo }]}>ABOUT DEEN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={onReportPress}
          >
            <HelpCircle size={15} color={colors.indigo} />
            <Text style={[styles.reportBtnText, { color: colors.indigo }]}>REPORT ISSUE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy, GDPR & Account Data Management */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Shield size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>PRIVACY & ACCOUNT DATA</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.sub, marginBottom: 12 }}>
          Manage your personal data in accordance with Bangladesh data protection principles and DEEN privacy policy.
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={async () => {
              const res = await exportUserData();
              if (res.success && res.data) {
                Alert.alert(
                  "Data Export Ready",
                  `Exported ${res.data.profile.ordersCount || 0} order records and profile data for ${res.data.profile.phone || res.data.profile.name}.`
                );
              } else {
                Alert.alert("Export Notice", res.message);
              }
            }}
          >
            <CheckCircle2 size={14} color={colors.indigo} />
            <Text style={[styles.reportBtnText, { color: colors.indigo }]}>EXPORT DATA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.crimson }]}
            onPress={() => {
              Alert.alert(
                "Delete Account & Reset Local Data?",
                "This will permanently clear your local authentication token, addresses, and saved preferences from this device.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await deleteUserAccount();
                      Alert.alert("Account Cleared", "Your local customer data and sessions have been reset.");
                    },
                  },
                ]
              );
            }}
          >
            <Trash2 size={14} color={colors.crimson} />
            <Text style={[styles.reportBtnText, { color: colors.crimson }]}>DELETE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Store Admin Portal (Gated) */}
      {profile.role === "admin" && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.indigo }]}>
          <View style={styles.cardHeader}>
            <Store size={17} color={colors.indigo} />
            <Text style={[styles.cardTitle, { color: colors.indigo }]}>STORE ADMIN & BI DASHBOARD</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.sub, marginBottom: 10 }}>
            Logged in with full Store Admin privileges. BI Analytics are active on Home.
          </Text>
          <TouchableOpacity
            style={[styles.broadcastBtn, { backgroundColor: colors.indigo, marginBottom: 8 }]}
            activeOpacity={0.88}
            onPress={onAnalyticsPress}
          >
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.broadcastBtnText}>📊 VIEW DETAILED BI ANALYTICS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.broadcastBtn, { backgroundColor: colors.emerald, marginBottom: 8 }]}
            activeOpacity={0.88}
            onPress={onCustomersPress}
          >
            <Users size={16} color="#FFFFFF" />
            <Text style={styles.broadcastBtnText}>👥 CUSTOMER DIRECTORY & ORDER PROFILES</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.broadcastBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.indigo, borderWidth: 1 }]}
            activeOpacity={0.88}
            onPress={onBroadcastPress}
          >
            <Sparkles size={16} color={colors.indigo} />
            <Text style={[styles.broadcastBtnText, { color: colors.indigo }]}>📢 SEND MARKETING BROADCAST PUSH</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    storeLocation: {
      marginBottom: 10,
    },
    storeName: {
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 2,
    },
    storeAddr: {
      fontSize: 11,
    },
    supportBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 8,
      marginTop: 6,
    },
    supportText: {
      fontSize: 11,
    },
    bold: {
      fontWeight: "800",
    },
    reportBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    reportBtnText: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    broadcastBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 8,
    },
    broadcastBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
  });
}
