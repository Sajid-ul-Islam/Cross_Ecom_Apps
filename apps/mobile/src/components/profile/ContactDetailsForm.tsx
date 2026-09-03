import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { User, MapPin, Plus, Trash2, CheckCircle2 } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { BD_DISTRICTS } from "../../data/districts";
import { fetchDistricts, type BdDistrict } from "../../services/gateway";

interface ContactDetailsFormProps {
  /** Form field values — parent owns the canonical state */
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: BdDistrict;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (d: BdDistrict) => void;
  /** Called when a new address is saved */
  onAddAddress: (data: { label: string; address: string; city: string; district: string; area: any }) => void;
  /** Called to remove a saved address */
  onRemoveAddress: (id: string) => void;
}

export const ContactDetailsForm: React.FC<ContactDetailsFormProps> = ({
  name,
  phone,
  email,
  address,
  city,
  district,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onAddressChange,
  onCityChange,
  onDistrictChange,
  onAddAddress,
  onRemoveAddress,
}) => {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);
  // Fetch districts from API on mount (single source of truth)
  React.useEffect(() => {
    fetchDistricts().then((data) => {
      if (data.length > 0) setDistricts(data);
    });
  }, []);

  // District picker modal
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");

  // New address modal
  const [newAddrModalOpen, setNewAddrModalOpen] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrStreet, setNewAddrStreet] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Dhaka");
  const [newAddrDistrict, setNewAddrDistrict] = useState<BdDistrict>(
    districts.find((d) => d.code === "BD-13") || districts[0]
  );

  const handleSaveNewAddress = () => {
    if (!newAddrStreet.trim()) return;
    onAddAddress({
      label: newAddrLabel.trim() || "Address",
      address: newAddrStreet.trim(),
      city: newAddrCity.trim() || newAddrDistrict.name,
      district: newAddrDistrict.code,
      area: newAddrDistrict.code === "BD-13" ? "dhaka_standard" : "outside_standard",
    });
    setNewAddrStreet("");
    setNewAddrModalOpen(false);
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <User size={17} color={colors.indigo} />
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            {profile.isGuest ? "GUEST CHECKOUT DETAILS" : "CONTACT & DEFAULT ADDRESS"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
            value={name}
            onChangeText={onNameChange}
            placeholder="e.g. Tanvir Ahmed"
            placeholderTextColor={colors.faint}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Bangladeshi Mobile Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
            value={phone}
            onChangeText={onPhoneChange}
            keyboardType="phone-pad"
            placeholder="017XX-XXXXXX"
            placeholderTextColor={colors.faint}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Email Address (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            placeholder="e.g. name@example.com"
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* District / State Selector */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>District / State (All 64 BD Districts) *</Text>
          <TouchableOpacity
            style={[
              styles.districtSelectInput,
              {
                backgroundColor: colors.paper,
                borderColor: colors.indigo,
              },
            ]}
            onPress={() => setDistrictModalOpen(true)}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.ink }}>
              📍 {district?.name || "Dhaka"} ({district?.code || "BD-13"})
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>
              CHANGE ▼
            </Text>
          </TouchableOpacity>
        </View>

        {/* City / Thana Field */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>City / Thana / Area *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
            value={city}
            onChangeText={onCityChange}
            placeholder="e.g. Mirpur, Banani, Agrabad"
            placeholderTextColor={colors.faint}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Default Street Address *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
            value={address}
            onChangeText={onAddressChange}
            multiline
            numberOfLines={3}
            placeholder="House #, Road #, Sector / Area details..."
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Saved Addresses Book */}
        <View style={styles.savedAddressesSection}>
          <View style={styles.savedAddressesHeader}>
            <Text style={[styles.label, { color: colors.ink, marginBottom: 0 }]}>Saved Address Book</Text>
            <TouchableOpacity
              style={[styles.addAddrChip, { backgroundColor: colors.indigoLight }]}
              onPress={() => setNewAddrModalOpen(true)}
            >
              <Plus size={12} color={colors.indigo} />
              <Text style={[styles.addAddrChipText, { color: colors.indigo }]}>ADD NEW</Text>
            </TouchableOpacity>
          </View>

          {profile.savedAddresses && profile.savedAddresses.length > 0 ? (
            <View style={styles.savedAddressesList}>
              {profile.savedAddresses.map((sa) => (
                <View
                  key={sa.id}
                  style={[styles.savedAddressItem, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <MapPin size={13} color={colors.indigo} />
                      <Text style={[styles.savedAddressLabel, { color: colors.ink }]}>{sa.label}</Text>
                      {sa.district && (
                        <Text style={[styles.savedAddressDistrict, { color: colors.sub }]}>
                          ({sa.district})
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.savedAddressDetails, { color: colors.sub }]} numberOfLines={2}>
                      {sa.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveAddress(sa.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color={colors.crimson} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noSavedAddrText, { color: colors.sub }]}>
              No secondary addresses saved. Tap "ADD NEW" to save your Office or Studio address.
            </Text>
          )}
        </View>
      </View>

      {/* District Selector Modal */}
      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.paper }]}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={[styles.modalSheetTitle, { color: colors.ink }]}>
                  SELECT DISTRICT (64 DISTRICTS)
                </Text>
                <Text style={[styles.modalSheetSub, { color: colors.sub }]}>
                  Official WooCommerce state codes for Bangladesh
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDistrictModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseText, { color: colors.ink }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.districtSearchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.ink }]}
              placeholder="Search district name (e.g. Dhaka, Bogura)..."
              placeholderTextColor={colors.faint}
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {(districts || []).filter((d) =>
                (d.name || "").toLowerCase().includes(districtSearch.toLowerCase()) ||
                (d.code || "").toLowerCase().includes(districtSearch.toLowerCase())
              ).map((d) => {
                const isSelected = district?.code === d.code;
                return (
                  <TouchableOpacity
                    key={d.code}
                    style={[
                      styles.districtItem,
                      { borderBottomColor: colors.borderLight },
                      isSelected && { backgroundColor: colors.indigoLight },
                    ]}
                    onPress={() => {
                      onDistrictChange(d);
                      setDistrictModalOpen(false);
                      setDistrictSearch("");
                    }}
                  >
                    <View>
                      <Text style={[styles.districtName, { color: isSelected ? colors.indigo : colors.ink }]}>
                        {d.name}
                      </Text>
                      <Text style={[styles.districtCode, { color: colors.sub }]}>
                        State Code: {d.code}
                      </Text>
                    </View>
                    {isSelected ? <CheckCircle2 size={18} color={colors.indigo} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={newAddrModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNewAddrModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.paper }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: colors.ink }]}>ADD NEW DELIVERY ADDRESS</Text>
              <TouchableOpacity onPress={() => setNewAddrModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseText, { color: colors.ink }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Address Label</Text>
              <View style={styles.chipsRow}>
                {["Home", "Office", "Studio", "Other"].map((lbl) => (
                  <TouchableOpacity
                    key={lbl}
                    style={[
                      styles.sizeChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      newAddrLabel === lbl && { backgroundColor: colors.indigo, borderColor: colors.indigo },
                    ]}
                    onPress={() => setNewAddrLabel(lbl)}
                  >
                    <Text style={[styles.sizeChipText, { color: newAddrLabel === lbl ? "#FFFFFF" : colors.ink }]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>City / Thana</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.ink }]}
                value={newAddrCity}
                onChangeText={setNewAddrCity}
                placeholder="e.g. Dhanmondi, Agrabad"
                placeholderTextColor={colors.faint}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Full Street Address *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.ink }]}
                value={newAddrStreet}
                onChangeText={setNewAddrStreet}
                multiline
                numberOfLines={3}
                placeholder="House, Road, Block details..."
                placeholderTextColor={colors.faint}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.indigo, marginTop: 10 }]}
              onPress={handleSaveNewAddress}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>SAVE TO ADDRESS BOOK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    field: s.field,
    label: s.label,
    input: s.input,
    multilineInput: s.multilineInput,
    districtSelectInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1.5,
    },
    savedAddressesSection: {
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.05)",
    },
    savedAddressesHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    addAddrChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    addAddrChipText: {
      fontSize: 10,
      fontWeight: "900",
    },
    savedAddressesList: {
      gap: 6,
    },
    savedAddressItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    savedAddressLabel: {
      fontSize: 12,
      fontWeight: "800",
    },
    savedAddressDistrict: {
      fontSize: 10,
    },
    savedAddressDetails: {
      fontSize: 11,
      marginTop: 2,
    },
    noSavedAddrText: {
      fontSize: 11,
      fontStyle: "italic",
    },
    chipsRow: s.chipsRow,
    sizeChip: s.sizeChip,
    sizeChipText: s.sizeChipText,
    saveBtn: s.saveBtn,
    saveBtnText: s.saveBtnText,
    // Modals
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      padding: 20,
      paddingBottom: 36,
    },
    modalSheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    modalSheetTitle: {
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    modalSheetSub: {
      fontSize: 11,
      marginTop: 2,
    },
    modalCloseBtn: {
      padding: 6,
    },
    modalCloseText: {
      fontSize: 18,
      fontWeight: "800",
    },
    districtSearchInput: {
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      marginBottom: 10,
    },
    districtItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderRadius: 6,
    },
    districtName: {
      fontSize: 13,
      fontWeight: "800",
    },
    districtCode: {
      fontSize: 10,
      marginTop: 1,
    },
  });
}
