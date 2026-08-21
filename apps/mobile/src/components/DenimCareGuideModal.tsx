import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { X, BookOpen, Sparkles, ShieldCheck, CheckCircle2 } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

interface DenimCareGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DenimCareGuideModal: React.FC<DenimCareGuideModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigoDark }]}>
                <BookOpen size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>RAW DENIM CARE &amp; FADING GUIDE</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Artisanal Japanese Selvedge Handbook</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Intro Hero Banner */}
            <View style={styles.introCard}>
              <View style={styles.introBadge}>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.introBadgeText}>RAW SELVEDGE PHILOSOPHY</Text>
              </View>
              <Text style={styles.introTitle}>A Canvas That Evolves With Your Life</Text>
              <Text style={styles.introBody}>
                Unlike pre-distressed mass market jeans, DEEN 13.5 oz raw selvedge denim is unwashed and untreated. Every crease, whisker, and fade will form uniquely to your body.
              </Text>
            </View>

            {/* Chapter 1 */}
            <View style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>01</Text>
                </View>
                <View>
                  <Text style={styles.chapterTitle}>THE FIRST COLD SOAK</Text>
                  <Text style={styles.chapterSub}>Setting the indigo &amp; achieving custom drape</Text>
                </View>
              </View>
              <Text style={styles.chapterBody}>
                Fill a bucket with cold or lukewarm water. Turn your selvedge jeans inside out and submerge for 30–45 minutes with a pinch of sea salt. Hang dry outdoors in shade. Do not machine dry.
              </Text>
            </View>

            {/* Chapter 2 */}
            <View style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>02</Text>
                </View>
                <View>
                  <Text style={styles.chapterTitle}>BREAK-IN &amp; HIGH CONTRAST FADING</Text>
                  <Text style={styles.chapterSub}>Whiskers, Honeycombs &amp; Stacks</Text>
                </View>
              </View>
              <Text style={styles.chapterBody}>
                Wear your raw denim continuously for the first 3 to 6 months before your first deep wash. Friction will wear off the surface indigo, creating sharp contrast honeycombs behind your knees and authentic lap whiskers.
              </Text>
            </View>

            {/* Chapter 3 */}
            <View style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>03</Text>
                </View>
                <View>
                  <Text style={styles.chapterTitle}>WASHING &amp; MAINTENANCE</Text>
                  <Text style={styles.chapterSub}>Preserving deep rope-dyed indigo richness</Text>
                </View>
              </View>
              <Text style={styles.chapterBody}>
                Always wash inside out in cold water with mild denim wash or zero-optical-brightener detergent. Never use hot water, bleach, or tumble dryers. Air drying maintains fabric tension.
              </Text>
            </View>

            {/* Chapter 4 */}
            <View style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>04</Text>
                </View>
                <View>
                  <Text style={styles.chapterTitle}>CHAINSTITCH HEMMING &amp; REPAIRS</Text>
                  <Text style={styles.chapterSub}>Banani Flagship Studio Craft Services</Text>
                </View>
              </View>
              <Text style={styles.chapterBody}>
                Need your selvedge inseam hemmed with authentic vintage Union Special chainstitching? Drop by our Banani Studio for complimentary chainstitch hemming and crotch blow-out repairs.
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: height * 0.9,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.indigoDark,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
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
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 36,
  },
  introCard: {
    backgroundColor: Colors.indigoDark,
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  introBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  introBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  introTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  introBody: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    lineHeight: 16,
  },
  chapterCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chapterNum: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  chapterTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  chapterSub: {
    fontSize: 10,
    color: Colors.sub,
  },
  chapterBody: {
    fontSize: 11,
    color: Colors.ink,
    lineHeight: 17,
  },
});
