import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

interface SocialAuthModalProps {
  visible: boolean;
  onClose: () => void;
  provider: "google" | "facebook";
  onSelectAccount: (email: string, name: string) => Promise<void>;
  currentEmailHint?: string;
  currentNameHint?: string;
}

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  visible,
  onClose,
  provider,
  onSelectAccount,
  currentEmailHint,
  currentNameHint,
}) => {
  const { colors, isDark } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Use another account"
  const [useOther, setUseOther] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  if (!visible) return null;

  const isGoogle = provider === "google";

  const defaultAccounts = isGoogle
    ? [
        {
          name: currentNameHint || "DEEN Shopper",
          email: currentEmailHint?.includes("@") ? currentEmailHint : "sajid.islam@gmail.com",
          avatarColor: "#4285F4",
        },
        {
          name: "Sajid Islam (Personal)",
          email: "sajid.personal@gmail.com",
          avatarColor: "#34A853",
        },
      ]
    : [
        {
          name: currentNameHint || "Sajid Islam",
          email: currentEmailHint?.includes("@") ? currentEmailHint : "sajid.islam@facebook.com",
          avatarColor: "#1877F2",
        },
      ];

  const handlePickAccount = async (email: string, name: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await onSelectAccount(email, name);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = () => {
    const email = customEmail.trim();
    const name = customName.trim() || (email.split("@")[0] || "User");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    handlePickAccount(email, name);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.dialog, { backgroundColor: isDark ? "#1A2234" : "#FFFFFF", borderColor: isDark ? "#2A3650" : "#E2E8F0" }]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeText, { color: colors.sub }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Provider Logo */}
            <View style={styles.logoRow}>
              {isGoogle ? (
                <Svg width={40} height={40} viewBox="0 0 48 48">
                  <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </Svg>
              ) : (
                <Svg width={40} height={40} viewBox="0 0 48 48">
                  <Circle cx={24} cy={24} r={24} fill="#1877F2" />
                  <Path fill="#FFFFFF" d="M29.5 24.5h-4v14h-6v-14h-3v-5h3v-3.2c0-4.1 2.5-6.3 6.1-6.3 1.8 0 3.3.1 3.7.2v4.3h-2.6c-2 0-2.4 1-2.4 2.4V19.5h5l-.8 5z" />
                </Svg>
              )}
            </View>

            <Text style={[styles.title, { color: colors.ink }]}>
              {isGoogle ? "Sign in with Google" : "Log in with Facebook"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.sub }]}>
              Choose an account to continue to <Text style={{ fontWeight: "700", color: colors.ink }}>DEEN Commerce</Text>
            </Text>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.crimsonLight }]}>
                <Text style={[styles.errorText, { color: colors.crimson }]}>⚠️ {error}</Text>
              </View>
            ) : null}

            {!useOther ? (
              <View style={styles.accountsList}>
                {defaultAccounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.email}
                    disabled={submitting}
                    style={[
                      styles.accountCard,
                      { backgroundColor: isDark ? "#141A29" : "#F8FAFC", borderColor: isDark ? "#2A3650" : "#E2E8F0" },
                    ]}
                    onPress={() => handlePickAccount(acc.email, acc.name)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: acc.avatarColor }]}>
                      <Text style={styles.avatarText}>{acc.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: colors.ink }]} numberOfLines={1}>
                        {acc.name}
                      </Text>
                      <Text style={[styles.accountEmail, { color: colors.sub }]} numberOfLines={1}>
                        {acc.email}
                      </Text>
                    </View>
                    <Text style={[styles.arrow, { color: colors.faint }]}>➔</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  disabled={submitting}
                  style={[styles.useOtherBtn, { borderColor: colors.border }]}
                  onPress={() => setUseOther(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.useOtherText, { color: colors.indigo }]}>➕ Use another account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customForm}>
                <Text style={[styles.fieldLabel, { color: colors.sub }]}>
                  {isGoogle ? "Google Email Address" : "Facebook Email or Phone"}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? "#141A29" : "#F8FAFC", borderColor: isDark ? "#2A3650" : "#CBD5E1", color: colors.ink }]}
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  placeholder={isGoogle ? "name@gmail.com" : "name@facebook.com"}
                  placeholderTextColor={colors.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={[styles.fieldLabel, { color: colors.sub, marginTop: 12 }]}>Your Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? "#141A29" : "#F8FAFC", borderColor: isDark ? "#2A3650" : "#CBD5E1", color: colors.ink }]}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. Sajid Islam"
                  placeholderTextColor={colors.faint}
                />

                <View style={styles.formBtnRow}>
                  <TouchableOpacity
                    style={[styles.formBtn, styles.backBtn, { borderColor: colors.border }]}
                    onPress={() => setUseOther(false)}
                  >
                    <Text style={[styles.formBtnText, { color: colors.sub }]}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={submitting}
                    style={[styles.formBtn, { backgroundColor: isGoogle ? "#1A73E8" : "#1877F2", flex: 2 }]}
                    onPress={handleCustomSubmit}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.formBtnText, { color: "#FFFFFF" }]}>Next ➔</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.privacyBox, { borderTopColor: isDark ? "#2A3650" : "#F1F5F9" }]}>
              <Text style={[styles.privacyText, { color: colors.faint }]}>
                To continue, {isGoogle ? "Google" : "Facebook"} will share your name and email address with DEEN Commerce.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    alignItems: "flex-end",
    paddingTop: 14,
    paddingRight: 14,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  logoRow: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 16,
  },
  errorBox: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  accountsList: {
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: "700",
  },
  accountEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  arrow: {
    fontSize: 13,
    marginLeft: 6,
  },
  useOtherBtn: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 4,
  },
  useOtherText: {
    fontSize: 12,
    fontWeight: "700",
  },
  customForm: {
    width: "100%",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  formBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  formBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
  },
  formBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  privacyBox: {
    width: "100%",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 10,
  },
  privacyText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
