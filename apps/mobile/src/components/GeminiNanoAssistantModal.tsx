import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { geminiNano, type GeminiNanoResponse } from "../services/ai/GeminiNanoEngine";
import { X, ShieldCheck, ArrowRight, MessageCircle } from "./Icons";
import { useTheme } from "../context/ThemeContext";

export interface GeminiNanoAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  productName?: string;
  category?: string;
}

export function GeminiNanoAssistantModal({
  visible,
  onClose,
  productName = "DEEN Artisanal Selvedge Denim",
  category = "Denim",
}: GeminiNanoAssistantModalProps) {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GeminiNanoResponse | null>(null);

  const handleQuickAction = async (type: "styling" | "care" | "exchange" | "delivery") => {
    setLoading(true);
    try {
      if (type === "styling") {
        const res = await geminiNano.generateStylingAdvice(productName, category, "Regular");
        setResponse(res);
      } else if (type === "care") {
        const res = await geminiNano.generateCareGuide();
        setResponse(res);
      } else if (type === "exchange") {
        const res = await geminiNano.answerQuery("What is the 7-day exchange policy?");
        setResponse(res);
      } else {
        const res = await geminiNano.answerQuery("What are the delivery charges?");
        setResponse(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await geminiNano.answerQuery(query);
      setResponse(res);
      setQuery("");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? "#0E1017" : "#FFFFFF",
              borderColor: isDark ? "#1F2333" : "#E5E7EB",
            },
          ]}
        >
          {/* Grabber */}
          <View style={styles.grabberContainer}>
            <View style={[styles.grabber, { backgroundColor: isDark ? "#2D3245" : "#D1D5DB" }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? "#1C2030" : "#F3F4F6" }]}>
            <View>
              <View style={styles.badgeRow}>
                <View style={styles.nanoBadge}>
                  <Text style={styles.nanoBadgeText}>✨ GOOGLE GEMINI NANO</Text>
                </View>
                <Text style={styles.subBadge}>AICore On-Device SLM</Text>
              </View>
              <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                On-Device Denim Concierge
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "#191D2B" : "#F3F4F6" }]}
              accessibilityRole="button"
              accessibilityLabel="Close assistant modal"
            >
              <X size={18} color={isDark ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Quick Prompts */}
            <View style={styles.quickActionsContainer}>
              <Text style={[styles.sectionLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                RECOMMENDED QUESTIONS
              </Text>
              <View style={styles.chipsWrap}>
                <TouchableOpacity
                  onPress={() => handleQuickAction("styling")}
                  style={[styles.actionChip, { borderColor: isDark ? "#262B3D" : "#E5E7EB" }]}
                >
                  <Text style={[styles.actionChipText, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                    👖 How to style {productName.slice(0, 18)}...
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickAction("care")}
                  style={[styles.actionChip, { borderColor: isDark ? "#262B3D" : "#E5E7EB" }]}
                >
                  <Text style={[styles.actionChipText, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                    🧼 Raw Denim First Soak & Wash Care
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickAction("exchange")}
                  style={[styles.actionChip, { borderColor: isDark ? "#262B3D" : "#E5E7EB" }]}
                >
                  <Text style={[styles.actionChipText, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                    🔄 7-Day Doorstep Size Exchange
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickAction("delivery")}
                  style={[styles.actionChip, { borderColor: isDark ? "#262B3D" : "#E5E7EB" }]}
                >
                  <Text style={[styles.actionChipText, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                    🚚 64 Districts Delivery Rates
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Response Display */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 8 }}>
                  Google Gemini Nano synthesizing on-device response...
                </Text>
              </View>
            ) : response ? (
              <View
                style={[
                  styles.responseCard,
                  {
                    backgroundColor: isDark ? "#121520" : "#F9FAFB",
                    borderColor: isDark ? "#262B3D" : "#E5E7EB",
                  },
                ]}
              >
                <Text style={[styles.responseBody, { color: isDark ? "#E5E7EB" : "#1F2937" }]}>
                  {response.content}
                </Text>

                <View style={styles.responseFooter}>
                  <View style={styles.metaRow}>
                    <ShieldCheck size={12} color="#10B981" />
                    <Text style={styles.metaText}>
                      {response.metadata.latencyMs}ms · {response.metadata.privacy}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Input Form */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ask Gemini Nano anything about DEEN products..."
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? "#161926" : "#F3F4F6",
                    color: isDark ? "#FFFFFF" : "#111827",
                    borderColor: isDark ? "#262B3D" : "#E5E7EB",
                  },
                ]}
                onSubmitEditing={handleAsk}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleAsk}
                style={styles.sendButton}
                accessibilityRole="button"
                accessibilityLabel="Send question"
              >
                <ArrowRight size={16} color="#000000" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "88%",
  },
  grabberContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nanoBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  nanoBadgeText: {
    color: "#C084FC",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subBadge: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quickActionsContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  responseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  responseBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  responseFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
});
