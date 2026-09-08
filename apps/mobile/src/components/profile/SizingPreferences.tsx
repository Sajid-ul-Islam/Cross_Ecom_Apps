import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ruler, Edit } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";

const JEANS_SIZES = ["28", "30", "32", "34", "36", "38"];
const TOP_SIZES = ["S", "M", "L", "XL", "XXL"];

interface SizingPreferencesProps {
  jeansSize: string;
  topSize: string;
  onJeansSizeChange: (size: string) => void;
  onTopSizeChange: (size: string) => void;
  onSave?: () => void;
}

export const SizingPreferences: React.FC<SizingPreferencesProps> = ({
  jeansSize,
  topSize,
  onJeansSizeChange,
  onTopSizeChange,
  onSave,
}) => {
  const { colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  const [editing, setEditing] = useState(false);

  const handleToggle = () => {
    if (editing && onSave) onSave();
    setEditing(!editing);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeaderBetween}>
        <View style={styles.headerLeftRow}>
          <Ruler size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>FIT & SIZING PREFERENCES</Text>
        </View>
        <TouchableOpacity
          style={[styles.editChip, { backgroundColor: colors.paper, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={handleToggle}
        >
          <Edit size={12} color={colors.indigo} />
          <Text style={[styles.editChipText, { color: colors.indigo }]}>
            {editing ? "DONE" : "EDIT"}
          </Text>
        </TouchableOpacity>
      </View>

      {!editing ? (
        /* Clean Summary Display */
        <View style={styles.summaryRow}>
          <View style={[styles.sizeBadge, { backgroundColor: colors.paper, borderColor: colors.border }]}>
            <Text style={[styles.sizeBadgeLabel, { color: colors.sub }]}>Jeans Waist</Text>
            <Text style={[styles.sizeBadgeValue, { color: colors.indigo }]}>👖 {jeansSize}"</Text>
          </View>

          <View style={[styles.sizeBadge, { backgroundColor: colors.paper, borderColor: colors.border }]}>
            <Text style={[styles.sizeBadgeLabel, { color: colors.sub }]}>Top / Panjabi</Text>
            <Text style={[styles.sizeBadgeValue, { color: colors.indigo }]}>👕 Size {topSize}</Text>
          </View>
        </View>
      ) : (
        /* Edit Chips */
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.fieldSub, { color: colors.sub }]}>
            Select your preferred waist and top size for automatic 1-tap checkout.
          </Text>

          <Text style={[styles.label, { color: colors.ink, marginTop: 10 }]}>Jeans Waist Size (Inches)</Text>
          <View style={styles.chipsRow}>
            {JEANS_SIZES.map((sz) => {
              const active = jeansSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[
                    styles.sizeChip,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    active && { backgroundColor: colors.indigo, borderColor: colors.indigo },
                  ]}
                  onPress={() => onJeansSizeChange(sz)}
                >
                  <Text style={[styles.sizeChipText, { color: active ? "#FFFFFF" : colors.ink }]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.ink, marginTop: 12 }]}>Top / Panjabi / Shirt Size</Text>
          <View style={styles.chipsRow}>
            {TOP_SIZES.map((sz) => {
              const active = topSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[
                    styles.sizeChip,
                    { backgroundColor: colors.paper, borderColor: colors.border },
                    active && { backgroundColor: colors.indigo, borderColor: colors.indigo },
                  ]}
                  onPress={() => onTopSizeChange(sz)}
                >
                  <Text style={[styles.sizeChipText, { color: active ? "#FFFFFF" : colors.ink }]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.indigo }]}
            activeOpacity={0.88}
            onPress={handleToggle}
          >
            <Text style={styles.doneBtnText}>✓ SAVE SIZING PREFERENCES</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardTitle: s.cardTitle,
    label: s.label,
    cardHeaderBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    headerLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    editChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
    },
    editChipText: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 2,
    },
    sizeBadge: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
    },
    sizeBadgeLabel: {
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 4,
    },
    sizeBadgeValue: {
      fontSize: 15,
      fontWeight: "900",
    },
    fieldSub: {
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 4,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
    },
    sizeChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
    },
    sizeChipText: {
      fontSize: 12,
      fontWeight: "800",
    },
    doneBtn: {
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
    },
    doneBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
}
