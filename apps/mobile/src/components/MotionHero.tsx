import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Sparkles, ShieldCheck } from "./Icons";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = Math.round((width - 32) * (10 / 16)); // 16:10 cinematic banner ratio

interface HeroSlide {
  id: string;
  image: string;
  badge: string;
  title: string;
  tagline: string;
  categorySlug?: string;
}

const SLIDES: HeroSlide[] = [
  {
    id: "denim_hero",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/Mobile-Hero-Banner.jpg",
    badge: "🔥 RAW SELVEDGE '26",
    title: "দেশের প্রথম ডেনিম ব্র্যান্ড",
    tagline: "13.5oz Red-Line ID Selvedge woven on vintage shuttle looms",
    categorySlug: "JEANS",
  },
  {
    id: "shirt_hero",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner-1.jpg",
    badge: "👔 TAILORED SHIRTS",
    title: "Pin-Point Oxford Weave",
    tagline: "Pure cotton comfort engineered for Bangladesh weather",
    categorySlug: "SHIRT",
  },
  {
    id: "panjabi_hero",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg",
    badge: "🌙 HERITAGE COLLECTION",
    title: "Indigo Dobby Panjabi",
    tagline: "Artisanal hand-finished collars & timeless elegance",
    categorySlug: "PANJABI",
  },
];

export const MotionHero: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // Smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setActiveIndex((prev) => (prev + 1) % SLIDES.length);
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [fadeAnim]);

  const currentSlide = SLIDES[activeIndex];

  const handlePrimaryPress = () => {
    if (currentSlide.categorySlug) {
      router.push({
        pathname: "/category/[slug]",
        params: { slug: currentSlide.categorySlug },
      });
    } else {
      router.push("/(tabs)/shop");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={handlePrimaryPress}
        style={styles.heroCard}
      >
        <Animated.View style={[styles.imageWrap, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: currentSlide.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Multi-gradient backdrop for rich text contrast */}
        <View style={styles.darkGradient} />

        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          {/* Top Brand Pill */}
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Sparkles size={11} color="#FFFFFF" />
              <Text style={styles.badgeText}>{currentSlide.badge}</Text>
            </View>

            <View style={styles.guaranteePill}>
              <ShieldCheck size={11} color="#10B981" />
              <Text style={styles.guaranteeText}>7-Day Size Swap</Text>
            </View>
          </View>

          {/* Title and Tagline */}
          <Text style={styles.titleText}>{currentSlide.title}</Text>
          <Text style={styles.taglineText}>{currentSlide.tagline}</Text>

          {/* CTA Row */}
          <View style={styles.ctaRow}>
            <View style={styles.primaryCta}>
              <Text style={styles.primaryCtaText}>EXPLORE NOW</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </View>

            <Text style={styles.shopCategoryHint}>
              Tap to view {currentSlide.categorySlug || "collection"} →
            </Text>
          </View>
        </View>

        {/* Sleek Slide Indicators */}
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveIndex(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.indicatorBar,
                {
                  width: i === activeIndex ? 24 : 6,
                  backgroundColor: i === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  heroCard: {
    height: HERO_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0D111A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  darkGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(13, 17, 26, 0.42)",
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: "flex-end",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(99, 102, 241, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  guaranteePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  guaranteeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  taglineText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
    marginBottom: 10,
    maxWidth: width * 0.75,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6366F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  shopCategoryHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10.5,
    fontWeight: "700",
  },
  indicatorRow: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  indicatorBar: {
    height: 4,
    borderRadius: 2,
  },
});
