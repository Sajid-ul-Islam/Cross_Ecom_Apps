import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../src/context/CartContext";
import { OrderProvider } from "../src/context/OrderContext";
import { ProfileProvider } from "../src/context/ProfileContext";
import { reportBug } from "../src/services/gateway";
import { Colors } from "../src/theme/colors";

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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <CartProvider>
          <OrderProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.paper },
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
          </OrderProvider>
        </CartProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
