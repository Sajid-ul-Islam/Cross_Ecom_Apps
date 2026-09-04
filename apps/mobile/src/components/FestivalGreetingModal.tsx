import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Sparkles } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { getCurrentFestival, type FestivalTheme } from "../services/festivals";
import { fetchActiveCampaigns } from "../services/gateway";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface FestivalGreetingModalProps {
  visible?: boolean;
  onClose?: () => void;
  festivalOverride?: FestivalTheme | null;
}

export const FestivalGreetingModal: React.FC<FestivalGreetingModalProps> = ({
  visible: controlledVisible,
  onClose: controlledOnClose,
  festivalOverride,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [internalVisible, setInternalVisible] = useState(false);
  const [festival, setFestival] = useState<FestivalTheme | null>(festivalOverride || null);

  const isControlled = controlledVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : internalVisible;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalVisible(false);
    }
  };

  useEffect(() => {
    if (festivalOverride) {
      setFestival(festivalOverride);
      return;
    }

    const localFest = getCurrentFestival();
    if (localFest) setFestival(localFest);

    fetchActiveCampaigns().then((data) => {
      if (data?.festivalGreeting?.active) {
        setFestival(data.festivalGreeting as FestivalTheme);
      }
    }).catch(() => {});

    // Auto-notify on start screen (once per day per festival)
    if (localFest && !isControlled) {
      const todayKey = `@deen_festival_notified_${localFest.id}_${new Date().toISOString().slice(0, 10)}`;
      AsyncStorage.getItem(todayKey).then((val) => {
        if (!val) {
          const timer = setTimeout(() => {
            setInternalVisible(true);
            AsyncStorage.setItem(todayKey, "true").catch(() => {});
          }, 1500);
          return () => clearTimeout(timer);
        }
      }).catch(() => {});
    }
  }, [festivalOverride, isControlled]);

  if (!festival || !isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.paper, borderColor: festival.themePrimary }]}>
          {/* Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: festival.themePrimary }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close festival greeting"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.motifIcon}>{festival.motif}</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>FESTIVAL GREETINGS</Text>
            </View>
            <Text style={styles.headerTitle}>{festival.title}</Text>
            <Text style={styles.headerSub}>{festival.subtitle}</Text>
          </View>

          {/* Content Body */}
          <View style={styles.body}>
            <Text style={[styles.greetingText, { color: colors.ink }]}>
              {festival.greeting}
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: festival.themePrimary }]}
              activeOpacity={0.88}
              onPress={() => {
                handleClose();
                router.push("/(tabs)/shop");
              }}
            >
              <Text style={styles.actionBtnText}>
                {festival.actionLabel || "Explore Festive Collection"} →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.dismissBtnText, { color: colors.sub }]}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: Math.min(width - 40, 360),
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  headerBanner: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  motifIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  badgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  body: {
    padding: 20,
    alignItems: "center",
  },
  greetingText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },
  actionBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  dismissBtn: {
    marginTop: 12,
    paddingVertical: 4,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
