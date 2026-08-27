import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { X, ZoomIn, ZoomOut, Maximize2 } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageLightboxModalProps {
  visible: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  onClose,
  images,
  initialIndex = 0,
  productName,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      setIsZoomed(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 50);
    }
  }, [visible, initialIndex]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIdx = Math.round(offsetX / SCREEN_WIDTH);
    if (nextIdx !== activeIndex && nextIdx >= 0 && nextIdx < images.length) {
      setActiveIndex(nextIdx);
    }
  };

  const jumpTo = (idx: number) => {
    setActiveIndex(idx);
    scrollRef.current?.scrollTo({
      x: idx * SCREEN_WIDTH,
      animated: true,
    });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {productName || "PRODUCT GALLERY"}
            </Text>
            <Text style={styles.counterText}>
              {activeIndex + 1} of {images.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={toggleZoom}>
            {isZoomed ? (
              <ZoomOut size={20} color="#FFFFFF" />
            ) : (
              <ZoomIn size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Fullscreen Horizontal Swipe Gallery */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.galleryScroll}
        >
          {images.map((img, idx) => (
            <View key={idx} style={styles.slideContainer}>
              <Image
                source={{ uri: img }}
                style={[
                  styles.lightboxImage,
                  isZoomed && styles.lightboxImageZoomed,
                ]}
                resizeMode={isZoomed ? "cover" : "contain"}
              />
            </View>
          ))}
        </ScrollView>

        {/* Thumbnail Selector Strip */}
        {images.length > 1 && (
          <View style={styles.bottomBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
              {images.map((img, idx) => {
                const isSelected = activeIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.thumbBox, isSelected && styles.thumbBoxActive]}
                    onPress={() => jumpTo(idx)}
                  >
                    <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
      justifyContent: "space-between",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 44,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      zIndex: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    titleWrap: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 10,
    },
    productTitle: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    counterText: {
      color: "rgba(255, 255, 255, 0.6)",
      fontSize: 10,
      fontWeight: "600",
      marginTop: 2,
    },
    galleryScroll: {
      flex: 1,
    },
    slideContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.75,
      justifyContent: "center",
      alignItems: "center",
    },
    lightboxImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.72,
    },
    lightboxImageZoomed: {
      width: SCREEN_WIDTH * 1.5,
      height: SCREEN_HEIGHT * 0.9,
    },
    bottomBar: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
    },
    thumbStrip: {
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    thumbBox: {
      width: 52,
      height: 52,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.3)",
      overflow: "hidden",
    },
    thumbBoxActive: {
      borderColor: colors.indigo,
    },
    thumbImg: {
      width: "100%",
      height: "100%",
    },
  });
}
