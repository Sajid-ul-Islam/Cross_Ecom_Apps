import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { litert, type SmartFitResult } from "../services/ai/LiteRTEngine";
import { X, Check, ShieldCheck } from "./Icons";
import { useTheme } from "../context/ThemeContext";

export interface LiteRTSmartFitModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  currentSize?: string;
}

export function LiteRTSmartFitModal({
  visible,
  onClose,
  onSelectSize,
  currentSize,
}: LiteRTSmartFitModalProps) {
  const { colors, isDark } = useTheme();

  // User Anthropometric States
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [fitPref, setFitPref] = useState<"slim" | "regular" | "relaxed">("regular");
  const [denimStretch, setDenimStretch] = useState<"rigid_raw" | "comfort_stretch" | "super_stretch">("comfort_stretch");

  // On-device LiteRT execution (zero latency)
  const prediction: SmartFitResult = useMemo(() => {
    return litert.predictSmartFit({
      heightCm,
      weightKg,
      fitPreference: fitPref,
      denimStretch,
    });
  }, [heightCm, weightKg, fitPref, denimStretch]);

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
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>⚡ GOOGLE LITE-RT ON-DEVICE AI</Text>
                </View>
                <Text style={styles.latencyText}>0ms Inference</Text>
              </View>
              <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                Smart Sizing & Fit Predictor
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "#191D2B" : "#F3F4F6" }]}
              accessibilityRole="button"
              accessibilityLabel="Close sizing modal"
            >
              <X size={18} color={isDark ? "#D1D5DB" : "#374151"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Height Selector */}
            <View style={styles.controlGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.controlLabel, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                  Your Height
                </Text>
                <Text style={styles.controlValue}>{heightCm} cm</Text>
              </View>
              <View style={styles.stepperRow}>
                {[165, 170, 175, 180, 185].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setHeightCm(val)}
                    style={[
                      styles.stepperChip,
                      heightCm === val && styles.stepperChipActive,
                      { borderColor: isDark ? "#262B3D" : "#E5E7EB" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        heightCm === val && styles.chipTextActive,
                        { color: isDark ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {val} cm
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Weight Selector */}
            <View style={styles.controlGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.controlLabel, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                  Your Weight
                </Text>
                <Text style={styles.controlValue}>{weightKg} kg</Text>
              </View>
              <View style={styles.stepperRow}>
                {[60, 65, 72, 78, 85, 92].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setWeightKg(val)}
                    style={[
                      styles.stepperChip,
                      weightKg === val && styles.stepperChipActive,
                      { borderColor: isDark ? "#262B3D" : "#E5E7EB" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        weightKg === val && styles.chipTextActive,
                        { color: isDark ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {val} kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fit Preference */}
            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, { color: isDark ? "#E5E7EB" : "#374151" }]}>
                Silhouette Cut Preference
              </Text>
              <View style={styles.optionsRow}>
                {(["slim", "regular", "relaxed"] as const).map((pref) => (
                  <TouchableOpacity
                    key={pref}
                    onPress={() => setFitPref(pref)}
                    style={[
                      styles.fitOption,
                      fitPref === pref && styles.fitOptionActive,
                      { borderColor: isDark ? "#262B3D" : "#E5E7EB" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fitOptionText,
                        fitPref === pref && styles.fitOptionTextActive,
                        { color: isDark ? "#D1D5DB" : "#374151" },
                      ]}
                    >
                      {pref.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Prediction Card */}
            <View
              style={[
                styles.predictionCard,
                {
                  backgroundColor: isDark ? "#121520" : "#F9FAFB",
                  borderColor: isDark ? "#262B3D" : "#E5E7EB",
                },
              ]}
            >
              <View style={styles.predHeader}>
                <View>
                  <Text style={styles.predSub}>RECOMMENDED DEEN SIZE</Text>
                  <Text style={styles.predSize}>Size {prediction.recommendedSize}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round(prediction.confidence * 100)}% Match
                  </Text>
                </View>
              </View>

              <Text style={[styles.predDesc, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                {prediction.fitCommentary}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Predicted Inseam:</Text>
                <Text style={styles.detailVal}>{prediction.recommendedInseam} inches</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stretch Factor:</Text>
                <Text style={styles.detailVal}>{prediction.stretchAdjustment}</Text>
              </View>

              <View style={styles.privacyNote}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.privacyText}>
                  100% On-Device AI inference. Zero personal biometric data leaves your phone.
                </Text>
              </View>
            </View>

            {/* Apply Action */}
            <TouchableOpacity
              onPress={() => {
                onSelectSize(prediction.recommendedSize);
                onClose();
              }}
              style={styles.applyBtn}
              activeOpacity={0.85}
            >
              <Check size={16} color="#000000" strokeWidth={3} />
              <Text style={styles.applyBtnText}>
                APPLY SIZE {prediction.recommendedSize} TO ITEM
              </Text>
            </TouchableOpacity>
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
  aiBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  aiBadgeText: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  latencyText: {
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
  controlGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  controlValue: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  stepperChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperChipActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#000000",
    fontWeight: "800",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  fitOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  fitOptionActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  fitOptionText: {
    fontSize: 11,
    fontWeight: "700",
  },
  fitOptionTextActive: {
    color: "#000000",
  },
  predictionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  predHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  predSub: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  predSize: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F59E0B",
  },
  confidenceBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  confidenceText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
  },
  predDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  detailVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  privacyText: {
    fontSize: 9,
    color: "#9CA3AF",
    flex: 1,
  },
  applyBtn: {
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  applyBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
