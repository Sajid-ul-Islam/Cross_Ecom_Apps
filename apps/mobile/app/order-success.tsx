import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, Package, ArrowRight, Home, PhoneCall } from "../src/components/Icons";
import { LottieAnimation } from "../src/components/LottieAnimation";
import { useTheme } from "../src/context/ThemeContext";
import { bdt, lookupCustomer, registerCustomer } from "../src/services/gateway";
import { ThemeColors } from "../src/theme/colors";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    gatewayRef?: string;
    total?: string;
    guestName?: string;
    guestPhone?: string;
  }>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const isGuestCheckout = Boolean(params.guestName && params.guestPhone);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Animated Lottie Success Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.emeraldLight }]}>
          <LottieAnimation type="success" size={84} loop={false} />
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>ORDER PLACED SUCCESSFULLY!</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Thank you for choosing DEEN. Your parcel is now queued for dispatch at our Mirpur fulfillment center.
        </Text>

        {/* Order Details Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.sub }]}>ORDER NUMBER</Text>
            <Text style={[styles.orderNumber, { color: colors.indigoDark }]}>{params.orderNumber || "N/A"}</Text>
          </View>

          {params.gatewayRef ? (
            <View style={styles.cardRow}>
              <Text style={[styles.label, { color: colors.sub }]}>APP REFERENCE</Text>
              <Text style={[styles.gatewayRef, { color: colors.faint }]}>{params.gatewayRef}</Text>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.sub }]}>TOTAL AMOUNT</Text>
            <Text style={[styles.totalValue, { color: colors.ink }]}>{bdt(Number(params.total || 0))}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.sub }]}>STATUS</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.indigoLight }]}>
              <Text style={[styles.statusBadgeText, { color: colors.indigo }]}>ORDER RECEIVED</Text>
            </View>
          </View>
        </View>

        {/* What happens next */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.ink }]}>WHAT HAPPENS NEXT?</Text>
          <View style={styles.infoStep}>
            <Text style={[styles.stepNum, { backgroundColor: colors.indigoLight, color: colors.indigoDark }]}>1</Text>
            <Text style={[styles.stepText, { color: colors.sub }]}>
              Our customer verification desk will call or SMS you shortly to confirm details.
            </Text>
          </View>

          <View style={styles.infoStep}>
            <Text style={[styles.stepNum, { backgroundColor: colors.indigoLight, color: colors.indigoDark }]}>2</Text>
            <Text style={[styles.stepText, { color: colors.sub }]}>
              Your parcel will be carefully inspected, folded, and dispatched via courier.
            </Text>
          </View>

          <View style={styles.infoStep}>
            <Text style={[styles.stepNum, { backgroundColor: colors.indigoLight, color: colors.indigoDark }]}>3</Text>
            <Text style={[styles.stepText, { color: colors.sub }]}>
              Have cash ready (if COD) upon parcel hand-over at your doorstep.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.trackBtn, { backgroundColor: colors.indigo }]}
            activeOpacity={0.88}
            onPress={() => router.replace("/(tabs)/orders")}
          >
            <Package size={18} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>TRACK MY ORDER</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeBtn, { backgroundColor: colors.paper, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)")}
          >
            <Home size={18} color={colors.indigoDark} />
            <Text style={[styles.homeBtnText, { color: colors.indigoDark }]}>BACK TO HOME</Text>
          </TouchableOpacity>

          {/* Guest-to-customer: prompt to save the profile (COD orders supported) */}
          {isGuestCheckout && (
            <GuestSavePrompt
              name={params.guestName || ""}
              phone={params.guestPhone || ""}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function GuestSavePrompt({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [checking, setChecking] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setChecking(true);
    try {
      // If this phone already has a profile, no need to re-register.
      const existing = await lookupCustomer(phone);
      if (existing?.found) {
        setSaved(true);
      } else {
        const res = await registerCustomer(name, phone);
        if (res?.success) setSaved(true);
      }
      // Brief confirmation, then go home (COD orders are already placed).
      if (!saved) {
        Alert.alert("Saved", "Your details are saved. Next checkout will greet you by name.");
      }
    } catch (e) {
      Alert.alert("Saved", "Your order is placed (COD). Profile save skipped — you can save later from your profile.");
    } finally {
      setChecking(false);
    }
  };

  if (saved) return null;

  return (
    <View style={[styles.guestPromptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.guestPromptTitle, { color: colors.ink }]}>Save this order to your profile?</Text>
      <Text style={[styles.guestPromptSub, { color: colors.sub }]}>
        Save your guest checkout so next time DEEN greets you by name and shows your order history.
      </Text>
      <View style={styles.guestPromptRow}>
        <TouchableOpacity style={[styles.guestSaveBtn, { backgroundColor: colors.indigo }]} activeOpacity={0.85} onPress={handleSave} disabled={checking}>
          <Text style={styles.guestSaveBtnText}>{checking ? "Saving…" : "Save My Profile"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestSkipBtn} activeOpacity={0.7} onPress={() => setSaved(true)}>
          <Text style={[styles.guestSkipBtnText, { color: colors.sub }]}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    scrollContent: {
      padding: 20,
      alignItems: "center",
      paddingBottom: 40,
    },
    iconCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0.5,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    card: {
      width: "100%",
      borderRadius: 10,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    orderNumber: {
      fontSize: 15,
      fontWeight: "800",
    },
    gatewayRef: {
      fontSize: 12,
      fontWeight: "600",
    },
    totalValue: {
      fontSize: 15,
      fontWeight: "900",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: "800",
    },
    divider: {
      height: 1,
      marginVertical: 12,
    },
    infoCard: {
      width: "100%",
      borderRadius: 10,
      borderWidth: 1,
      padding: 16,
      marginBottom: 24,
      gap: 10,
    },
    infoTitle: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    infoStep: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    stepNum: {
      width: 20,
      height: 20,
      borderRadius: 10,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 20,
    },
    stepText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
    },
    actions: {
      width: "100%",
      gap: 10,
    },
    trackBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
    },
    trackBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
    },
    homeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      paddingVertical: 14,
      borderRadius: 8,
    },
    homeBtnText: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
    },
    guestPromptCard: {
      width: "100%",
      borderRadius: 10,
      borderWidth: 1,
      padding: 16,
      marginTop: 8,
    },
    guestPromptTitle: {
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 4,
    },
    guestPromptSub: {
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 12,
    },
    guestPromptRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    guestSaveBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 8,
      alignItems: "center",
    },
    guestSaveBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    guestSkipBtn: {
      paddingVertical: 8,
    },
    guestSkipBtnText: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
