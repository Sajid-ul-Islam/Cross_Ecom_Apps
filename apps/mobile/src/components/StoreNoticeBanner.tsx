import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { X, Truck } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { fetchNotice } from "../services/gateway";

const DISMISS_KEY = "deen_notice_dismissed_v1";
const DELIVERY_DISMISS_KEY = "deen_delivery_banner_dismissed_v1";

export function StoreNoticeBanner() {
  const { colors, isDark } = useTheme();
  const [notice, setNotice] = useState<string>("");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [deliveryDismissed, setDeliveryDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const [dDismissed, prevNotice] = await Promise.all([
          AsyncStorage.getItem(DELIVERY_DISMISS_KEY),
          AsyncStorage.getItem(DISMISS_KEY),
        ]);
        if (dDismissed === "true") setDeliveryDismissed(true);

        const n = await fetchNotice();
        if (!active) return;
        if (n) {
          if (prevNotice === n) {
            setNoticeDismissed(true);
          }
          setNotice(n);
        }
      } catch {
        /* no banner if fetch fails */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onDismissNotice = async () => {
    setNoticeDismissed(true);
    try {
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem(DISMISS_KEY, notice);
    } catch {}
  };

  const onDismissDelivery = async () => {
    setDeliveryDismissed(true);
    try {
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem(DELIVERY_DISMISS_KEY, "true");
    } catch {}
  };

  // 1. Priority 1: Active Store Broadcast Notice (e.g., Eid holidays, flash drops)
  if (notice && !noticeDismissed) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.indigo,
          paddingHorizontal: 14,
          paddingVertical: 7,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.15)",
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 10 }}>📢</Text>
        </View>
        <Text style={{ flex: 1, color: "#FFFFFF", fontSize: 11.5, fontWeight: "700", lineHeight: 15 }} numberOfLines={1}>
          {notice}
        </Text>
        <TouchableOpacity
          onPress={onDismissNotice}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss store notice"
          accessibilityRole="button"
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={10} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Priority 2: Slim Express Delivery Assurance (Dhaka ৳50 · Outside ৳90)
  if (!deliveryDismissed) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : colors.indigoLight,
          paddingHorizontal: 14,
          paddingVertical: 6,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(224, 83, 5, 0.25)" : "rgba(224, 83, 5, 0.14)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Truck size={11} color={colors.indigo} />
        </View>
        <Text style={{ flex: 1, fontSize: 11, color: colors.ink, letterSpacing: 0.1 }} numberOfLines={1}>
          Dhaka <Text style={{ fontWeight: "900", color: colors.indigo }}>৳50</Text> (24–48h) · Outside Dhaka <Text style={{ fontWeight: "900", color: colors.indigo }}>৳90</Text>
        </Text>
        <View
          style={{
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)",
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 8.5, fontWeight: "900", color: colors.emerald, letterSpacing: 0.3 }}>EXPRESS</Text>
        </View>
        <TouchableOpacity
          onPress={onDismissDelivery}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss delivery info"
          accessibilityRole="button"
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 2,
          }}
        >
          <X size={9} color={colors.sub} />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
