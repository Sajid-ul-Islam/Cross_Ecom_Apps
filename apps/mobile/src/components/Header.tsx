import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, ArrowLeft, Search } from "lucide-react-native";
import { Colors } from "../theme/colors";
import { useCart } from "../context/CartContext";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showBag?: boolean;
  subtitle?: string;
  onSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "DEEN",
  showBack = false,
  showSearch = true,
  showBag = true,
  subtitle,
  onSearchPress,
}) => {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.paper} />
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={Colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>{title}</Text>
            {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : (
              <Text style={styles.brandTag}>DENIM &amp; CO · BD</Text>
            )}
          </View>
        )}

        {showBack && (
          <View style={styles.centerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
        )}

        <View style={styles.rightActions}>
          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSearchPress || (() => router.push("/(tabs)/shop"))}
            >
              <Search size={20} color={Colors.ink} />
            </TouchableOpacity>
          )}

          {showBag && (
            <TouchableOpacity
              style={styles.bagButton}
              onPress={() => router.push("/(tabs)/bag")}
            >
              <ShoppingBag size={20} color={Colors.ink} />
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.paper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  brandContainer: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    color: Colors.indigoDark,
  },
  brandTag: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: Colors.denimStitch,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.sub,
  },
  centerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.ink,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.sub,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bagButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.crimson,
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
});
