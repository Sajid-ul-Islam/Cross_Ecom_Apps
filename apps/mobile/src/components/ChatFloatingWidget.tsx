/**
 * DEEN Mobile — Floating Concierge & Support Widget.
 *
 * Draggable, badge-driven support widget that pins to the bottom-right of the screen
 * above the bottom navigation bar. Provides instant access to:
 * 1. AI Concierge chat sheet (Sparkles badge)
 * 2. WhatsApp direct hotline (01952-700500)
 * 3. Facebook Messenger direct channel
 */

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { WhatsApp, Messenger, X, Sparkles } from "./Icons";
import { AiConciergeModal } from "./AiConciergeModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const WHATSAPP_URL = "https://wa.me/8801952700500";
const MESSENGER_URL = "https://m.me/deencommerce";

interface ChatFloatingWidgetProps {
  visible?: boolean;
  onChatOpened?: () => void;
  setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatFloatingWidget({
  visible = true,
  onChatOpened,
  setVisible,
}: ChatFloatingWidgetProps) {
  const { colors } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Position animated coordinates
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [pan]);

  // Draggable gesture responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        setDragging(true);
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        setDragging(false);
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        pan.flattenOffset();
      },
    })
  ).current;

  const openWhatsApp = async () => {
    try {
      await Linking.openURL(WHATSAPP_URL);
    } catch {}
  };

  const openMessenger = async () => {
    try {
      await Linking.openURL(MESSENGER_URL);
    } catch {}
  };

  const toggleChat = () => {
    setChatOpen((prev) => {
      const next = !prev;
      if (next) {
        onChatOpened?.();
        if (setVisible) setVisible(true);
      } else {
        resetPosition();
      }
      return next;
    });
  };

  if (!visible) return null;

  return (
    <>
      {chatOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            setChatOpen(false);
            resetPosition();
          }}
        />
      )}

      {/* Floating draggable container */}
      <Animated.View
        style={[
          styles.widgetContainer,
          {
            transform: pan.getTranslateTransform(),
          },
          dragging ? styles.widgetDragging : {},
        ]}
        {...panResponder.panHandlers}
      >
        {/* Support App Buttons (WhatsApp & Messenger) */}
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: "#25D366" }]}
            activeOpacity={0.85}
            onPress={openWhatsApp}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp support hotline"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <WhatsApp size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: "#0084FF" }]}
            activeOpacity={0.85}
            onPress={openMessenger}
            accessibilityRole="button"
            accessibilityLabel="Facebook Messenger support"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Messenger size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* AI Concierge Trigger Badge */}
        <TouchableOpacity
          style={[styles.badge, { backgroundColor: colors.indigo, marginTop: 10 }]}
          activeOpacity={0.85}
          onPress={toggleChat}
          accessibilityRole="button"
          accessibilityLabel="Open DEEN AI concierge chat"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {chatOpen ? (
            <X size={20} color="#FFFFFF" />
          ) : (
            <Sparkles size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Slide-over AI Concierge Modal */}
      {chatOpen && (
        <AiConciergeModal
          visible={true}
          onClose={() => {
            setChatOpen(false);
            resetPosition();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    position: "absolute",
    bottom: 76,
    right: 16,
    alignItems: "center",
    zIndex: 999,
  },
  widgetDragging: {
    opacity: 0.88,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconRow: {
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
