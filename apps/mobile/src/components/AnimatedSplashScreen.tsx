import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function AnimatedSplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const { colors, isDark } = useTheme();
  const scale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.0,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.paper,
          opacity: containerOpacity,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999,
        },
      ]}
    >
      <Animated.View
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: logoOpacity,
          transform: [{ scale }],
        }}
      >
        {/* Brand Icon */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Animated.Image
            source={isDark ? require("../../assets/icon_dark.png") : require("../../assets/icon_light.png")}
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
            }}
            resizeMode="cover"
          />
        </View>

        {/* Brand Logo Wordmark */}
        <Animated.Image
          source={isDark ? require("../../assets/logo_white.png") : require("../../assets/logo.png")}
          style={{
            width: 200,
            height: 56,
            resizeMode: "contain",
          }}
        />

        {/* Brand Heritage & Slogan */}
        <Text
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.5,
            color: colors.denimStitch,
            textTransform: "uppercase",
          }}
        >
          দেশের প্রথম ডেনিম ব্র্যান্ড
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 2,
            color: colors.sub,
            textTransform: "uppercase",
          }}
        >
          EST. 2020 · DHAKA
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
