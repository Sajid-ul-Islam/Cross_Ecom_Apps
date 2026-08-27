import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Gift, Heart, BookOpen, Trophy } from "../Icons";
import { useTheme } from "../../context/ThemeContext";
import { useRewards } from "../../context/RewardsContext";
import { useWishlist } from "../../context/WishlistContext";

interface VipClubCardProps {
  onRewardsPress: () => void;
  onWishlistPress: () => void;
  onGiftCardPress: () => void;
  onCareGuidePress: () => void;
}

export const VipClubCard: React.FC<VipClubCardProps> = ({
  onRewardsPress,
  onWishlistPress,
  onGiftCardPress,
  onCareGuidePress,
}) => {
  const { colors } = useTheme();
  const { coins, tierLabel, dailyStreak } = useRewards();
  const { wishlist } = useWishlist();
  const styles = createStyles(colors);

  return (
    <View style={[styles.vipCard, { backgroundColor: colors.indigoDark }]}>
      <View style={styles.vipHeader}>
        <View style={styles.vipHeaderLeft}>
          <View style={styles.vipIconCircle}>
            <Trophy size={20} color="#FBBF24" />
          </View>
          <View>
            <Text style={styles.vipTitle}>DEEN VIP CLUB · {tierLabel.toUpperCase()}</Text>
            <Text style={styles.vipSub}>
              🪙 {coins} Coins (≈ ৳{Math.floor(coins / 2)} Discount) · Day {dailyStreak} Streak 🔥
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.vipGrid}>
        <TouchableOpacity
          style={[styles.vipActionChip, { backgroundColor: colors.card }]}
          activeOpacity={0.85}
          onPress={onRewardsPress}
        >
          <Gift size={15} color={colors.amber} />
          <Text style={[styles.vipActionText, { color: colors.ink }]}>DAILY SCRATCH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.vipActionChip, { backgroundColor: colors.card }]}
          activeOpacity={0.85}
          onPress={onWishlistPress}
        >
          <Heart size={15} color={colors.crimson} />
          <Text style={[styles.vipActionText, { color: colors.ink }]}>SAVED ({wishlist.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.vipActionChip, { backgroundColor: colors.card }]}
          activeOpacity={0.85}
          onPress={onGiftCardPress}
        >
          <Gift size={15} color={colors.indigo} />
          <Text style={[styles.vipActionText, { color: colors.ink }]}>GIFT CARDS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.vipActionChip, { backgroundColor: colors.card }]}
          activeOpacity={0.85}
          onPress={onCareGuidePress}
        >
          <BookOpen size={15} color={colors.indigo} />
          <Text style={[styles.vipActionText, { color: colors.ink }]}>DENIM GUIDE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    vipCard: {
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    vipHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    vipHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    vipIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    vipTitle: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
    vipSub: {
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: 11,
      marginTop: 2,
    },
    vipGrid: {
      flexDirection: "row",
      gap: 6,
    },
    vipActionChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 10,
      borderRadius: 8,
    },
    vipActionText: {
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.3,
    },
  });
}
