import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { X, Lock, User, Phone, CheckCircle2, Sparkles, ShieldCheck, Key, ArrowRight } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import { DemoAccount } from "../types";

const { width, height } = Dimensions.get("window");

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors, isDark } = useTheme();
  const {
    profile,
    demoAccounts,
    activeDemoId,
    loginWithCredentials,
    loginAsDemoAccount,
    switchToGuestMode,
  } = useProfile();

  const [identifier, setIdentifier] = useState("customer");
  const [password, setPassword] = useState("deen1234");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Default prefill when opening
  useEffect(() => {
    if (visible) {
      if (profile.role === "admin") {
        setIdentifier("admin");
        setPassword("admin123");
      } else if (profile.phone?.includes("776655")) {
        setIdentifier("vip");
        setPassword("deen1234");
      } else if (profile.isGuest) {
        setIdentifier("guest");
        setPassword("");
      } else {
        setIdentifier("customer");
        setPassword("deen1234");
      }
      setNotice(null);
    }
  }, [visible, profile]);

  const handleSelectDemo = (acc: DemoAccount) => {
    setIdentifier(acc.username);
    setPassword(acc.password);
    setNotice({
      type: "success",
      text: `Loaded credentials for ${acc.name}. Tap "SIGN IN" or double tap card.`,
    });
  };

  const handleQuickLoginDemo = async (acc: DemoAccount) => {
    setSubmitting(true);
    setIdentifier(acc.username);
    setPassword(acc.password);
    try {
      await loginAsDemoAccount(acc.id);
      setNotice({
        type: "success",
        text: `✓ Logged in as ${acc.name} (${acc.badge})!`,
      });
      setTimeout(() => {
        setSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Login failed. Please try again." });
    }
  };

  const handleSignIn = async () => {
    if (!identifier.trim()) {
      setNotice({ type: "error", text: "Please enter a username, phone, or email." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginWithCredentials(identifier, password);
      if (res.success) {
        setNotice({ type: "success", text: res.message });
        setTimeout(() => {
          setSubmitting(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
      } else {
        setSubmitting(false);
        setNotice({ type: "error", text: res.message });
      }
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Network error during authentication." });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <Key size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>TEST ACCOUNTS &amp; SIGN IN</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  Demo credentials for customer, VIP &amp; store admin
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={onClose}
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Status notice */}
            {notice && (
              <View
                style={[
                  styles.noticeBanner,
                  notice.type === "success" ? styles.noticeSuccess : styles.noticeError,
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    notice.type === "success" ? styles.noticeTextSuccess : styles.noticeTextError,
                  ]}
                >
                  {notice.text}
                </Text>
              </View>
            )}

            {/* Current Active Badge */}
            <View style={[styles.currentActiveBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.currentActiveLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: profile.role === "admin" ? colors.amber : colors.emerald },
                  ]}
                />
                <View>
                  <Text style={[styles.currentActiveLabel, { color: colors.sub }]}>CURRENTLY SIGNED IN AS:</Text>
                  <Text style={[styles.currentActiveValue, { color: colors.ink }]}>
                    {profile.role === "admin"
                      ? "Store Admin (Full BI Access)"
                      : profile.isGuest
                      ? "Guest User (01911-000000)"
                      : `${profile.name} (${profile.phone})`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick 1-Tap Demo Account Selectors */}
            <Text style={[styles.sectionHeading, { color: colors.ink }]}>
              1-TAP TEST CREDENTIALS PRESETS
            </Text>
            <Text style={[styles.sectionSub, { color: colors.sub }]}>
              Tap any account below to instantly prefill or log in:
            </Text>

            <View style={styles.demoList}>
              {demoAccounts.map((acc) => {
                const isSelected = identifier.toLowerCase() === acc.username.toLowerCase();
                const isActive = activeDemoId === acc.id;

                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.demoCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isSelected ? colors.indigo : colors.border,
                      },
                      isSelected && styles.demoCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSelectDemo(acc)}
                  >
                    <View style={styles.demoCardHeader}>
                      <View style={styles.demoCardBadgeRow}>
                        <View
                          style={[
                            styles.demoBadge,
                            acc.role === "admin"
                              ? styles.demoBadgeAdmin
                              : acc.accountType === "guest"
                              ? styles.demoBadgeGuest
                              : acc.id === "vip"
                              ? styles.demoBadgeVip
                              : styles.demoBadgeCustomer,
                          ]}
                        >
                          <Text
                            style={[
                              styles.demoBadgeText,
                              acc.role === "admin"
                                ? styles.demoBadgeTextAdmin
                                : acc.accountType === "guest"
                                ? styles.demoBadgeTextGuest
                                : acc.id === "vip"
                                ? styles.demoBadgeTextVip
                                : styles.demoBadgeTextCustomer,
                            ]}
                          >
                            {acc.badge}
                          </Text>
                        </View>
                        {isActive && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.quickSignBtn, { backgroundColor: colors.indigo }]}
                        onPress={() => handleQuickLoginDemo(acc)}
                      >
                        <Text style={styles.quickSignBtnText}>1-Tap Sign In</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.demoName, { color: colors.ink }]}>{acc.name}</Text>
                    <Text style={[styles.demoDesc, { color: colors.sub }]}>{acc.description}</Text>

                    <View style={[styles.credGrid, { backgroundColor: colors.cardSecondary }]}>
                      <View style={styles.credCol}>
                        <Text style={styles.credKey}>USERNAME</Text>
                        <Text style={[styles.credVal, { color: colors.ink }]} selectable>
                          {acc.username}
                        </Text>
                      </View>

                      <View style={styles.credCol}>
                        <Text style={styles.credKey}>PASSWORD</Text>
                        <Text style={[styles.credVal, { color: colors.ink }]} selectable>
                          {acc.password || "(None - Guest)"}
                        </Text>
                      </View>

                      <View style={styles.credCol}>
                        <Text style={styles.credKey}>PHONE NUMBER</Text>
                        <Text style={[styles.credVal, { color: colors.ink }]} selectable>
                          {acc.phone}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Manual Form Login */}
            <View style={[styles.manualBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.manualHeading, { color: colors.ink }]}>MANUAL SIGN-IN FORM</Text>
              <Text style={[styles.manualSub, { color: colors.sub }]}>
                Test with custom credentials or edit values:
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.ink }]}>Username / Phone / Email</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                  ]}
                >
                  <User size={18} color={colors.sub} />
                  <TextInput
                    style={[styles.inputField, { color: colors.ink }]}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="e.g. customer, 01712-345678, admin"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.ink }]}>Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                  ]}
                >
                  <Lock size={18} color={colors.sub} />
                  <TextInput
                    style={[styles.inputField, { color: colors.ink }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password (e.g. deen1234)"
                    placeholderTextColor={colors.faint}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.indigo },
                  submitting && styles.btnDisabled,
                ]}
                activeOpacity={0.88}
                onPress={handleSignIn}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Key size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>AUTHENTICATE &amp; SIGN IN</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: "CabinetGrotesk-Bold",
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  noticeBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  noticeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  noticeError: {
    backgroundColor: "#FEE2E2",
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noticeTextSuccess: {
    color: "#166534",
  },
  noticeTextError: {
    color: "#991B1B",
  },
  currentActiveBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  currentActiveLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currentActiveLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  currentActiveValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  demoList: {
    gap: 12,
    marginBottom: 20,
  },
  demoCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  demoCardSelected: {
    borderWidth: 2,
  },
  demoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  demoCardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoBadgeCustomer: {
    backgroundColor: "#EFF6FF",
  },
  demoBadgeVip: {
    backgroundColor: "#FEF3C7",
  },
  demoBadgeAdmin: {
    backgroundColor: "#EDE9FE",
  },
  demoBadgeGuest: {
    backgroundColor: "#F3F4F6",
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  demoBadgeTextCustomer: {
    color: "#1D4ED8",
  },
  demoBadgeTextVip: {
    color: "#B45309",
  },
  demoBadgeTextAdmin: {
    color: "#6D28D9",
  },
  demoBadgeTextGuest: {
    color: "#4B5563",
  },
  activePill: {
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  quickSignBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickSignBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  demoName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  demoDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  credGrid: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 10,
    justifyContent: "space-between",
  },
  credCol: {
    flex: 1,
  },
  credKey: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8B95A5",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  credVal: {
    fontSize: 11,
    fontWeight: "700",
  },
  manualBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  manualHeading: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  manualSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
