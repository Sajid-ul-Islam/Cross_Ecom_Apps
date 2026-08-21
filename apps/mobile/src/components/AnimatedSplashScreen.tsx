import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function AnimatedSplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
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
          zIndex: 999 
        }
      ]}
    >
      <Animated.Image 
        source={require("../../assets/icon.png")} 
        style={{ 
          width: 140, 
          height: 140, 
          borderRadius: 28,
          opacity: logoOpacity,
          transform: [{ scale }] 
        }} 
        resizeMode="contain" 
      />
    </Animated.View>
  );
}
