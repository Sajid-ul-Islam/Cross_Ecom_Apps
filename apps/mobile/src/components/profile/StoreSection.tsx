import React, { useState } from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Store, HelpCircle, Sparkles, Facebook, Instagram, Shield, Trash2, CheckCircle2 } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { exportUserData, deleteUserAccount } from "../../services/gateway";

interface StoreSectionProps {
  onAboutPress: () => void;
  onReportPress: () => void;
  onBroadcastPress: () => void;
  onAnalyticsPress: () => void;
}

export const StoreSection: React.FC<StoreSectionProps> = ({
  onAboutPress,
  onReportPress,
  onBroadcastPress,
  onAnalyticsPress,
}) => {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <>
      {/* Store Outlets & Concierge */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Store size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>DEEN RETAIL OUTLETS</Text>
        </View>

        <View style={styles.storeLocation}>
          <Text style={[styles.storeName, { color: colors.ink }]}>📍 Mirpur 12 (Flagship Outlet)</Text>
          <Text style={[styles.storeAddr, { color: colors.sub }]}>
            2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216
          </Text>
        </View>

        <View style={styles.storeLocation}>
          <Text style={[styles.storeName, { color: colors.ink }]}>📍 Wari Outlet (Dhaka South)</Text>
          <Text style={[styles.storeAddr, { color: colors.sub }]}>
            Ground Floor, 41 A.K Famous Tower, Rankin St, Wari, Dhaka-1203
          </Text>
        </View>

        <View style={styles.storeLocation}>
          <Text style={[styles.storeName, { color: colors.ink }]}>📍 Cumilla Outlet</Text>
          <Text style={[styles.storeAddr, { color: colors.sub }]}>
            4th Floor, QR Tower, Badurtola, Cumilla
          </Text>
        </View>

        <View style={styles.storeLocation}>
          <Text style={[styles.storeName, { color: colors.ink }]}>📍 Sylhet Outlet</Text>
          <Text style={[styles.storeAddr, { color: colors.sub }]}>
            Block-A, House-54/2, Kumar Para, Sylhet
          </Text>
        </View>

        <View style={[styles.supportBox, { backgroundColor: colors.indigoLight }]}>
          <HelpCircle size={18} color={colors.indigo} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportText, { color: colors.indigoDark }]}>
              Customer Hotline & WhatsApp: <Text style={styles.bold}>+880 1952-700500</Text>
            </Text>
            <Text style={{ fontSize: 10, color: colors.sub, marginTop: 1 }}>
              Open 10:00 AM – 10:00 PM Daily
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "#1877F2",
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => Linking.openURL("https://www.facebook.com/deencommerce")}
          >
            <Facebook size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 11 }}>
              FACEBOOK
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: "#E1306C",
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => Linking.openURL("https://www.instagram.com/deencommerce")}
          >
            <Instagram size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 11 }}>
              INSTAGRAM
            </Text>
          </TouchableOpacity>
        </View>

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
        <Text style={{ fontSize: 11, color: colors.sub, marginBottom: 12, lineHeight: 16 }}>
          You have full control over your saved personal data and session preferences.
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={async () => {
              try {
                const res = await exportUserData();
                if (res.success) {
                  Alert.alert(
                    "Account Data Exported",
                    `Profile Name: ${res.data?.profile?.name || "Guest"}\nIdentifier: ${res.data?.profile?.username || "N/A"}\nExported: ${new Date().toLocaleDateString()}`
                  );
                } else {
                  Alert.alert("Account Data", "You are currently browsing as a guest. Register or sign in to export your permanent order history.");
                }
              } catch {
                Alert.alert("Notice", "Your local profile data is safely stored on this device.");
              }
            }}
          >
            <Shield size={14} color={colors.indigo} />
            <Text style={[styles.reportBtnText, { color: colors.indigo }]}>EXPORT DATA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportBtn, { flex: 1, backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            onPress={() => {
              Alert.alert(
                "Delete Account & Data",
                "Are you sure you want to clear your local customer profile, saved addresses, and active sessions on this device?",
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
