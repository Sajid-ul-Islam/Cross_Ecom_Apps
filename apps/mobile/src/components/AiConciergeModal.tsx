import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Sparkles, Send, ShoppingBag, Truck, MapPin, PhoneCall } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { bdt, GATEWAY_URL } from "../services/gateway";

const { width, height } = Dimensions.get("window");

interface AiMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    salePrice?: number;
    image: string;
    sizes: string[];
  }>;
  actions?: Array<{ label: string; action: string; payload?: any }>;
}

const QUICK_PROMPTS = [
  "👖 Suggest selvedge jeans under ৳2500",
  "🚚 Chittagong delivery charge & time?",
  "🔄 How does the 7-day size exchange work?",
  "📍 Where are your retail showrooms in Dhaka?",
];

export interface AiConciergeModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface AiChatViewProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const AiChatView: React.FC<AiChatViewProps> = ({
  onClose,
  isEmbedded = false,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { addToCart } = useCart();
  const { profile } = useProfile();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Welcome to **DEEN AI Concierge**! I can recommend menswear outfits from our live catalog, calculate Bangladesh delivery charges, explain our 7-day doorstep size exchange, or locate our 4 retail showrooms.\n\nHow can I help you today?",
    },
  ]);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    const userMsg: AiMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${GATEWAY_URL}/v1/deen/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          phone: profile?.phone,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to consult AI");

      const data = await res.json();
      const aiMsg: AiMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply,
        products: data.suggestedProducts,
        actions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: "I experienced a brief connection blip with our catalog knowledge base. You can also chat directly with our Dhaka stylists on WhatsApp at 01952-700500!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (p: any) => {
    const size = p.sizes?.[0] || "32";
    addToCart(p, size, 1);
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const content = (
    <View style={isEmbedded ? styles.sheetEmbedded : styles.sheet}>
      {/* Header */}
      {!isEmbedded && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatar}>
              <Sparkles size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.title}>DEEN AI CONCIERGE</Text>
              <Text style={styles.sub}>● RAG Knowledge & Live Catalog Active</Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close AI Concierge"
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          )}
        </View>
      )}

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageWrapper,
                  m.sender === "user" ? styles.userWrapper : styles.aiWrapper,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    m.sender === "user" ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      m.sender === "user" ? styles.userBubbleText : styles.aiBubbleText,
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>

                {/* Embedded Products */}
                {m.products && m.products.length > 0 && (
                  <View style={styles.productsList}>
                    {m.products.map((p) => {
                      const price = p.salePrice ?? p.price;
                      const isAdded = addedIds[p.id];

                      return (
                        <View key={p.id} style={styles.productCard}>
                          <Image
                            source={{ uri: p.image }}
                            style={styles.productThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.productInfo}>
                            <Text style={styles.productCategory}>{p.category}</Text>
                            <Text style={styles.productName} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={styles.productPrice}>{bdt(price)}</Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.addBtn,
                              { backgroundColor: isAdded ? colors.emerald : colors.indigo },
                            ]}
                            activeOpacity={0.8}
                            onPress={() => handleQuickAdd(p)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.addBtnText}>
                              {isAdded ? "✓" : "+ BAG"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Suggested Action Buttons */}
                {m.actions && (
                  <View style={styles.actionsRow}>
                    {m.actions.map((act) => (
                      <TouchableOpacity
                        key={act.action}
                        style={styles.actionChip}
                        activeOpacity={0.8}
                        onPress={() => {
                          onClose?.();
                          if (act.action === "open_url" && act.payload?.url) {
                            Linking.openURL(act.payload.url);
                          } else if (act.action === "open_whatsapp") {
                            Linking.openURL("https://wa.me/8801952700500");
                          } else if (act.action === "navigate_shop") {
                            router.push("/(tabs)/shop");
                          } else if (act.action === "navigate_orders") {
                            router.push("/(tabs)/orders");
                          } else if (act.action === "navigate_checkout") {
                            router.push("/checkout");
                          }
                        }}
                      >
                        <Text style={styles.actionChipText}>{act.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={styles.loadingRow}>
                <Sparkles size={14} color={colors.indigo} />
                <Text style={styles.loadingText}>Retrieving catalog & knowledge base…</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <View style={styles.quickPromptsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
                {QUICK_PROMPTS.map((qp) => (
                  <TouchableOpacity
                    key={qp}
                    style={styles.promptChip}
                    onPress={() => handleSend(qp)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.promptChipText}>{qp}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask in Bengali or English…"
              placeholderTextColor={colors.faint}
              returnKeyType="send"
              onSubmitEditing={() => handleSend(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSend(input)}
              disabled={!input.trim() || loading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );

  if (isEmbedded) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.paper }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  );
};

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <AiChatView onClose={onClose} />
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: Math.round(height * 0.85),
      display: "flex",
      flexDirection: "column",
    },
    sheetEmbedded: {
      backgroundColor: colors.paper,
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    aiAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.indigo,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.5,
    },
    sub: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.emerald,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 14,
      backgroundColor: colors.paper,
    },
    messagesContent: {
      paddingVertical: 14,
      gap: 12,
    },
    messageWrapper: {
      marginBottom: 6,
    },
    userWrapper: {
      alignItems: "flex-end",
    },
    aiWrapper: {
      alignItems: "flex-start",
    },
    bubble: {
      maxWidth: "85%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
    },
    userBubble: {
      backgroundColor: colors.indigo,
      borderBottomRightRadius: 2,
    },
    aiBubble: {
      backgroundColor: colors.cardSecondary,
      borderBottomLeftRadius: 2,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bubbleText: {
      fontSize: 13,
      lineHeight: 18,
    },
    userBubbleText: {
      color: "#FFFFFF",
      fontWeight: "500",
    },
    aiBubbleText: {
      color: colors.ink,
      fontWeight: "500",
    },
    productsList: {
      marginTop: 8,
      gap: 6,
      width: "100%",
    },
    productCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    productThumb: {
      width: 44,
      height: 52,
      borderRadius: 6,
    },
    productInfo: {
      flex: 1,
      minWidth: 0,
    },
    productCategory: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.sub,
      textTransform: "uppercase",
    },
    productName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
      marginTop: 2,
    },
    productPrice: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.indigo,
      marginTop: 2,
    },
    addBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    addBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    actionChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.indigo,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 6,
    },
    loadingText: {
      fontSize: 11,
      fontStyle: "italic",
      color: colors.sub,
    },
    quickPromptsWrap: {
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    quickPromptsScroll: {
      paddingHorizontal: 14,
      gap: 8,
    },
    promptChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    promptChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.ink,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.card,
    },
    input: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.ink,
    },
    sendBtn: {
      backgroundColor: colors.indigo,
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      opacity: 0.5,
    },
  });
}
