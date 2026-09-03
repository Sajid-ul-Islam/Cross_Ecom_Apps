import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Lock, Key, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Edit } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { changePassword } from "../../services/gateway";

interface SecuritySectionProps {
  onRegisterPress?: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  onRegisterPress,
  onSuccessNotice,
}) => {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isGuest = profile.isGuest;

  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: colors.border };
    if (pass.length < 6) return { score: 1, label: "Too Short (Min 6)", color: colors.crimson };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const complexity = (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0) + (hasUpper ? 1 : 0);
    if (complexity >= 2 && pass.length >= 8) {
      return { score: 3, label: "Strong Password", color: colors.emerald };
    }
    return { score: 2, label: "Good", color: colors.amber };
  };

  const strength = calculateStrength(newPassword);

  const handleUpdatePassword = async () => {
    setNotice(null);
    if (!newPassword) {
      setNotice({ type: "error", text: "Please enter your new password." });
      return;
    }
    if (newPassword.length < 6) {
      setNotice({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", text: "New password and confirmation password do not match." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        identifier: profile.phone || profile.username || profile.email,
      });

      if (res.success) {
        setNotice({ type: "success", text: res.message || "✓ Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onSuccessNotice) {
          onSuccessNotice("✓ Account password updated successfully!");
        }
        setTimeout(() => {
          setEditing(false);
          setNotice(null);
        }, 1200);
      } else {
        setNotice({ type: "error", text: res.message || "Failed to update password." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error updating password. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (isGuest) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Lock size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>ACCOUNT SECURITY</Text>
        </View>

        <Text style={[styles.subText, { color: colors.sub }]}>
          You are currently in Fast Guest Checkout mode. Create a permanent DEEN account to set an account password and save addresses.
        </Text>

        <TouchableOpacity
          style={[styles.createAccountBtn, { backgroundColor: colors.indigo }]}
          activeOpacity={0.88}
          onPress={onRegisterPress}
        >
          <ShieldCheck size={16} color="#FFFFFF" />
          <Text style={styles.createAccountBtnText}>CREATE VERIFIED ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeaderBetween}>
        <View style={styles.headerLeftRow}>
          <Lock size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>ACCOUNT SECURITY</Text>
        </View>
        <TouchableOpacity
          style={[styles.editChip, { backgroundColor: colors.paper, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => setEditing(!editing)}
        >
          <Key size={12} color={colors.indigo} />
          <Text style={[styles.editChipText, { color: colors.indigo }]}>
            {editing ? "CLOSE" : "CHANGE"}
          </Text>
        </TouchableOpacity>
      </View>

      {!editing ? (
        /* Clean Summary Display */
        <View style={styles.summaryList}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>Account Password</Text>
            <Text style={[styles.summaryValue, { color: colors.ink }]}>••••••••••••</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.sub }]}>Protection Status</Text>
            <View style={[styles.protectedBadge, { backgroundColor: colors.emeraldLight }]}>
              <Text style={[styles.protectedText, { color: colors.emerald }]}>✓ SECURE</Text>
            </View>
          </View>
        </View>
      ) : (
        /* Editable Password Form */
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.subText, { color: colors.sub }]}>
            Update your login password. We recommend choosing at least 6 characters.
          </Text>

          {notice && (
            <View
              style={[
                styles.noticeBanner,
                notice.type === "success"
                  ? { backgroundColor: colors.emeraldLight, borderColor: colors.emerald }
                  : { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: colors.crimson },
              ]}
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={16} color={colors.emerald} />
              ) : (
                <AlertCircle size={16} color={colors.crimson} />
              )}
              <Text
                style={[
                  styles.noticeText,
                  { color: notice.type === "success" ? colors.emerald : colors.crimson },
                ]}
              >
                {notice.text}
              </Text>
            </View>
          )}

          {/* Current Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Current Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.paper, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputField, { color: colors.ink }]}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password (if known)"
                placeholderTextColor={colors.faint}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowCurrent(!showCurrent)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showCurrent ? <EyeOff size={18} color={colors.sub} /> : <Eye size={18} color={colors.sub} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>New Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.paper, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputField, { color: colors.ink }]}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.faint}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNew(!showNew)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showNew ? <EyeOff size={18} color={colors.sub} /> : <Eye size={18} color={colors.sub} />}
              </TouchableOpacity>
            </View>

            {/* Password Strength Bar */}
            {Boolean(newPassword) && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${(strength.score / 3) * 100}%`,
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.ink }]}>Confirm New Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.paper, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputField, { color: colors.ink }]}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-type new password"
                placeholderTextColor={colors.faint}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirm ? <EyeOff size={18} color={colors.sub} /> : <Eye size={18} color={colors.sub} />}
              </TouchableOpacity>
            </View>

            {Boolean(confirmPassword) && (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  marginTop: 4,
                  color: confirmPassword === newPassword ? colors.emerald : colors.crimson,
                }}
              >
                {confirmPassword === newPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.indigo },
              submitting && { opacity: 0.7 },
            ]}
            activeOpacity={0.88}
            onPress={handleUpdatePassword}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Key size={15} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>UPDATE PASSWORD</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    field: s.field,
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
    summaryList: {
      paddingVertical: 2,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: "700",
    },
    summaryDivider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      marginVertical: 2,
    },
    protectedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    protectedText: {
      fontSize: 10,
      fontWeight: "900",
    },
    subText: {
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 12,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    inputField: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 13,
    },
    eyeBtn: {
      padding: 6,
    },
    strengthWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    strengthBarBg: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      overflow: "hidden",
    },
    strengthBarFill: {
      height: "100%",
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 10,
      fontWeight: "800",
    },
    noticeBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
    },
    noticeText: {
      flex: 1,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 15,
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 6,
    },
    submitBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
    createAccountBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 6,
    },
    createAccountBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
}
