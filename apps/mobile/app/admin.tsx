import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Shield, Lock } from "../src/components/Icons";
import { useTheme } from "../src/context/ThemeContext";
import { useProfile } from "../src/context/ProfileContext";
import { ScreenShell } from "../src/components/ScreenShell";
import { AdminAnalyticsView } from "../src/components/AdminAnalyticsModal";

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();

  const isAdmin = profile?.role === "admin";

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
            {isAdmin ? "ADMIN" : "GUEST"}
          </Text>
        </View>
      </View>

      {/* Screen Body */}
      {isAdmin ? (
        <View style={{ flex: 1, backgroundColor: colors.paper }}>
          <AdminAnalyticsView isStandalone={true} />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: colors.paper,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Lock size={28} color={colors.crimson} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.ink, marginBottom: 8, textAlign: "center" }}>
            Administrator Access Required
          </Text>
          <Text style={{ fontSize: 13, color: colors.sub, textAlign: "center", marginBottom: 24, maxWidth: 300 }}>
            This operations dashboard is restricted to authenticated DEEN store executives. Please sign in with an admin account from Profile.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.indigo,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 13 }}>
              GO TO PROFILE SIGN IN
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenShell>
  );
}
