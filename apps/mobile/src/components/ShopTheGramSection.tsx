import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Linking,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import type { SocialFeedData, SocialReel } from "../services/gateway";
import { StoriesFeedModal } from "./StoriesFeedModal";
import { Play, Instagram, Facebook, Youtube } from "./Icons";

interface ShopTheGramSectionProps {
  feedData: SocialFeedData;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export const ShopTheGramSection: React.FC<ShopTheGramSectionProps> = ({ feedData }) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const reels = feedData?.reels && feedData.reels.length > 0 ? feedData.reels : [];
  const accounts = feedData?.officialAccounts;

  const handleOpenReel = (index: number) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.sectionContainer, { backgroundColor: colors.paper, borderTopColor: colors.border }]}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>📸 {accounts?.handle || "@deencommerce"} Community</Text>
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>
          Shop The Gram &amp; Social Looks
        </Text>

        <Text style={[styles.subtitle, { color: colors.sub }]}>
          Real fits styled by patrons across Bangladesh. Tap to shop tagged pieces or watch reels.
        </Text>
      </View>

      {/* Grid of Cards */}
      <View style={styles.grid}>
        {reels.map((reel, idx) => (
          <TouchableOpacity
            key={reel.id}
            style={[styles.card, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => handleOpenReel(idx)}
          >
            {/* Poster Image */}
            <Image
              source={{ uri: reel.poster }}
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Reel Badge */}
            {reel.videoUrl && (
              <View style={styles.reelBadge}>
                <Play size={10} color="#FFFFFF" />
                <Text style={styles.reelBadgeText}>REEL</Text>
              </View>
            )}

            {/* Platform Tag */}
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>
                {reel.platform === "instagram" ? "IG" : "FB"}
              </Text>
            </View>

            {/* Bottom Overlay Info */}
            <View style={styles.cardOverlay}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {reel.title}
              </Text>

              {reel.taggedProduct && (
                <View style={styles.taggedBox}>
                  <Text style={styles.taggedName} numberOfLines={1}>
                    {reel.taggedProduct.name}
                  </Text>
                  <Text style={styles.taggedPrice}>
                    ৳{reel.taggedProduct.price}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <Text style={styles.statText}>❤️ {reel.likes}</Text>
                <Text style={styles.statText}>👁️ {reel.views}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Social Follow Strip */}
      <View style={[styles.socialStrip, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.stripTitle, { color: colors.ink }]}>
            Join {accounts?.communityCount || "125,000+ Patrons"}
          </Text>
          <Text style={[styles.stripSub, { color: colors.sub }]}>
            Follow for daily drops and lookbooks
          </Text>
        </View>

        <View style={styles.stripButtons}>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: "rgba(225, 48, 108, 0.12)" }]}
            onPress={() => handleOpenUrl(accounts?.instagram || "https://www.instagram.com/deencommerce/?hl=en")}
            accessibilityLabel="Follow on Instagram"
          >
            <Instagram size={16} color="#e1306c" />
            <Text style={[styles.socialBtnText, { color: "#e1306c" }]}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: "rgba(24, 119, 242, 0.12)" }]}
            onPress={() => handleOpenUrl(accounts?.facebook || "https://www.facebook.com/deencommerce")}
            accessibilityLabel="Follow on Facebook"
          >
            <Facebook size={16} color="#1877f2" />
            <Text style={[styles.socialBtnText, { color: "#1877f2" }]}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: "rgba(255, 0, 0, 0.12)" }]}
            onPress={() => handleOpenUrl("https://www.youtube.com/@deencommerce")}
            accessibilityLabel="Subscribe on YouTube"
          >
            <Youtube size={16} color="#ff0000" />
            <Text style={[styles.socialBtnText, { color: "#ff0000" }]}>YouTube</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Feed Modal */}
      <StoriesFeedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        feedData={feedData}
        initialIndex={selectedIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingVertical: 28,
    borderTopWidth: 1,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  badgePill: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    color: "#a855f7",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  grid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  reelBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  reelBadgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  platformBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  platformBadgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  taggedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  taggedName: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
    flex: 1,
    marginRight: 4,
  },
  taggedPrice: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 9.5,
    fontWeight: "600",
  },
  socialStrip: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  stripTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  stripSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stripButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  socialBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
