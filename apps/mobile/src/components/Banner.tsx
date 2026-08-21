import React from "react";
import { View, Text } from "react-native";
import { Gift, Truck } from "./Icons";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { bdt } from "../services/gateway";

export const FreeTeeBanner: React.FC = () => {
  const { freeTeeEligible, freeTeeGap, subtotal } = useCart();
  const { colors } = useTheme();
  const progress = Math.min(1, subtotal / 3500);
  const accentColor = freeTeeEligible ? colors.emerald : colors.indigo;

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
          {freeTeeEligible ? (
            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.emerald }}>
              🎉 FREE HEAVYWEIGHT TEE UNLOCKED!
            </Text>
          ) : (
            <Text style={{ fontSize: 12, color: colors.ink }}>
              Add{" "}
              <Text style={{ fontWeight: "700", color: colors.indigo }}>{bdt(freeTeeGap)}</Text>
              {" "}more for a{" "}
              <Text style={{ fontWeight: "700", color: colors.indigo }}>FREE T-Shirt</Text>
            </Text>
          )}
          <Text style={{ fontSize: 10, color: colors.sub, marginTop: 2 }}>
            Orders over ৳3,500 receive a complimentary 240 GSM Tee
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
        <Text style={{ fontWeight: "700" }}>৳80</Text>
        {" "}(24–48h) · Outside Dhaka:{" "}
        <Text style={{ fontWeight: "700" }}>৳150</Text>
        {" "}(3–5 days)
      </Text>
    </View>
  );
};

