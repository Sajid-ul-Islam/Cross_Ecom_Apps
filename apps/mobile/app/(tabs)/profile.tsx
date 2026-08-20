import React, { useState } from "react";
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
import { User, Phone, MapPin, Ruler, Bell, Save, Store, HelpCircle } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { Colors } from "../../src/theme/colors";
import { useProfile } from "../../src/context/ProfileContext";
import { reportBug } from "../../src/services/gateway";

const JEANS_SIZES = ["28", "30", "32", "34", "36", "38"];
const TOP_SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ProfileScreen() {
  const { profile, updateProfile, loginAsAdmin, logoutAdmin } = useProfile();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [jeansSize, setJeansSize] = useState(profile.jeansSize);
  const [topSize, setTopSize] = useState(profile.topSize);
  const [pushOrders, setPushOrders] = useState(profile.pushOrders);
  const [pushPromos, setPushPromos] = useState(profile.pushPromos);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleReport = async () => {
    try {
      await reportBug({
        severity: "low",
        route: "profile",
        message: "User-initiated problem report (no crash).",
      });
      Alert.alert("Thanks!", "Your report was sent. We'll look into it during development.");
    } catch {
      Alert.alert("Couldn't send", "Please try again later.");
    }
  };

  const handleSave = async () => {
    await updateProfile({
      name,
      phone,
      address,
      jeansSize,
      topSize,
      pushOrders,
      pushPromos,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="MY PROFILE" showSearch={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {savedMessage && (
          <View style={styles.alertSuccess}>
            <Text style={styles.alertSuccessText}>✓ Profile &amp; fit preferences updated</Text>
          </View>
        )}

        {/* Admin access — login reveals the BI / sales dashboard (home) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Store size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>STORE ADMIN ACCESS</Text>
          </View>
          {profile.role === "admin" ? (
            <View style={styles.adminOn}>
              <Text style={styles.adminOnText}>✓ Logged in as admin — sales &amp; BI dashboard visible on Home.</Text>
              <TouchableOpacity style={styles.adminLogoutBtn} onPress={logoutAdmin}>
                <Text style={styles.adminLogoutText}>LOG OUT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.adminLoginBtn} onPress={loginAsAdmin}>
              <Text style={styles.adminLoginText}>LOGIN AS ADMIN</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Report a problem — sends a low-severity bug report to the gateway */}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={handleReport}
        >
          <HelpCircle size={16} color={Colors.indigo} />
          <Text style={styles.reportBtnText}>REPORT A PROBLEM</Text>
        </TouchableOpacity>

        {/* Contact Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>PERSONAL &amp; DELIVERY INFO</Text>
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
            <Text style={styles.label}>Phone Number (BD Mobile)</Text>
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
            <Text style={styles.label}>Default Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholder="House, Road, Sector, City"
              placeholderTextColor={Colors.faint}
            />
          </View>
        </View>

        {/* Saved Fit & Sizing */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ruler size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>SAVED FIT &amp; SIZING PREFERENCES</Text>
          </View>

          <Text style={styles.fieldSub}>
            Pre-selects your size automatically when viewing denim jeans or tops.
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

        {/* Notification Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>NOTIFICATIONS</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Order Status Updates</Text>
              <Text style={styles.toggleSub}>Live notifications when parcels ship</Text>
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
              <Text style={styles.toggleLabel}>Denim Drops &amp; Flash Sales</Text>
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
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.88}
          onPress={handleSave}
        >
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>SAVE PREFERENCES</Text>
        </TouchableOpacity>

        {/* Retail Outlets */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Store size={16} color={Colors.indigo} />
            <Text style={styles.cardTitle}>DEEN RETAIL OUTLETS</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Mirpur 12 Outlet (Flagship)</Text>
            <Text style={styles.storeAddr}>Plot 1, Block C, Section 12, Mirpur, Dhaka-1216</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Wari Outlet</Text>
            <Text style={styles.storeAddr}>Rankin Street, Wari, Old Dhaka</Text>
          </View>

          <View style={styles.storeLocation}>
            <Text style={styles.storeName}>📍 Cumilla Outlet</Text>
            <Text style={styles.storeAddr}>Sattar Tower, Kandirpar, Cumilla</Text>
          </View>

          <View style={styles.supportBox}>
            <HelpCircle size={16} color={Colors.indigo} />
            <Text style={styles.supportText}>
              Support Hotline: <Text style={styles.bold}>+880 9613-827282</Text> (10 AM - 8 PM)
            </Text>
          </View>
        </View>
      </ScrollView>
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
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  alertSuccessText: {
    color: Colors.emerald,
    fontSize: 12,
    fontWeight: "700",
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
    letterSpacing: 1,
  },
  adminOn: {
    gap: 8,
  },
  adminOnText: {
    color: Colors.emerald,
    fontSize: 12,
    fontWeight: "600",
  },
  adminLogoutBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminLogoutText: {
    color: Colors.sub,
    fontSize: 11,
    fontWeight: "700",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  reportBtnText: {
    color: Colors.indigo,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldSub: {
    fontSize: 11,
    color: Colors.sub,
    marginBottom: 6,
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
    minHeight: 64,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 44,
    alignItems: "center",
  },
  sizeChipActive: {
    backgroundColor: Colors.indigoDark,
    borderColor: Colors.indigoDark,
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
    paddingVertical: 4,
  },
  toggleText: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
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
    marginVertical: 10,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.indigo,
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  storeLocation: {
    marginBottom: 8,
  },
  storeName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  storeAddr: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontWeight: "700",
  },
});
