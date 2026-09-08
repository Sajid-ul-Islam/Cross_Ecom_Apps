import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Updates from "expo-updates";
import { useTheme } from "../context/ThemeContext";

interface OTABannerState {
  visible: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isReady: boolean;
  error: string | null;
}

/**
 * OTAUpdateBanner — mounts at the root layout level.
 *
 * Behaviour:
 * - On app load: silently checks for an update.
 * - If an update is available: shows a dismissable "Update available – tap to apply" banner.
 * - Tapping the banner: downloads and reloads the app instantly (< 1 s if already downloaded).
 * - In dev (Expo Go / __DEV__): renders nothing (Updates API is unavailable in dev).
 */
export function OTAUpdateBanner() {
  const { colors, isDark } = useTheme();

  const [state, setState] = useState<OTABannerState>({
    visible: false,
    isChecking: false,
    isDownloading: false,
    isReady: false,
    error: null,
  });

  const slideAnim = React.useRef(new Animated.Value(-80)).current;

  const showBanner = useCallback(() => {
    setState((s) => ({ ...s, visible: true }));
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [slideAnim]);

  const hideBanner = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -80,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setState((s) => ({ ...s, visible: false, error: null })));
  }, [slideAnim]);

  const checkForUpdate = useCallback(async () => {
    // expo-updates is unavailable in Expo Go dev client or __DEV__ builds
    if (__DEV__ || !Updates.isEmbeddedLaunch) return;

    try {
      setState((s) => ({ ...s, isChecking: true }));
      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable) {
        // Download in the background immediately
        setState((s) => ({ ...s, isChecking: false, isDownloading: true }));
        await Updates.fetchUpdateAsync();
        setState((s) => ({
          ...s,
          isDownloading: false,
          isReady: true,
        }));
        showBanner();
      } else {
        setState((s) => ({ ...s, isChecking: false }));
      }
    } catch (err: any) {
      // Silently fail – never crash the app over an OTA check
      setState((s) => ({ ...s, isChecking: false, isDownloading: false }));
    }
  }, [showBanner]);

  useEffect(() => {
    // Check on mount with a 3 s delay so it doesn't compete with splash
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  const handleApplyUpdate = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // ignore
    }
  };

  if (!state.visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? "#1A2E4A" : "#0F2240",
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="App update available"
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerIcon}>🚀</Text>
          <View>
            <Text style={styles.bannerTitle}>Update available!</Text>
            <Text style={styles.bannerSub}>Tap to apply — takes 1 second</Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApplyUpdate}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Apply update now"
          >
            {state.isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnText}>Apply Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={hideBanner}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss update banner"
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 12,
    right: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  bannerIcon: {
    fontSize: 22,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  bannerSub: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  applyBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
});
