import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "../src/components/Icons";
import { useTheme } from "../src/context/ThemeContext";
import { useProfile } from "../src/context/ProfileContext";
import { ScreenShell } from "../src/components/ScreenShell";
import { AdminAnalyticsView } from "../src/components/AdminAnalyticsModal";

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();

  const isAdmin = profile?.role === "admin";

  React.useEffect(() => {
    if (!isAdmin) {
      router.replace("/(tabs)/profile");
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <ScreenShell>
      {/* Top App Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          backgroundColor: colors.card,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={20} color={colors.ink} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.sub }}>Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: colors.ink, letterSpacing: 0.5 }}>
            ADMIN BI &amp; OPERATIONS
          </Text>
          <Text style={{ fontSize: 10, color: colors.indigo, fontWeight: "800" }}>
            DEEN COMMERCE CONTROL ROOM
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "rgba(16,185,129,0.15)",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color: colors.emerald }}>
            ADMIN
          </Text>
        </View>
      </View>

      {/* Screen Body */}
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <AdminAnalyticsView isStandalone={true} />
      </View>
    </ScreenShell>
  );
}
