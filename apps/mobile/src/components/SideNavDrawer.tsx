import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import {
  X,
  Instagram,
  Facebook,
  WhatsApp,
  Youtube,
  Package,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from "./Icons";

interface SideNavDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenStories: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  visible,
  onClose,
  onOpenStories,
}) => {
  const router = useRouter();
  const { colors, isDark, setThemeMode } = useTheme();
  const { profile } = useProfile();

  const categories = [
    { label: "Jeans & Selvedge", query: "JEANS", icon: "👖" },
    { label: "Casual & Resort Shirts", query: "SHIRT", icon: "👔" },
    { label: "Heritage Panjabi", query: "PANJABI", icon: "✨" },
    { label: "Springfield Polos", query: "POLO", icon: "👕" },
    { label: "Cargo Trousers", query: "TROUSER", icon: "🧵" },
    { label: "Heavyweight Tees", query: "T-SHIRT", icon: "⚡" },
  ];

  const handleCategoryPress = (catQuery: string) => {
    onClose();
    router.push(`/(tabs)/shop?category=${catQuery}`);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap to Close */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Slide-in Card Drawer */}
        <View style={[styles.drawerCard, { backgroundColor: colors.paper, borderRightColor: colors.border }]}>
          {/* Drawer Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.brandLogo}
                resizeMode="cover"
              />
              <View>
                <Text style={[styles.brandTitle, { color: isDark ? colors.indigo : colors.indigoDark }]}>
                  DEEN
                </Text>
                <Text style={[styles.brandEst, { color: colors.sub }]}>
                  EST. 2020 · DHAKA
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardSecondary }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close navigation menu"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* User Account / Sign In Pill */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
              {profile ? (
                <View style={styles.profileRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, { color: colors.ink }]} numberOfLines={1}>
                      {profile.name || "Valued Patron"}
                    </Text>
                    <Text style={[styles.profilePhone, { color: colors.sub }]}>
                      {profile.phone || "DEEN Member"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push("/(tabs)/profile");
                    }}
                  >
                    <Text style={[styles.profileLink, { color: colors.indigo }]}>View →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profileRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, { color: colors.ink }]}>Welcome to DEEN</Text>
                    <Text style={[styles.profilePhone, { color: colors.sub }]}>Fast checkout & tracking</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.signInButton, { backgroundColor: colors.indigo }]}
                    onPress={() => {
                      onClose();
                      router.push("/(tabs)/profile");
                    }}
                  >
                    <Text style={styles.signInText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Section 1: Featured Experience (Stories) */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.sub }]}>FEATURED EXPERIENCE</Text>
              <TouchableOpacity
                style={[
                  styles.featureCardFull,
                  {
                    backgroundColor: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenStories();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.featureLeftRow}>
                  <Text style={{ fontSize: 24 }}>🎬</Text>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.featureTitle, { color: colors.ink }]}>Stories</Text>
                      <View style={styles.livePill}>
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={[styles.featureSub, { color: colors.sub }]}>Shoppable Reels &amp; Drops</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, color: colors.sub }}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Apparel & Collections */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.sub }]}>APPAREL & CRAFT</Text>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.query}
                  style={[styles.navRow, { backgroundColor: colors.cardSecondary }]}
                  onPress={() => handleCategoryPress(cat.query)}
                >
                  <View style={styles.navRowLeft}>
                    <Text style={styles.navEmoji}>{cat.icon}</Text>
                    <Text style={[styles.navRowText, { color: colors.ink }]}>{cat.label}</Text>
                  </View>
                  <Text style={[styles.navArrow, { color: colors.sub }]}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section 3: Orders & Support */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.sub }]}>ACCOUNT & LOGISTICS</Text>

              <TouchableOpacity
                style={styles.simpleNavRow}
                onPress={() => {
                  onClose();
                  router.push("/orders");
                }}
              >
                <Package size={18} color={colors.indigo} />
                <Text style={[styles.simpleNavText, { color: colors.ink }]}>Track Orders & Consignment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simpleNavRow}
                onPress={() => {
                  onClose();
                  router.push("/(tabs)/cart");
                }}
              >
                <ShoppingBag size={18} color={colors.indigo} />
                <Text style={[styles.simpleNavText, { color: colors.ink }]}>Shopping Bag</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simpleNavRow}
                onPress={() => {
                  onClose();
                  router.push("/(tabs)/chat");
                }}
              >
                <Sparkles size={18} color={colors.indigo} />
                <Text style={[styles.simpleNavText, { color: colors.ink }]}>AI Concierge & Live Chat</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Connect With DEEN */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.sub }]}>CONNECT WITH DEEN</Text>

              {/* Instagram */}
              <TouchableOpacity
                style={[styles.socialRow, { backgroundColor: colors.cardSecondary }]}
                onPress={() => handleOpenUrl("https://www.instagram.com/deencommerce/?hl=en")}
              >
                <View style={styles.socialLeft}>
                  <Instagram size={18} color="#e1306c" />
                  <View>
                    <Text style={[styles.socialName, { color: colors.ink }]}>Instagram</Text>
                    <Text style={[styles.socialHandle, { color: colors.sub }]}>@deencommerce</Text>
                  </View>
                </View>
                <ExternalLink size={14} color={colors.sub} />
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={[styles.socialRow, { backgroundColor: colors.cardSecondary }]}
                onPress={() => handleOpenUrl("https://www.facebook.com/deencommerce")}
              >
                <View style={styles.socialLeft}>
                  <Facebook size={18} color="#1877f2" />
                  <View>
                    <Text style={[styles.socialName, { color: colors.ink }]}>Facebook</Text>
                    <Text style={[styles.socialHandle, { color: colors.sub }]}>fb.com/deencommerce</Text>
                  </View>
                </View>
                <ExternalLink size={14} color={colors.sub} />
              </TouchableOpacity>

              {/* YouTube */}
              <TouchableOpacity
                style={[styles.socialRow, { backgroundColor: colors.cardSecondary }]}
                onPress={() => handleOpenUrl("https://www.youtube.com/@deencommerce")}
              >
                <View style={styles.socialLeft}>
                  <Youtube size={18} color="#ff0000" />
                  <View>
                    <Text style={[styles.socialName, { color: colors.ink }]}>YouTube</Text>
                    <Text style={[styles.socialHandle, { color: colors.sub }]}>Lookbooks & Films</Text>
                  </View>
                </View>
                <ExternalLink size={14} color={colors.sub} />
              </TouchableOpacity>

              {/* WhatsApp Concierge */}
              <TouchableOpacity
                style={[styles.socialRow, { backgroundColor: colors.cardSecondary }]}
                onPress={() => handleOpenUrl("https://wa.me/8801952700500")}
              >
                <View style={styles.socialLeft}>
                  <WhatsApp size={18} color="#25d366" />
                  <View>
                    <Text style={[styles.socialName, { color: colors.ink }]}>WhatsApp Concierge</Text>
                    <Text style={[styles.socialHandle, { color: colors.sub }]}>+880 1952-700500</Text>
                  </View>
                </View>
                <ExternalLink size={14} color={colors.sub} />
              </TouchableOpacity>
            </View>

            {/* Section 5: Theme Toggle & Bottom Note */}
            <View style={styles.bottomBlock}>
              <View style={styles.themeRow}>
                <Text style={[styles.themeLabel, { color: colors.sub }]}>Appearance</Text>
                <TouchableOpacity
                  style={[styles.themePill, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  onPress={() => setThemeMode(isDark ? "light" : "dark")}
                >
                  <Text style={[styles.themeText, { color: colors.ink }]}>
                    {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.guaranteeText, { color: colors.sub }]}>
                64 Districts COD · 7-Day Easy Exchange
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
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  drawerCard: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandEst: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileName: {
    fontSize: 13,
    fontWeight: "800",
  },
  profilePhone: {
    fontSize: 11,
    marginTop: 2,
  },
  profileLink: {
    fontSize: 12,
    fontWeight: "700",
  },
  signInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  featuredGrid: {
    flexDirection: "row",
    gap: 10,
  },
  featureCardFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  featureEmoji: {
    fontSize: 18,
  },
  livePill: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: "#ef4444",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  featureSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navEmoji: {
    fontSize: 15,
  },
  navRowText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  navArrow: {
    fontSize: 12,
  },
  simpleNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  simpleNavText: {
    fontSize: 13,
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  socialLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialName: {
    fontSize: 12,
    fontWeight: "700",
  },
  socialHandle: {
    fontSize: 10,
  },
  bottomBlock: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
    paddingTop: 16,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  guaranteeText: {
    textAlign: "center",
    fontSize: 10.5,
    marginTop: 14,
  },
});
