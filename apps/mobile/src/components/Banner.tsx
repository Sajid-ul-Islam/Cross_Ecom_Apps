import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Gift, Truck, Sparkles, Tag, ArrowRight } from "./Icons";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { bdt, CASHBACK_TIERS, fetchActiveCampaigns, ActiveCampaignState } from "../services/gateway";

export const CashbackBanner: React.FC = () => {
  const router = useRouter();
  const { subtotal } = useCart();
  const { colors } = useTheme();
  const [campaignState, setCampaignState] = useState<ActiveCampaignState | null>(null);

  useEffect(() => {
    fetchActiveCampaigns().then((data) => {
      if (data) setCampaignState(data);
    });
  }, []);

  // When cashback is explicitly disabled or activeCampaign is a Flat 50% Sale:
  const isCashbackActive = campaignState?.cashback?.enabled ?? false;
  const isSaleActive = campaignState?.sale?.enabled ?? true;
  const saleInfo = campaignState?.sale || {
    title: "FLAT UP TO 50% OFF",
    subtitle: "Season Clearance: 40%–50% discount on selected artisanal denim & apparel",
    badge: "LIMITED TIME SALE",
    discountRange: "40%–50%",
  };

  // If Cashback is enabled, show the cashback progress bar
  if (isCashbackActive) {
    const isTier2 = subtotal >= CASHBACK_TIERS.tier2.minSpend;
    const isTier1 = subtotal >= CASHBACK_TIERS.tier1.minSpend;
    const progress = Math.min(1, subtotal / CASHBACK_TIERS.tier2.minSpend);
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
  }

  // If Flat Sale is active (e.g. Up to 50% discount sale)
  if (isSaleActive) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push("/(tabs)/shop")}
        style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: colors.crimson,
          shadowColor: colors.crimson,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "rgba(225, 41, 62, 0.12)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Tag size={18} color={colors.crimson} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <View style={{ backgroundColor: colors.crimson, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>
                  {saleInfo.badge}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "900", color: colors.crimson, letterSpacing: 0.3 }}>
                {saleInfo.title}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.sub, lineHeight: 15 }} numberOfLines={1}>
              {saleInfo.subtitle}
            </Text>
          </View>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            backgroundColor: colors.indigoDark,
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 6,
          }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>SHOP</Text>
            <ArrowRight size={12} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return null;
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

