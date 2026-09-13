import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16)); // 16:9 cinematic edge-to-edge ratio

interface HeroSlide {
  id: string;
  image: string;
  videoUrl?: string;
  badge: string;
  title: string;
  tagline: string;
  categorySlug?: string;
}

const SLIDES: HeroSlide[] = [
  {
    id: "denim_hero",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/Mobile-Hero-Banner.jpg",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/Denim-Web-Banner_1920x840pxl.mp4",
    badge: "🔥 CROSS HATCH DENIM '26",
    title: "দেশের প্রথম ডেনিম ব্র্যান্ড",
    tagline: "13.5oz Cross Hatch Denim woven on vintage shuttle looms",
    categorySlug: "JEANS",
  },
  {
    id: "shirt_hero",
    image: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner-1.jpg",
    videoUrl: "https://deencommerce.com/wp-content/uploads/2026/09/END-OF-THE-SESSION-2_1920x8401.mp4",
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

const HeroVideoSlide: React.FC<{ videoUrl: string; isActive: boolean }> = ({
  videoUrl,
  isActive,
}) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActive) {
      p.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
};

interface MotionHeroProps {
  onWatchStory?: () => void;
}

export const MotionHero: React.FC<MotionHeroProps> = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentSlide = SLIDES[activeIndex];

  useEffect(() => {
    const duration = currentSlide.videoUrl ? 8000 : 5500;
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
    }, duration);

    return () => clearInterval(timer);
  }, [activeIndex, fadeAnim, currentSlide.videoUrl]);

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
        activeOpacity={0.96}
        onPress={handlePrimaryPress}
        style={styles.heroCard}
      >
        <Animated.View style={[styles.imageWrap, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: currentSlide.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {currentSlide.videoUrl ? (
            <HeroVideoSlide
              key={currentSlide.id}
              videoUrl={currentSlide.videoUrl}
              isActive={true}
            />
          ) : null}
        </Animated.View>

        {/* Sleek Minimal Slide Indicators */}
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveIndex(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.indicatorBar,
                {
                  width: i === activeIndex ? 20 : 6,
                  backgroundColor:
                    i === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.45)",
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
    marginHorizontal: -16, // Flush edge-to-edge canceling screen 16px horizontal padding
    marginTop: -16, // Flush to screen top
    marginBottom: 16,
    width: SCREEN_WIDTH,
  },
  heroCard: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 0, // Edge-to-edge clean
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
  },
  imageWrap: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  indicatorRow: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorBar: {
    height: 4,
    borderRadius: 2,
  },
});
