import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { X, Ruler, CheckCircle2, Info, Sparkles } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { DeenCategory } from "../types";

const { width, height } = Dimensions.get("window");

export type UnitType = "in" | "cm";

interface MeasurementRow {
  size: string;
  waist?: { in: number; cm: number };
  length?: { in: number; cm: number };
  hip?: { in: number; cm: number };
  thigh?: { in: number; cm: number };
  legOpening?: { in: number; cm: number };
  chest?: { in: number; cm: number };
  shoulder?: { in: number; cm: number };
  sleeve?: { in: number; cm: number };
}

const JEANS_CHART: MeasurementRow[] = [
  { size: "28", waist: { in: 28, cm: 71 }, length: { in: 32, cm: 81 }, hip: { in: 36, cm: 91 }, thigh: { in: 21, cm: 53 }, legOpening: { in: 13, cm: 33 } },
  { size: "30", waist: { in: 30, cm: 76 }, length: { in: 32, cm: 81 }, hip: { in: 38, cm: 96 }, thigh: { in: 22, cm: 56 }, legOpening: { in: 13.5, cm: 34 } },
  { size: "32", waist: { in: 32, cm: 81 }, length: { in: 32, cm: 81 }, hip: { in: 40, cm: 101 }, thigh: { in: 23, cm: 58 }, legOpening: { in: 14, cm: 35.5 } },
  { size: "34", waist: { in: 34, cm: 86 }, length: { in: 32, cm: 81 }, hip: { in: 42, cm: 106 }, thigh: { in: 24, cm: 61 }, legOpening: { in: 14.5, cm: 37 } },
  { size: "36", waist: { in: 36, cm: 91 }, length: { in: 34, cm: 86 }, hip: { in: 44, cm: 111 }, thigh: { in: 25, cm: 63.5 }, legOpening: { in: 15, cm: 38 } },
  { size: "38", waist: { in: 38, cm: 96 }, length: { in: 34, cm: 86 }, hip: { in: 46, cm: 116 }, thigh: { in: 26, cm: 66 }, legOpening: { in: 15.5, cm: 39 } },
];

const TOPS_CHART: MeasurementRow[] = [
  { size: "S", chest: { in: 38, cm: 96 }, length: { in: 27, cm: 68.5 }, shoulder: { in: 17, cm: 43 }, sleeve: { in: 8.5, cm: 21.5 } },
  { size: "M", chest: { in: 40, cm: 101 }, length: { in: 28, cm: 71 }, shoulder: { in: 18, cm: 45.5 }, sleeve: { in: 9, cm: 23 } },
  { size: "L", chest: { in: 42, cm: 106 }, length: { in: 29, cm: 73.5 }, shoulder: { in: 19, cm: 48 }, sleeve: { in: 9.5, cm: 24 } },
  { size: "XL", chest: { in: 44, cm: 111 }, length: { in: 30, cm: 76 }, shoulder: { in: 20, cm: 50.5 }, sleeve: { in: 10, cm: 25.5 } },
  { size: "XXL", chest: { in: 46, cm: 116 }, length: { in: 31, cm: 78.5 }, shoulder: { in: 21, cm: 53 }, sleeve: { in: 10.5, cm: 26.5 } },
];

const PANJABI_CHART: MeasurementRow[] = [
  { size: "38 (S)", chest: { in: 40, cm: 101 }, length: { in: 40, cm: 101 }, shoulder: { in: 17.5, cm: 44.5 }, sleeve: { in: 24.5, cm: 62 } },
  { size: "40 (M)", chest: { in: 42, cm: 106 }, length: { in: 42, cm: 106 }, shoulder: { in: 18.5, cm: 47 }, sleeve: { in: 25, cm: 63.5 } },
  { size: "42 (L)", chest: { in: 44, cm: 111 }, length: { in: 44, cm: 111 }, shoulder: { in: 19.5, cm: 49.5 }, sleeve: { in: 25.5, cm: 64.5 } },
  { size: "44 (XL)", chest: { in: 46, cm: 116 }, length: { in: 45, cm: 114 }, shoulder: { in: 20.5, cm: 52 }, sleeve: { in: 26, cm: 66 } },
  { size: "46 (XXL)", chest: { in: 48, cm: 122 }, length: { in: 46, cm: 116 }, shoulder: { in: 21.5, cm: 54.5 }, sleeve: { in: 26.5, cm: 67 } },
];

const TROUSERS_CHART: MeasurementRow[] = [
  { size: "30", waist: { in: 30, cm: 76 }, length: { in: 39, cm: 99 }, hip: { in: 39, cm: 99 }, thigh: { in: 23, cm: 58 } },
  { size: "32", waist: { in: 32, cm: 81 }, length: { in: 40, cm: 101 }, hip: { in: 41, cm: 104 }, thigh: { in: 24, cm: 61 } },
  { size: "34", waist: { in: 34, cm: 86 }, length: { in: 40.5, cm: 103 }, hip: { in: 43, cm: 109 }, thigh: { in: 25, cm: 63.5 } },
  { size: "36", waist: { in: 36, cm: 91 }, length: { in: 41, cm: 104 }, hip: { in: 45, cm: 114 }, thigh: { in: 26, cm: 66 } },
];

interface SizeGuideModalProps {
  visible: boolean;
  onClose: () => void;
  category: DeenCategory | string;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  savedUserSize?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  visible,
  category = "JEANS",
  selectedSize,
  savedUserSize,
  onSelectSize,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [unit, setUnit] = useState<UnitType>("in");

  const catUpper = (category || "").toUpperCase();
  const isBottom = catUpper === "JEANS" || catUpper === "DENIM" || catUpper === "TROUSERS";
  const isPanjabi = catUpper === "PANJABI";
  const isTrousers = catUpper === "TROUSERS";

  const chartData = isTrousers
    ? TROUSERS_CHART
    : isBottom
    ? JEANS_CHART
    : isPanjabi
    ? PANJABI_CHART
    : TOPS_CHART;

  const handlePick = (sizeStr: string) => {
    // extract clean size token (e.g. "38" from "38 (S)")
    const clean = sizeStr.split(" ")[0];
    onSelectSize(clean);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigoLight }]}>
                <Ruler size={18} color={colors.indigo} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>SIZE CHART &amp; GUIDE</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>
                  {catUpper === "JEANS"
                    ? "Raw Selvedge Denim Sizing"
                    : isPanjabi
                    ? "Premium Dobby Panjabi Sizing"
                    : `${category} Measurement Guide`}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Unit Toggle & Saved Size Match */}
          <View style={styles.toolBar}>
            <View style={styles.unitToggleContainer}>
              <TouchableOpacity
                style={[styles.unitBtn, unit === "in" && styles.unitBtnActive]}
                onPress={() => setUnit("in")}
              >
                <Text style={[styles.unitBtnText, unit === "in" && styles.unitBtnTextActive]}>
                  INCHES (in)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, unit === "cm" && styles.unitBtnActive]}
                onPress={() => setUnit("cm")}
              >
                <Text style={[styles.unitBtnText, unit === "cm" && styles.unitBtnTextActive]}>
                  CENTIMETERS (cm)
                </Text>
              </TouchableOpacity>
            </View>

            {savedUserSize && (
              <View style={styles.savedMatchBadge}>
                <Sparkles size={13} color={colors.indigo} />
                <Text style={styles.savedMatchText}>Saved Size: {savedUserSize}</Text>
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Measurement Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeadCell, styles.sizeCol]}>SIZE</Text>
                {isBottom ? (
                  <>
                    <Text style={styles.tableHeadCell}>WAIST</Text>
                    <Text style={styles.tableHeadCell}>{isTrousers ? "TOTAL LEN" : "INSEAM"}</Text>
                    <Text style={styles.tableHeadCell}>HIP</Text>
                    <Text style={styles.tableHeadCell}>THIGH</Text>
                    {!isTrousers && <Text style={styles.tableHeadCell}>LEG OPEN</Text>}
                  </>
                ) : (
                  <>
                    <Text style={styles.tableHeadCell}>CHEST</Text>
                    <Text style={styles.tableHeadCell}>LENGTH</Text>
                    <Text style={styles.tableHeadCell}>SHOULDER</Text>
                    <Text style={styles.tableHeadCell}>SLEEVE</Text>
                  </>
                )}
              </View>

              {chartData.map((row) => {
                const cleanRowSize = row.size.split(" ")[0];
                const isSelected =
                  selectedSize === cleanRowSize ||
                  selectedSize === row.size ||
                  (isPanjabi && selectedSize === cleanRowSize);
                const isSaved = savedUserSize === cleanRowSize;

                return (
                  <TouchableOpacity
                    key={row.size}
                    style={[styles.tableRow, isSelected && styles.tableRowSelected]}
                    activeOpacity={0.8}
                    onPress={() => handlePick(row.size)}
                  >
                    <View style={[styles.tableCellWrap, styles.sizeCol]}>
                      <Text style={[styles.tableCellText, styles.sizeCellText, isSelected && styles.cellSelectedText]}>
                        {row.size}
                      </Text>
                      {isSaved && <Text style={styles.matchTag}>YOURS</Text>}
                    </View>

                    {isBottom ? (
                      <>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.waist ? row.waist[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.length ? row.length[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.hip ? row.hip[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.thigh ? row.thigh[unit] : "-"}
                        </Text>
                        {!isTrousers && (
                          <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                            {row.legOpening ? row.legOpening[unit] : "-"}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.chest ? row.chest[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.length ? row.length[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.shoulder ? row.shoulder[unit] : "-"}
                        </Text>
                        <Text style={[styles.tableCellText, isSelected && styles.cellSelectedText]}>
                          {row.sleeve ? row.sleeve[unit] : "-"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* How to Measure Guidelines */}
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <Info size={15} color={colors.indigo} />
                <Text style={styles.guideTitle}>HOW TO MEASURE ACCURATELY</Text>
              </View>

              {isBottom ? (
                <View style={styles.guideSteps}>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>1. Waist: </Text>
                    Measure around your natural waistline where your waistband comfortably sits.
                  </Text>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>2. Inseam: </Text>
                    Measure from the crotch seam straight down to the ankle hem.
                  </Text>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>3. Thigh: </Text>
                    Measure around the fullest part of your thigh, roughly 1 inch below the crotch.
                  </Text>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>4. Raw Denim Fit Note: </Text>
                    DEEN selvedge denim is sanforized (pre-shrunk). Expect less than 1-2% shrink after cold wash.
                  </Text>
                </View>
              ) : (
                <View style={styles.guideSteps}>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>1. Chest: </Text>
                    Measure around the fullest part of your chest, keeping the tape horizontal under arms.
                  </Text>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>2. Shoulder: </Text>
                    Measure across the back from the tip of one shoulder bone to the other.
                  </Text>
                  <Text style={styles.guideStep}>
                    <Text style={styles.bold}>3. Length: </Text>
                    Measure from the highest point of the shoulder down to the bottom hemline.
                  </Text>
                </View>
              )}
            </View>

            {/* Hassle Free Exchange Promise */}
            <View style={styles.policyCard}>
              <CheckCircle2 size={16} color={colors.emerald} />
              <Text style={styles.policyText}>
                Size didn't fit perfectly? Enjoy our <Text style={styles.bold}>7-Day Free Size Exchange</Text> across Bangladesh.
              </Text>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
              <Text style={styles.confirmBtnText}>
                {selectedSize ? `CONFIRM SIZE (${selectedSize})` : "CLOSE SIZE GUIDE"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.88,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  unitToggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.paper,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  unitBtnActive: {
    backgroundColor: Colors.indigo,
  },
  unitBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sub,
  },
  unitBtnTextActive: {
    color: "#FFFFFF",
  },
  savedMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  savedMatchText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  content: {
    padding: 18,
    gap: 16,
  },
  tableCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: Colors.cardSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeadCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: Colors.sub,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sizeCol: {
    flex: 1.2,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowSelected: {
    backgroundColor: Colors.indigoLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.indigo,
  },
  tableCellWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tableCellText: {
    flex: 1,
    fontSize: 12,
    color: Colors.ink,
    textAlign: "center",
  },
  sizeCellText: {
    fontWeight: "800",
    textAlign: "left",
  },
  cellSelectedText: {
    color: Colors.indigoDark,
    fontWeight: "800",
  },
  matchTag: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
    backgroundColor: Colors.emerald,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  guideCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
  },
  guideSteps: {
    gap: 6,
  },
  guideStep: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 17,
  },
  bold: {
    fontWeight: "700",
    color: Colors.ink,
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.emeraldLight,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.emerald,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.emerald,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.paper,
  },
  confirmBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
