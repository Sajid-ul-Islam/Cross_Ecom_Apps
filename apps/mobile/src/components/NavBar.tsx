import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, ArrowLeft } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";

interface NavBarProps {
  /** Center title text */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Show the back arrow on the left (default true) */
  showBack?: boolean;
  /** Show the shopping bag icon on the right (default true) */
  showBag?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({
  title,
  subtitle,
  showBack = true,
  showBag = true,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { totalItems } = useCart();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <View style={[styles.navBar, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
      {/* Left: Back button or empty spacer */}
      {showBack ? (
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}

      {/* Center: Title + optional subtitle */}
      {title ? (
        <View style={styles.titleCenter}>
          <Text style={[styles.navTitle, { color: colors.ink }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.navSub, { color: colors.sub }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.titleCenter} />
      )}

      {/* Right: Shopping bag with badge */}
      {showBag ? (
        <TouchableOpacity
          style={[styles.bagBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <ShoppingBag size={20} color={colors.ink} />
          {totalItems > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.indigo }]}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    titleCenter: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 10,
    },
    navTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    navSub: {
      fontSize: 10,
      color: colors.sub,
      marginTop: 2,
    },
    bagBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
    },
    badge: s.badge,
    badgeText: s.badgeText,
  });
}
