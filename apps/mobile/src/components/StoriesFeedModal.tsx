import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import type { SocialFeedData, SocialReel } from "../services/gateway";
import type { Product } from "../types";
import { X, Heart, ExternalLink, Play } from "./Icons";

interface StoriesFeedModalProps {
  visible: boolean;
  onClose: () => void;
  feedData: SocialFeedData;
  initialIndex?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const StoriesFeedModal: React.FC<StoriesFeedModalProps> = ({
  visible,
  onClose,
  feedData,
  initialIndex = 0,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { addToCart } = useCart();

  const reels = feedData?.reels && feedData.reels.length > 0 ? feedData.reels : [];
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [likesState, setLikesState] = useState<Record<string, { count: number; userLiked: boolean }>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  const currentReel: SocialReel | undefined = reels[activeIndex] || reels[0];

  const nextReel = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setActiveIndex(0);
    }
  };

  const prevReel = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else {
      setActiveIndex(reels.length - 1);
    }
  };

  const toggleLike = (reelId: string) => {
    setLikesState((prev) => {
      const cur = prev[reelId] || { count: currentReel?.likes || 1200, userLiked: false };
      const nextLiked = !cur.userLiked;
      return {
        ...prev,
        [reelId]: {
          count: nextLiked ? cur.count + 1 : cur.count - 1,
          userLiked: nextLiked,
        },
      };
    });
  };

  const triggerHeartBurst = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTap = (e: any) => {
    const now = Date.now();
    const touchX = e.nativeEvent.locationX;

    if (now - lastTapRef.current < 300) {
      // Double tap -> Like & burst
      if (currentReel) {
        if (!likesState[currentReel.id]?.userLiked) {
          toggleLike(currentReel.id);
        }
        triggerHeartBurst();
      }
    } else {
      // Single tap -> navigate Left or Right
      if (touchX < SCREEN_WIDTH * 0.3) {
        prevReel();
      } else {
        nextReel();
      }
    }
    lastTapRef.current = now;
  };

  const handleAddToCart = (tagged: SocialReel["taggedProduct"]) => {
    if (!tagged) return;
    const prod: Product = {
      id: tagged.id,
      sku: `SKU-${tagged.id}`,
      name: tagged.name,
      category: (tagged.category as any) || "JEANS",
      price: tagged.price,
      regularPrice: tagged.regularPrice || tagged.price,
      sizes: ["M", "L", "XL"],
      images: [tagged.image, tagged.image],
      gallery: [tagged.image],
      thumb: tagged.image,
      single: tagged.image,
      full: tagged.image,
      fabric: "100% Cotton Craftsmanship",
      stockStatus: "instock",
      rating: 4.9,
      ratingCount: 32,
      blurb: tagged.name,
    };
    addToCart(prod, "L", 1);
    setToastMessage(`Added "${tagged.name}" to Bag!`);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleViewProduct = (productId: string) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  const handleOpenExternal = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  if (!visible || !currentReel) return null;

  const currentLikes = likesState[currentReel.id] || { count: currentReel.likes, userLiked: false };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Toast */}
        {toastMessage && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ {toastMessage}</Text>
          </View>
        )}

        {/* Progress Bars */}
        <View style={styles.progressBarContainer}>
          {reels.map((r, idx) => (
            <View
              key={r.id}
              style={[
                styles.progressBar,
                {
                  backgroundColor: idx <= activeIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)",
                },
              ]}
            />
          ))}
        </View>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: currentReel.poster }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>{currentReel.author}</Text>
                <View style={styles.verifiedDot} />
              </View>
              <Text style={styles.platformText}>
                {currentReel.platform === "instagram" ? "📸 Instagram Reel" : "📘 Facebook Video"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close stories"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Content Tap Area */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTap}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: currentReel.poster }}
            style={styles.mediaImage}
            resizeMode="cover"
          />

          {/* Reel Indicator Pill */}
          <View style={styles.reelIndicator}>
            <Play size={12} color="#FFFFFF" />
            <Text style={styles.reelIndicatorText}>REEL PREVIEW</Text>
          </View>

          {/* Animated Heart Burst */}
          <Animated.View
            style={[
              styles.heartBurst,
              {
                transform: [{ scale: heartScale }],
                opacity: heartScale,
              },
            ]}
          >
            <Text style={{ fontSize: 80 }}>❤️</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Floating Right Actions */}
        <View style={[styles.rightActions, { bottom: currentReel.taggedProduct ? 140 : 80 }]}>
          {/* Heart Button */}
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => toggleLike(currentReel.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart size={26} color={currentLikes.userLiked ? "#ef4444" : "#FFFFFF"} />
            <Text style={styles.actionCountText}>{currentLikes.count}</Text>
          </TouchableOpacity>

          {/* Views */}
          <View style={styles.actionIconBtn}>
            <Text style={{ fontSize: 20 }}>👁️</Text>
            <Text style={styles.actionCountText}>{currentReel.views}</Text>
          </View>

          {/* External Link */}
          <TouchableOpacity
            style={[styles.actionIconBtn, styles.externalCircle]}
            onPress={() => handleOpenExternal(currentReel.permalink)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ExternalLink size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Details & Tagged Product Sheet */}
        <View style={styles.bottomSheet}>
          <Text style={styles.captionText} numberOfLines={2}>
            {currentReel.caption}
          </Text>

          {currentReel.taggedProduct && (
            <View style={styles.taggedCard}>
              <View style={styles.taggedLeft}>
                <Image
                  source={{ uri: currentReel.taggedProduct.image }}
                  style={styles.taggedThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taggedName} numberOfLines={1}>
                    {currentReel.taggedProduct.name}
                  </Text>
                  <Text style={styles.taggedPrice}>
                    ৳{currentReel.taggedProduct.price.toLocaleString("en-BD")}
                  </Text>
                </View>
              </View>

              <View style={styles.taggedActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => handleViewProduct(currentReel.taggedProduct!.id)}
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddToCart(currentReel.taggedProduct)}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
    zIndex: 30,
  },
  progressBar: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 64 : 46,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 30,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#6366f1",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
  },
  platformText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  reelIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? 116 : 96,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  reelIndicatorText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heartBurst: {
    position: "absolute",
    zIndex: 40,
  },
  rightActions: {
    position: "absolute",
    right: 16,
    zIndex: 30,
    alignItems: "center",
    gap: 18,
  },
  actionIconBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  externalCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 30,
  },
  captionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  taggedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  taggedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  taggedThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  taggedName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  taggedPrice: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  taggedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  viewBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#6366f1",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});
