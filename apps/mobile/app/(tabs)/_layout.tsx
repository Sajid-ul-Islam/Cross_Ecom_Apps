import React from "react";
import { Tabs } from "expo-router";
import { Home, Layers, ShoppingBag, Clock, User } from "../../src/components/Icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useCart } from "../../src/context/CartContext";

export default function TabLayout() {
  const { totalItems } = useCart();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.indigo,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => <Layers size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.indigo,
            fontSize: 10,
            fontWeight: "800",
            color: "#FFFFFF",
          },
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
