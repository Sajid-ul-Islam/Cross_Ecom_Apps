import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Share,
} from "react-native";
import { X, Gift, Sparkles, Share2, Check, Tag } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { bdt } from "../services/gateway";
import { useRewards } from "../context/RewardsContext";

const { width, height } = Dimensions.get("window");

const AMOUNTS = [1000, 2500, 5000, 10000];

const CARD_THEMES = [
  {
    id: "eid",
    name: "Eid Festive",
    bg: "#16281F",
    accent: "#D4AF37",
    sub: "Joyous Eid Celebrations",
  },
  {
    id: "denim",
    name: "Raw Selvedge",
    bg: "#0E1A2B",
    accent: "#E08D3C",
    sub: "Artisanal Denim Heritage",
  },
  {
    id: "gold",
    name: "VIP Connoisseur",
    bg: "#1F1A24",
    accent: "#F3C969",
    sub: "Exclusive Menswear Gift",
  },
];

interface GiftCardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GiftCardModal: React.FC<GiftCardModalProps> = ({ visible, onClose }) => {
  const { addVoucher } = useRewards();
  const { colors, isDark } = useTheme();

  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [amount, setAmount] = useState<number>(2500);
  const [recipientName, setRecipientName] = useState<string>("Tahmid");
  const [senderName, setSenderName] = useState<string>("Sajid");
  const [customNote, setCustomNote] = useState<string>(
    "Enjoy the finest artisanal raw denim and dobby panjabis from DEEN!"
  );
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCreateGiftCard = async () => {
    const code = `DEEN-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCode(code);

    await addVoucher({
      code,
      title: `E-Gift Card (${bdt(amount)}) from ${senderName}`,
      discountType: "fixed",
      discountValue: amount,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year
    });
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    try {
      await Share.share({
        message: `🎁 ${recipientName}, you received a ${bdt(
          amount
        )} DEEN Digital Gift Card from ${senderName}!\n\nUse voucher code: ${generatedCode}\n\nShop authentic raw denim & festive menswear at: https://cross-ecom-apps.onrender.com/`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <Gift size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>DIGITAL E-GIFT CARDS</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Send instant shopping vouchers with custom greetings</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Live Gift Card Preview */}
            <View style={[styles.cardPreview, { backgroundColor: selectedTheme.bg }]}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={[styles.cardBrand, { color: selectedTheme.accent }]}>DEEN COMMERCE</Text>
                  <Text style={styles.cardOccasion}>{selectedTheme.sub}</Text>
                </View>
                <Text style={[styles.cardAmount, { color: selectedTheme.accent }]}>{bdt(amount)}</Text>
              </View>

              <View style={styles.cardCenter}>
                <Text style={styles.cardTo}>TO: {recipientName || "Recipient"}</Text>
                <Text style={styles.cardMessage} numberOfLines={2}>
                  "{customNote}"
                </Text>
                <Text style={styles.cardFrom}>FROM: {senderName || "Sender"}</Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.cardCodeLabel}>VOUCHER CODE:</Text>
                <Text style={[styles.cardCode, { color: selectedTheme.accent }]}>
                  {generatedCode || "DEEN-GIFT-XXXX"}
                </Text>
              </View>
            </View>

            {/* Generated Code Share Bar */}
            {generatedCode ? (
              <View style={styles.generatedShareBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.genTitle}>🎉 Gift Card Created!</Text>
                  <Text style={styles.genCode}>{generatedCode}</Text>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Share2 size={14} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>SHARE VOUCHER</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* 1. Theme Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>1. SELECT CARD DESIGN</Text>
              <View style={styles.themesRow}>
                {CARD_THEMES.map((theme) => {
                  const active = selectedTheme.id === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.themeChip,
                        { backgroundColor: theme.bg },
                        active && styles.themeChipActive,
                      ]}
                      onPress={() => setSelectedTheme(theme)}
                    >
                      <Text style={[styles.themeChipText, { color: theme.accent }]}>
                        {theme.name}
                      </Text>
                      {active && <Check size={12} color={theme.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Amount Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>2. GIFT CARD VALUE</Text>
              <View style={styles.amountGrid}>
                {AMOUNTS.map((amt) => {
                  const active = amount === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.amountChip, active && styles.amountChipActive]}
                      onPress={() => setAmount(amt)}
                    >
                      <Text style={[styles.amountChipText, active && styles.amountChipTextActive]}>
                        {bdt(amt)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Recipient & Message Details */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>3. PERSONALIZED GREETING</Text>

              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Recipient Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="e.g. Tahmid"
                    placeholderTextColor={colors.faint}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Your Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={senderName}
                    onChangeText={setSenderName}
                    placeholder="e.g. Sajid"
                    placeholderTextColor={colors.faint}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Custom Greeting Message</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
                  value={customNote}
                  onChangeText={setCustomNote}
                  multiline
                  numberOfLines={2}
                  placeholder="Write a custom note..."
                  placeholderTextColor={colors.faint}
                />
              </View>
            </View>

            {/* Create Button */}
            {!generatedCode && (
              <TouchableOpacity
                style={styles.createBtn}
                activeOpacity={0.88}
                onPress={handleCreateGiftCard}
              >
                <Gift size={16} color="#FFFFFF" />
                <Text style={styles.createBtnText}>GENERATE & ACTIVATE GIFT CARD</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 36,
  },
  cardPreview: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  cardOccasion: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "900",
  },
  cardCenter: {
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 10,
    borderRadius: 6,
  },
  cardTo: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  cardMessage: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontStyle: "italic",
    lineHeight: 14,
  },
  cardFrom: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingTop: 8,
  },
  cardCodeLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  generatedShareBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.emeraldLight,
    borderWidth: 1,
    borderColor: Colors.emerald,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  genTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.emerald,
  },
  genCode: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  themesRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themeChipActive: {
    borderColor: Colors.indigo,
    borderWidth: 2,
  },
  themeChipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  amountGrid: {
    flexDirection: "row",
    gap: 8,
  },
  amountChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  amountChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  amountChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
  },
  amountChipTextActive: {
    color: "#FFFFFF",
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: Colors.ink,
  },
  createBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 8,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
