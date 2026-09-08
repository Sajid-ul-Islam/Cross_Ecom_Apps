import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Gift, Truck, Sparkles, Tag, ArrowRight, X, CreditCard } from "./Icons";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { bdt, CASHBACK_TIERS, fetchActiveCampaigns, ActiveCampaignState } from "../services/gateway";
import { BankOffersModal } from "./BankOffersModal";

export const CashbackBanner: React.FC = () => {
  const router = useRouter();
  const { subtotal } = useCart();
  const { colors } = useTheme();
  const [campaignState, setCampaignState] = useState<ActiveCampaignState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchActiveCampaigns().then((data) => {
      if (data) setCampaignState(data);
    });
  }, []);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const isCashbackActive = campaignState?.cashback?.enabled ?? false;
  const isSaleActive = campaignState?.sale?.enabled ?? true;
  const saleInfo = campaignState?.sale || {
    title: "FLAT UP TO 50% OFF",
    subtitle: "Season Clearance: 40%–50% discount on selected artisanal denim & apparel",
    badge: "LIMITED TIME SALE",
    discountRange: "40%–50%",
  };

  const activeAccent = currentSlide === 1 ? colors.indigo : currentSlide === 2 ? colors.emerald : colors.crimson;

  return (
    <>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 6,
          borderWidth: 1.5,
          borderColor: activeAccent,
          shadowColor: activeAccent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 8,
          elevation: 3,
          position: "relative",
        }}
      >
        {/* Dismiss [X] Button */}
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            zIndex: 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={12} color={colors.sub} />
        </TouchableOpacity>

        {/* Slide 0: Flat Sale / Clearance */}
        {currentSlide === 0 && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/shop")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 20 }}
          >
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: "rgba(225, 41, 62, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Tag size={16} color={colors.crimson} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: colors.crimson, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.4 }}>{saleInfo.badge}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: colors.crimson }}>{saleInfo.title}</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>{saleInfo.subtitle}</Text>
            </View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(225, 41, 62, 0.1)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              gap: 3,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: colors.crimson }}>Shop</Text>
              <ArrowRight size={11} color={colors.crimson} />
            </View>
          </TouchableOpacity>
        )}

        {/* Slide 1: Bank & Card Offers */}
        {currentSlide === 1 && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setBankModalOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 20 }}
          >
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard size={16} color={colors.indigo} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: colors.indigo, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.4 }}>BANK OFFERS</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: colors.indigo }}>UP TO 15% SAVINGS</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>
                City Amex, BRAC, EBL, SCB &amp; 0% EMI
              </Text>
            </View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              gap: 3,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: colors.indigo }}>Offers</Text>
              <ArrowRight size={11} color={colors.indigo} />
            </View>
          </TouchableOpacity>
        )}

        {/* Slide 2: Express Nationwide Delivery */}
        {currentSlide === 2 && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/shop")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 20 }}
          >
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Truck size={16} color={colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: colors.emerald, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.4 }}>EXPRESS</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: colors.emerald }}>DELIVERY FROM ৳50</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>
                24–48h Dhaka Metro · 3–5 days across 64 districts
              </Text>
            </View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              gap: 3,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: colors.emerald }}>View</Text>
              <ArrowRight size={11} color={colors.emerald} />
            </View>
          </TouchableOpacity>
        )}

        {/* Slide indicator dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {[0, 1, 2].map((idx) => (
            <View
              key={idx}
              style={{
                width: idx === currentSlide ? 16 : 4,
                height: 3,
                borderRadius: 2,
                backgroundColor: idx === currentSlide ? activeAccent : colors.border,
              }}
            />
          ))}
        </View>
      </View>

      {/* Bank Offers Modal */}
      <BankOffersModal
        visible={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
      />
    </>
  );
};

export const DeliveryNoticeBanner: React.FC = () => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : colors.indigoLight,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: isDark ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.14)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Truck size={12} color={colors.indigo} />
      </View>
      <Text style={{ fontSize: 11, color: colors.ink, flex: 1, letterSpacing: 0.1 }}>
        Dhaka Delivery{" "}
        <Text style={{ fontWeight: "900", color: colors.indigo }}>৳50</Text>
        {" "}(24–48h) · Outside Dhaka{" "}
        <Text style={{ fontWeight: "900", color: colors.indigo }}>৳90</Text>
        {" "}(3–5 days)
      </Text>
      <View
        style={{
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(16, 185, 129, 0.3)",
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: "900", color: colors.emerald, letterSpacing: 0.4 }}>EXPRESS</Text>
      </View>
    </View>
  );
};


