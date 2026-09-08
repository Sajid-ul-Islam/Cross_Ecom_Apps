import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { Play, Eye, ShoppingBag, ExternalLink } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { SectionHeader } from "./SectionHeader";
import { fetchSocialFeed, SocialReel, OFFICIAL_BRAND_SOCIALS } from "../services/socialContent";
import { SocialReelModal } from "./SocialReelModal";
import { bdt } from "../services/gateway";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.round(width * 0.44);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.55);

export const SocialReelsCarousel: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [reels, setReels] = useState<SocialReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<SocialReel | null>(null);

  useEffect(() => {
    fetchSocialFeed().then((res) => {
      setReels(res.reels);
    });
  }, []);

  if (!reels || reels.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader
        title="DEEN REELS & SOCIAL FEED"
        subtitle="Daily styling, loom craftsmanship & behind the seams"
        actionText="Follow @deencommerce →"
        onActionPress={() => Linking.openURL(OFFICIAL_BRAND_SOCIALS.instagram).catch(() => {})}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {reels.map((reel) => (
          <TouchableOpacity
            key={reel.id}
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedReel(reel)}
            accessibilityRole="button"
            accessibilityLabel={`${reel.title}, ${reel.views} views`}
          >
            {/* Visual Reel Poster */}
            <Image source={{ uri: reel.poster }} style={styles.poster} resizeMode="cover" />

            {/* Gradient Dark Overlay */}
            <View style={styles.overlay} />

            {/* Top Platform & View Count Badge */}
            <View style={styles.topBadgeRow}>
              <View style={[styles.platformPill, reel.platform === "instagram" ? styles.igPill : styles.fbPill]}>
                <Text style={styles.platformText}>
                  {reel.platform === "instagram" ? "IG REEL" : "FB POST"}
                </Text>
              </View>
              <View style={styles.viewsBadge}>
                <Eye size={10} color="#FFFFFF" />
                <Text style={styles.viewsText}>{reel.views}</Text>
              </View>
            </View>

            {/* Center Play Button Pulse Indicator */}
            <View style={styles.playIconWrap}>
              <View style={styles.playIconCircle}>
                <Play size={16} color="#FFFFFF" />
              </View>
            </View>

            {/* Bottom Tagged Commerce Product & Title */}
            <View style={styles.bottomContent}>
              <Text style={styles.reelTitle} numberOfLines={2}>
                {reel.title}
              </Text>

              {reel.taggedProduct && (
                <View style={styles.productPill}>
                  <ShoppingBag size={11} color="#FFFFFF" />
                  <Text style={styles.productPillText} numberOfLines={1}>
                    {bdt(reel.taggedProduct.price)} · {reel.taggedProduct.name}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Social Reel Immersive Viewer Modal */}
      <SocialReelModal
        visible={!!selectedReel}
        reel={selectedReel}
        onClose={() => setSelectedReel(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  topBadgeRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  igPill: {
    backgroundColor: "rgba(225, 48, 108, 0.88)",
  },
  fbPill: {
    backgroundColor: "rgba(24, 119, 242, 0.88)",
  },
  platformText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  viewsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewsText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  playIconWrap: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  bottomContent: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  reelTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 6,
  },
  productPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  productPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    flex: 1,
  },
});
