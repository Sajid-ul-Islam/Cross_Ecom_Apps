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
import { X, Lock, User, CheckCircle2, Key, ArrowRight } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";

const { width, height } = Dimensions.get("window");

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const { login, profile } = useProfile();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setPassword("");
      setNotice(null);
    }
  }, [visible]);

  const handleSignIn = async () => {
    if (!username.trim()) {
      setNotice({ type: "error", text: "Please enter your username." });
      return;
    }
    if (!password) {
      setNotice({ type: "error", text: "Please enter your password." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        setNotice({ type: "success", text: `Welcome back, ${username.trim()}!` });
        setTimeout(() => {
          setSubmitting(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setSubmitting(false);
        setNotice({ type: "error", text: res.message || "Invalid username or password." });
      }
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Network error during sign in." });
    }
  };

  const isAdmin = profile.role === "admin";

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
                <Text style={[styles.title, { color: colors.ink }]}>SIGN IN</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  Use your deencommerce.com account
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

            <View style={[styles.currentActiveBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.currentActiveLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isAdmin ? colors.amber : colors.emerald },
                  ]}
                />
                <View>
                  <Text style={[styles.currentActiveLabel, { color: colors.sub }]}>CURRENTLY SIGNED IN AS:</Text>
                  <Text style={[styles.currentActiveValue, { color: colors.ink }]}>
                    {isAdmin ? "Store Admin (Full BI Access)" : profile.isGuest ? "Guest User" : `${profile.name || "Customer"}`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.manualBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.manualHeading, { color: colors.ink }]}>SIGN IN TO YOUR ACCOUNT</Text>
              <Text style={[styles.manualSub, { color: colors.sub }]}>
                Enter your WordPress username and password.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.ink }]}>Username / Email</Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                  ]}
                >
                  <User size={18} color={colors.sub} />
                  <TextInput
                    style={[styles.inputField, { color: colors.ink }]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="your username"
                    placeholderTextColor={colors.faint}
                    autoCapitalize="none"
                    autoCorrect={false}
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
                    placeholder="your password"
                    placeholderTextColor={colors.faint}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
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
                    <Text style={styles.submitBtnText}>SIGN IN</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.guestLink}>
                <Text style={[styles.guestLinkText, { color: colors.sub }]}>
                  Continue as guest
                </Text>
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
  manualBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  manualHeading: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  manualSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "CabinetGrotesk-Bold",
    letterSpacing: 0.5,
  },
  guestLink: {
    alignItems: "center",
    marginTop: 14,
  },
  guestLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
