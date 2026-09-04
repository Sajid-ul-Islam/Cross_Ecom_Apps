import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { X } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { fetchNotice } from "../services/gateway";

const DISMISS_KEY = "deen_notice_dismissed_v1";

export function StoreNoticeBanner() {
  const { colors } = useTheme();
  const [notice, setNotice] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const n = await fetchNotice();
        if (!active) return;
        if (!n) {
          setNotice("");
          return;
        }
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const prev = await AsyncStorage.getItem(DISMISS_KEY);
        if (prev === n) {
          setDismissed(true);
        }
        setNotice(n);
      } catch {
        /* no banner if fetch fails */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!notice || dismissed) return null;

  const onDismiss = async () => {
    setDismissed(true);
    try {
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem(DISMISS_KEY, notice);
    } catch {
      /* ignore */
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.indigo,
        paddingHorizontal: 14,
        paddingVertical: 9,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 12 }}>📢</Text>
      </View>
      <Text style={{ flex: 1, color: "#FFFFFF", fontSize: 12, fontWeight: "700", lineHeight: 16 }}>{notice}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss notice"
        accessibilityRole="button"
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "rgba(255, 255, 255, 0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={12} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
