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
import { X, Sparkles, Store, ShieldCheck, Heart, MapPin, PhoneCall, Truck, WhatsApp, Instagram, Facebook } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useStore } from "../context/StoreContext";

const { height } = Dimensions.get("window");

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { info } = useStore();
  const waNumber = info.whatsapp.replace(/[^0-9]/g, "");

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
              <Text style={styles.introTitle}>DEEN Commerce is a fashion start-up founded with the vision of harmonising fashion and ethics.</Text>
            </View>

            {/* Section 1 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Store size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>WHO WE ARE</Text>
              </View>
              <Text style={styles.sectionBody}>
                The company is committed to ethical values and quality and has quickly become a leader in the sustainable fashion industry. The founders recognised the need for a paradigm shift in an industry that is often criticised for its environmental and ethical footprint. They set out to challenge conventions and establish a brand that marries style with responsibility.
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 10 }]}>
                The company's core values are ethics and quality. These values are not mere slogans, but form the bedrock of every decision, action, and product offered by DEEN Commerce.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Heart size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>WHAT DRIVES US</Text>
              </View>
              <Text style={styles.sectionBody}>
                Right from the outset, DEEN has been reimagining the fashion market. We have never been afraid to take risks, on the contrary, with our spontaneous customer service, clean delivery and easy return, we have set new standards in customer service.
              </Text>
              <Text style={[styles.sectionBody, { marginTop: 10 }]}>
                For us, the customer is the focus of our mindset and actions. This is where customers can find exactly the clothes they are looking for. It’s difficult to leave our site with an empty shopping cart.
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

              {/* Round social icon buttons — side by side */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 22, marginTop: 16 }}>
                <TouchableOpacity
                  accessibilityLabel="WhatsApp"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`https://wa.me/88${waNumber}`)}
                  style={[styles.socialRound, { backgroundColor: "#25D366" }]}
                >
                  <WhatsApp size={30} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Instagram"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL("https://www.instagram.com/deencommerce")}
                  style={[styles.socialRound, { backgroundColor: "#E1306C" }]}
                >
                  <Instagram size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Facebook"
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL("https://www.facebook.com/deencommerce")}
                  style={[styles.socialRound, { backgroundColor: "#1877F2" }]}
                >
                  <Facebook size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Outlets */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={colors.indigo} />
                <Text style={styles.sectionTitle}>OUR OUTLETS</Text>
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
                We support fashion that is produced, consumed and sold in a responsible manner. We are convinced that this commitment will pay off for us all in the long run. DEEN Commerce Ltd. donates 5% of the profit to the DEEN Foundation that serves the humanity.
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
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  sectionBody: {
    fontSize: 11,
    color: Colors.sub,
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
});
