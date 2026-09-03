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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  Lock,
  User,
  CheckCircle2,
  Key,
  ArrowRight,
  PhoneCall,
  Mail,
  Sparkles,
  ShieldCheck,
  Package,
} from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import { forgotPassword, registerCustomer as registerCustomerAPI } from "../services/gateway";
import { SocialAuthModal } from "./SocialAuthModal";

const { width, height } = Dimensions.get("window");

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
}

export const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMode = "signin",
}) => {
  if (!visible) return null;
  const { colors, isDark } = useTheme();
  const { login, loginAsAdmin, loginWithGoogle, loginWithFacebook, registerCustomer, profile } = useProfile();
  const styles = createStyles(colors);

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Sign up fields
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [socialModalProvider, setSocialModalProvider] = useState<"google" | "facebook" | null>(null);

  const handleSocialGoogle = () => {
    setSocialModalProvider("google");
  };

  const handleSocialFacebook = () => {
    setSocialModalProvider("facebook");
  };

  const handleSocialAccountPicked = async (email: string, name: string) => {
    setSubmitting(true);
    try {
      const isG = socialModalProvider === "google";
      const token = `mobile_${isG ? "google" : "facebook"}_token_${Date.now()}`;
      const res = isG
        ? await loginWithGoogle(token, email, name)
        : await loginWithFacebook(token, email, name);

      if (res.success) {
        setNotice({ type: "success", text: `Signed in as ${name}!` });
        setTimeout(() => {
          setSubmitting(false);
          setSocialModalProvider(null);
          onClose();
          if (onSuccess) onSuccess();
        }, 500);
      } else {
        setSubmitting(false);
        setNotice({ type: "error", text: res.message || "Social sign-in failed." });
      }
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Social sign-in error." });
    }
  };

  useEffect(() => {
    if (visible) {
      setPassword("");
      setSignupPassword("");
      setNotice(null);
      setMode(initialMode);
    }
  }, [visible, initialMode]);

  const handleForgotPassword = async () => {
    const ident = username.trim();
    if (!ident) {
      Alert.alert(
        "Enter Username or Email",
        "Please enter your username or email address in the field above to receive a password reset link."
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await forgotPassword(ident);
      setSubmitting(false);
      Alert.alert("Password Reset", res.message);
    } catch {
      setSubmitting(false);
      Alert.alert("Notice", "If an account exists with this username/email, a reset link has been dispatched.");
    }
  };

  const handleSignIn = async () => {
    if (!username.trim()) {
      setNotice({ type: "error", text: "Please enter your username or email address." });
      return;
    }
    if (!password) {
      setNotice({ type: "error", text: "Please enter your account password." });
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
        setNotice({ type: "error", text: res.message || "Invalid credentials. Please verify and try again." });
      }
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Network connection error during sign in." });
    }
  };

  const handleSignUp = async () => {
    if (!signupName.trim()) {
      setNotice({ type: "error", text: "Please enter your full name." });
      return;
    }
    const cleanPhone = signupPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
      setNotice({ type: "error", text: "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)." });
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setNotice({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerCustomerAPI(
        signupName.trim(),
        cleanPhone,
        signupEmail.trim()
      );
      await registerCustomer({
        name: signupName.trim(),
        phone: cleanPhone,
        email: signupEmail.trim(),
      });
      setNotice({ type: "success", text: `Account created! Welcome to DEEN, ${signupName.trim()}!` });
      setTimeout(() => {
        setSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch {
      setSubmitting(false);
      setNotice({ type: "error", text: "Network error during registration." });
    }
  };

  const isPhoneValid = signupPhone.replace(/[^0-9]/g, "").length === 11 && signupPhone.startsWith("01");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigoDark }]}>
                <Key size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>
                  {mode === "signin" ? "ACCOUNT SIGN IN" : "CREATE NEW ACCOUNT"}
                </Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  DEEN Artisanal Denim & Menswear
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Segmented Mode Switcher */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === "signin" && [styles.segmentBtnActive, { backgroundColor: colors.indigoDark }],
              ]}
              activeOpacity={0.8}
              onPress={() => {
                setMode("signin");
                setNotice(null);
              }}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: mode === "signin" ? "#FFFFFF" : colors.sub },
                ]}
              >
                SIGN IN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === "signup" && [styles.segmentBtnActive, { backgroundColor: colors.indigoDark }],
              ]}
              activeOpacity={0.8}
              onPress={() => {
                setMode("signup");
                setNotice(null);
              }}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: mode === "signup" ? "#FFFFFF" : colors.sub },
                ]}
              >
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {notice && (
              <View
                style={[
                  styles.noticeBanner,
                  notice.type === "success"
                    ? { backgroundColor: colors.emeraldLight, borderColor: colors.emerald }
                    : { backgroundColor: colors.crimsonLight, borderColor: colors.crimson },
                ]}
              >
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

            {/* -------------------- SIGN IN MODE -------------------- */}
            {mode === "signin" ? (
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderArea}>
                  <Text style={[styles.formTitle, { color: colors.ink }]}>WELCOME BACK</Text>
                  <Text style={[styles.formSub, { color: colors.sub }]}>
                    Sign in to access your saved sizing, orders, and privileges.
                  </Text>
                </View>

                {/* Username / Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Username or Email</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                    ]}
                  >
                    <User size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="e.g. sazid or user@deencommerce.com"
                      placeholderTextColor={colors.faint}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Password</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                    ]}
                  >
                    <Lock size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your account password"
                      placeholderTextColor={colors.faint}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotBtn}
                  disabled={submitting}
                >
                  <Text style={[styles.forgotBtnText, { color: colors.indigo }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
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
                      <Text style={styles.primaryBtnText}>SIGN IN TO YOUR ACCOUNT</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Social Divider */}
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.sub, letterSpacing: 0.5 }}>OR CONTINUE WITH</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                </View>

                {/* Social Buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: colors.paper,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    activeOpacity={0.8}
                    onPress={handleSocialGoogle}
                    disabled={submitting}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colors.ink }}>G  Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: colors.paper,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    activeOpacity={0.8}
                    onPress={handleSocialFacebook}
                    disabled={submitting}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#1877F2" }}>f  Facebook</Text>
                  </TouchableOpacity>
                </View>

                {/* Store Admin Quick Access */}
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 42,
                      borderRadius: 8,
                      backgroundColor: colors.cardSecondary,
                      borderWidth: 1.5,
                      borderColor: colors.indigo,
                    }}
                    activeOpacity={0.8}
                    onPress={async () => {
                      setUsername("admin");
                      setPassword("admin");
                      setSubmitting(true);
                      try {
                        const res = await loginAsAdmin("admin");
                        if (res.success) {
                          setNotice({ type: "success", text: "Logged in as Store Administrator!" });
                          setTimeout(() => {
                            setSubmitting(false);
                            onClose();
                            if (onSuccess) onSuccess();
                          }, 500);
                        } else {
                          setSubmitting(false);
                          setNotice({ type: "error", text: res.message || "Admin login failed." });
                        }
                      } catch {
                        setSubmitting(false);
                        setNotice({ type: "error", text: "Admin login network error." });
                      }
                    }}
                    disabled={submitting}
                  >
                    <Sparkles size={15} color={colors.indigo} />
                    <Text style={{ fontSize: 12, fontWeight: "800", color: colors.indigo }}>
                      👑 LOGIN AS STORE ADMIN
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 10, color: colors.sub, textAlign: "center", marginTop: 6 }}>
                    Store Admin Privileges & BI Analytics (user: admin · pass: admin)
                  </Text>
                </View>

                <TouchableOpacity onPress={onClose} style={styles.guestLink}>
                  <Text style={[styles.guestLinkText, { color: colors.sub }]}>
                    Continue as guest shopper
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* -------------------- SIGN UP MODE -------------------- */
              <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderArea}>
                  <Text style={[styles.formTitle, { color: colors.ink }]}>JOIN DEEN PRIVILEGE</Text>
                  <Text style={[styles.formSub, { color: colors.sub }]}>
                    Create an account for 1-tap checkout, order tracking & rewards.
                  </Text>
                </View>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Full Name *</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                    ]}
                  >
                    <User size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={signupName}
                      onChangeText={setSignupName}
                      placeholder="e.g. Tanvir Ahmed"
                      placeholderTextColor={colors.faint}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Bangladeshi Phone Number */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.inputLabel, { color: colors.ink }]}>Mobile Number *</Text>
                    {signupPhone.length > 0 && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: isPhoneValid ? colors.emerald : colors.crimson,
                        }}
                      >
                        {isPhoneValid ? "✓ Valid 11-digit BD number" : "11 digits required (01XXXXXXXXX)"}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        backgroundColor: colors.paper,
                        borderColor: signupPhone.length > 0 ? (isPhoneValid ? colors.emerald : colors.crimson) : colors.border,
                      },
                    ]}
                  >
                    <PhoneCall size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={signupPhone}
                      onChangeText={setSignupPhone}
                      placeholder="01XXXXXXXXX"
                      placeholderTextColor={colors.faint}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Email Address (Optional)</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                    ]}
                  >
                    <Mail size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.faint}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.ink }]}>Create Password *</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: colors.paper, borderColor: colors.border },
                    ]}
                  >
                    <Lock size={18} color={colors.sub} />
                    <TextInput
                      style={[styles.inputField, { color: colors.ink }]}
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={colors.faint}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Member Perks Box */}
                <View style={[styles.perksBox, { backgroundColor: colors.indigoLight, borderColor: colors.indigo }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Sparkles size={14} color={colors.indigo} />
                    <Text style={[styles.perksTitle, { color: colors.indigoDark }]}>MEMBERSHIP BENEFITS</Text>
                  </View>
                  <Text style={[styles.perksItem, { color: colors.ink }]}>
                    • 1-Tap checkout across all Android & iOS devices{"\n"}
                    • Real-time Pathao courier consignment updates{"\n"}
                    • Saved sizing preferences & personalized drops
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: colors.indigo },
                    submitting && styles.btnDisabled,
                  ]}
                  activeOpacity={0.88}
                  onPress={handleSignUp}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>CREATE DEEN ACCOUNT</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Social Divider */}
                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.sub, letterSpacing: 0.5 }}>OR JOIN WITH</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
                </View>

                {/* Social Buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: colors.paper,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    activeOpacity={0.8}
                    onPress={handleSocialGoogle}
                    disabled={submitting}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colors.ink }}>G  Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: colors.paper,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    activeOpacity={0.8}
                    onPress={handleSocialFacebook}
                    disabled={submitting}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#1877F2" }}>f  Facebook</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={onClose} style={styles.guestLink}>
                  <Text style={[styles.guestLinkText, { color: colors.sub }]}>
                    Continue as guest shopper
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Social Account Chooser Modal Sheet */}
      <SocialAuthModal
        visible={Boolean(socialModalProvider)}
        provider={socialModalProvider || "google"}
        onClose={() => setSocialModalProvider(null)}
        onSelectAccount={handleSocialAccountPicked}
        currentEmailHint={signupEmail || profile.email}
        currentNameHint={signupName || profile.name}
      />
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      height: height * 0.88,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 11,
      marginTop: 2,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentContainer: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 6,
      backgroundColor: colors.cardSecondary,
      borderRadius: 10,
      padding: 3,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    segmentBtnActive: {},
    segmentBtnText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    noticeBanner: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
    },
    noticeText: {
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    formCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },
    cardHeaderArea: {
      marginBottom: 14,
    },
    formTitle: {
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    formSub: {
      fontSize: 11,
      marginTop: 2,
      lineHeight: 16,
    },
    inputGroup: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 44,
      gap: 10,
    },
    inputField: {
      flex: 1,
      fontSize: 13,
      height: "100%",
    },
    forgotBtn: {
      alignSelf: "flex-end",
      marginBottom: 14,
      marginTop: -2,
    },
    forgotBtnText: {
      fontSize: 11,
      fontWeight: "700",
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 6,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    guestLink: {
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 4,
    },
    guestLinkText: {
      fontSize: 12,
      fontWeight: "600",
    },
    perksBox: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
      marginTop: 4,
    },
    perksTitle: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    perksItem: {
      fontSize: 11,
      lineHeight: 17,
    },
  });
}
