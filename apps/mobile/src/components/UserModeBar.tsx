import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { User, Store } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";

const { width } = Dimensions.get("window");

interface UserModeBarProps {
  showDescription?: boolean;
}

export const UserModeBar: React.FC<UserModeBarProps> = ({ showDescription = true }) => {
  const { colors } = useTheme();
  const { currentMode, profile, switchToGuestMode } = useProfile();
  const [justSwitched, setJustSwitched] = useState<string | null>(null);

  const handleSelect = async (mode: "registered" | "guest") => {
    if (mode === currentMode) return;
    if (mode === "guest") {
      await switchToGuestMode();
      setJustSwitched("⚡ Guest Mode Active: Anonymous fast checkout without registration.");
    } else {
      setJustSwitched("👤 Customer Mode: sign in to load your account.");
    }
    setTimeout(() => setJustSwitched(null), 4000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.topTitleRow}>
          <Store size={14} color={colors.indigo} />
          <Text style={[styles.topTitle, { color: colors.ink }]}>ACCOUNT MODE</Text>
        </View>
        <View
          style={[
            styles.modeIndicator,
            currentMode === "admin"
              ? styles.modeIndicatorAdmin
              : currentMode === "registered"
              ? styles.modeIndicatorReg
              : styles.modeIndicatorGuest,
          ]}
        >
          <Text
            style={[
              styles.modeIndicatorText,
              currentMode === "admin"
                ? styles.modeIndicatorTextAdmin
                : currentMode === "registered"
                ? styles.modeIndicatorTextReg
                : styles.modeIndicatorTextGuest,
            ]}
          >
            {currentMode === "admin" ? "ADMIN ACTIVE" : currentMode === "registered" ? "CUSTOMER" : "GUEST"}
          </Text>
        </View>
      </View>

      <View style={[styles.tabsRow, { backgroundColor: colors.cardSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            currentMode === "registered" && [
              styles.tabItemActive,
              { backgroundColor: colors.paper, borderColor: colors.indigo },
            ],
          ]}
          activeOpacity={0.85}
          onPress={() => handleSelect("registered")}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text
            style={[
              styles.tabTitle,
              { color: currentMode === "registered" ? colors.indigoDark : colors.sub },
              currentMode === "registered" && styles.tabTitleActive,
            ]}
          >
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            currentMode === "guest" && [
              styles.tabItemActive,
              { backgroundColor: colors.paper, borderColor: colors.indigo },
            ],
          ]}
          activeOpacity={0.85}
          onPress={() => handleSelect("guest")}
        >
          <Text style={styles.tabIcon}>⚡</Text>
          <Text
            style={[
              styles.tabTitle,
              { color: currentMode === "guest" ? colors.indigoDark : colors.sub },
              currentMode === "guest" && styles.tabTitleActive,
            ]}
          >
            Guest
          </Text>
        </TouchableOpacity>
      </View>

      {justSwitched ? (
        <View style={styles.switchBanner}>
          <Text style={styles.switchBannerText}>{justSwitched}</Text>
        </View>
      ) : showDescription ? (
        <Text style={[styles.descText, { color: colors.sub }]}>
          {currentMode === "admin"
            ? "👑 Admin Mode: Full BI dashboard active on Home."
            : currentMode === "registered"
            ? `👤 Customer Mode: Logged in as ${profile.name || "Customer"}.`
            : "⚡ Guest Mode: Anonymous checkout without registration."}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  modeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeIndicatorAdmin: {
    backgroundColor: "#EDE9FE",
  },
  modeIndicatorReg: {
    backgroundColor: "#DCFCE7",
  },
  modeIndicatorGuest: {
    backgroundColor: "#FEF3C7",
  },
  modeIndicatorText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modeIndicatorTextAdmin: {
    color: "#6D28D9",
  },
  modeIndicatorTextReg: {
    color: "#166534",
  },
  modeIndicatorTextGuest: {
    color: "#B45309",
  },
  tabsRow: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 4,
  },
  tabItemActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabTitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabTitleActive: {
    fontWeight: "800",
  },
  switchBanner: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  switchBannerText: {
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  descText: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
});
