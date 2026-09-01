import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { X, CreditCard, Check, Layers } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { fetchBankOffers, BankOffer, bdt } from "../services/gateway";

interface BankOffersModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BankOffersModal: React.FC<BankOffersModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [offers, setOffers] = useState<BankOffer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchBankOffers()
        .then((data) => {
          if (data && data.length > 0) setOffers(data);
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleCopy = (code: string) => {
    setCopiedCode(code);
    Alert.alert("Coupon Copied", `Promo code ${code} copied to clipboard! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <CreditCard size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>BANK &amp; CARD OFFERS</Text>
                <Text style={[styles.subTitle, { color: colors.sub }]}>
                  Up to 15% Instant Savings &amp; 0% EMI
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.sub} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading && offers.length === 0 ? (
              <View style={styles.loadingWrap}>
                <Text style={{ color: colors.sub, fontSize: 12 }}>Loading partner bank offers...</Text>
              </View>
            ) : (
              offers.map((offer) => (
                <View
                  key={offer.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <View style={[styles.logoBadge, { backgroundColor: offer.color || colors.indigo }]}>
                        <Text style={styles.logoText}>{offer.logoText}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bankName, { color: colors.ink }]}>{offer.bankName}</Text>
                        <Text style={[styles.cardType, { color: colors.sub }]}>{offer.cardType}</Text>
                      </View>
                    </View>

                    <View style={[styles.discountBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                      <Text style={[styles.discountText, { color: colors.emerald }]}>{offer.discount}</Text>
                    </View>
                  </View>

                  <Text style={[styles.description, { color: colors.ink }]}>{offer.description}</Text>

                  <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                    <Text style={[styles.terms, { color: colors.sub }]}>
                      Min Spend: <Text style={{ fontWeight: "700", color: colors.ink }}>৳{offer.minSpend.toLocaleString()}</Text>
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.copyBtn,
                        copiedCode === offer.couponCode
                          ? { backgroundColor: colors.emerald, borderColor: colors.emerald }
                          : { backgroundColor: colors.cardSecondary, borderColor: colors.indigo },
                      ]}
                      onPress={() => handleCopy(offer.couponCode)}
                    >
                      <Text
                        style={[
                          styles.copyBtnText,
                          copiedCode === offer.couponCode ? { color: "#FFFFFF" } : { color: colors.indigo },
                        ]}
                      >
                        {copiedCode === offer.couponCode ? "✓ COPIED" : `CODE: ${offer.couponCode}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.indigo }]} onPress={onClose}>
              <Text style={styles.closeBtnText}>DONE · CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    modalCard: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      minHeight: "50%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    subTitle: {
      fontSize: 11,
      marginTop: 2,
    },
    scrollContent: {
      padding: 16,
      gap: 12,
    },
    loadingWrap: {
      padding: 30,
      alignItems: "center",
    },
    card: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      gap: 8,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logoBadge: {
      width: 44,
      height: 28,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    bankName: {
      fontSize: 13,
      fontWeight: "800",
    },
    cardType: {
      fontSize: 10,
      marginTop: 1,
    },
    discountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    discountText: {
      fontSize: 11,
      fontWeight: "900",
    },
    description: {
      fontSize: 11.5,
      lineHeight: 16,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      paddingTop: 8,
    },
    terms: {
      fontSize: 10.5,
    },
    copyBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
    },
    copyBtnText: {
      fontSize: 10,
      fontWeight: "800",
    },
    footer: {
      padding: 14,
      borderTopWidth: 1,
    },
    closeBtn: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    closeBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
}
