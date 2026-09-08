import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Package, Sparkles, Heart, Check, X } from "./Icons";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
export const NOTIF_OPT_IN_DISMISSED_KEY = "deen_notif_opt_in_reviewed_v1";

interface NotificationOptInModalProps {
  visible: boolean;
  onClose: () => void;
  onEnableSuccess?: () => void;
}

export const NotificationOptInModal: React.FC<NotificationOptInModalProps> = ({
  visible,
  onClose,
  onEnableSuccess,
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState<"explainer" | "enabled">("explainer");

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(NOTIF_OPT_IN_DISMISSED_KEY, "dismissed");
    } catch {}
    onClose();
  };

  const handleEnable = async () => {
    try {
      await AsyncStorage.setItem(NOTIF_OPT_IN_DISMISSED_KEY, "enabled");
      setStep("enabled");
      setTimeout(() => {
        setStep("explainer");
        onClose();
        if (onEnableSuccess) onEnableSuccess();
      }, 1500);
    } catch {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.paper, borderColor: colors.border }]}>
          {step === "explainer" ? (
            <>
              {/* Header Icon */}
              <View style={[styles.bellIconWrap, { backgroundColor: colors.indigoLight }]}>
                <Bell size={28} color={colors.indigo} />
              </View>

              <Text style={[styles.title, { color: colors.ink }]}>
                Never Miss a Drop or Delivery
              </Text>
              <Text style={[styles.subtitle, { color: colors.sub }]}>
                Enable DEEN notifications to receive timely, essential updates for your wardrobe. Zero spam, guaranteed.
              </Text>

              {/* Value Items */}
              <View style={styles.valueList}>
                <View style={styles.valueRow}>
                  <View style={[styles.miniIcon, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <Package size={16} color={colors.emerald} />
                  </View>
                  <View style={styles.valueTextWrap}>
                    <Text style={[styles.valueTitle, { color: colors.ink }]}>Live Order &amp; Courier Alerts</Text>
                    <Text style={[styles.valueDesc, { color: colors.sub }]}>
                      Real-time Pathao parcel dispatch &amp; doorstep delivery notices.
                    </Text>
                  </View>
                </View>

                <View style={styles.valueRow}>
                  <View style={[styles.miniIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
                    <Sparkles size={16} color={colors.indigo} />
                  </View>
                  <View style={styles.valueTextWrap}>
                    <Text style={[styles.valueTitle, { color: colors.ink }]}>Limited Raw Denim Drops</Text>
                    <Text style={[styles.valueDesc, { color: colors.sub }]}>
                      First access to vintage shuttle-loom releases before sizes sell out.
                    </Text>
                  </View>
                </View>

                <View style={styles.valueRow}>
                  <View style={[styles.miniIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                    <Heart size={16} color={colors.amber} />
                  </View>
                  <View style={styles.valueTextWrap}>
                    <Text style={[styles.valueTitle, { color: colors.ink }]}>Wishlist Restocks &amp; Offers</Text>
                    <Text style={[styles.valueDesc, { color: colors.sub }]}>
                      Price drops &amp; cashback promotions on pieces you love.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.indigo }]}
                activeOpacity={0.88}
                onPress={handleEnable}
                accessibilityRole="button"
                accessibilityLabel="Enable DEEN notifications"
              >
                <Text style={styles.primaryBtnText}>ENABLE NOTIFICATIONS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel="Maybe later"
              >
                <Text style={[styles.secondaryBtnText, { color: colors.sub }]}>Maybe Later</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successWrap}>
              <View style={[styles.bellIconWrap, { backgroundColor: colors.emeraldLight }]}>
                <Check size={32} color={colors.emerald} />
              </View>
              <Text style={[styles.title, { color: colors.ink, marginTop: 12 }]}>
                Notifications Activated!
              </Text>
              <Text style={[styles.subtitle, { color: colors.sub }]}>
                You can personalize category preferences at any time from your Profile settings.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  bellIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  valueList: {
    width: "100%",
    gap: 14,
    marginBottom: 24,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTextWrap: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  valueDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  successWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
});
