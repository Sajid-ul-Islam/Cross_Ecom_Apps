import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Phone,
  MapPin,
  Ruler,
  Bell,
  Save,
  Store,
  HelpCircle,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  Sparkles,
  Key,
  LogOut,
  Gift,
  Heart,
  BookOpen,
  Trophy,
} from "../../src/components/Icons";
import { Colors } from "../../src/theme/colors";
import { Header } from "../../src/components/Header";
import { DeliveryOptionKey, SavedAddress } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { useTheme } from "../../src/context/ThemeContext";
import { reportBug, DELIVERY_OPTIONS, bdt } from "../../src/services/gateway";
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { WishlistModal } from "../../src/components/WishlistModal";
import { DailyRewardsModal } from "../../src/components/DailyRewardsModal";
import { GiftCardModal } from "../../src/components/GiftCardModal";
import { DenimCareGuideModal } from "../../src/components/DenimCareGuideModal";
import { LoginModal } from "../../src/components/LoginModal";
import { UserModeBar } from "../../src/components/UserModeBar";
import { AboutModal } from "../../src/components/AboutModal";
import { useRewards } from "../../src/context/RewardsContext";
import { useWishlist } from "../../src/context/WishlistContext";

import { useRouter } from "expo-router";
import { useOrders } from "../../src/context/OrderContext";

const JEANS_SIZES = ["28", "30", "32", "34", "36", "38"];
const TOP_SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ProfileScreen() {
  const router = useRouter();
  const { orders } = useOrders();
  const {
    profile,
    updateProfile,
    switchToGuestMode,
    registerCustomer,
    login,
    logout,
    isLoggedIn,
  } = useProfile();


  const { themeMode, isDark, setThemeMode, colors } = useTheme();
  const { wishlist } = useWishlist();
  const { coins, tierLabel, dailyStreak } = useRewards();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email || "");
  const [address, setAddress] = useState(profile.address);
  const [selectedArea, setSelectedArea] = useState<DeliveryOptionKey>(profile.area || "dhaka_standard");
  const [jeansSize, setJeansSize] = useState(profile.jeansSize);
  const [topSize, setTopSize] = useState(profile.topSize);
  const [pushOrders, setPushOrders] = useState(profile.pushOrders);
  const [pushPromos, setPushPromos] = useState(profile.pushPromos);
  const [savedMessage, setSavedMessage] = useState("");
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [giftCardModalVisible, setGiftCardModalVisible] = useState(false);
  const [careGuideVisible, setCareGuideVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setEmail(profile.email || "");
    setAddress(profile.address);
    setSelectedArea(profile.area || "dhaka_standard");
    setJeansSize(profile.jeansSize);
    setTopSize(profile.topSize);
    setPushOrders(profile.pushOrders);
    setPushPromos(profile.pushPromos);
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
      Alert.alert("Report Sent", "Thank you! Our engineering team will review your report.");
    } catch {
      Alert.alert("Couldn't send", "Please try again later.");
    }
  };

  const handleSave = async () => {
    await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      area: selectedArea,
      jeansSize,
      topSize,
      pushOrders,
      pushPromos,
    });
    showToast("✓ Profile & preferences saved successfully");
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      Alert.alert("Invalid Phone", "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    await registerCustomer({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      address: address.trim(),
    });
    showToast("🎉 Registered as a DEEN Customer Account!");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="MY ACCOUNT" showSearch={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quick Role & Mode Switcher Bar */}
        <UserModeBar />

        {savedMessage ? (
          <View style={styles.alertSuccess}>
            <Text style={styles.alertSuccessText}>{savedMessage}</Text>
          </View>
        ) : null}

        {/* DEEN VIP Club & Rewards Portal */}
        <View style={styles.vipCard}>
          <View style={styles.vipHeader}>
            <View style={styles.vipHeaderLeft}>
              <View style={styles.vipIconCircle}>
                <Trophy size={18} color={Colors.amber} />
              </View>
              <View>
                <Text style={styles.vipTitle}>DEEN VIP CLUB · {tierLabel}</Text>
                <Text style={styles.vipSub}>
                  🪙 {coins} Coins (≈ ৳{Math.floor(coins / 2)} Discount) · Day {dailyStreak} Streak 🔥
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.vipGrid}>
            <TouchableOpacity
              style={styles.vipActionChip}
              onPress={() => setRewardsModalVisible(true)}
            >
              <Gift size={14} color={Colors.amber} />
              <Text style={styles.vipActionText}>DAILY SCRATCH</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.vipActionChip}
              onPress={() => setWishlistModalVisible(true)}
            >
              <Heart size={14} color={Colors.crimson} />
              <Text style={styles.vipActionText}>SAVED ({wishlist.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.vipActionChip}
              onPress={() => setGiftCardModalVisible(true)}
            >
              <Gift size={14} color={Colors.indigoDark} />
              <Text style={styles.vipActionText}>GIFT CARDS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.vipActionChip}
              onPress={() => setCareGuideVisible(true)}
            >
              <BookOpen size={14} color={Colors.indigoDark} />
              <Text style={styles.vipActionText}>DENIM GUIDE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Account & Guest Mode Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile.role === "admin"
                  ? "👑"
                  : profile.isGuest
                  ? "👤"
                  : profile.name
                  ? profile.name.charAt(0).toUpperCase()
                  : "D"}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.roleBadge,
                    profile.role === "admin"
                      ? styles.roleBadgeAdmin
                      : profile.isGuest
                      ? styles.roleBadgeGuest
                      : styles.roleBadgeCustomer,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      profile.role === "admin"
                        ? styles.roleBadgeTextAdmin
                        : profile.isGuest
                        ? styles.roleBadgeTextGuest
                        : styles.roleBadgeTextCustomer,
                    ]}
                  >
                    {profile.role === "admin"
                      ? "STORE ADMIN"
                      : profile.isGuest
                      ? "GUEST SHOPPER"
                      : "REGISTERED CUSTOMER"}
                  </Text>
                </View>
                {!profile.isGuest && profile.memberSince && (
                  <Text style={styles.memberSinceText}>Since {profile.memberSince}</Text>
                )}
              </View>

              <Text style={styles.accountName}>
                {profile.role === "admin"
                  ? "Store Administrator"
                  : profile.isGuest
                  ? "Guest User"
                  : profile.name || "DEEN Member"}
              </Text>
              <Text style={styles.accountSub}>
                {profile.role === "admin"
                  ? "Full BI, Sales & Catalog Access"
                  : profile.isGuest
                  ? "Instant shopping without registration"
                  : profile.phone || profile.email || "Verified Shopper"}
              </Text>
            </View>
          </View>

          {/* Mode Switcher Buttons */}
          <View style={styles.modeSwitchRow}>
            {profile.isGuest ? (
              <TouchableOpacity
                style={[styles.modeBtn, styles.modeBtnPrimary]}
                activeOpacity={0.8}
                onPress={handleRegister}
              >
                <CheckCircle2 size={15} color="#FFFFFF" />
                <Text style={styles.modeBtnTextPrimary}>CREATE CUSTOMER ACCOUNT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.modeBtn, styles.modeBtnSecondary]}
                activeOpacity={0.8}
                onPress={switchToGuestMode}
              >
                <Text style={styles.modeBtnTextSecondary}>SWITCH TO GUEST MODE</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnAuth]}
              activeOpacity={0.8}
              onPress={() => setLoginModalVisible(true)}
            >
              <Key size={15} color={colors.indigo} />
              <Text style={styles.modeBtnTextAuth}>DEMO SIGN IN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Orders & Live Pathao Tracking Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Truck size={18} color={colors.indigo} />
              <Text style={[styles.cardTitle, { color: colors.ink }]}>MY ORDERS &amp; PATHAO TRACKING</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.indigo }}>VIEW ALL ({orders.length}) →</Text>
            </TouchableOpacity>
          </View>

          {orders.length > 0 ? (
            <View style={{ backgroundColor: colors.paper, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.borderLight, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.indigo }}>
                  {orders[0].number} {orders[0].wooId ? `(Store #${orders[0].wooId})` : ""}
                </Text>
                <View style={{ backgroundColor: colors.indigoLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.indigo }}>
                    {orders[0].status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: colors.sub }}>
                {orders[0].pathaoConsignmentId ? (
                  <>Pathao Consignment: <Text style={{ fontWeight: "700", color: colors.ink }}>{orders[0].pathaoConsignmentId}</Text></>
                ) : (
                  <>Delivery Status: <Text style={{ fontWeight: "700", color: colors.ink }}>Preparing Dispatch</Text></>
                )}
              </Text>
              <Text style={{ fontSize: 11, color: colors.sub }}>
                Delivery: <Text style={{ fontWeight: "700", color: colors.ink }}>৳{orders[0].delivery}</Text> · Total: <Text style={{ fontWeight: "800", color: colors.indigo }}>{bdt(orders[0].total)}</Text> ({orders[0].payment === "cod" ? "Cash on Delivery" : "Paid"})
              </Text>

              <TouchableOpacity
                style={{
                  marginTop: 6,
                  backgroundColor: colors.indigo,
                  paddingVertical: 8,
                  borderRadius: 6,
                  alignItems: "center",
                }}
                onPress={() => router.push("/(tabs)/orders")}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                  {orders[0].pathaoConsignmentId ? "OPEN ORDER & LIVE PATHAO TRACKING →" : "VIEW ORDER DETAILS →"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: colors.sub, marginBottom: 8 }}>
                No active orders placed yet.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.indigo, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 }}
                onPress={() => router.push("/(tabs)/shop")}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>START SHOPPING</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Sign-In Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Key size={16} color={colors.indigo} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>YOUR ACCOUNT</Text>
          </View>

          <Text style={[styles.cardSub, { color: colors.sub }]}>
            {isLoggedIn
              ? `Signed in as ${profile.name || profile.username}.`
              : "Sign in with your deencommerce.com account to sync your orders and profile."}
          </Text>

          {isLoggedIn ? (
            <TouchableOpacity
              style={[styles.openLoginBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              activeOpacity={0.88}
              onPress={() => logout()}
            >
              <LogOut size={15} color={colors.ink} />
              <Text style={[styles.openLoginBtnText, { color: colors.ink }]}>LOG OUT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.openLoginBtn, { backgroundColor: colors.indigo }]}
              activeOpacity={0.88}
              onPress={() => setLoginModalVisible(true)}
            >
              <Lock size={15} color="#FFFFFF" />
              <Text style={styles.openLoginBtnText}>SIGN IN</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Store Admin Switcher */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Store size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>STORE ADMIN &amp; BI ACCESS</Text>
          </View>
          {profile.role === "admin" ? (
            <View style={styles.adminOn}>
              <Text style={styles.adminOnText}>
                ✓ Logged in as Admin — Sales Insights &amp; BI Dashboard are live on Home.
              </Text>
              <TouchableOpacity
                style={styles.broadcastBtn}
                activeOpacity={0.88}
                onPress={() => setBroadcastModalVisible(true)}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.broadcastBtnText}>📢 SEND MARKETING BROADCAST PUSH</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminLogoutBtn} onPress={logout}>
                <Text style={styles.adminLogoutText}>LOG OUT ADMIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.adminLoginBtn} onPress={() => setLoginModalVisible(true)}>
              <Text style={styles.adminLoginText}>LOGIN AS STORE ADMIN</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact & Customer Profile Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>
              {profile.isGuest ? "GUEST CHECKOUT DETAILS" : "REGISTERED CUSTOMER DETAILS"}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tanvir Ahmed"
              placeholderTextColor={Colors.faint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BD Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="017XX-XXXXXX"
              placeholderTextColor={Colors.faint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="e.g. name@example.com"
              placeholderTextColor={Colors.faint}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Default Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholder="House, Road, Sector/Area, City"
              placeholderTextColor={Colors.faint}
            />
          </View>
        </View>

        {/* Advanced Delivery Zone Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>PREFERRED DELIVERY OPTION</Text>
          </View>

          <View style={styles.deliveryOptionsList}>
            {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const isSelected = selectedArea === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.deliveryTier, isSelected && styles.deliveryTierActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedArea(key)}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.tierInfo}>
                    <View style={styles.tierTop}>
                      <Text style={[styles.tierName, isSelected && styles.tierNameActive]}>
                        {opt.name}
                      </Text>
                      {opt.badge && (
                        <View style={[styles.tierBadge, opt.badge === "FREE" && styles.tierBadgeFree]}>
                          <Text style={styles.tierBadgeText}>{opt.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tierSub}>{opt.sub}</Text>
                  </View>
                  <Text style={[styles.tierFee, isSelected && styles.tierFeeActive]}>
                    {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Saved Sizing Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ruler size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>FIT &amp; SIZING PREFERENCES</Text>
          </View>

          <Text style={styles.fieldSub}>
            Auto-selects your preferred size when viewing selvedge jeans, shirts, and tops.
          </Text>

          <Text style={[styles.label, { marginTop: 10 }]}>Jeans Waist Size (Inches)</Text>
          <View style={styles.chipsRow}>
            {JEANS_SIZES.map((sz) => {
              const active = jeansSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                  onPress={() => setJeansSize(sz)}
                >
                  <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Shirt / Panjabi / Tee Size</Text>
          <View style={styles.chipsRow}>
            {TOP_SIZES.map((sz) => {
              const active = topSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                  onPress={() => setTopSize(sz)}
                >
                  <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Theme & Appearance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>APPEARANCE &amp; THEME</Text>
          </View>

          <Text style={styles.fieldSub}>
            Inherits your phone's system dark / light mode automatically or locks your preferred look.
          </Text>

          <View style={styles.themeGrid}>
            <TouchableOpacity
              style={[styles.themeOptionCard, themeMode === "system" && styles.themeOptionCardActive]}
              onPress={() => setThemeMode("system")}
              activeOpacity={0.8}
            >
              <Text style={styles.themeEmoji}>🌓</Text>
              <Text style={[styles.themeOptionTitle, themeMode === "system" && styles.themeOptionTitleActive]}>
                System Auto
              </Text>
              <Text style={styles.themeOptionSub}>
                {isDark ? "Currently Dark" : "Currently Light"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOptionCard, themeMode === "light" && styles.themeOptionCardActive]}
              onPress={() => setThemeMode("light")}
              activeOpacity={0.8}
            >
              <Text style={styles.themeEmoji}>☀️</Text>
              <Text style={[styles.themeOptionTitle, themeMode === "light" && styles.themeOptionTitleActive]}>
                Light Mode
              </Text>
              <Text style={styles.themeOptionSub}>Warm Paper &amp; Indigo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOptionCard, themeMode === "dark" && styles.themeOptionCardActive]}
              onPress={() => setThemeMode("dark")}
              activeOpacity={0.8}
            >
              <Text style={styles.themeEmoji}>🌙</Text>
              <Text style={[styles.themeOptionTitle, themeMode === "dark" && styles.themeOptionTitleActive]}>
                Dark Mode
              </Text>
              <Text style={styles.themeOptionSub}>Midnight Selvedge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>NOTIFICATIONS</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Order &amp; Parcel Tracking</Text>
              <Text style={styles.toggleSub}>Live updates on dispatch and delivery</Text>
            </View>
            <Switch
              value={pushOrders}
              onValueChange={setPushOrders}
              trackColor={{ false: Colors.border, true: Colors.indigo }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleDivider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Drops &amp; Festive Sales</Text>
              <Text style={styles.toggleSub}>Exclusive selvedge alerts &amp; Eid collections</Text>
            </View>
            <Switch
              value={pushPromos}
              onValueChange={setPushPromos}
              trackColor={{ false: Colors.border, true: Colors.indigo }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88} onPress={handleSave}>
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>SAVE PREFERENCES</Text>
        </TouchableOpacity>

        {/* Report Problem & Stores */}
        <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
          <HelpCircle size={16} color={Colors.indigo} />
          <Text style={styles.reportBtnText}>REPORT A PROBLEM / BUG</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.reportBtn, { marginTop: 0 }]} onPress={() => setAboutModalVisible(true)}>
          <Store size={16} color={Colors.indigo} />
          <Text style={styles.reportBtnText}>ABOUT DEEN COMMERCE</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Store size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>DEEN RETAIL OUTLETS</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Mirpur 12 (Flagship Outlet)</Text>
            <Text style={styles.storeAddr}>2nd Floor, Ramzannesa Super Market, Mirpur 12, Dhaka-1216</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Wari Outlet (Dhaka South)</Text>
            <Text style={styles.storeAddr}>Ground Floor, 41 A.K Famous Tower, Rankin St, Wari, Dhaka-1203</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Cumilla Outlet</Text>
            <Text style={styles.storeAddr}>4th Floor, QR Tower, Badurtola, Cumilla</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Sylhet Outlet</Text>
            <Text style={styles.storeAddr}>Block-A, House-54/2, Kumar Para, Sylhet</Text>
          </View>

          <View style={styles.supportBox}>
            <HelpCircle size={16} color={Colors.indigo} />
            <Text style={styles.supportText}>
              Customer Hotline & WhatsApp: <Text style={styles.bold}>+880 1952-700500</Text> (10 AM - 10 PM)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Admin Broadcast Marketing Modal */}
      <AdminBroadcastModal
        visible={broadcastModalVisible}
        onClose={() => setBroadcastModalVisible(false)}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        visible={wishlistModalVisible}
        onClose={() => setWishlistModalVisible(false)}
      />

      {/* Daily Rewards Modal */}
      <DailyRewardsModal
        visible={rewardsModalVisible}
        onClose={() => setRewardsModalVisible(false)}
      />

      {/* Gift Card Modal */}
      <GiftCardModal
        visible={giftCardModalVisible}
        onClose={() => setGiftCardModalVisible(false)}
      />

      {/* Denim Care Guide Modal */}
      <DenimCareGuideModal
        visible={careGuideVisible}
        onClose={() => setCareGuideVisible(false)}
      />

      {/* Login & Demo Credentials Modal */}
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />

      {/* About DEEN Modal */}
      <AboutModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  alertSuccess: {
    backgroundColor: Colors.emeraldLight,
    borderWidth: 1,
    borderColor: Colors.emerald,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  alertSuccessText: {
    color: Colors.emerald,
    fontSize: 12,
    fontWeight: "700",
  },
  vipCard: {
    backgroundColor: Colors.indigoDark,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  vipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vipHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vipIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  vipTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  vipSub: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    marginTop: 2,
  },
  vipGrid: {
    flexDirection: "row",
    gap: 6,
  },
  vipActionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.paper,
    paddingVertical: 9,
    borderRadius: 6,
  },
  vipActionText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  themeGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  themeOptionCard: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  themeOptionCardActive: {
    borderColor: Colors.indigo,
    borderWidth: 2,
    backgroundColor: Colors.indigoLight,
  },
  themeEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  themeOptionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
  },
  themeOptionTitleActive: {
    color: Colors.indigoDark,
  },
  themeOptionSub: {
    fontSize: 8,
    color: Colors.sub,
    textAlign: "center",
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  accountInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeCustomer: {
    backgroundColor: Colors.emeraldLight,
  },
  roleBadgeGuest: {
    backgroundColor: Colors.amberLight,
  },
  roleBadgeAdmin: {
    backgroundColor: Colors.indigoLight,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  roleBadgeTextCustomer: {
    color: Colors.emerald,
  },
  roleBadgeTextGuest: {
    color: Colors.amber,
  },
  roleBadgeTextAdmin: {
    color: Colors.indigo,
  },
  memberSinceText: {
    fontSize: 10,
    color: Colors.sub,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.ink,
  },
  accountSub: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 2,
  },
  modeSwitchRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: "row",
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  modeBtnPrimary: {
    backgroundColor: Colors.indigo,
  },
  modeBtnSecondary: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnAuth: {
    backgroundColor: Colors.indigoLight,
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  modeBtnTextPrimary: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modeBtnTextSecondary: {
    color: Colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  modeBtnTextAuth: {
    color: Colors.indigoDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  demoGrid: {
    gap: 8,
    marginBottom: 12,
  },
  demoPillCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoPillHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  demoPillRole: {
    fontSize: 12,
    fontWeight: "800",
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  demoPillUser: {
    fontSize: 11,
    marginTop: 1,
  },
  demoPillPass: {
    fontSize: 10,
    marginTop: 1,
  },
  openLoginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  openLoginBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  cardSub: {
    fontSize: 11,
    marginBottom: 12,
    marginTop: -6,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: Colors.indigoDark,
  },
  adminLoginBtn: {
    backgroundColor: Colors.indigo,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  adminLoginText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  adminOn: {
    gap: 10,
  },
  adminOnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.emerald,
    lineHeight: 18,
  },
  broadcastBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  broadcastBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  adminLogoutBtn: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  adminLogoutText: {
    color: Colors.crimson,
    fontSize: 11,
    fontWeight: "800",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 6,
  },
  fieldSub: {
    fontSize: 12,
    color: Colors.sub,
    lineHeight: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.ink,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  deliveryOptionsList: {
    gap: 8,
  },
  deliveryTier: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  deliveryTierActive: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoLight,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.indigo,
  },
  tierInfo: {
    flex: 1,
  },
  tierTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  tierNameActive: {
    color: Colors.indigoDark,
  },
  tierSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tierBadgeFree: {
    backgroundColor: Colors.emerald,
  },
  tierBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  tierFee: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  tierFeeActive: {
    color: Colors.indigoDark,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    alignItems: "center",
  },
  sizeChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  sizeChipTextActive: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleText: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  saveBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportBtnText: {
    color: Colors.indigo,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  storeLocation: {
    marginBottom: 10,
  },
  storeName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 2,
  },
  storeAddr: {
    fontSize: 11,
    color: Colors.sub,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.indigoLight,
    padding: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  supportText: {
    fontSize: 11,
    color: Colors.indigoDark,
  },
  bold: {
    fontWeight: "800",
  },
});
