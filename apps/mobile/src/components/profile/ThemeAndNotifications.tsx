import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { Sparkles, Bell } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";

interface ThemeAndNotificationsProps {
  pushOrders: boolean;
  pushPromos: boolean;
  onPushOrdersChange: (value: boolean) => void;
  onPushPromosChange: (value: boolean) => void;
}

export const ThemeAndNotifications: React.FC<ThemeAndNotificationsProps> = ({
  pushOrders,
  pushPromos,
  onPushOrdersChange,
  onPushPromosChange,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <>
      {/* Appearance & Theme */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Sparkles size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>APPEARANCE & THEME</Text>
        </View>

        <View style={styles.themeRow}>
          {(["system", "light", "dark"] as const).map((mode) => {
            const active = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                activeOpacity={0.8}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.themeChip,
                  { backgroundColor: colors.paper, borderColor: colors.border },
                  active && { backgroundColor: colors.indigo, borderColor: colors.indigo },
                ]}
              >
                <Text style={{ fontSize: 16, marginBottom: 2 }}>
                  {mode === "system" ? "🌓" : mode === "light" ? "☀️" : "🌙"}
                </Text>
                <Text style={[styles.themeChipText, { color: active ? "#FFFFFF" : colors.ink }]}>
                  {mode === "system" ? "SYSTEM" : mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Bell size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>NOTIFICATION PREFERENCES</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.ink }]}>Order & Parcel Tracking</Text>
            <Text style={[styles.toggleSub, { color: colors.sub }]}>Live Pathao dispatch and delivery alerts</Text>
          </View>
          <Switch
            value={pushOrders}
            onValueChange={onPushOrdersChange}
            trackColor={{ false: colors.border, true: colors.indigo }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.toggleDivider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.ink }]}>Festive Sales & Raw Denim Drops</Text>
            <Text style={[styles.toggleSub, { color: colors.sub }]}>Exclusive selvedge alerts and discounts</Text>
          </View>
          <Switch
            value={pushPromos}
            onValueChange={onPushPromosChange}
            trackColor={{ false: colors.border, true: colors.indigo }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    themeRow: {
      flexDirection: "row",
      gap: 8,
    },
    themeChip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    themeChipText: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleText: {
      flex: 1,
      paddingRight: 12,
    },
    toggleLabel: {
      fontSize: 13,
      fontWeight: "800",
    },
    toggleSub: {
      fontSize: 11,
      marginTop: 2,
    },
    toggleDivider: {
      height: 1,
      marginVertical: 12,
    },
  });
}
