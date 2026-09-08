import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LogOut, CheckCircle2, Key, Sparkles, Package, Heart, MapPin, User, TrendingUp, ArrowRight } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useOrders } from "../../context/OrderContext";
import { useWishlist } from "../../context/WishlistContext";

interface AccountHeaderProps {
  onLoginPress: () => void;
  onRegister: () => void;
  onOrdersPress?: () => void;
  onAddressPress?: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  onLoginPress,
  onRegister,
  onOrdersPress,
  onAddressPress,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, isLoggedIn, logout } = useProfile();
  const { orders } = useOrders();
  const { wishlist } = useWishlist();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  const isAdmin = profile.role === "admin";
  const isGuest = profile.isGuest;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top Banner Accent */}
      <View
        style={[
          styles.bannerAccent,
          { backgroundColor: isAdmin ? colors.indigo : isGuest ? colors.amber : colors.indigoDark },
        ]}
      />

      <View style={styles.cardBody}>
        <View style={styles.accountHeader}>
          {/* Avatar with Glow/Border */}
          <View
            style={[
              styles.avatarWrapper,
              {
                borderColor: isAdmin ? colors.amber : isGuest ? colors.border : colors.indigo,
                backgroundColor: colors.cardSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isAdmin ? colors.indigoDark : isGuest ? colors.paper : colors.indigo },
              ]}
            >
              <Text style={styles.avatarText}>
                {isAdmin
                  ? "👑"
                  : isGuest
                  ? "👤"
                  : typeof profile?.name === "string" && profile.name.trim()
                  ? profile.name.trim().charAt(0).toUpperCase()
                  : "D"}
              </Text>
            </View>
          </View>

          {/* Identity & Status */}
          <View style={styles.accountInfo}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.roleBadge,
                  isAdmin
                    ? { backgroundColor: "rgba(102, 126, 234, 0.15)", borderColor: colors.indigo }
                    : isGuest
                    ? { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: colors.amber }
                    : { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: colors.emerald },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    isAdmin
                      ? { color: colors.indigo }
                      : isGuest
                      ? { color: colors.amber }
                      : { color: colors.emerald },
                  ]}
                >
                  {isAdmin
                    ? "👑 STORE ADMINISTRATOR"
                    : isGuest
                    ? "🛍️ GUEST SHOPPER"
                    : "💎 DEEN CLUB MEMBER"}
                </Text>
              </View>

              {!isGuest && profile.memberSince ? (
                <Text style={[styles.memberSinceText, { color: colors.sub }]}>
                  Since {profile.memberSince}
                </Text>
              ) : null}
            </View>

            <Text style={[styles.accountName, { color: colors.ink }]} numberOfLines={1}>
              {isAdmin
                ? profile.name || "Store Administrator"
                : isGuest
                ? "Guest User"
                : profile.name || "DEEN Customer"}
            </Text>

            <Text style={[styles.accountSub, { color: colors.sub }]} numberOfLines={1}>
              {isAdmin
                ? "Verified WordPress Admin Credentials"
                : profile.phone
                ? `📞 ${profile.phone}`
                : profile.email
                ? `✉️ ${profile.email}`
                : "Fast Guest Checkout Active"}
            </Text>
          </View>
        </View>

        {/* Quick Stats Bar */}
        <View style={[styles.statsRow, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
          {isAdmin ? (
            <>
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.75}
                onPress={() => router.push("/admin")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={14} color={colors.indigo} />
                  <Text style={[styles.statValue, { color: colors.indigo }]}>Control</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>BI Hub</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

              <View style={styles.statItem}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[styles.statValue, { color: colors.amber }]}>Admin</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>Privileges</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.75}
                onPress={() => router.push("/admin")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Package size={14} color={colors.emerald} />
                  <Text style={[styles.statValue, { color: colors.emerald }]}>Live</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>Analytics</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.75}
                onPress={() => (onOrdersPress ? onOrdersPress() : router.push("/(tabs)/orders"))}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Package size={14} color={colors.indigo} />
                  <Text style={[styles.statValue, { color: colors.ink }]}>{orders?.length || 0}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>Orders</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.75}
                onPress={() => onAddressPress && onAddressPress()}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} color={colors.emerald} />
                  <Text style={[styles.statValue, { color: colors.ink }]}>
                    {profile?.city || "Dhaka"}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>District</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.75}
                onPress={() => router.push("/(tabs)/shop")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Heart size={14} color={colors.crimson} />
                  <Text style={[styles.statValue, { color: colors.ink }]}>{wishlist?.length || 0}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.sub }]}>Saved</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Authentication Actions */}
        <View style={[styles.authActionsRow, { borderTopColor: colors.borderLight }]}>
          {isLoggedIn ? (
            <TouchableOpacity
              style={[styles.authActionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.crimson }]}
              activeOpacity={0.85}
              onPress={() => logout()}
            >
              <LogOut size={14} color={colors.crimson} />
              <Text style={[styles.authActionBtnText, { color: colors.crimson }]}>LOG OUT</Text>
            </TouchableOpacity>
          ) : isGuest ? (
            <>
              <TouchableOpacity
                style={[styles.authActionBtn, { flex: 1.2, backgroundColor: colors.indigo }]}
                activeOpacity={0.88}
                onPress={onRegister}
              >
                <Sparkles size={14} color="#FFFFFF" />
                <Text style={[styles.authActionBtnText, { color: "#FFFFFF" }]}>CREATE ACCOUNT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authActionBtn, { flex: 1, backgroundColor: colors.paper, borderColor: colors.indigo }]}
                activeOpacity={0.88}
                onPress={onLoginPress}
              >
                <Key size={14} color={colors.indigo} />
                <Text style={[styles.authActionBtnText, { color: colors.indigo }]}>SIGN IN</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.authActionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => logout()}
              >
                <LogOut size={14} color={colors.crimson} />
                <Text style={[styles.authActionBtnText, { color: colors.crimson }]}>LOG OUT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authActionBtn, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }]}
                activeOpacity={0.85}
                onPress={onLoginPress}
              >
                <Key size={14} color={colors.indigo} />
                <Text style={[styles.authActionBtnText, { color: colors.indigo }]}>SWITCH ACCOUNT</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: {
      ...s.card,
      padding: 0,
      overflow: "hidden",
    },
    bannerAccent: {
      height: 4,
      width: "100%",
    },
    cardBody: {
      padding: 16,
    },
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatarWrapper: {
      padding: 3,
      borderRadius: 30,
      borderWidth: 1.5,
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 22,
      fontWeight: "900",
      color: "#FFFFFF",
    },
    accountInfo: {
      flex: 1,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    roleBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    memberSinceText: {
      fontSize: 10,
    },
    accountName: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    accountSub: {
      fontSize: 11,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginTop: 14,
      borderWidth: 1,
    },
    statItem: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      gap: 2,
    },
    statValue: {
      fontSize: 13,
      fontWeight: "900",
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    statDivider: {
      width: 1,
      height: 24,
    },
    authActionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    authActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    authActionBtnText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
  });
}
