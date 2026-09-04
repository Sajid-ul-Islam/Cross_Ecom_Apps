import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Sparkles, Gift, Trophy, CheckCircle2, Tag, ArrowRight } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useRewards } from "../context/RewardsContext";

const { width, height } = Dimensions.get("window");

const REWARD_OPTIONS = [
  {
    title: "৳150 OFF Voucher",
    code: "STREAK150",
    coins: 150,
    sub: "Valid on all Selvedge Denim & Panjabis",
  },
  {
    title: "Free Express Dhaka Delivery",
    code: "FREEDHAKA",
    coins: 200,
    sub: "Save ৳150 on same-day express delivery",
  },
  {
    title: "15% OFF Japanese Selvedge",
    code: "JAPAN15",
    coins: 250,
    sub: "Exclusive 15% discount on all 13.5 oz denim",
  },
  {
    title: "+500 VIP Bonus Coins",
    code: "COIN500",
    coins: 500,
    sub: "Instantly redeemable for ৳250 checkout discount",
  },
];

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { coins, tierLabel, dailyStreak, claimedDailyToday, claimDailyReward } = useRewards();

  const [revealed, setRevealed] = useState(claimedDailyToday);
  const [selectedReward, setSelectedReward] = useState(REWARD_OPTIONS[0]);

  const handleReveal = async () => {
    if (claimedDailyToday) return;
    const randomOpt = REWARD_OPTIONS[Math.floor(Math.random() * REWARD_OPTIONS.length)];
    setSelectedReward(randomOpt);
    setRevealed(true);
    await claimDailyReward(randomOpt.title, randomOpt.code, randomOpt.coins);
  };

  const handleUseReward = () => {
    onClose();
    router.push("/(tabs)/shop");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.amber }]}>
                <Gift size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>DAILY REWARDS & STREAK</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  Day {dailyStreak} Streak · {tierLabel}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Streak Indicator Row */}
            <View style={styles.streakCard}>
              <Text style={styles.streakTitle}>🔥 {dailyStreak}-DAY CHECK-IN STREAK</Text>
              <View style={styles.streakDaysRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const isPast = d < dailyStreak;
                  const isCurrent = d === dailyStreak;
                  return (
                    <View
                      key={d}
                      style={[
                        styles.streakDot,
                        isPast && styles.streakDotPast,
                        isCurrent && styles.streakDotCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.streakDotText,
                          (isPast || isCurrent) && styles.streakDotTextActive,
                        ]}
                      >
                        D{d}
                      </Text>
                      {isPast && <Text style={styles.streakCheck}>✓</Text>}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.streakSub}>
                Check in every 24h to unlock bigger discounts and Selvedge VIP status!
              </Text>
            </View>

            {/* Scratch / Mystery Card */}
            <View style={styles.scratchCardContainer}>
              <View style={styles.scratchHeader}>
                <Sparkles size={14} color={colors.amber} />
                <Text style={styles.scratchHeaderText}>TODAY'S MYSTERY REWARD</Text>
              </View>

              {!revealed ? (
                <TouchableOpacity
                  style={styles.scratchUnrevealed}
                  activeOpacity={0.85}
                  onPress={handleReveal}
                >
                  <Gift size={42} color="#FFFFFF" />
                  <Text style={styles.scratchPrompt}>TAP TO SCRATCH & REVEAL</Text>
                  <Text style={styles.scratchPromptSub}>Win vouchers, free shipping & bonus coins</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.scratchRevealed}>
                  <View style={styles.rewardIconBadge}>
                    <Trophy size={28} color={colors.amber} />
                  </View>
                  <Text style={styles.rewardCongratulations}>CONGRATULATIONS!</Text>
                  <Text style={styles.rewardTitle}>{selectedReward.title}</Text>
                  <Text style={styles.rewardSub}>{selectedReward.sub}</Text>

                  {/* Promo Code Box */}
                  <View style={styles.codeBox}>
                    <Tag size={14} color={colors.indigoDark} />
                    <Text style={styles.codeLabel}>VOUCHER CODE:</Text>
                    <Text style={styles.codeText}>{selectedReward.code}</Text>
                  </View>

                  <View style={styles.coinBonusRow}>
                    <Text style={styles.coinBonusText}>
                      +{selectedReward.coins} DEEN Coins Added to Your Balance (Total: {coins})
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {revealed && (
              <TouchableOpacity
                style={styles.useRewardBtn}
                activeOpacity={0.88}
                onPress={handleUseReward}
              >
                <Text style={styles.useRewardBtnText}>START SHOPPING WITH REWARD</Text>
                <ArrowRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Loyalty Balance Summary */}
            <View style={styles.balanceSummary}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>YOUR DEEN COINS BALANCE</Text>
                <Text style={styles.balanceCoins}>🪙 {coins} Coins</Text>
                <Text style={styles.balanceBDT}>≈ ৳{Math.floor(coins / 2)} Checkout Discount</Text>
              </View>
              <View style={styles.tierPill}>
                <Text style={styles.tierPillText}>{tierLabel}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.88,
      paddingTop: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
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
      backgroundColor: colors.amber,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    subtitle: {
      fontSize: 11,
      color: colors.sub,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 18,
      gap: 14,
      paddingBottom: 36,
    },
    streakCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    streakTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.amber,
      letterSpacing: 0.5,
    },
    streakDaysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    streakDot: {
      width: 38,
      height: 38,
      borderRadius: 8,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    streakDotPast: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    streakDotCurrent: {
      backgroundColor: colors.indigo,
      borderColor: colors.indigo,
    },
    streakDotText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.sub,
    },
    streakDotTextActive: {
      color: "#FFFFFF",
    },
    streakCheck: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
    },
    streakSub: {
      fontSize: 10,
      color: colors.sub,
      lineHeight: 14,
    },
    scratchCardContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    scratchHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    scratchHeaderText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.amber,
      letterSpacing: 0.6,
    },
    scratchUnrevealed: {
      backgroundColor: colors.indigoDark,
      borderRadius: 10,
      paddingVertical: 32,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    scratchPrompt: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    scratchPromptSub: {
      color: "rgba(255, 255, 255, 0.75)",
      fontSize: 11,
    },
    scratchRevealed: {
      backgroundColor: colors.paper,
      borderRadius: 10,
      padding: 18,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.amberLight,
      gap: 6,
    },
    rewardIconBadge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.amberLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    rewardCongratulations: {
      fontSize: 10,
      fontWeight: "900",
      color: colors.amber,
      letterSpacing: 1,
    },
    rewardTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.ink,
      textAlign: "center",
    },
    rewardSub: {
      fontSize: 11,
      color: colors.sub,
      textAlign: "center",
    },
    codeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.indigoLight,
      borderWidth: 1,
      borderColor: colors.indigo,
      borderStyle: "dashed",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
      marginTop: 6,
    },
    codeLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.indigoDark,
    },
    codeText: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.indigoDark,
      letterSpacing: 1,
    },
    coinBonusRow: {
      marginTop: 6,
    },
    coinBonusText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.emerald,
    },
    useRewardBtn: {
      backgroundColor: colors.indigo,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 8,
    },
    useRewardBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    balanceSummary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceLeft: {
      gap: 2,
    },
    balanceLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.sub,
      letterSpacing: 0.5,
    },
    balanceCoins: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.ink,
    },
    balanceBDT: {
      fontSize: 10,
      color: colors.emerald,
      fontWeight: "700",
    },
    tierPill: {
      backgroundColor: colors.indigoLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    tierPillText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.indigoDark,
    },
  });
}
