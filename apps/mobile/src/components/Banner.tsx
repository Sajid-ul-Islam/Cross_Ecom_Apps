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

  return (
    <>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 6,
          borderWidth: 1,
          borderColor: currentSlide === 1 ? colors.indigo : currentSlide === 2 ? colors.emerald : colors.crimson,
          position: "relative",
        }}
      >
        {/* Dismiss [X] Button */}
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 10,
            padding: 4,
          }}
        >
          <X size={14} color={colors.sub} />
        </TouchableOpacity>

        {/* Slide 0: Flat Sale / Clearance */}
        {currentSlide === 0 && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/shop")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 16 }}
          >
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: "rgba(225, 41, 62, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Tag size={16} color={colors.crimson} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: colors.crimson, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900" }}>{saleInfo.badge}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: colors.crimson }}>{saleInfo.title}</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>{saleInfo.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Slide 1: Bank & Card Offers */}
        {currentSlide === 1 && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setBankModalOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 16 }}
          >
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard size={16} color={colors.indigo} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <View style={{ backgroundColor: colors.indigo, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900" }}>BANK OFFERS</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "900", color: colors.indigo }}>UP TO 15% CARD SAVINGS</Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>
                City Amex, BRAC Bank, EBL, SCB &amp; 0% EMI Available · Tap to View
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Slide 2: Instant Cashback if active, else Nationwide Delivery */}
        {currentSlide === 2 && (
          isCashbackActive ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, paddingRight: 16 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  alignItems: "center", justifyContent: "center", marginRight: 10,
                }}>
                  <Gift size={16} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: colors.emerald }}>
                    🎁 INSTANT CASHBACK: UP TO ৳700
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.sub, marginTop: 1 }}>
                    ৳500 on ৳2,500+ · ৳700 on ৳3,000+ orders
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/(tabs)/shop")}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 16 }}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                alignItems: "center", justifyContent: "center",
              }}>
                <Truck size={16} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <View style={{ backgroundColor: colors.emerald, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 8.5, fontWeight: "900" }}>EXPRESS DISPATCH</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "900", color: colors.emerald }}>NATIONWIDE DELIVERY FROM ৳50</Text>
                </View>
                <Text style={{ fontSize: 10.5, color: colors.sub }} numberOfLines={1}>
                  24–48h Pathao Express Dhaka · 3–5 days across 64 districts
                </Text>
              </View>
            </TouchableOpacity>
          )
        )}

        {/* Slide indicator dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 6 }}>
          {[0, 1, 2].map((idx) => (
            <View
              key={idx}
              style={{
                width: idx === currentSlide ? 12 : 4,
                height: 3,
                borderRadius: 2,
                backgroundColor: idx === currentSlide ? colors.indigo : colors.border,
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


