import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Lock, ShieldCheck, X, Check, RotateCcw } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { bdt } from "../services/gateway";

// Safe conditional import for react-native-webview
let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (err) {
    console.warn("[PaymentDrawer] react-native-webview not loaded:", err);
  }
}

export interface PaymentDrawerProps {
  visible: boolean;
  paymentUrl: string;
  orderId: string | number;
  orderNumber: string;
  total: number;
  onSuccess: (orderId: string | number, orderNumber: string) => void;
  onClose: () => void;
  onSwitchToCod?: () => void;
}

export function PaymentDrawer({
  visible,
  paymentUrl,
  orderId,
  orderNumber,
  total,
  onSuccess,
  onClose,
  onSwitchToCod,
}: PaymentDrawerProps) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const webViewRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setProgress(0.1);
      setIsCompleted(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSafeClose = () => {
    if (isCompleted) {
      onClose();
      return;
    }

    Alert.alert(
      "Cancel Payment?",
      `Your Order #${orderNumber} (${bdt(total)}) has been created and reserved in our system. You can complete payment later or switch to Cash on Delivery.`,
      [
        { text: "Continue Payment", style: "cancel" },
        {
          text: "Leave Checkout",
          style: "destructive",
          onPress: () => {
            Animated.timing(slideAnim, {
              toValue: Dimensions.get("window").height,
              duration: 200,
              useNativeDriver: true,
            }).start(() => onClose());
          },
        },
      ]
    );
  };

  const handleNavigationChange = (navState: { url: string; title?: string }) => {
    const url = navState.url.toLowerCase();

    // Google Play Store & Merchant compliance: check for order completion / confirmation redirects
    const isSuccess =
      url.includes("/order-received/") ||
      url.includes("thank-you") ||
      url.includes("pay_for_order=false") ||
      url.includes("status=success") ||
      url.includes("status=completed") ||
      url.includes("payment_status=completed") ||
      url.includes("payment=success");

    const isCancelOrFailed =
      url.includes("status=cancel") ||
      url.includes("status=failed") ||
      url.includes("cancelled=true") ||
      url.includes("payment_status=failed");

    if (isSuccess && !isCompleted) {
      setIsCompleted(true);
      setLoading(false);
      setTimeout(() => {
        onSuccess(orderId, orderNumber);
      }, 1200);
      return;
    }

    if (isCancelOrFailed) {
      Alert.alert(
        "Payment Incomplete",
        "The online transaction was not completed. Would you like to switch this order to Cash on Delivery (COD) or retry?",
        [
          { text: "Retry Payment", onPress: () => webViewRef.current?.reload() },
          ...(onSwitchToCod
            ? [
                {
                  text: "Switch to Cash on Delivery",
                  style: "default" as const,
                  onPress: () => onSwitchToCod(),
                },
              ]
            : []),
          { text: "Close", style: "cancel" as const, onPress: () => onClose() },
        ]
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSafeClose}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#0D0D11" : "#FFFFFF",
              borderColor: isDark ? "#222530" : "#E5E7EB",
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Grabber Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: isDark ? "#3A3D4D" : "#D1D5DB" }]} />
          </View>

          {/* Native Header Bar (Ensures User Never Feels 'Lost') */}
          <View
            style={[
              styles.headerBar,
              {
                borderBottomColor: isDark ? "#1C1F2B" : "#F3F4F6",
                backgroundColor: isDark ? "#121520" : "#F9FAFB",
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.shieldBadge}>
                <ShieldCheck size={18} color="#10B981" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                    DEEN SECURE PAYMENT
                  </Text>
                  <View style={styles.sslBadge}>
                    <Lock size={10} color="#10B981" />
                    <Text style={styles.sslBadgeText}>256-BIT SSL</Text>
                  </View>
                </View>
                <Text style={[styles.headerSubtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                  Order #{orderNumber} · {bdt(total)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSafeClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "#1E2230" : "#E5E7EB" }]}
              accessibilityRole="button"
              accessibilityLabel="Close payment drawer"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={isDark ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
          </View>

          {/* Loading Progress Bar */}
          {loading && !isCompleted && (
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
          )}

          {/* Content Area: Embedded Web Portal or Completion Screen */}
          <View style={styles.body}>
            {isCompleted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Check size={40} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={[styles.successTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  Payment Verified!
                </Text>
                <Text style={[styles.successSubtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                  Thank you! Your payment for Order #{orderNumber} has been received. Redirecting to your parcel tracking...
                </Text>
                <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 16 }} />
              </View>
            ) : Platform.OS === "web" ? (
              // Web implementation: Sandboxed embedded iframe with native styling
              <View style={styles.iframeWrapper}>
                {paymentUrl ? (
                  <iframe
                    src={paymentUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      backgroundColor: "transparent",
                    }}
                    title="DEEN Secure Merchant Checkout"
                    onLoad={() => setLoading(false)}
                  />
                ) : (
                  <View style={styles.fallbackCenter}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                    <Text style={{ color: "#9CA3AF", marginTop: 12, fontSize: 13 }}>
                      Preparing secure checkout session...
                    </Text>
                  </View>
                )}
              </View>
            ) : WebView ? (
              // Native iOS / Android: High-performance react-native-webview
              <View style={styles.webviewWrapper}>
                {paymentUrl ? (
                  <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    renderLoading={() => (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#F59E0B" />
                        <Text style={[styles.loadingText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                          Connecting to secure payment gateway...
                        </Text>
                      </View>
                    )}
                    onLoadProgress={({ nativeEvent }: any) => {
                      setProgress(nativeEvent.progress);
                      if (nativeEvent.progress >= 0.95) setLoading(false);
                    }}
                    onNavigationStateChange={handleNavigationChange}
                    style={{ flex: 1, backgroundColor: "transparent" }}
                  />
                ) : (
                  <View style={styles.fallbackCenter}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                    <Text style={{ color: "#9CA3AF", marginTop: 12, fontSize: 13 }}>
                      Initializing payment portal...
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // Fallback if native webview is unmounted
              <View style={styles.fallbackCenter}>
                <ShieldCheck size={48} color="#10B981" />
                <Text style={[styles.fallbackTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  DEEN Merchant Payment
                </Text>
                <Text style={[styles.fallbackDesc, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                  Your Order #{orderNumber} is reserved. Complete payment using the button below.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Bar: Switching to COD or Safety Notes */}
          {!isCompleted && (
            <SafeAreaView
              style={[
                styles.footerBar,
                {
                  borderTopColor: isDark ? "#1C1F2B" : "#F3F4F6",
                  backgroundColor: isDark ? "#0D0D11" : "#FFFFFF",
                },
              ]}
            >
              {onSwitchToCod && (
                <TouchableOpacity
                  onPress={onSwitchToCod}
                  style={styles.switchCodBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchCodText}>
                    Prefer Cash on Delivery? <Text style={{ textDecorationLine: "underline", color: "#F59E0B" }}>Switch to COD</Text>
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.policyNotice}>
                Official DEEN Commerce payment. Card & Mobile banking processed via PCI-DSS certified gateway.
              </Text>
            </SafeAreaView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    width: "100%",
    height: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sslBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  sslBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarTrack: {
    height: 3,
    width: "100%",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  progressBarFill: {
    height: 3,
    backgroundColor: "#F59E0B",
  },
  body: {
    flex: 1,
    position: "relative",
  },
  iframeWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  webviewWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 13, 17, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 12,
    textAlign: "center",
  },
  fallbackCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  fallbackDesc: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  switchCodBtn: {
    paddingVertical: 4,
  },
  switchCodText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  policyNotice: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
  },
});
