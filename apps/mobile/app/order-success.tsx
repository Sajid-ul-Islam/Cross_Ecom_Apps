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
import { Colors } from "../src/theme/colors";
import { bdt, lookupCustomer, registerCustomer } from "../src/services/gateway";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    total?: string;
    guestName?: string;
    guestPhone?: string;
  }>();
  const isGuestCheckout = Boolean(params.guestName && params.guestPhone);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={48} color={Colors.emerald} />
        </View>

        <Text style={styles.title}>ORDER PLACED SUCCESSFULLY!</Text>
        <Text style={styles.subtitle}>
          Thank you for choosing DEEN. Your parcel is now queued for dispatch at our Mirpur fulfillment center.
        </Text>

        {/* Order Details Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>ORDER NUMBER</Text>
            <Text style={styles.orderNumber}>{params.orderNumber || "DN-XXXXXX"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.label}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>{bdt(Number(params.total || 0))}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.label}>STATUS</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>ORDER RECEIVED</Text>
            </View>
          </View>
        </View>

        {/* What happens next */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>WHAT HAPPENS NEXT?</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>
              Our customer verification desk will call or SMS you shortly to confirm details.
            </Text>
          </View>

          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>
              Your parcel will be carefully inspected, folded, and dispatched via courier.
            </Text>
          </View>

          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>
              Have cash ready (if COD) upon parcel hand-over at your doorstep.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackBtn}
            activeOpacity={0.88}
            onPress={() => router.replace("/(tabs)/orders")}
          >
            <Package size={18} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>TRACK MY ORDER</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)")}
          >
            <Home size={18} color={Colors.indigoDark} />
            <Text style={styles.homeBtnText}>BACK TO HOME</Text>
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
    <View style={styles.guestPromptCard}>
      <Text style={styles.guestPromptTitle}>Save this order to your profile?</Text>
      <Text style={styles.guestPromptSub}>
        Save your guest checkout so next time DEEN greets you by name and shows your order history.
      </Text>
      <View style={styles.guestPromptRow}>
        <TouchableOpacity style={styles.guestSaveBtn} activeOpacity={0.85} onPress={handleSave} disabled={checking}>
          <Text style={styles.guestSaveBtnText}>{checking ? "Saving…" : "Save My Profile"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestSkipBtn} activeOpacity={0.7} onPress={() => setSaved(true)}>
          <Text style={styles.guestSkipBtnText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
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
    backgroundColor: Colors.emeraldLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.sub,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.ink,
  },
  statusBadge: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.indigo,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  infoCard: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
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
    backgroundColor: Colors.indigoLight,
    color: Colors.indigoDark,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: Colors.sub,
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
    backgroundColor: Colors.indigo,
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
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 8,
  },
  homeBtnText: {
    color: Colors.indigoDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  guestPromptCard: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 8,
  },
  guestPromptTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
    marginBottom: 4,
  },
  guestPromptSub: {
    fontSize: 11,
    color: Colors.sub,
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
    backgroundColor: Colors.indigo,
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
    color: Colors.sub,
    fontSize: 12,
    fontWeight: "600",
  },
});
