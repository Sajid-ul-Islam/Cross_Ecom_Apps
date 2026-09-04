import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "./Header";
import { ThemeColors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { useTheme } from "../context/ThemeContext";

interface ScreenShellProps {
  /** Header title (default: "DEEN") */
  title?: string;
  /** Show back arrow in header (default: false) */
  showBack?: boolean;
  /** Show search icon in header (default: true) */
  showSearch?: boolean;
  /** Show bag icon in header (default: true) */
  showBag?: boolean;
  /** Show notification bell in header (default: true) */
  showNotif?: boolean;
  /** Custom navigation bar — replaces the default Header entirely */
  renderNav?: React.ReactNode;
  /** Show loading spinner instead of children */
  loading?: boolean;
  /** Optional loading message below the spinner */
  loadingMessage?: string;
  /** Show empty state instead of children */
  empty?: boolean;
  /** Custom empty state content — replaces the default empty view */
  emptyContent?: React.ReactNode;
  /** Screen content (rendered when not loading and not empty) */
  children?: React.ReactNode;
}

/**
 * Wraps every screen's SafeAreaView + nav bar + optional loading/empty
 * state into a single component. Screens only provide their content as
 * children; this handles the surrounding chrome.
 *
 * Usage:
 *   // With default Header:
 *   <ScreenShell title="MY ORDERS" loading={loading}>
 *     <ScrollView>...</ScrollView>
 *   </ScreenShell>
 *
 *   // With custom NavBar:
 *   <ScreenShell renderNav={<NavBar title="SKU-123" />}>
 *     <ScrollView>...</ScrollView>
 *   </ScreenShell>
 */
export const ScreenShell: React.FC<ScreenShellProps> = ({
  title,
  showBack = false,
  showSearch = true,
  showBag = false,
  showNotif = true,
  renderNav,
  loading = false,
  loadingMessage,
  empty = false,
  emptyContent,
  children,
}) => {
  const { colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      {renderNav ?? (
        <Header
          title={title}
          showBack={showBack}
          showSearch={showSearch}
          showBag={showBag}
          showNotif={showNotif}
        />
      )}

      {loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {/* Top Banner Skeleton */}
          <View
            style={{
              width: "100%",
              height: 130,
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginBottom: 16,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="small" color={colors.indigo} />
            {loadingMessage ? (
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.sub, fontWeight: "600" }}>
                {loadingMessage}
              </Text>
            ) : null}
          </View>

          {/* 2-column Grid Skeletons */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                height: 190,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: 10,
              }}
            >
              <View style={{ width: "100%", height: 110, backgroundColor: colors.cardSecondary, borderRadius: 8, marginBottom: 10 }} />
              <View style={{ width: "80%", height: 14, backgroundColor: colors.cardSecondary, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ width: "40%", height: 12, backgroundColor: colors.cardSecondary, borderRadius: 4 }} />
            </View>
            <View
              style={{
                flex: 1,
                height: 190,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: 10,
              }}
            >
              <View style={{ width: "100%", height: 110, backgroundColor: colors.cardSecondary, borderRadius: 8, marginBottom: 10 }} />
              <View style={{ width: "70%", height: 14, backgroundColor: colors.cardSecondary, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ width: "50%", height: 12, backgroundColor: colors.cardSecondary, borderRadius: 4 }} />
            </View>
          </View>

          {/* Bottom Card Skeleton */}
          <View
            style={{
              width: "100%",
              height: 76,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ width: 52, height: 52, backgroundColor: colors.cardSecondary, borderRadius: 8 }} />
            <View style={{ flex: 1 }}>
              <View style={{ width: "60%", height: 14, backgroundColor: colors.cardSecondary, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ width: "40%", height: 12, backgroundColor: colors.cardSecondary, borderRadius: 4 }} />
            </View>
          </View>
        </View>
      ) : empty && emptyContent ? (
        emptyContent
      ) : (
        children
      )}
    </SafeAreaView>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    center: s.center,
    loadingMessage: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
