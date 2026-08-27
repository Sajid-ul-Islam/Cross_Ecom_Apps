import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ruler } from "../Icons";
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
}

export const SizingPreferences: React.FC<SizingPreferencesProps> = ({
  jeansSize,
  topSize,
  onJeansSizeChange,
  onTopSizeChange,
}) => {
  const { colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Ruler size={17} color={colors.indigo} />
        <Text style={[styles.cardTitle, { color: colors.ink }]}>FIT & SIZING PREFERENCES</Text>
      </View>

      <Text style={[styles.fieldSub, { color: colors.sub }]}>
        Auto-selects your preferred waist and top size across all product pages.
      </Text>

      <Text style={[styles.label, { color: colors.ink, marginTop: 8 }]}>Jeans Waist Size (Inches)</Text>
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

      <Text style={[styles.label, { color: colors.ink, marginTop: 14 }]}>Shirt / Panjabi / Tee Size</Text>
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
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    fieldSub: {
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 8,
    },
    label: s.label,
    chipsRow: s.chipsRow,
    sizeChip: s.sizeChip,
    sizeChipText: s.sizeChipText,
  });
}
