import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LogOut, CheckCircle2, Key } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";

interface AccountHeaderProps {
  onLoginPress: () => void;
  onRegister: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({ onLoginPress, onRegister }) => {
  const { colors } = useTheme();
  const { profile, isLoggedIn, switchToGuestMode, logout } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.accountHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.indigo }]}>
          <Text style={styles.avatarText}>
            {profile.role === "admin"
              ? "👑"
              : profile.isGuest
              ? "👤"
              : profile.name
              ? profile.name.charAt(0).toUpperCase()
              : "D"}
          </Text>
        </View>

        <View style={styles.accountInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.roleBadge,
                profile.role === "admin"
                  ? { backgroundColor: colors.indigoLight }
                  : profile.isGuest
                  ? { backgroundColor: colors.amberLight }
                  : { backgroundColor: colors.emeraldLight },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  profile.role === "admin"
                    ? { color: colors.indigo }
                    : profile.isGuest
                    ? { color: colors.amber }
                    : { color: colors.emerald },
                ]}
              >
                {profile.role === "admin"
                  ? "STORE ADMIN"
                  : profile.isGuest
                  ? "GUEST SHOPPER"
                  : "VERIFIED MEMBER"}
              </Text>
            </View>

            {!profile.isGuest && profile.memberSince ? (
              <Text style={[styles.memberSinceText, { color: colors.sub }]}>
                Since {profile.memberSince}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.accountName, { color: colors.ink }]}>
            {profile.role === "admin"
              ? "Store Administrator"
              : profile.isGuest
              ? "Guest User"
              : profile.name || "DEEN Member"}
          </Text>

          <Text style={[styles.accountSub, { color: colors.sub }]}>
            {profile.role === "admin"
              ? "Full BI & Sales Insights Active"
              : profile.phone || profile.email || "Fast guest checkout active"}
          </Text>
        </View>
      </View>

      {/* Mode Switching / Authentication Buttons */}
      <View style={[styles.authActionsRow, { borderTopColor: colors.borderLight }]}>
        {isLoggedIn ? (
          <TouchableOpacity
            style={[styles.authActionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => logout()}
          >
            <LogOut size={14} color={colors.crimson} />
            <Text style={[styles.authActionBtnText, { color: colors.crimson }]}>LOG OUT</Text>
          </TouchableOpacity>
        ) : profile.isGuest ? (
          <>
            <TouchableOpacity
              style={[styles.authActionBtn, { backgroundColor: colors.indigo }]}
              activeOpacity={0.88}
              onPress={onRegister}
            >
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={[styles.authActionBtnText, { color: "#FFFFFF" }]}>SAVE PROFILE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authActionBtn, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }]}
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
              onPress={switchToGuestMode}
            >
              <Text style={[styles.authActionBtnText, { color: colors.ink }]}>GUEST MODE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authActionBtn, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }]}
              activeOpacity={0.88}
              onPress={onLoginPress}
            >
              <Key size={14} color={colors.indigo} />
              <Text style={[styles.authActionBtnText, { color: colors.indigo }]}>SWITCH ACCOUNT</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
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
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
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
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0.3,
    },
    accountSub: {
      fontSize: 12,
      marginTop: 2,
    },
    authActionsRow: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 8,
    },
    authActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: "transparent",
    },
    authActionBtnText: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
}
