/**
 * Shared style tokens — single source of truth for the most commonly
 * duplicated StyleSheet definitions across the app.
 *
 * Usage in any component:
 *   import { sharedStyles } from "../theme/sharedStyles";
 *   const s = sharedStyles(colors);
 *   // Use s.card, s.label, s.input, etc. alongside screen-specific styles.
 */
import { StyleSheet, ViewStyle, TextStyle } from "react-native";
import { ThemeColors } from "./colors";

interface SharedStyleMap {
  // Screen-level
  safeArea: ViewStyle;
  scrollContent: ViewStyle;

  // Card system
  card: ViewStyle;
  cardHeader: ViewStyle;
  cardTitle: TextStyle;

  // Forms
  field: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  multilineInput: TextStyle;

  // Chips / selectors
  chipsRow: ViewStyle;
  sizeChip: ViewStyle;
  sizeChipText: TextStyle;

  // Buttons
  saveBtn: ViewStyle;
  saveBtnText: TextStyle;

  // Badges
  badge: ViewStyle;
  badgeText: TextStyle;

  // Empty states
  center: ViewStyle;
  emptyContainer: ViewStyle;
  emptyTitle: TextStyle;
  emptySub: TextStyle;

  // Utilities
  bold: TextStyle;
  sectionHeader: ViewStyle;
}

export function sharedStyles(colors: ThemeColors): SharedStyleMap {
  return {
    // ─── Screen-level ────────────────────────────────────────
    safeArea: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    scrollContent: {
      padding: 16,
      gap: 12,
      paddingBottom: 40,
    },

    // ─── Card system ─────────────────────────────────────────
    card: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    // ─── Forms ───────────────────────────────────────────────
    field: {
      marginBottom: 12,
    },
    label: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
    },
    multilineInput: {
      minHeight: 70,
      textAlignVertical: "top",
    },

    // ─── Chips / selectors ───────────────────────────────────
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    sizeChip: {
      minWidth: 44,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderRadius: 6,
      alignItems: "center",
    },
    sizeChipText: {
      fontSize: 12,
      fontWeight: "800",
    },

    // ─── Buttons ─────────────────────────────────────────────
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    // ─── Badges ──────────────────────────────────────────────
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.crimson,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },

    // ─── Empty states ────────────────────────────────────────
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.ink,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 12,
      color: colors.sub,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 16,
    },

    // ─── Utilities ───────────────────────────────────────────
    bold: {
      fontWeight: "800",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginTop: 18,
      marginBottom: 10,
    },
  };
}
