import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";

import { Save } from "../../src/components/Icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { DeliveryOptionKey } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { useTheme } from "../../src/context/ThemeContext";

import { reportBug } from "../../src/services/gateway";
import { BD_DISTRICTS, BdDistrict } from "../../src/data/districts";

// Extracted sub-components
import { AccountHeader } from "../../src/components/profile/AccountHeader";
import { VipClubCard } from "../../src/components/profile/VipClubCard";
import { RecentOrderPreview } from "../../src/components/profile/RecentOrderPreview";
import { ContactDetailsForm } from "../../src/components/profile/ContactDetailsForm";
import { DeliveryOptions } from "../../src/components/profile/DeliveryOptions";
import { SizingPreferences } from "../../src/components/profile/SizingPreferences";
import { ThemeAndNotifications } from "../../src/components/profile/ThemeAndNotifications";
import { StoreSection } from "../../src/components/profile/StoreSection";

// Modals
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { WishlistModal } from "../../src/components/WishlistModal";
import { DailyRewardsModal } from "../../src/components/DailyRewardsModal";
import { GiftCardModal } from "../../src/components/GiftCardModal";
import { DenimCareGuideModal } from "../../src/components/DenimCareGuideModal";
import { LoginModal } from "../../src/components/LoginModal";
import { AboutModal } from "../../src/components/AboutModal";
import { CourierTrackingModal } from "../../src/components/CourierTrackingModal";

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
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email || "");
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city || "Dhaka");
  const [district, setDistrict] = useState<BdDistrict>(
    BD_DISTRICTS.find((d) => d.code === profile.district) ||
      BD_DISTRICTS.find((d) => d.code === "BD-13") ||
      BD_DISTRICTS[0]
  );
  const [selectedArea, setSelectedArea] = useState<DeliveryOptionKey>(profile.area || "dhaka_standard");
  const [jeansSize, setJeansSize] = useState(profile.jeansSize || "32");
  const [topSize, setTopSize] = useState(profile.topSize || "L");
  const [pushOrders, setPushOrders] = useState(profile.pushOrders ?? true);
  const [pushPromos, setPushPromos] = useState(profile.pushPromos ?? false);
  const [savedMessage, setSavedMessage] = useState("");

  // Modal visibility
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [giftCardModalVisible, setGiftCardModalVisible] = useState(false);
  const [careGuideVisible, setCareGuideVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setEmail(profile.email || "");
    setAddress(profile.address);
    setCity(profile.city || "Dhaka");
    const dMatch = BD_DISTRICTS.find((d) => d.code === profile.district);
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
    await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.code,
      area: selectedArea,
      jeansSize,
      topSize,
      pushOrders,
      pushPromos,
    });
    showToast("✓ Profile & shopping preferences saved successfully!");
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      Alert.alert("Invalid Mobile Number", "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    await registerCustomer({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.code,
    });
    showToast("🎉 Registered as a verified DEEN Customer Account!");
  };

  return (
    <ScreenShell title="MY ACCOUNT" showSearch={false}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {savedMessage ? (
          <View style={[styles.alertSuccess, { backgroundColor: colors.emeraldLight, borderColor: colors.emerald }]}>
            <Text style={[styles.alertSuccessText, { color: colors.emerald }]}>{savedMessage}</Text>
          </View>
        ) : null}

        {/* 1. Account Identity Header */}
        <AccountHeader
          onLoginPress={() => setLoginModalVisible(true)}
          onRegister={handleRegister}
        />

        {/* 2. VIP Club & Loyalty Rewards Portal */}
        <VipClubCard
          onRewardsPress={() => setRewardsModalVisible(true)}
          onWishlistPress={() => setWishlistModalVisible(true)}
          onGiftCardPress={() => setGiftCardModalVisible(true)}
          onCareGuidePress={() => setCareGuideVisible(true)}
        />

        {/* 3. My Orders & Live Pathao Tracking Hub */}
        <RecentOrderPreview
          onTrackingPress={(order) => {
            setSelectedOrderForTracking(order);
            setTrackingModalVisible(true);
          }}
        />

        {/* 4. Customer Details & Delivery Address Management */}
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

        {/* 5. Preferred Delivery Zone / Courier Option */}
        <DeliveryOptions
          selectedArea={selectedArea}
          onSelectArea={setSelectedArea}
        />

        {/* 6. Saved Sizing & Fit Preferences */}
        <SizingPreferences
          jeansSize={jeansSize}
          topSize={topSize}
          onJeansSizeChange={setJeansSize}
          onTopSizeChange={setTopSize}
        />

        {/* 7. Appearance & Theme + 8. Notification Preferences */}
        <ThemeAndNotifications
          pushOrders={pushOrders}
          pushPromos={pushPromos}
          onPushOrdersChange={setPushOrders}
          onPushPromosChange={setPushPromos}
        />

        {/* Save Preferences Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.indigo }]}
          activeOpacity={0.88}
          onPress={handleSave}
        >
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>SAVE PREFERENCES</Text>
        </TouchableOpacity>

        {/* 9. Store Outlets & Customer Concierge + 10. Admin Portal */}
        <StoreSection
          onAboutPress={() => setAboutModalVisible(true)}
          onReportPress={handleReport}
          onBroadcastPress={() => setBroadcastModalVisible(true)}
        />
      </ScrollView>

      {/* Embedded Modals */}
      <AdminBroadcastModal
        visible={broadcastModalVisible}
        onClose={() => setBroadcastModalVisible(false)}
      />
      <WishlistModal
        visible={wishlistModalVisible}
        onClose={() => setWishlistModalVisible(false)}
      />
      <DailyRewardsModal
        visible={rewardsModalVisible}
        onClose={() => setRewardsModalVisible(false)}
      />
      <GiftCardModal
        visible={giftCardModalVisible}
        onClose={() => setGiftCardModalVisible(false)}
      />
      <DenimCareGuideModal
        visible={careGuideVisible}
        onClose={() => setCareGuideVisible(false)}
      />
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />
      <AboutModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
      />
      <CourierTrackingModal
        visible={trackingModalVisible}
        order={selectedOrderForTracking}
        onClose={() => {
          setTrackingModalVisible(false);
          setSelectedOrderForTracking(null);
        }}
      />
    </ScreenShell>
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
    },
    alertSuccessText: {
      fontSize: 12,
      fontWeight: "800",
    },
    saveBtn: s.saveBtn,
    saveBtnText: s.saveBtnText,
  });
}
