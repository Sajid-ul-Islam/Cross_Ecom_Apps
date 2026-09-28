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
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { X, Sparkles, Send, Phone, MessageCircle, Trash2 } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { bdt, getInStockSizes, request, getAuthToken, getGuestSession } from "../services/gateway";
import { QuickAddBottomSheet } from "./QuickAddBottomSheet";

const { width, height } = Dimensions.get("window");

const WHATSAPP_NUMBER = "8801952700500";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const MESSENGER_URL = "https://m.me/deencommerce";
const SUPPORT_HOTLINE = "tel:+8801952700500";
const CHAT_STORAGE_KEY = "@deen/ai_chat_history_v1";
const MAX_STORED_MESSAGES = 40;

const WELCOME_MESSAGE: AiMessage = {
  id: "welcome",
  sender: "ai",
  text: "👋 Welcome to **DEEN Denim Concierge**! I can recommend menswear outfits from our live catalog, calculate Bangladesh delivery charges, guide you on waist & chest sizing, explain our 7-day doorstep size exchange, or check your live order tracking.\n\nHow can I help you today?",
  quickReplies: [
    "জিন্স কালেকশন 👖",
    "পাঞ্জাবি কালেকশন 🕌",
    "শার্ট কালেকশন 👔",
    "সাইজ গাইড 📏",
    "অর্ডার স্ট্যাটাস চেক 📦",
  ],
};

/** In-chat informational cards for gateway actions that need no navigation. */
const INFO_CARDS: Record<string, { text: string; quickReplies?: string[] }> = {
  open_bank_offers: {
    text: "💳 **Bank Card Offers & Cashback**\n\n• **0% EMI** — 3, 6 & 12-month plans on major credit cards (via SSLCommerz)\n• **Instant cashback** — ৳500 on ৳2500+ orders, ৳700 on ৳3000+ orders (auto-applied at checkout)\n• **COD** available nationwide with zero advance payment",
    quickReplies: ["Jeans Collection 👖", "Delivery charge?", "Cash on Delivery"],
  },
  open_size_guide: {
    text: "📐 **Quick Size Chart**\n\n• **Jeans (waist inches):** 28 · 30 · 32 · 34 · 36 · 38\n• Measure your snug natural waist — between sizes? Go one up.\n• **Panjabi/Shirts (chest):** M (38″) · L (40″) · XL (42″) · XXL (44″)\n\nStill unsure? Our 7-day doorstep size exchange has you covered!",
    quickReplies: ["Show size 32 jeans", "7-day size exchange", "Jeans Collection 👖"],
  },
  open_care_guide: {
    text: "🧼 **Denim Care Guide**\n\n• Wash rarely, inside-out, in **cold water**\n• Mild detergent only — **never bleach**\n• **Air-dry in shade**; avoid tumble drying\n• Iron inside-out on low heat\n\nProper care keeps your raw denim fading beautifully!",
    quickReplies: ["Selvedge Jeans Collection", "Size Guide 📏", "Delivery charge?"],
  },
  open_exchange: {
    text: "🔄 **7-Day Doorstep Size Exchange**\n\n• Request within **7 days** of delivery\n• Same product, different size — our rider **swaps at your door**\n• Item must be unworn with tags intact\n\nTo start an exchange, open your order from My Orders!",
    quickReplies: ["My Orders 📦", "Size Guide 📏", "WhatsApp Support"],
  },
};

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
  quickReplies?: string[];
}

const QUICK_PROMPTS = [
  "🔥 What is the current offer & discount?",
  "👖 Suggest jeans under ৳2500",
  "📏 How to choose my waist size for DEEN jeans?",
  "🔄 How does the 7-day size exchange work?",
  "🚚 Chittagong delivery charge & time?",
  "📍 Do you have retail outlets or showrooms?",
  "💬 WhatsApp Concierge Hotline",
];

export interface AiConciergeModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface AiChatViewProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

/**
 * Lightweight, zero-dependency formatted text parser for React Native.
 * Parses bold tokens (**text**), strikethrough (~~text~~), inline code (`code`),
 * bullets (•, -, *), and line breaks into styled <Text> tree.
 */
export function renderFormattedTextNative(
  text: string,
  isUser: boolean,
  colors: ThemeColors
): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");

  const parseInline = (lineText: string, keyPrefix: string): React.ReactNode[] => {
    const parts = lineText.split(/(\*\*[\s\S]+?\*\*|~~[\s\S]+?~~|`[\s\S]+?`)/g);
    return parts.map((part, idx) => {
      const key = `${keyPrefix}_${idx}`;
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const content = part.slice(2, -2);
        return (
          <Text
            key={key}
            style={{
              fontWeight: "700",
              color: isUser ? "#FFFFFF" : colors.ink,
            }}
          >
            {content}
          </Text>
        );
      }
      if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
        const content = part.slice(2, -2);
        return (
          <Text
            key={key}
            style={{
              textDecorationLine: "line-through",
              opacity: 0.7,
              color: isUser ? "#FFFFFF" : colors.sub,
            }}
          >
            {content}
          </Text>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        const content = part.slice(1, -1);
        return (
          <Text
            key={key}
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
              fontWeight: "600",
              color: isUser ? "#FFFFFF" : colors.indigo,
            }}
          >
            {content}
          </Text>
        );
      }
      return (
        <Text key={key} style={{ color: isUser ? "#FFFFFF" : colors.ink }}>
          {part}
        </Text>
      );
    });
  };

  const renderedElements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      renderedElements.push(
        <Text key={`space_${i}`}>
          {"\n"}
        </Text>
      );
      continue;
    }

    const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length > 0 ? "    " : "  ";
      const bulletContent = bulletMatch[3];
      renderedElements.push(
        <Text key={`b_${i}`}>
          <Text
            style={{
              color: isUser ? "#FFFFFF" : colors.indigo,
              fontWeight: "700",
            }}
          >
            {indent}•{" "}
          </Text>
          {parseInline(bulletContent, `b_in_${i}`)}
          {i < lines.length - 1 ? "\n" : ""}
        </Text>
      );
      continue;
    }

    renderedElements.push(
      <Text key={`l_${i}`}>
        {parseInline(line, `l_in_${i}`)}
        {i < lines.length - 1 ? "\n" : ""}
      </Text>
    );
  }

  return renderedElements;
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
  const [hydrated, setHydrated] = useState(false);

  const [messages, setMessages] = useState<AiMessage[]>([WELCOME_MESSAGE]);

  const scrollRef = useRef<ScrollView>(null);

  // ── Restore persisted conversation once on mount ──
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(CHAT_STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const stored = JSON.parse(raw) as AiMessage[];
          if (Array.isArray(stored) && stored.length > 0) {
            setMessages(stored);
          }
        } catch {
          // Corrupt payload — keep the fresh welcome state
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
  }, []);

  // ── Persist conversation after every change (post-hydration) ──
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))).catch(
      () => {}
    );
  }, [messages, hydrated]);

  const clearConversation = () => {
    Alert.alert(
      "Clear conversation?",
      "This will erase your chat history on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => setMessages([WELCOME_MESSAGE]),
        },
      ]
    );
  };

  const pushBotNote = (text: string, quickReplies?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: `ai_${Date.now()}`, sender: "ai", text, quickReplies },
    ]);
  };

  /**
   * Navigation from chat:
   * - Floating modal → dismiss, then navigate.
   * - Embedded (Chat tab) → navigate directly; chat stays mounted.
   */
  const navigateFromChat = (path: Href) => {
    if (isEmbedded) {
      router.push(path);
    } else {
      onClose?.();
      router.push(path);
    }
  };

  /**
   * Central gateway-action dispatcher. Every action the AI agent can emit
   * is handled here — nothing silently no-ops or closes the chat.
   */
  const handleAction = (act: { label: string; action: string; payload?: any }) => {
    switch (act.action) {
      // External deep links (never close the chat)
      case "open_url":
        if (act.payload?.url) Linking.openURL(act.payload.url).catch(() => {});
        break;
      case "open_whatsapp":
        openWhatsApp();
        break;
      case "open_messenger":
        openMessenger();
        break;
      case "contact_support":
        Linking.openURL(SUPPORT_HOTLINE).catch(() => openWhatsApp());
        break;

      // In-app navigation (modal dismisses; tab chat stays open)
      case "navigate_shop":
      case "search_jeans":
      case "search_delivery":
        navigateFromChat("/(tabs)/shop");
        break;
      case "navigate_orders":
        navigateFromChat("/(tabs)/orders");
        break;
      case "navigate_checkout":
        navigateFromChat("/checkout");
        break;
      case "navigate_returns":
        navigateFromChat("/(tabs)/orders");
        break;

      // In-chat informational cards
      case "open_bank_offers":
      case "open_size_guide":
      case "open_care_guide":
      case "open_exchange": {
        const card = INFO_CARDS[act.action];
        if (card) pushBotNote(card.text, card.quickReplies);
        break;
      }

      // Future-proof: unknown actions inform instead of silently dying
      default:
        pushBotNote(
          `“${act.label}” is on our roadmap! Meanwhile, ask me about orders, sizes, offers or delivery.`
        );
        break;
    }
  };

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
      // Use request() so x-api-key is injected automatically (same as every other
      // gateway call). Bare fetch() omitted the key -> gateway answered 401 and
      // the concierge never rendered retrieved catalog/order data.
      // Also send the user's auth/session token so the gateway scopes visible
      // orders to THIS account (order tracking works in-chat for signed-in users).
      const guestSession = await getGuestSession();
      const token = (await getAuthToken()) || guestSession?.token;
      const authHeaders: Record<string, string> = {};
      if (token) authHeaders.Authorization = `Bearer ${token}`;

      const data = await request<{
        reply: string;
        suggestedProducts?: any[];
        suggestedActions?: { label: string; action: string; payload?: any }[];
        quickReplies?: string[];
      }>(
        "/v1/deen/ai/chat",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            message: text,
            phone: profile?.phone,
            history: messages.slice(-4).map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          }),
        },
        8000
      );

      if (!data?.reply) throw new Error("Empty AI response");

      const aiMsg: AiMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply,
        products: data.suggestedProducts,
        actions: data.suggestedActions,
        quickReplies: data.quickReplies,
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

  const [quickAddProduct, setQuickAddProduct] = useState<any>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const handleQuickAdd = (p: any) => {
    const inStock = getInStockSizes(p);
    if (inStock.length === 1) {
      addToCart(p, inStock[0], 1);
      setAddedIds((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [p.id]: false }));
      }, 2000);
      return;
    }
    setQuickAddProduct(p);
    setQuickAddVisible(true);
  };

  const openWhatsApp = async () => {
    const appUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}`;
    const webUrl = WHATSAPP_URL;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {}
    await Linking.openURL(webUrl);
  };

  const openMessenger = async () => {
    const appUrl = "fb-messenger://user-thread/100981575058964";
    const webUrl = MESSENGER_URL;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {}
    await Linking.openURL(webUrl);
  };

  const content = (
    <View style={isEmbedded ? styles.sheetEmbedded : styles.sheet}>
      {/* Header with DEEN Assistant, WhatsApp and Messenger buttons */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Sparkles size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.title}>DEEN DENIM CONCIERGE</Text>
            <Text style={[styles.sub, { color: colors.denimStitch }]}>
              দেশের প্রথম ডেনিম ব্র্যান্ড · <Text style={{ color: colors.emerald }}>Online</Text>
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.headerIconCircle}
            onPress={openWhatsApp}
            accessibilityRole="button"
            accessibilityLabel="Direct WhatsApp Support"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Phone size={15} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconCircle, { backgroundColor: "rgba(0, 132, 255, 0.12)", borderColor: "rgba(0, 132, 255, 0.35)" }]}
            onPress={openMessenger}
            accessibilityRole="button"
            accessibilityLabel="Direct Facebook Messenger Support"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageCircle size={15} color="#0084FF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={clearConversation}
            accessibilityRole="button"
            accessibilityLabel="Clear chat history"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={colors.sub} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              if (onClose) {
                onClose();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Leave chat"
          >
            <X size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

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
                    {renderFormattedTextNative(m.text, m.sender === "user", colors)}
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
                        key={`${m.id}_${act.action}`}
                        style={styles.actionChip}
                        activeOpacity={0.8}
                        onPress={() => handleAction(act)}
                        accessibilityRole="button"
                        accessibilityLabel={act.label}
                      >
                        <Text style={styles.actionChipText}>{act.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Interactive Quick Reply Pills */}
                {m.sender === "ai" && m.quickReplies && m.quickReplies.length > 0 && (
                  <View style={styles.quickRepliesRow}>
                    {m.quickReplies.map((qr, qIdx) => (
                      <TouchableOpacity
                        key={`qr_${m.id}_${qIdx}`}
                        style={styles.quickReplyPill}
                        activeOpacity={0.8}
                        onPress={() => handleSend(qr)}
                        accessibilityRole="button"
                        accessibilityLabel={`Quick reply: ${qr}`}
                      >
                        <Text style={styles.quickReplyText}>{qr}</Text>
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
        <QuickAddBottomSheet
          product={quickAddProduct}
          visible={quickAddVisible}
          onClose={() => setQuickAddVisible(false)}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss chat modal"
      />
      {content}
      <QuickAddBottomSheet
        product={quickAddProduct}
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
      />
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
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      height: Math.round(height * 0.82),
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    sheetEmbedded: {
      backgroundColor: colors.paper,
      flex: 1,
      maxWidth: 600,
      width: "100%",
      alignSelf: "center",
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
    headerIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(37, 211, 102, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(37, 211, 102, 0.35)",
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
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
    quickRepliesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    quickReplyPill: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.indigo,
    },
    quickReplyText: {
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
