import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";

import {
  RotateCcw,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Package,
  MapPin,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  ChevronRight,
  Facebook,
  Instagram,
  LinkedIn,
  WhatsApp,
  Sparkles,
} from "../../src/components/Icons";
import * as Updates from "expo-updates";
import { ScreenShell } from "../../src/components/ScreenShell";
import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { DeliveryOptionKey } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useOrders } from "../../src/context/OrderContext";

import { reportBug, fetchDistricts, updateProfileAPI, type BdDistrict } from "../../src/services/gateway";
import { BD_DISTRICTS } from "../../src/data/districts";
import { OFFICIAL_BRAND_SOCIALS } from "../../src/services/socialContent";

// Extracted sub-components
import { AccountHeader } from "../../src/components/profile/AccountHeader";
import { RecentOrderPreview } from "../../src/components/profile/RecentOrderPreview";
import { ContactDetailsForm } from "../../src/components/profile/ContactDetailsForm";
import { SizingPreferences } from "../../src/components/profile/SizingPreferences";
import { ThemeAndNotifications } from "../../src/components/profile/ThemeAndNotifications";
import { SecuritySection } from "../../src/components/profile/SecuritySection";
import { ScreenErrorBoundary } from "../../src/components/ScreenErrorBoundary";
import { ProfileDrawerModal } from "../../src/components/ProfileDrawerModal";

// Modals
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { AdminCustomersModal } from "../../src/components/AdminCustomersModal";
import { LoginModal } from "../../src/components/LoginModal";
import { AboutModal } from "../../src/components/AboutModal";
import { CourierTrackingModal } from "../../src/components/CourierTrackingModal";

/**
 * Expo Router Error Boundary for Profile route.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(239, 68, 68, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
        <AlertCircle size={32} color="#EF4444" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "900", color: "#1A1A2E", marginBottom: 8 }}>Profile Screen Recovery</Text>
      <Text style={{ fontSize: 13, color: "#1A1A2E", textAlign: "center", marginBottom: 20 }}>
        An unexpected error occurred while rendering the profile. Tap reload to restore normal operation.
      </Text>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#6366F1", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 }}
        onPress={retry}
      >
        <RotateCcw size={16} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 13 }}>RETRY PROFILE</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    updateProfile,
    addSavedAddress,
    removeSavedAddress,
  } = useProfile();

  const { orders } = useOrders();
  const { isDark, colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);
  const isAdmin = profile?.role === "admin" || profile?.accountType === "admin";

  // Profile form fields
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [city, setCity] = useState(profile?.city || "Dhaka");
  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);
  const [district, setDistrict] = useState<BdDistrict>(
    (districts && BD_DISTRICTS.find((d) => d.code === profile?.district)) ||
      BD_DISTRICTS.find((d) => d.code === "BD-13") ||
      BD_DISTRICTS[0]
  );
  const [selectedArea, setSelectedArea] = useState<DeliveryOptionKey>(profile?.area || "dhaka_standard");
  const [jeansSize, setJeansSize] = useState(profile?.jeansSize || "32");
  const [topSize, setTopSize] = useState(profile?.topSize || "L");
  const [pushOrders, setPushOrders] = useState(profile?.pushOrders ?? true);
  const [pushPromos, setPushPromos] = useState(profile?.pushPromos ?? false);
  const [pushDrops, setPushDrops] = useState(profile?.pushDrops ?? true);
  const [pushPersonalized, setPushPersonalized] = useState(profile?.pushPersonalized ?? true);
  const [otaChecking, setOtaChecking] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Drawer / Bottom-sheet states
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [sizingModalVisible, setSizingModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);

  // Other Modal visibility
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [customersModalVisible, setCustomersModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);

  useEffect(() => {
    fetchDistricts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDistricts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setEmail(profile.email || "");
    setAddress(profile.address || "");
    setCity(profile.city || "Dhaka");
    const dMatch = (districts || []).find((d) => d.code === profile.district);
    if (dMatch) setDistrict(dMatch);
    setSelectedArea(profile.area || "dhaka_standard");
    setJeansSize(profile.jeansSize || "32");
    setTopSize(profile.topSize || "L");
    setPushOrders(profile.pushOrders ?? true);
    setPushPromos(profile.pushPromos ?? false);
    setPushDrops(profile.pushDrops ?? true);
    setPushPersonalized(profile.pushPersonalized ?? true);
  }, [profile]);

  const showToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(""), 3500);
  };

  const handleSave = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone && (cleanPhone.length !== 11 || !cleanPhone.startsWith("01"))) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district?.code || "BD-13",
        area: selectedArea,
        jeansSize,
        topSize,
        pushOrders,
        pushPromos,
        pushDrops,
        pushPersonalized,
      });

      updateProfileAPI({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district?.code || "BD-13",
      }).catch(() => {});

      showToast("✓ Profile & shopping preferences saved successfully!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenErrorBoundary fallbackTitle="My Account">
      <ScreenShell title="MY ACCOUNT" showSearch={false}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {savedMessage ? (
            <View style={[styles.alertSuccess, { backgroundColor: colors.emeraldLight, borderColor: colors.emerald }]}>
              <Text style={[styles.alertSuccessText, { color: colors.emerald }]}>{savedMessage}</Text>
            </View>
          ) : null}

          {/* 1. Account Identity Header with Quick Stat Pills */}
          <AccountHeader
            onLoginPress={() => {
              setAuthModalMode("signin");
              setLoginModalVisible(true);
            }}
            onRegister={() => {
              setAuthModalMode("signup");
              setLoginModalVisible(true);
            }}
            onOrdersPress={() => setOrdersModalVisible(true)}
            onAddressPress={() => setAddressModalVisible(true)}
          />

          {/* Priority 1 for Admin: Executive BI Control Hub */}
          {isAdmin && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.indigo,
                padding: 16,
                marginBottom: 16,
                shadowColor: colors.indigo,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.indigoLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={18} color={colors.indigo} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: colors.ink, letterSpacing: 0.5 }}>
                      BUSINESS INTELLIGENCE (BI)
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.sub, fontWeight: "700" }}>
                      Executive Operations &amp; Real-Time Analytics
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: "900", color: colors.emerald }}>
                    ● LIVE BI
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: colors.sub, lineHeight: 18, marginBottom: 14 }}>
                Real-time tracking of net revenues, gross margins, return intelligence, and Pathao logistics dispatch.
              </Text>

              {/* Primary BI Action */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.indigo,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
                activeOpacity={0.88}
                onPress={() => router.push("/admin")}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>
                  OPEN DEDICATED BI PAGE →
                </Text>
              </TouchableOpacity>

              {/* Admin Shortcuts Grid */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardSecondary,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                  onPress={() => setCustomersModalVisible(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: colors.ink }}>
                    👥 Customers
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardSecondary,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                  onPress={() => setBroadcastModalVisible(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: colors.ink }}>
                    📢 Push Alert
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── 2. Minimal Profile Drawer Menu Rows (Simple, Clean & Fast) ── */}
          <View style={styles.menuList}>
            {/* 1. My Orders & Logistics Tracking */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setOrdersModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
                <Package size={20} color={colors.indigo} />
              </View>
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemTitleRow}>
                  <Text style={styles.menuItemTitle}>My Orders &amp; Logistics Tracking</Text>
                  {orders.length > 0 && (
                    <View style={styles.menuItemBadge}>
                      <Text style={styles.menuItemBadgeText}>{orders.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  {orders.length > 0
                    ? `${orders.length} orders · Live Pathao tracking`
                    : "View order history & live logistics dispatch"}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 2. Saved Delivery Address */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setAddressModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <MapPin size={20} color={colors.emerald} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Saved Delivery Address</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  {address
                    ? `${district?.name || "Dhaka"} · ${address}`
                    : `${district?.name || "Dhaka"} · Tap to set shipping address`}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 3. Fit & Sizing Preferences */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setSizingModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                <Ruler size={20} color={colors.amber} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Fit &amp; Sizing Preferences</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  Jeans Waist {jeansSize}&quot; · Top {topSize} · Tap to adjust
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 4. Account Security & Password */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setSecurityModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                <ShieldCheck size={20} color={colors.crimson} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Account Security &amp; Password</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  {profile?.isGuest
                    ? "Guest user · Set password & protect account"
                    : "Change password & login protection"}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 5. Appearance & Notifications */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setPreferencesModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
                <SlidersHorizontal size={20} color={colors.indigo} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Appearance &amp; Notifications</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  Theme: {isDark ? "DARK" : "LIGHT"} · Notification alerts active
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 6. About DEEN & Showrooms */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setAboutModalVisible(true)}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(59, 130, 246, 0.12)" }]}>
                <Store size={20} color={colors.indigo} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>About DEEN, Showrooms &amp; Socials</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  4 retail outlets, official brand socials &amp; heritage
                </Text>
              </View>
              <ChevronRight size={18} color={colors.sub} />
            </TouchableOpacity>

            {/* 7. WhatsApp Concierge */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => Linking.openURL("https://wa.me/8801952700500?text=Hello%20DEEN%20Commerce%2C%20I%20need%20assistance.")}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Text style={{ fontSize: 18 }}>💬</Text>
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>WhatsApp Concierge Hotline</Text>
                <Text style={styles.menuItemSub} numberOfLines={1}>
                  Instant customer support: +880 1952-700500
                </Text>
              </View>
              <ArrowRight size={16} color={colors.emerald} />
            </TouchableOpacity>
          </View>

          {/* ── 3. Official Brand Community & Social Links ── */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color={colors.indigo} />
                <Text style={{ fontSize: 12.5, fontWeight: "900", color: colors.ink, letterSpacing: 0.5 }}>
                  OFFICIAL BRAND CHANNELS
                </Text>
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: "700", color: colors.sub }}>
                @deencommerce
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: colors.sub, lineHeight: 17, marginBottom: 14 }}>
              Join 125,000+ patrons across Bangladesh. Connect directly on our official verified social channels.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              {/* Facebook */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#1877F2",
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(OFFICIAL_BRAND_SOCIALS.facebook)}
                accessibilityRole="button"
                accessibilityLabel="Open DEEN Facebook page"
              >
                <Facebook size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}>Facebook</Text>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#E1306C",
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(OFFICIAL_BRAND_SOCIALS.instagram)}
                accessibilityRole="button"
                accessibilityLabel="Open DEEN Instagram profile"
              >
                <Instagram size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}>Instagram</Text>
              </TouchableOpacity>

              {/* LinkedIn */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#0A66C2",
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(OFFICIAL_BRAND_SOCIALS.linkedin)}
                accessibilityRole="button"
                accessibilityLabel="Open DEEN LinkedIn corporate page"
              >
                <LinkedIn size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 4. App Info & OTA Updates Card ── */}
          <View
            style={{
              backgroundColor: colors.cardSecondary,
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.ink }}>DEEN Commerce App</Text>
              <Text style={{ fontSize: 10.5, color: colors.sub, marginTop: 2 }}>v1.0.1 (Production · OTA Enabled)</Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
              onPress={async () => {
                setOtaChecking(true);
                try {
                  if (__DEV__ || !Updates.isEmbeddedLaunch) {
                    Alert.alert("App Updates", "You are running in development client. Production builds receive instant OTA updates seamlessly.");
                    return;
                  }
                  const res = await Updates.checkForUpdateAsync();
                  if (res.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } else {
                    Alert.alert("Up to Date", "Your DEEN Commerce app is running the latest version.");
                  }
                } catch {
                  Alert.alert("Update Status", "Up to date with latest published bundle.");
                } finally {
                  setOtaChecking(false);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Check for app updates"
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>
                {otaChecking ? "Checking..." : "Check Updates"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── 5. Bottom-Sheet Drawers ── */}

        {/* Orders Drawer Modal */}
        <ProfileDrawerModal
          visible={ordersModalVisible}
          onClose={() => setOrdersModalVisible(false)}
          title="MY ORDERS & TRACKING"
          subtitle="Order status & live Pathao courier tracking"
          icon={<Package size={20} color={colors.indigo} />}
        >
          <RecentOrderPreview
            onTrackingPress={(order) => {
              setSelectedOrderForTracking(order);
              setTrackingModalVisible(true);
            }}
          />
          <TouchableOpacity
            style={styles.fullOrdersBtn}
            activeOpacity={0.85}
            onPress={() => {
              setOrdersModalVisible(false);
              router.push("/(tabs)/orders");
            }}
          >
            <Text style={styles.fullOrdersBtnText}>VIEW FULL ORDERS TAB →</Text>
          </TouchableOpacity>
        </ProfileDrawerModal>

        {/* Saved Delivery Address Drawer Modal */}
        <ProfileDrawerModal
          visible={addressModalVisible}
          onClose={() => setAddressModalVisible(false)}
          title="SAVED DELIVERY ADDRESS"
          subtitle="Default shipping address for 1-tap checkout"
          icon={<MapPin size={20} color={colors.emerald} />}
        >
          <ContactDetailsForm
            name={name}
            phone={phone}
            email={email}
            address={address}
            city={city}
            district={district}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onEmailChange={setEmail}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            onSaveProfile={async () => {
              await handleSave();
              setAddressModalVisible(false);
            }}
            onAddAddress={addSavedAddress}
            onRemoveAddress={removeSavedAddress}
          />
        </ProfileDrawerModal>

        {/* Fit & Sizing Preferences Drawer Modal */}
        <ProfileDrawerModal
          visible={sizingModalVisible}
          onClose={() => setSizingModalVisible(false)}
          title="FIT & SIZING PREFERENCES"
          subtitle="Save sizes for tailored recommendations"
          icon={<Ruler size={20} color={colors.amber} />}
        >
          <SizingPreferences
            jeansSize={jeansSize}
            topSize={topSize}
            onJeansSizeChange={setJeansSize}
            onTopSizeChange={setTopSize}
            onSave={async () => {
              await handleSave();
              setSizingModalVisible(false);
            }}
          />
        </ProfileDrawerModal>

        {/* Account Security Drawer Modal */}
        <ProfileDrawerModal
          visible={securityModalVisible}
          onClose={() => setSecurityModalVisible(false)}
          title="ACCOUNT SECURITY & PASSWORD"
          subtitle="Update password and account protection"
          icon={<ShieldCheck size={20} color={colors.crimson} />}
        >
          <SecuritySection
            onRegisterPress={() => {
              setSecurityModalVisible(false);
              setAuthModalMode("signup");
              setLoginModalVisible(true);
            }}
            onSuccessNotice={(msg) => {
              showToast(msg);
              setSecurityModalVisible(false);
            }}
          />
        </ProfileDrawerModal>

        {/* Appearance & Notifications Preferences Drawer Modal */}
        <ProfileDrawerModal
          visible={preferencesModalVisible}
          onClose={() => setPreferencesModalVisible(false)}
          title="APPEARANCE & PREFERENCES"
          subtitle="Customize theme and notification alerts"
          icon={<SlidersHorizontal size={20} color={colors.indigo} />}
        >
          <ThemeAndNotifications
            pushOrders={pushOrders}
            pushPromos={pushPromos}
            pushDrops={pushDrops}
            pushPersonalized={pushPersonalized}
            onPushOrdersChange={setPushOrders}
            onPushPromosChange={setPushPromos}
            onPushDropsChange={setPushDrops}
            onPushPersonalizedChange={setPushPersonalized}
          />
          <TouchableOpacity
            style={[styles.fullOrdersBtn, { marginTop: 16 }]}
            activeOpacity={0.88}
            onPress={async () => {
              await handleSave();
              setPreferencesModalVisible(false);
            }}
          >
            <Text style={styles.fullOrdersBtnText}>✓ APPLY PREFERENCES</Text>
          </TouchableOpacity>
        </ProfileDrawerModal>

        {/* ── 4. Global Modals ── */}
        {isAdmin && customersModalVisible && (
          <AdminCustomersModal
            visible={customersModalVisible}
            onClose={() => setCustomersModalVisible(false)}
          />
        )}

        {isAdmin && broadcastModalVisible && (
          <AdminBroadcastModal
            visible={broadcastModalVisible}
            onClose={() => setBroadcastModalVisible(false)}
          />
        )}

        {loginModalVisible && (
          <LoginModal
            visible={loginModalVisible}
            initialMode={authModalMode}
            onClose={() => setLoginModalVisible(false)}
            onSuccess={(role) => {
              setLoginModalVisible(false);
              showToast("✓ Authenticated successfully!");
              if (role === "admin" || profile?.role === "admin") {
                router.push("/admin");
              }
            }}
          />
        )}

        {aboutModalVisible && (
          <AboutModal
            visible={aboutModalVisible}
            onClose={() => setAboutModalVisible(false)}
          />
        )}

        {trackingModalVisible && selectedOrderForTracking && (
          <CourierTrackingModal
            visible={trackingModalVisible}
            order={selectedOrderForTracking}
            onClose={() => {
              setTrackingModalVisible(false);
              setSelectedOrderForTracking(null);
            }}
          />
        )}
      </ScreenShell>
    </ScreenErrorBoundary>
  );
}

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    scrollContent: s.scrollContent,
    alertSuccess: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      marginBottom: 8,
    },
    alertSuccessText: {
      fontSize: 12,
      fontWeight: "800",
    },
    menuList: {
      gap: 10,
      marginBottom: 30,
      marginTop: 4,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 3,
    },
    menuItemTitle: {
      fontSize: 13.5,
      fontWeight: "800",
      color: colors.ink,
      letterSpacing: 0.1,
    },
    menuItemBadge: {
      backgroundColor: colors.indigo,
      paddingHorizontal: 7,
      paddingVertical: 1.5,
      borderRadius: 999,
    },
    menuItemBadgeText: {
      color: "#FFFFFF",
      fontSize: 9.5,
      fontWeight: "900",
    },
    menuItemSub: {
      fontSize: 11,
      color: colors.sub,
    },
    fullOrdersBtn: {
      backgroundColor: colors.indigo,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    fullOrdersBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    saveBtn: s.saveBtn,
    saveBtnText: s.saveBtnText,
  });
}
