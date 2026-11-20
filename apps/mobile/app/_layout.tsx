import React from "react";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { CartProvider } from "../src/context/CartContext";
import { OrderProvider } from "../src/context/OrderContext";
import { ProfileProvider } from "../src/context/ProfileContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { ReturnProvider } from "../src/context/ReturnContext";
import { WishlistProvider } from "../src/context/WishlistContext";
import { RewardsProvider } from "../src/context/RewardsContext";
import { StoreProvider } from "../src/context/StoreContext";
import { startGatewayKeepAlive, reportBug } from "../src/services/gateway";

import { AnimatedSplashScreen } from "../src/components/AnimatedSplashScreen";
import { OTAUpdateBanner } from "../src/components/OTAUpdateBanner";
import { ChatFloatingWidget } from "../src/components/ChatFloatingWidget";
import { ScreenErrorBoundary } from "../src/components/ScreenErrorBoundary";

// Tell TypeScript that React Native's `global` exists (RN exposes it at runtime
// but TS 6 strict lib doesn't include it).
declare var global: typeof globalThis;

// Global crash catcher: forwards uncaught JS errors to the gateway bug store
// (best-effort; must never break the app). Wrapped to avoid native double-reg.
if ((global as any).ErrorUtils && !(global as any).__deenCrashHandlerInstalled) {
  (global as any).__deenCrashHandlerInstalled = true;
  const prev = (global as any).ErrorUtils.getGlobalHandler?.();
  (global as any).ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
    reportBug({
      severity: isFatal ? "crash" : "high",
      message: err?.message ?? String(err),
      stack: err?.stack ?? null,
    });
    if (typeof prev === "function") prev(err, isFatal);
  });
}

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="category/[slug]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="order-success"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

/**
 * Handles incoming notification clicks from Android System Notification Drawer
 * and deep-links directly to product drops (/product/[id]) or order screens.
 */
function NotificationDeepLinkHandler() {
  const router = useRouter();

  React.useEffect(() => {
    // 1. Background / Foreground notification response listener
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data) return;

      if (typeof data.url === "string" && data.url.length > 0) {
        router.push(data.url as any);
      } else if (data.productId) {
        router.push(`/product/${data.productId}` as any);
      } else if (data.orderNumber) {
        router.push("/(tabs)/profile" as any);
      } else if (typeof data.actionUrl === "string" && data.actionUrl.length > 0) {
        router.push(data.actionUrl as any);
      }
    });

    // 2. Cold-start notification tap handler
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response?.notification?.request?.content?.data;
        if (!data) return;

        if (typeof data.url === "string" && data.url.length > 0) {
          router.push(data.url as any);
        } else if (data.productId) {
          router.push(`/product/${data.productId}` as any);
        } else if (data.orderNumber) {
          router.push("/(tabs)/profile" as any);
        } else if (typeof data.actionUrl === "string" && data.actionUrl.length > 0) {
          router.push(data.actionUrl as any);
        }
      })
      .catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [isSplashVisible, setSplashVisible] = React.useState(true);

  // Keep the gateway warm + auto-failover if the primary origin goes down.
  // (Also configure an external uptime pinger against /health in production.)
  React.useEffect(() => startGatewayKeepAlive(), []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ProfileProvider>
          <NotificationProvider>
            <WishlistProvider>
              <RewardsProvider>
                <StoreProvider>
                  <ReturnProvider>
                    <CartProvider>
                      <OrderProvider>
                        <NotificationDeepLinkHandler />
                        <ScreenErrorBoundary fallbackTitle="DEEN Commerce App">
                          <RootNavigator />
                        </ScreenErrorBoundary>
                        <ChatFloatingWidget />
                        {isSplashVisible && (
                          <AnimatedSplashScreen onAnimationComplete={() => setSplashVisible(false)} />
                        )}
                        <OTAUpdateBanner />
                      </OrderProvider>
                    </CartProvider>
                  </ReturnProvider>
                </StoreProvider>
              </RewardsProvider>
            </WishlistProvider>
          </NotificationProvider>
        </ProfileProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
