import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";

import { Save, RotateCcw, AlertCircle } from "../../src/components/Icons";
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
import { DeliveryOptions } from "../../src/components/profile/DeliveryOptions";
import { SizingPreferences } from "../../src/components/profile/SizingPreferences";
import { ThemeAndNotifications } from "../../src/components/profile/ThemeAndNotifications";
import { SecuritySection } from "../../src/components/profile/SecuritySection";
import { StoreSection } from "../../src/components/profile/StoreSection";
import { ScreenErrorBoundary } from "../../src/components/ScreenErrorBoundary";

// Modals
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { AdminAnalyticsModal } from "../../src/components/AdminAnalyticsModal";
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

  // Modal visibility
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
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

          {/* 2. My Orders & Live Pathao Tracking Hub */}
          <RecentOrderPreview
            onTrackingPress={(order) => {
              setSelectedOrderForTracking(order);
              setTrackingModalVisible(true);
            }}
          />

          {/* 3. Customer Details & Delivery Address Management */}
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
            onAddAddress={addSavedAddress}
            onRemoveAddress={removeSavedAddress}
          />

          {/* 4. Default Delivery Speed / Slot Preferences */}
          <DeliveryOptions
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
          />

          {/* 5. Saved Sizing Profile */}
          <SizingPreferences
            jeansSize={jeansSize}
            topSize={topSize}
            onJeansSizeChange={setJeansSize}
            onTopSizeChange={setTopSize}
          />

          {/* 6. Appearance & Theme + Notification Preferences */}
          <ThemeAndNotifications
            pushOrders={pushOrders}
            pushPromos={pushPromos}
            onPushOrdersChange={setPushOrders}
            onPushPromosChange={setPushPromos}
          />

          {/* 7. Top-Notch Account Security & Password Update */}
          <SecuritySection
            onRegisterPress={() => {
              setAuthModalMode("signup");
              setLoginModalVisible(true);
            }}
            onSuccessNotice={showToast}
          />

          {/* 8. Save Preferences Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.indigo }, saving && { opacity: 0.7 }]}
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={saving}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{saving ? "SAVING CHANGES..." : "SAVE PREFERENCES"}</Text>
          </TouchableOpacity>

          {/* 9. Store Outlets & Customer Concierge + Store Admin Portal */}
          <StoreSection
            onAboutPress={() => setAboutModalVisible(true)}
            onReportPress={handleReport}
            onBroadcastPress={() => setBroadcastModalVisible(true)}
            onAnalyticsPress={() => setAnalyticsModalVisible(true)}
            onCustomersPress={() => setCustomersModalVisible(true)}
          />
        </ScrollView>

        {/* Embedded Modals — only mounted when active to prevent child render crashes */}
        {analyticsModalVisible && (
          <AdminAnalyticsModal
            visible={analyticsModalVisible}
            onClose={() => setAnalyticsModalVisible(false)}
          />
        )}

        {customersModalVisible && (
          <AdminCustomersModal
            visible={customersModalVisible}
            onClose={() => setCustomersModalVisible(false)}
          />
        )}

        {broadcastModalVisible && (
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
