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
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

export interface MobileCareGuide {
  title: string;
  subtitle: string;
  badge: string;
  philosophyTitle: string;
  philosophyText: string;
  chapters: Array<{
    num: string;
    title: string;
    sub: string;
    body: string;
  }>;
}

export const MOBILE_CARE_GUIDES: Record<string, MobileCareGuide> = {
  JEANS: {
    title: "RAW DENIM CARE & FADING GUIDE",
    subtitle: "Artisanal Japanese Selvedge Handbook",
    badge: "RAW SELVEDGE PHILOSOPHY",
    philosophyTitle: "A Canvas That Evolves With Your Life",
    philosophyText:
      "Unlike pre-distressed mass market jeans, DEEN 13.5 oz raw selvedge denim is unwashed and untreated. Every crease, whisker, and fade will form uniquely to your body.",
    chapters: [
      {
        num: "01",
        title: "THE FIRST COLD SOAK",
        sub: "Setting the indigo & achieving custom drape",
        body: "Fill a bucket with cold or lukewarm water. Turn your selvedge jeans inside out and submerge for 30–45 minutes with a pinch of sea salt. Hang dry outdoors in shade. Do not machine dry.",
      },
      {
        num: "02",
        title: "BREAK-IN & HIGH CONTRAST FADING",
        sub: "Whiskers, Honeycombs & Stacks",
        body: "Wear your raw denim continuously for the first 3 to 6 months before your first deep wash. Friction will wear off the surface indigo, creating sharp contrast honeycombs behind your knees and authentic lap whiskers.",
      },
      {
        num: "03",
        title: "WASHING & MAINTENANCE",
        sub: "Preserving deep rope-dyed indigo richness",
        body: "Always wash inside out in cold water with mild denim wash or zero-optical-brightener detergent. Never use hot water, bleach, or tumble dryers. Air drying maintains fabric tension.",
      },
      {
        num: "04",
        title: "CHAINSTITCH HEMMING & REPAIRS",
        sub: "DEEN Outlet Craft & Repair Services",
        body: "Need your selvedge inseam hemmed with authentic vintage chainstitching? Drop by our Mirpur 12 Studio or physical outlets for complimentary chainstitch hemming and crotch repairs.",
      },
    ],
  },
  PANJABI: {
    title: "HERITAGE PANJABI CARE GUIDE",
    subtitle: "Embroidery, Jacquard & Silk-Cotton Handbook",
    badge: "FESTIVE APPAREL CARE",
    philosophyTitle: "Preserving Artisanal Weaves & Embroidery",
    philosophyText:
      "DEEN Panjabis are crafted from 100% Egyptian Giza cotton, breathable dobby jacquards, and detailed artisanal thread embroidery. Gentle care keeps the plackets sharp and fabric lustrous for years.",
    chapters: [
      {
        num: "01",
        title: "GENTLE HAND WASH ONLY",
        sub: "Preserving delicate embroidery & buttons",
        body: "Submerge in cold water with mild liquid detergent for 10–15 minutes. Gently agitate with hands. Avoid rigorous scrubbing across embroidered panels or mother-of-pearl buttons.",
      },
      {
        num: "02",
        title: "TOWEL ROLL & SHADE DRYING",
        sub: "Preventing collar creasing & shrinkage",
        body: "Do not wring or twist. Roll in a clean, dry towel to absorb excess moisture, then hang flat on a padded hanger in shade to prevent color fading and collar creasing.",
      },
      {
        num: "03",
        title: "REVERSE STEAM IRONING",
        sub: "Protecting 3D artisanal motifs",
        body: "Always iron on the reverse side of embroidery using medium steam heat. Place a pressing cloth over delicate threadwork to preserve the 3D relief of the artisanal motifs.",
      },
      {
        num: "04",
        title: "STORAGE & OCCASION PREP",
        sub: "Band collar structure retention",
        body: "Store buttoned on a structured hanger in a breathable garment bag. Avoid wire hangers that distort the shoulder line and band collar contour.",
      },
    ],
  },
  SHIRT: {
    title: "ARTISANAL SHIRT CARE GUIDE",
    subtitle: "Camp Collar, Poplin & Oxford Handbook",
    badge: "PREMIUM SHIRTING CARE",
    philosophyTitle: "Crisp Structure & Breathable Drape",
    philosophyText:
      "From breathable Cuban camp collars to structured executive stripes, DEEN shirts are engineered with reinforced side gussets and high-count cotton poplin for enduring drape.",
    chapters: [
      {
        num: "01",
        title: "COLD GENTLE MACHINE CYCLE",
        sub: "Protecting seams and plackets",
        body: "Unbutton all buttons before washing (including cuffs and collar). Machine wash in cold water (≤ 30°C) with similar colors on a gentle spin cycle.",
      },
      {
        num: "02",
        title: "RESHAPE WHILE DAMP",
        sub: "Camp collar point preservation",
        body: "Remove promptly from the wash. Reshape the camp collar points, front placket, and shoulder seams while damp, then hang dry immediately on a contoured hanger.",
      },
      {
        num: "03",
        title: "MEDIUM HEAT STEAM IRON",
        sub: "Effortless wrinkle-free finish",
        body: "Iron while the fabric is slightly damp for an effortless crisp finish. Start with collar points, cuffs, sleeves, and finish with the main body panels.",
      },
    ],
  },
  "T-SHIRT": {
    title: "240 GSM TEE CARE GUIDE",
    subtitle: "Zero-Torque Combed Cotton Handbook",
    badge: "HEAVY COTTON LONGEVITY",
    philosophyTitle: "Zero-Torque Boxy Structure",
    philosophyText:
      "Crafted from 220–240 GSM pre-shrunk combed compact cotton. High-density knit prevents seam twisting (torque) and maintains a boxy structured silhouette wash after wash.",
    chapters: [
      {
        num: "01",
        title: "INSIDE-OUT COLD WASH",
        sub: "Protecting graphic prints and dyes",
        body: "Turn tee inside out before washing to protect graphic screen prints and surface texture. Wash with cold water using mild, color-safe detergent.",
      },
      {
        num: "02",
        title: "FLAT OR HANGER DRY",
        sub: "Zero neck stretch guarantee",
        body: "Avoid high-heat tumble dryers which degrade cotton fibers. Hang dry or dry flat. Never stretch the bound ribbed neckline while wet.",
      },
      {
        num: "03",
        title: "LOW-HEAT REVERSE IRON",
        sub: "Chest print protection",
        body: "If ironing is desired, iron inside out on low-to-medium heat. Never place a hot iron directly onto rubberized or high-density puff chest prints.",
      },
    ],
  },
  POLO: {
    title: "KNITTED POLO CARE GUIDE",
    subtitle: "Honeycomb Knit & Anti-Curl Collar Handbook",
    badge: "COMPACT KNIT CARE",
    philosophyTitle: "Retaining Anti-Curl Collar Contour",
    philosophyText:
      "Knitted from combed compact cotton with tipped flat-knit collars. Engineered to retain sharp shape and micro-vent side seams without pilling.",
    chapters: [
      {
        num: "01",
        title: "BUTTON THE PLACKET",
        sub: "Collar contour retention",
        body: "Fasten all placket buttons and flip the ribbed collar up before placing into a cold gentle wash. This prevents the collar from stretching or catching.",
      },
      {
        num: "02",
        title: "COLLAR SHAPING WHILE DAMP",
        sub: "Anti-curl tip alignment",
        body: "Fold collar back down into its natural fold line while damp. Smooth out the tips flat and line dry in shade away from direct sun.",
      },
      {
        num: "03",
        title: "STEAM REFRESH",
        sub: "Honeycomb piqué ventilation",
        body: "Use a garment steamer or low-heat iron over the piqué body. Avoid heavy downward pressure on the textured honeycomb knit.",
      },
    ],
  },
  TROUSERS: {
    title: "UTILITY CHINO CARE GUIDE",
    subtitle: "Ripstop Durability & High-Density Twill Handbook",
    badge: "ENDURANCE TAILORING",
    philosophyTitle: "Preserving High-Density Twill & Articulated Seams",
    philosophyText:
      "Built for daily urban mobility with stretch cotton twills and articulated knee pleats. Proper care maintains color depth and reinforced seam integrity.",
    chapters: [
      {
        num: "01",
        title: "EMPTY POCKETS & FASTEN ZIPPER",
        sub: "Hardware and pocket protection",
        body: "Zip up fly zippers and secure utility flap buttons. Wash inside out in cold water to minimize surface friction and maintain twill color depth.",
      },
      {
        num: "02",
        title: "HANG BY HEM CUFFS",
        sub: "Natural crease release",
        body: "Hang trousers upside down by the leg cuffs using clamp hangers. Gravity naturally pulls out travel creases while drying.",
      },
      {
        num: "03",
        title: "LINE-CREASE IRONING",
        sub: "Crisp tailored profile",
        body: "Iron on medium heat along the natural leg crease for a sharp tailored profile. Spot clean cargo utility pockets as needed.",
      },
    ],
  },
};

export function getMobileCareGuide(category?: string): MobileCareGuide {
  if (!category) return MOBILE_CARE_GUIDES.JEANS;
  const cat = category.toUpperCase();
  if (cat.includes("JEAN") || cat.includes("DENIM")) return MOBILE_CARE_GUIDES.JEANS;
  if (cat.includes("PANJABI") || cat.includes("PUNJABI")) return MOBILE_CARE_GUIDES.PANJABI;
  if (cat.includes("SHIRT") && !cat.includes("T-SHIRT")) return MOBILE_CARE_GUIDES.SHIRT;
  if (cat.includes("T-SHIRT") || cat.includes("TEE") || cat.includes("TANK")) return MOBILE_CARE_GUIDES["T-SHIRT"];
  if (cat.includes("POLO")) return MOBILE_CARE_GUIDES.POLO;
  if (cat.includes("TROUSER") || cat.includes("PANT") || cat.includes("CHINO")) return MOBILE_CARE_GUIDES.TROUSERS;
  return MOBILE_CARE_GUIDES.JEANS;
}

interface DenimCareGuideModalProps {
  visible: boolean;
  onClose: () => void;
  category?: string;
  productName?: string;
}

export const DenimCareGuideModal: React.FC<DenimCareGuideModalProps> = ({
  visible,
  onClose,
  category = "JEANS",
  productName,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const guide = getMobileCareGuide(category);

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
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
                  {guide.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.sub }]} numberOfLines={1}>
                  {productName ? `${productName} · ` : ""}{guide.subtitle}
                </Text>
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
                <Text style={styles.introBadgeText}>{guide.badge}</Text>
              </View>
              <Text style={styles.introTitle}>{guide.philosophyTitle}</Text>
              <Text style={styles.introBody}>{guide.philosophyText}</Text>
            </View>

            {/* Chapters */}
            {guide.chapters.map((chapter) => (
              <View key={chapter.num} style={styles.chapterCard}>
                <View style={styles.chapterHeader}>
                  <View style={styles.chapterNum}>
                    <Text style={styles.chapterNumText}>{chapter.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterSub}>{chapter.sub}</Text>
                  </View>
                </View>
                <Text style={styles.chapterBody}>{chapter.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.paper,
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
      borderBottomColor: colors.borderLight,
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
      backgroundColor: colors.indigoDark,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    subtitle: {
      fontSize: 11,
      color: colors.sub,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 18,
      gap: 14,
      paddingBottom: 36,
    },
    introCard: {
      backgroundColor: colors.indigoDark,
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
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.indigoLight,
      alignItems: "center",
      justifyContent: "center",
    },
    chapterNumText: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.indigoDark,
    },
    chapterTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.4,
    },
    chapterSub: {
      fontSize: 10,
      color: colors.sub,
    },
    chapterBody: {
      fontSize: 11,
      color: colors.ink,
      lineHeight: 17,
    },
  });
}
