import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeColors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { useTheme } from "../context/ThemeContext";

interface SectionHeaderProps {
  /** Bold section title */
  title: string;
  /** Light subtitle below the title */
  subtitle?: string;
  /** Action link text on the right (e.g. "View All") — hidden when omitted */
  actionText?: string;
  /** Press handler for the action link */
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
}) => {
  const { colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {actionText && onActionPress ? (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.seeAllText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      marginTop: 18,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.sub,
      marginTop: 2,
    },
    seeAllText: {
      fontSize: 12,
      color: colors.indigo,
      fontWeight: "700",
    },
  });
}
