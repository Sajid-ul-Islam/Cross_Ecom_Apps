/**
 * DEEN Mobile — Floating Chat Widget.
 *
 * A draggable, badge-driven chat widget that pins to the bottom-right edge
 * of the screen. Tapping the badge opens the AI chat. Tapping the WhatsApp
 * or Messenger icon shows the user a choice (WhatsApp or Messenger); the
 * other icon is hidden after a short delay and re-appears when the user
 * taps back into the widget. When the chat is open the home screen stays
 * reachable underneath a full-height slide-over sheet.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  PanResponder,
  Linking,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { WhatsApp, Messenger, X, Sparkles } from "./Icons";
import { AiConciergeModal } from "./AiConciergeModal";
import type { PanResponderGestureState } from "react-native";

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
  // ── Draggable position (Animated values) ────────────────────────────
  const translateX = new Animated.Value(16);
  const translateY = new Animated.Value(-SCREEN_HEIGHT + 120);
  const [dragging, setDragging] = useState(false);

  const resetPosition = useCallback(() => {
    translateX.setValue(16);
    translateY.setValue(-SCREEN_HEIGHT + 120);
    Animated.spring(translateX, {
      toValue: 16,
      useNativeDriver: true,
      speed: 25,
    }).start();
    Animated.spring(translateY, {
      toValue: -SCREEN_HEIGHT + 120,
      useNativeDriver: true,
      speed: 25,
    }).start();
  }, [translateX, translateY]);

  // ── Dragging via PanResponder ───────────────────────────────────────
  const panResponder = useCallback(() => {
    return (
      {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: (e: any, gs: any) => {
          setDragging(true);
          // gs.x / gs.y are the coordinates of the responder grant
          translateX.setValue(gs.x);
          translateY.setValue(gs.y);
        },
        onResponderMove: (e: any, gs: any) => {
          if (gs.numberActive > 0) {
            translateX.setValue(gs.x);
            translateY.setValue(gs.y);
          }
        },
        onResponderRelease: (e: any, gs: any) => {
          setDragging(false);
          const clampedX = Math.max(
            8,
            Math.min(SCREEN_WIDTH - 8 - 56, gs.x),
          );
          const clampedY = Math.max(
            8,
            Math.min(SCREEN_HEIGHT - 8 - 120, gs.y),
          );
          translateX.setValue(clampedX);
          translateY.setValue(clampedY);
          Animated.spring(translateX, {
            toValue: clampedX,
            useNativeDriver: true,
            friction: 5,
          }).start();
          Animated.spring(translateY, {
            toValue: clampedY,
            useNativeDriver: true,
            friction: 5,
          }).start();
        },
        onResponderTerminate: () => {
          setDragging(false);
        },
      } as any
    );
  }, [translateX, translateY]);

  // ── Icon visibility (auto-hide one after 2.5s) ─────────────────────
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [showMessenger, setShowMessenger] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => {
      if (showWhatsApp && showMessenger) setShowWhatsApp(false);
    }, 2500);
    const t2 = setTimeout(() => {
      if (showWhatsApp && showMessenger) setShowMessenger(false);
    }, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, showWhatsApp, showMessenger]);

  // ── Icon tap → chooser sheet ───────────────────────────────────────
  const handleIconTap = (icon: "whatsapp" | "messenger") => {
    Alert.alert(
      "Choose your chat app",
      "Pick one to open a conversation with DEEN's concierge.\n\n• WhatsApp — 01952-700500 (online)\n• Messenger — deencommerce",
      [
        { text: "WhatsApp", onPress: () => openWhatsApp() },
        { text: "Messenger", onPress: () => openMessenger() },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const openWhatsApp = async () => {
    try {
      await Linking.openURL(WHATSAPP_URL);
    } catch {
      // fall through
    }
    setShowWhatsApp(false);
    setShowMessenger(true);
  };

  const openMessenger = async () => {
    try {
      await Linking.openURL(MESSENGER_URL);
    } catch {
      // fall through
    }
    setShowMessenger(false);
    setShowWhatsApp(true);
  };

  // ── Toggle chat open / closed ──────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────
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

      {/* Draggable floating widget (badge container) */}
      <Animated.View
        style={[
          styles.widgetContainer,
          {
            transform: [
              { translateX },
              { translateY },
            ],
          },
          dragging ? styles.widgetDragging : {},
        ]}
        {...panResponder()}
      >
        {/* ── Main badge (sparkle) ── */}
        <TouchableOpacity
          style={[styles.badge, { backgroundColor: colors.indigo }]}
          activeOpacity={0.8}
          onPress={toggleChat}
          accessibilityRole="button"
          accessibilityLabel="Open DEEN AI concierge chat"
        >
          <Sparkles size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ── WhatsApp + Messenger icons ── */}
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: "#25D366" }]}
            activeOpacity={0.85}
            onPress={() => handleIconTap("whatsapp")}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp support"
          >
            {showWhatsApp && <WhatsApp size={20} color="#FFFFFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: "rgba(0,132,255,0.12)" }]}
            activeOpacity={0.85}
            onPress={() => handleIconTap("messenger")}
            accessibilityRole="button"
            accessibilityLabel="Messenger support"
          >
            {showMessenger && <Messenger size={20} color="#0084FF" />}
          </TouchableOpacity>
        </View>

        {/* Close (✕) — only when chat is open */}
        {chatOpen && (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.cardSecondary }]}
            activeOpacity={0.8}
            onPress={() => {
              setChatOpen(false);
              resetPosition();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close chat"
          >
            <X size={14} color={colors.ink} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Chat slide-over (full-height sheet) ── */}
      {chatOpen && (
        <View style={styles.sheetContainer}>
          <AiConciergeModal
            visible={true}
            onClose={() => {
              setChatOpen(false);
              resetPosition();
            }}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  widgetDragging: {
    opacity: 0.92,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
  },
});
