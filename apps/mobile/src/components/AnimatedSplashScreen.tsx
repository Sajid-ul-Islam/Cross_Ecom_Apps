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
        <Animated.Image
          source={isDark ? require("../../assets/logo_white.png") : require("../../assets/logo.png")}
          style={{
            width: 220,
            height: 64,
          }}
          resizeMode="contain"
        />
        <Text
          style={{
            marginTop: 14,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 2.5,
            color: colors.sub,
            textTransform: "uppercase",
          }}
        >
          Cross Hatch Denim & Apparel
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
