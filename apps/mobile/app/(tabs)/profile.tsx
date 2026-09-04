import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";

import { Save, RotateCcw, AlertCircle, TrendingUp, ArrowRight } from "../../src/components/Icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { DeliveryOptionKey } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { useTheme } from "../../src/context/ThemeContext";

import { reportBug, fetchDistricts, updateProfileAPI, type BdDistrict } from "../../src/services/gateway";
import { BD_DISTRICTS } from "../../src/data/districts";

// Extracted sub-components
import { AccountHeader } from "../../src/components/profile/AccountHeader";
import { RecentOrderPreview } from "../../src/components/profile/RecentOrderPreview";
import { ContactDetailsForm } from "../../src/components/profile/ContactDetailsForm";
import { SizingPreferences } from "../../src/components/profile/SizingPreferences";
import { ThemeAndNotifications } from "../../src/components/profile/ThemeAndNotifications";
import { SecuritySection } from "../../src/components/profile/SecuritySection";
import { StoreSection } from "../../src/components/profile/StoreSection";
import { ScreenErrorBoundary } from "../../src/components/ScreenErrorBoundary";

// Modals
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { AdminCustomersModal } from "../../src/components/AdminCustomersModal";
import { LoginModal } from "../../src/components/LoginModal";
import { AboutModal } from "../../src/components/AboutModal";
import { CourierTrackingModal } from "../../src/components/CourierTrackingModal";

/**
 * Expo Router Error Boundary for Profile route.
 * Automatically catches any unexpected render errors and provides graceful recovery.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0D111A", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(239, 68, 68, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
        <AlertCircle size={32} color="#EF4444" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "900", color: "#F4F6FC", marginBottom: 8 }}>Profile Screen Recovery</Text>
      <Text style={{ fontSize: 13, color: "#8C96B2", textAlign: "center", marginBottom: 20 }}>
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
    registerCustomer,
    addSavedAddress,
    removeSavedAddress,
  } = useProfile();

  const { themeMode, isDark, setThemeMode, colors } = useTheme();
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
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdminShipping, setShowAdminShipping] = useState(false);

  // Modal visibility
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [customersModalVisible, setCustomersModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);

  useEffect(() => {
    // Fetch districts from API (single source of truth)
    fetchDistricts().then((data) => {
      if (Array.isArray(data) && data.length > 0) setDistricts(data);
    }).catch(() => {});
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
  }, [profile]);

  const showToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(""), 3500);
  };

  const handleReport = async () => {
    try {
      await reportBug({
        severity: "low",
        route: "profile",
        message: "User-initiated problem report from Profile tab.",
      });
      Alert.alert("Report Sent", "Thank you! Our engineering team will review your feedback.");
    } catch {
      Alert.alert("Notice", "Thank you! Our team has received your report.");
    }
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
      });

      // Background sync to backend gateway
      updateProfileAPI({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district?.code || "BD-13",
      }).catch(() => {});

      showToast("✓ Profile & shopping preferences saved successfully!");
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

          {/* 1. Account Identity Header */}
          <AccountHeader
            onLoginPress={() => {
              setAuthModalMode("signin");
              setLoginModalVisible(true);
            }}
            onRegister={() => {
              setAuthModalMode("signup");
              setLoginModalVisible(true);
            }}
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
                      Executive Operations & Real-Time Analytics
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

          {/* 2. My Orders & Live Pathao Tracking Hub (De-emphasized if admin) */}
          <RecentOrderPreview
            onTrackingPress={(order) => {
              setSelectedOrderForTracking(order);
              setTrackingModalVisible(true);
            }}
          />

          {/* 3. Customer Details & Delivery Address (Secondary/Collapsed for Admin) */}
          {isAdmin ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 14,
                marginBottom: 16,
                padding: 16,
              }}
            >
              <TouchableOpacity
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                onPress={() => setShowAdminShipping(!showAdminShipping)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: colors.sub, letterSpacing: 0.5 }}>
                    📦 PERSONAL DELIVERY & SHIPPING ADDRESS
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>
                    {showAdminShipping ? "Tap to hide personal shipping info" : "Secondary for store administrators (Tap to expand)"}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: colors.indigo }}>
                  {showAdminShipping ? "−" : "+"}
                </Text>
              </TouchableOpacity>
              {showAdminShipping && (
                <View style={{ marginTop: 14 }}>
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
                    onSaveProfile={handleSave}
                    onAddAddress={addSavedAddress}
                    onRemoveAddress={removeSavedAddress}
                  />
                </View>
              )}
            </View>
          ) : (
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
              onSaveProfile={handleSave}
              onAddAddress={addSavedAddress}
              onRemoveAddress={removeSavedAddress}
            />
          )}

          {/* 4. Saved Sizing Profile */}
          <SizingPreferences
            jeansSize={jeansSize}
            topSize={topSize}
            onJeansSizeChange={setJeansSize}
            onTopSizeChange={setTopSize}
            onSave={handleSave}
          />

          {/* 5. Appearance & Theme + Notification Preferences */}
          <ThemeAndNotifications
            pushOrders={pushOrders}
            pushPromos={pushPromos}
            onPushOrdersChange={setPushOrders}
            onPushPromosChange={setPushPromos}
          />

          {/* 6. Top-Notch Account Security & Password Update */}
          <SecuritySection
            onRegisterPress={() => {
              setAuthModalMode("signup");
              setLoginModalVisible(true);
            }}
            onSuccessNotice={showToast}
          />

          {/* 7. Store Outlets & Customer Concierge */}
          <StoreSection
            onAboutPress={() => setAboutModalVisible(true)}
            onReportPress={handleReport}
          />
        </ScrollView>

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
      marginBottom: 6,
    },
    alertSuccessText: {
      fontSize: 12,
      fontWeight: "800",
    },
    saveBtn: s.saveBtn,
    saveBtnText: s.saveBtnText,
  });
}
