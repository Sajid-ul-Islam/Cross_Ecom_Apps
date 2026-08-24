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
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
      }}
    >
      <Text style={{ flex: 1, color: "#fff", fontSize: 12.5, fontWeight: "700" }}>{notice}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Dismiss notice">
        <X size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
