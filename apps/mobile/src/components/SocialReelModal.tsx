import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Heart, MessageCircle, ExternalLink, ShoppingBag, Eye } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { SocialReel } from "../services/socialContent";
import { bdt } from "../services/gateway";
import { Product } from "../types";

const { width, height } = Dimensions.get("window");

interface SocialReelModalProps {
  visible: boolean;
  reel: SocialReel | null;
  onClose: () => void;
}

export const SocialReelModal: React.FC<SocialReelModalProps> = ({
  visible,
  reel,
  onClose,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addToCart } = useCart();
  const [liked, setLiked] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  if (!reel) return null;

  const handleOpenSocial = () => {
    if (reel.permalink) {
      Linking.openURL(reel.permalink).catch(() => {});
    }
  };

  const handleGoToProduct = () => {
    if (reel.taggedProduct) {
      onClose();
      router.push({
        pathname: "/product/[id]",
        params: { id: reel.taggedProduct.id },
      });
    }
  };

  const handleQuickAdd = () => {
    if (!reel.taggedProduct) return;
    const p = reel.taggedProduct;
    // Map minimal TaggedProduct to Product interface for cart
    const dummyProduct: Product = {
      id: p.id,
      sku: `DEEN-${p.id}`,
      name: p.name,
      category: (p.category as any) || "JEANS",
      price: p.price,
      regularPrice: p.regularPrice,
      salePrice: p.price,
      sizes: ["30", "32", "34"],
      images: [p.image, p.image],
      gallery: [p.image],
      thumb: p.image,
      single: p.image,
      full: p.image,
      fabric: "100% Cotton Selvedge",
      stockStatus: "instock",
      rating: 4.9,
      ratingCount: 28,
      blurb: p.name,
    };
    addToCart(dummyProduct, "32", 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.authorRow}>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>
                  {reel.platform === "instagram" ? "📸 INSTAGRAM REEL" : "📘 FACEBOOK POST"}
                </Text>
              </View>
              <Text style={[styles.authorHandle, { color: colors.ink }]}>{reel.author}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Close reel viewer"
            >
              <X size={18} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Visual Media Showcase */}
            <View style={styles.mediaWrap}>
              <Image
                source={{ uri: reel.poster }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <View style={styles.mediaOverlay}>
                <View style={styles.viewBadge}>
                  <Eye size={12} color="#FFFFFF" />
                  <Text style={styles.viewBadgeText}>{reel.views} views</Text>
                </View>
              </View>
            </View>

            {/* Engagement Row */}
            <View style={styles.engagementRow}>
              <View style={styles.statGroup}>
                <TouchableOpacity
                  onPress={() => setLiked(!liked)}
                  style={styles.statBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Heart
                    size={20}
                    color={liked ? colors.crimson : colors.ink}
                  />
                  <Text style={[styles.statText, { color: colors.ink }]}>
                    {reel.likes + (liked ? 1 : 0)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.statBtn}>
                  <MessageCircle size={18} color={colors.sub} />
                  <Text style={[styles.statText, { color: colors.sub }]}>
                    {reel.comments}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleOpenSocial}
                style={[styles.openExternalBtn, { borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.openExternalText, { color: colors.indigo }]}>
                  View on {reel.platform === "instagram" ? "Instagram" : "Facebook"}
                </Text>
                <ExternalLink size={13} color={colors.indigo} />
              </TouchableOpacity>
            </View>

            {/* Title & Caption */}
            <View style={styles.contentSection}>
              <Text style={[styles.reelTitle, { color: colors.ink }]}>{reel.title}</Text>
              <Text style={[styles.reelCaption, { color: colors.sub }]}>{reel.caption}</Text>
            </View>

            {/* Tagged Product Commerce Integration */}
            {reel.taggedProduct && (
              <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.productHeader}>
                  <View style={[styles.tagPill, { backgroundColor: colors.indigoLight }]}>
                    <ShoppingBag size={12} color={colors.indigo} />
                    <Text style={[styles.tagPillText, { color: colors.indigo }]}>FEATURED IN THIS LOOK</Text>
                  </View>
                </View>

                <View style={styles.productRow}>
                  <Image
                    source={{ uri: reel.taggedProduct.image }}
                    style={styles.productThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.ink }]} numberOfLines={2}>
                      {reel.taggedProduct.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.currentPrice, { color: colors.indigo }]}>
                        {bdt(reel.taggedProduct.price)}
                      </Text>
                      {reel.taggedProduct.regularPrice && (
                        <Text style={[styles.oldPrice, { color: colors.faint }]}>
                          {bdt(reel.taggedProduct.regularPrice)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {addedToast && (
                  <View style={[styles.toastBanner, { backgroundColor: colors.emeraldLight }]}>
                    <Text style={[styles.toastBannerText, { color: colors.emerald }]}>
                      ✓ Added to bag! Size 32 selected.
                    </Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.quickAddBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                    activeOpacity={0.85}
                    onPress={handleQuickAdd}
                  >
                    <ShoppingBag size={14} color={colors.ink} />
                    <Text style={[styles.quickAddText, { color: colors.ink }]}>Quick Bag</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.viewPdpBtn, { backgroundColor: colors.indigo }]}
                    activeOpacity={0.88}
                    onPress={handleGoToProduct}
                  >
                    <Text style={styles.viewPdpText}>SHOP PIECE →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: height * 0.88,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  platformBadge: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  authorHandle: {
    fontSize: 13,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 32,
  },
  mediaWrap: {
    width: "100%",
    height: Math.round(width * 0.85),
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
    marginBottom: 12,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  viewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: "700",
  },
  openExternalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  openExternalText: {
    fontSize: 11,
    fontWeight: "800",
  },
  contentSection: {
    marginBottom: 16,
  },
  reelTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  reelCaption: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  productHeader: {
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  tagPillText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: "900",
  },
  oldPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  toastBanner: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  toastBannerText: {
    fontSize: 11.5,
    fontWeight: "800",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "800",
  },
  viewPdpBtn: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewPdpText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
