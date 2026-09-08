import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { X, Sparkles, Store, ShieldCheck, Heart, MapPin, PhoneCall, Truck, WhatsApp, Instagram, Facebook, LinkedIn } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useStore } from "../context/StoreContext";
import { HorizontalStoryRail } from "./HorizontalStoryRail";
import { TRUST_STORY_CARDS } from "../data/storyCards";

const { height } = Dimensions.get("window");

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { info } = useStore();
  const waNumber = (info?.whatsapp || "01952700500").replace(/[^0-9]/g, "");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigoDark }]}>
                <Store size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>ABOUT DEEN</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>The country's first denim brand</Text>
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
                <Text style={styles.introBadgeText}>EST. 2020 · DHAKA, BANGLADESH</Text>
              </View>
              <Text style={styles.introTitle}>Harmonising Fashion and Ethics</Text>
              <Text style={styles.introBody}>
                DEEN Commerce was founded with a clear vision: marrying contemporary artisanal fashion with responsible craftsmanship. Rooted in Dhaka manufacturing, we bring premium denim to life.
              </Text>
            </View>

            {/* Why Shop With DEEN — shared trust/authenticity rail (same data as Home) */}
            <View style={styles.railBlock}>
              <View style={styles.railHeader}>
                <ShieldCheck size={14} color={colors.indigo} />
                <Text style={[styles.railTitle, { color: colors.ink }]}>WHY SHOP WITH DEEN</Text>
              </View>
              <HorizontalStoryRail cards={TRUST_STORY_CARDS} />
            </View>

            {/* Section 1 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Store size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>WHO WE ARE</Text>
              </View>
              <Text style={styles.sectionBody}>
                The company is committed to ethical values and high quality, challenging industry conventions. Every selvedge denim pair and shirt is crafted with high-density cotton, rope-dyed indigo, and reinforced bar-tack stitching.
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 10 }]}>
                Ethics and quality are not slogans; they are the bedrock of every decision and product manufactured in our Dhaka ateliers.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Heart size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>WHAT DRIVES US</Text>
              </View>
              <Text style={styles.sectionBody}>
                Customer delight is the core of our mindset. With spontaneous concierge support, 24–48h express delivery via Pathao Logistics in Dhaka, and hassle-free 7-day doorstep size exchange across all 64 districts, we aim to provide an effortless experience.
              </Text>
            </View>

            {/* Contact Info */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <PhoneCall size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>CONTACT & COMMUNITY</Text>
              </View>
              <Text style={styles.sectionBody}>
                Need help or styling advice? Connect directly with us:
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 8, fontWeight: "600", color: colors.ink }]}>
                WhatsApp & Hotline: {info.whatsapp}
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 4, fontWeight: "600", color: colors.ink }]}>
                Facebook: facebook.com/deencommerce
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 4, fontWeight: "600", color: colors.ink }]}>
                Instagram: instagram.com/deencommerce
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 4, fontWeight: "600", color: colors.ink }]}>
                LinkedIn: linkedin.com/company/deencommerce
              </Text>

              {/* Round social icon buttons — side by side */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16 }}>
                <TouchableOpacity
                  accessibilityLabel="WhatsApp"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`https://wa.me/88${waNumber}`)}
                  style={[styles.socialRound, { backgroundColor: "#25D366" }]}
                >
                  <WhatsApp size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Instagram"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL("https://www.instagram.com/deencommerce/?hl=en")}
                  style={[styles.socialRound, { backgroundColor: "#E1306C" }]}
                >
                  <Instagram size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Facebook"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL("https://www.facebook.com/deencommerce")}
                  style={[styles.socialRound, { backgroundColor: "#1877F2" }]}
                >
                  <Facebook size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="LinkedIn"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL("https://www.linkedin.com/company/deencommerce")}
                  style={[styles.socialRound, { backgroundColor: "#0A66C2" }]}
                >
                  <LinkedIn size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Careers & Opportunities */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={{ fontSize: 16 }}>💼</Text>
                <Text style={styles.sectionTitle}>CAREERS &amp; OPPORTUNITIES</Text>
              </View>
              <Text style={styles.sectionBody}>
                We are constantly growing! If you are passionate about apparel design, textile merchandising, web engineering, or showroom styling:
              </Text>
              <TouchableOpacity
                style={styles.mailRow}
                onPress={() => Linking.openURL("mailto:career@deencommerce.com")}
                accessibilityRole="button"
                accessibilityLabel="Send CV to career@deencommerce.com"
              >
                <Text style={{ fontSize: 15 }}>✉️</Text>
                <Text style={[styles.mailRowText, { color: colors.indigo }]}>
                  Send CV: <Text style={{ fontWeight: "800" }}>career@deencommerce.com</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mailRow}
                onPress={() => Linking.openURL("mailto:wholesale@deencommerce.com")}
                accessibilityRole="button"
                accessibilityLabel="Wholesale enquiries to wholesale@deencommerce.com"
              >
                <Text style={{ fontSize: 15 }}>📦</Text>
                <Text style={[styles.mailRowText, { color: colors.sub }]}>
                  Wholesale: <Text style={{ fontWeight: "800", color: colors.ink }}>wholesale@deencommerce.com</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Retail Showrooms & Outlets */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>RETAIL SHOWROOMS &amp; OUTLETS</Text>
              </View>
              
              <Text style={[styles.sectionBody, { fontWeight: "bold", color: colors.ink, marginTop: 4 }]}>Mirpur 12 Outlet</Text>
              <Text style={styles.sectionBody}>Level 3, Ramzannesa Super Market, Mirpur 12, Dhaka 1216.</Text>
              <Text style={styles.sectionBody}>01972-627981</Text>

              <Text style={[styles.sectionBody, { fontWeight: "bold", color: colors.ink, marginTop: 12 }]}>Wari Outlet</Text>
              <Text style={styles.sectionBody}>Ground floor, 41 A.K. Famous Tower, Rankin Street, Wari, Dhaka 1203.</Text>
              <Text style={styles.sectionBody}>01972-627983</Text>

              <Text style={[styles.sectionBody, { fontWeight: "bold", color: colors.ink, marginTop: 12 }]}>Cumilla Outlet</Text>
              <Text style={styles.sectionBody}>4th floor, QR Tower, Road Dharmasagor Side, Cumilla 3500.</Text>
              <Text style={styles.sectionBody}>01972-627984</Text>

              <Text style={[styles.sectionBody, { fontWeight: "bold", color: colors.ink, marginTop: 12 }]}>Sylhet Outlet</Text>
              <Text style={styles.sectionBody}>54/A, Level 2, Block A, Kumarpara, Sylhet.</Text>
              <Text style={styles.sectionBody}>01972-627985</Text>
            </View>

            {/* Privacy & Support (store readiness) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>PRIVACY & SUPPORT</Text>
              </View>
              <Text style={styles.sectionBody}>
                We protect your data. Your profile, addresses and order history are stored
                securely and used only to fulfil your orders and improve your experience.
                We never sell your personal information.
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 8, fontWeight: "600", color: colors.ink }]}>
                Support: {info.email} · {info.whatsapp}
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 4, fontWeight: "600", color: colors.ink }]}>
                Privacy Policy: deencommerce.com/privacy-policy
              </Text>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>CORPORATE RESPONSIBILITY</Text>
              </View>
              <Text style={styles.sectionBody}>
                We support fashion that is produced, consumed and sold in a responsible manner. DEEN Commerce Ltd. donates 5% of profit to the DEEN Foundation to serve the underprivileged and support community welfare.
              </Text>
            </View>

            {/* Hotline & WhatsApp Concierge */}
            <TouchableOpacity
              style={[styles.conciergeCta, { backgroundColor: colors.indigoLight, borderColor: colors.border }]}
              onPress={() => Linking.openURL(`https://wa.me/88${waNumber}`)}
              accessibilityRole="button"
              accessibilityLabel="Hotline and WhatsApp concierge"
            >
              <Text style={{ fontSize: 22 }}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.conciergeTitle, { color: colors.indigo }]}>
                  Hotline &amp; WhatsApp: +880 {info.whatsapp}
                </Text>
                <Text style={[styles.conciergeSub, { color: colors.sub }]}>
                  Tap to chat with DEEN styling concierge
                </Text>
              </View>
            </TouchableOpacity>
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
      width: 44,
      height: 44,
      borderRadius: 22,
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
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 20,
    },
    introBody: {
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 18,
      opacity: 0.9,
    },
    railBlock: {
      gap: 8,
    },
    railHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 2,
    },
    railTitle: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.4,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.4,
    },
    sectionBody: {
      fontSize: 11,
      color: colors.sub,
      lineHeight: 17,
    },
    socialRound: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    mailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.paper,
      marginBottom: 8,
    },
    mailRowText: {
      fontSize: 12,
      fontWeight: "600",
      flexShrink: 1,
    },
    conciergeCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    conciergeTitle: {
      fontSize: 13,
      fontWeight: "800",
    },
    conciergeSub: {
      fontSize: 11,
      marginTop: 2,
      lineHeight: 16,
    },
  });
}
