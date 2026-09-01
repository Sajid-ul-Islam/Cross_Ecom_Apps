import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Check, Truck, Package, Home, FileText, AlertCircle } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { Order } from "../types";

interface OrderStatusStepperProps {
  order: Order | any;
  onTrackPathao?: (consignmentId: string) => void;
}

interface StepInfo {
  index: number;
  label: string;
}

const STEPS: StepInfo[] = [
  { index: 0, label: "Placed" },
  { index: 1, label: "Confirmed" },
  { index: 2, label: "Packed" },
  { index: 3, label: "In Transit" },
  { index: 4, label: "Delivered" },
];

function getActiveStepIndex(status: string, hasPathao: boolean): { currentStep: number; isFailed: boolean; isCancelled: boolean; isReturned: boolean } {
  const norm = (status || "").toLowerCase().replace(/[-_]/g, "");

  if (norm.includes("cancel")) {
    return { currentStep: 0, isFailed: true, isCancelled: true, isReturned: false };
  }
  if (norm.includes("return") || norm.includes("rto")) {
    return { currentStep: 3, isFailed: true, isCancelled: false, isReturned: true };
  }
  if (norm.includes("fail") || norm.includes("reject")) {
    return { currentStep: 0, isFailed: true, isCancelled: false, isReturned: false };
  }

  // Normal flow
  if (norm.includes("deliver") || norm === "completed") {
    return { currentStep: 4, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("transit") || norm.includes("shipped") || norm.includes("dispatch") || (hasPathao && norm !== "pending")) {
    return { currentStep: 3, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("process") || norm.includes("pack")) {
    return { currentStep: 2, isFailed: false, isCancelled: false, isReturned: false };
  }
  if (norm.includes("confirm") || norm.includes("verified")) {
    return { currentStep: 1, isFailed: false, isCancelled: false, isReturned: false };
  }

  // default pending
  return { currentStep: 0, isFailed: false, isCancelled: false, isReturned: false };
}

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ order, onTrackPathao }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const hasPathao = Boolean(order.pathaoConsignmentId);
  const pathaoId = order.pathaoConsignmentId || "";
  const trackingUrl = order.pathaoTrackingUrl || (pathaoId ? `https://merchant.pathao.com/tracking?consignment_id=${pathaoId}` : null);

  const { currentStep, isCancelled, isReturned, isFailed } = getActiveStepIndex(order.status, hasPathao);

  const handleOpenPathao = () => {
    if (trackingUrl) {
      Linking.openURL(trackingUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Status Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.headerLabel, { color: colors.ink }]}>STATUS:</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCancelled || isFailed
                  ? "rgba(225, 41, 62, 0.12)"
                  : isReturned
                  ? "rgba(245, 158, 11, 0.12)"
                  : currentStep === 4
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(99, 102, 241, 0.12)",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isCancelled || isFailed
                    ? colors.crimson
                    : isReturned
                    ? colors.amber
                    : currentStep === 4
                    ? colors.emerald
                    : colors.indigo,
                },
              ]}
            >
              {isCancelled ? "CANCELLED" : isReturned ? "RETURNED" : (order.status || "PROCESSING").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.estimateText, { color: colors.sub }]}>
          ETA: <Text style={{ fontWeight: "700", color: colors.ink }}>
            {order.shipping?.city?.toLowerCase()?.includes("dhaka") ? "24–48h" : "3–5 Days"}
          </Text>
        </Text>
      </View>

      {/* 5-Step Stepper Progress Visualizer */}
      <View style={styles.stepperContainer}>
        {/* Background Line */}
        <View style={[styles.lineBackground, { backgroundColor: colors.borderLight }]} />

        {/* Active Line */}
        <View
          style={[
            styles.lineActive,
            {
              backgroundColor: isCancelled || isFailed ? colors.crimson : colors.indigo,
              width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
            },
          ]}
        />

        {/* Steps Nodes */}
        <View style={styles.stepsRow}>
          {STEPS.map((step) => {
            const isCompleted = step.index <= currentStep && !isCancelled && !isFailed;
            const isCurrent = step.index === currentStep && !isCancelled && !isFailed;

            return (
              <View key={step.index} style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isCompleted ? colors.indigo : isCurrent ? colors.indigo : colors.cardSecondary,
                      borderColor: isCompleted || isCurrent ? colors.indigo : colors.border,
                    },
                  ]}
                >
                  {isCompleted && step.index < currentStep ? (
                    <Check size={10} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.circleNumber,
                        { color: isCompleted || isCurrent ? "#FFFFFF" : colors.sub },
                      ]}
                    >
                      {step.index + 1}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isCompleted || isCurrent ? colors.ink : colors.sub,
                      fontWeight: isCompleted || isCurrent ? "800" : "600",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Pathao Logistics Live Tracking Box */}
      {hasPathao && (
        <View style={[styles.pathaoBox, { borderTopColor: colors.borderLight }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <Truck size={14} color={colors.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pathaoTitle, { color: colors.indigo }]}>
                PATHAO: <Text style={{ color: colors.ink, fontWeight: "900" }}>{pathaoId}</Text>
              </Text>
              <Text style={[styles.pathaoSub, { color: colors.sub }]} numberOfLines={1}>
                Live rider &amp; dispatch tracking active
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 6 }}>
            {onTrackPathao && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                onPress={() => onTrackPathao(pathaoId)}
              >
                <Text style={[styles.actionBtnText, { color: colors.ink }]}>TRACK</Text>
              </TouchableOpacity>
            )}

            {trackingUrl && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.indigo, borderColor: colors.indigo }]}
                onPress={handleOpenPathao}
              >
                <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>LIVE ↗</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      marginVertical: 10,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 9.5,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    estimateText: {
      fontSize: 10.5,
    },
    stepperContainer: {
      position: "relative",
      paddingVertical: 8,
      marginBottom: 4,
    },
    lineBackground: {
      position: "absolute",
      top: 18,
      left: 15,
      right: 15,
      height: 2.5,
      zIndex: 1,
    },
    lineActive: {
      position: "absolute",
      top: 18,
      left: 15,
      height: 2.5,
      zIndex: 2,
    },
    stepsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      position: "relative",
      zIndex: 3,
    },
    stepNode: {
      alignItems: "center",
      width: 52,
    },
    circle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    circleNumber: {
      fontSize: 9,
      fontWeight: "900",
    },
    stepLabel: {
      fontSize: 9.5,
      textAlign: "center",
    },
    pathaoBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      paddingTop: 10,
      marginTop: 8,
    },
    pathaoTitle: {
      fontSize: 11,
      fontWeight: "800",
    },
    pathaoSub: {
      fontSize: 9.5,
      marginTop: 1,
    },
    actionBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 5,
      borderWidth: 1,
    },
    actionBtnText: {
      fontSize: 9.5,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });
}
