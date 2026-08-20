import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../src/context/CartContext";
import { OrderProvider } from "../src/context/OrderContext";
import { ProfileProvider } from "../src/context/ProfileContext";
import { Colors } from "../src/theme/colors";

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
