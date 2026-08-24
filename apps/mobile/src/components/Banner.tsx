import React from "react";
import { View, Text } from "react-native";
import { Gift, Truck } from "./Icons";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { bdt } from "../services/gateway";

export const CashbackBanner: React.FC = () => {
  const { subtotal } = useCart();
  const { colors } = useTheme();

  // Tier 1: ৳2,500 (৳500 cashback)
  // Tier 2: ৳3,000 (৳700 cashback)
  const isTier2 = subtotal >= 3000;
  const isTier1 = subtotal >= 2500;
  const progress = Math.min(1, subtotal / 3000);
  const accentColor = isTier2 ? colors.emerald : isTier1 ? colors.denimStitch : colors.indigo;

  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: colors.indigoLight,
          alignItems: "center", justifyContent: "center", marginRight: 10,
        }}>
          <Gift size={16} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          {isTier2 ? (
            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.emerald }}>
              🎉 MAXIMUM ৳700 CASHBACK UNLOCKED!
            </Text>
          ) : isTier1 ? (
            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.denimStitch }}>
              ✨ ৳500 CASHBACK UNLOCKED! Add {bdt(3000 - subtotal)} for ৳700
            </Text>
          ) : (
            <Text style={{ fontSize: 12, color: colors.ink }}>
              Add{" "}
              <Text style={{ fontWeight: "700", color: colors.indigo }}>{bdt(2500 - subtotal)}</Text>
              {" "}for{" "}
              <Text style={{ fontWeight: "700", color: colors.emerald }}>৳500 CASHBACK</Text>
            </Text>
          )}
          <Text style={{ fontSize: 10, color: colors.sub, marginTop: 2 }}>
            Instant Cashback: ৳500 off on ৳2,500+ · ৳700 off on ৳3,000+
          </Text>
        </View>
      </View>

      <View style={{
        height: 6, backgroundColor: colors.paper,
        borderRadius: 3, overflow: "hidden",
        borderWidth: 1, borderColor: colors.borderLight,
      }}>
        <View style={{
          width: `${progress * 100}%` as any,
          height: "100%",
          borderRadius: 3,
          backgroundColor: accentColor,
        }} />
      </View>
    </View>
  );
};

export const DeliveryNoticeBanner: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.indigoLight,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Truck size={15} color={colors.indigo} />
      <Text style={{ fontSize: 11, color: colors.ink, flex: 1 }}>
        Dhaka Delivery:{" "}
        <Text style={{ fontWeight: "700" }}>৳50</Text>
        {" "}(24–48h) · Outside Dhaka:{" "}
        <Text style={{ fontWeight: "700" }}>৳90</Text>
        {" "}(3–5 days)
      </Text>
    </View>
  );
};

