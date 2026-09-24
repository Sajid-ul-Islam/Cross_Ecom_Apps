import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, Bell, Heart, Sparkles, Menu } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useWishlist } from "../context/WishlistContext";
import { useNotifications } from "../context/NotificationContext";
import { NotificationModal } from "./NotificationModal";
import { WishlistModal } from "./WishlistModal";
import { AiConciergeModal } from "./AiConciergeModal";
import { SideNavDrawer } from "./SideNavDrawer";
import { StoriesFeedModal } from "./StoriesFeedModal";
import { DEFAULT_SOCIAL_FEED } from "../services/gateway";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showBag?: boolean;
  showNotif?: boolean;
  subtitle?: string;
  onSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "DEEN",
  showBack = false,
  showSearch = true,
  showBag = false,
  showNotif = true,
  subtitle,
  onSearchPress,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { wishlist } = useWishlist();
  const { unreadCount } = useNotifications();
  const [notifVisible, setNotifVisible] = useState(false);
  const [wishlistVisible, setWishlistVisible] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [storiesVisible, setStoriesVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.cardSecondary }]}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandContainer}>
            <View style={styles.brandRow}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.cardSecondary, marginRight: 6 }]}
                onPress={() => setSideNavVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Open navigation menu"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Menu size={20} color={colors.ink} />
              </TouchableOpacity>
              <View style={{ flexDirection: "column" }}>
                <Image
                  source={isDark ? require("../../assets/logo_white.png") : require("../../assets/logo.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontSize: 8.5,
                    fontWeight: "800",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: colors.denimStitch,
                    marginTop: 1,
                  }}
                >
                  {subtitle || "EST. 2020 · DHAKA"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {showBack && (
          <View style={styles.centerTitleContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 18, height: 18, borderRadius: 4 }}
                resizeMode="cover"
              />
              <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {subtitle && (
              <Text style={[styles.headerSubtitle, { color: colors.sub }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        <View style={styles.rightActions}>
          {showSearch && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.cardSecondary }]}
              onPress={onSearchPress || (() => router.push("/(tabs)/shop"))}
              accessibilityRole="button"
              accessibilityLabel="Search catalog"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Search size={20} color={colors.ink} />
            </TouchableOpacity>
          )}

          {showNotif && (
            <TouchableOpacity
              style={[styles.notifButton, { backgroundColor: colors.cardSecondary }]}
              onPress={() => setNotifVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unreadCount} unread`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={20} color={colors.ink} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.crimson }]}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            style={[styles.notifButton, { backgroundColor: colors.cardSecondary }]}
            onPress={() => setWishlistVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Wishlist, ${wishlist.length} saved items`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart size={20} color={wishlist.length > 0 ? colors.crimson : colors.ink} />
            {wishlist.length > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.crimson }]}>
                <Text style={styles.notifBadgeText}>{wishlist.length > 9 ? "9+" : wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Notifications Modal */}
      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
      />

      {/* Wishlist Drawer Modal */}
      <WishlistModal
        visible={wishlistVisible}
        onClose={() => setWishlistVisible(false)}
      />

      {/* AI Concierge Drawer Modal */}
      <AiConciergeModal
        visible={aiVisible}
        onClose={() => setAiVisible(false)}
      />

      {/* Side Card Navigation Drawer */}
      <SideNavDrawer
        visible={sideNavVisible}
        onClose={() => setSideNavVisible(false)}
        onOpenStories={() => setStoriesVisible(true)}
      />

      {/* Shoppable Stories Modal */}
      <StoriesFeedModal
        visible={storiesVisible}
        onClose={() => setStoriesVisible(false)}
        feedData={DEFAULT_SOCIAL_FEED}
      />
    </View>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingTop: 8,
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
    },
    brandContainer: {
      flexDirection: "column",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 2,
    },
    brandLogo: {
      width: 96,
      height: 28,
    },
    brandSubtitle: {
      fontSize: 11,
      marginTop: 2,
    },
    centerTitleContainer: {
      flex: 1,
      paddingHorizontal: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 11,
      marginTop: 1,
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
    },
    notifButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      position: "relative",
    },
    notifBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    notifBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },
    bagButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },
  });
}
