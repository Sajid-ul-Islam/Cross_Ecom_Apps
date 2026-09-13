import React, { useState, useEffect, useRef, useCallback } from "react";
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

const HeroVideoSlide: React.FC<{
  videoUrl: string;
  isActive: boolean;
  onEnded: () => void;
}> = ({ videoUrl, isActive, onEnded }) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false; // Do not loop: play full video once before next slide
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

  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      if (isActive) {
        onEnded();
      }
    });
    return () => {
      sub.remove();
    };
  }, [player, isActive, onEnded]);

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

  const advanceToNextSlide = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0.2,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    // For static images, advance after 5.5 seconds.
    // For video slides, advance upon playback completion (via onEnded) with a 30s safety watchdog.
    if (currentSlide.videoUrl) {
      const watchdog = setTimeout(advanceToNextSlide, 30000);
      return () => clearTimeout(watchdog);
    }

    const timer = setTimeout(advanceToNextSlide, 5500);
    return () => clearTimeout(timer);
  }, [activeIndex, currentSlide.videoUrl, advanceToNextSlide]);

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
              onEnded={advanceToNextSlide}
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
