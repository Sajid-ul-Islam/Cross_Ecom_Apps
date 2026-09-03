import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { User, MapPin, Plus, Trash2, CheckCircle2, Edit } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { BD_DISTRICTS } from "../../data/districts";
import { fetchDistricts, type BdDistrict } from "../../services/gateway";

interface ContactDetailsFormProps {
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
  onSaveProfile?: () => Promise<void> | void;
  onAddAddress: (data: { label: string; address: string; city: string; district: string; area: any }) => void;
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
  onSaveProfile,
  onAddAddress,
  onRemoveAddress,
}) => {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  // Mode toggles: default to clean display view
  const [editingContact, setEditingContact] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const [districts, setDistricts] = useState<BdDistrict[]>(BD_DISTRICTS);
  React.useEffect(() => {
    fetchDistricts().then((data) => {
      if (Array.isArray(data) && data.length > 0) setDistricts(data);
    }).catch(() => {});
  }, []);

  // District picker modal
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");

  // Add Address Modal state
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrAddress, setNewAddrAddress] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Dhaka");
  const [newAddrDistrict, setNewAddrDistrict] = useState<BdDistrict>(
    districts.find((d) => d.code === "BD-13") || districts[0]
  );

  const handleSaveContact = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone && (cleanPhone.length !== 11 || !cleanPhone.startsWith("01"))) {
      Alert.alert("Invalid Phone", "Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    if (onSaveProfile) await onSaveProfile();
    setEditingContact(false);
  };

  const handleSaveAddress = async () => {
    if (onSaveProfile) await onSaveProfile();
    setEditingAddress(false);
  };

  const handleAddNewAddress = () => {
    if (!newAddrAddress.trim()) {
      Alert.alert("Address Required", "Please enter a delivery address.");
      return;
    }
    onAddAddress({
      label: newAddrLabel,
      address: newAddrAddress.trim(),
      city: newAddrCity.trim(),
      district: newAddrDistrict.code,
      area: newAddrDistrict.code === "BD-13" ? "dhaka_standard" : "outside_dhaka",
    });
    setNewAddrAddress("");
    setAddAddressModalOpen(false);
  };

  return (
    <>
      {/* 1. Personal Information Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderBetween}>
          <View style={styles.headerLeftRow}>
            <User size={17} color={colors.indigo} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>PERSONAL INFORMATION</Text>
          </View>
          <TouchableOpacity
            style={[styles.editChip, { backgroundColor: colors.paper, borderColor: colors.border }]}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={editingContact ? "Finish editing personal information" : "Edit personal information"}
            onPress={() => {
              if (editingContact) {
                handleSaveContact();
              } else {
                setEditingContact(true);
              }
            }}
          >
            <Edit size={12} color={colors.indigo} />
            <Text style={[styles.editChipText, { color: colors.indigo }]}>
              {editingContact ? "DONE" : "EDIT"}
            </Text>
          </TouchableOpacity>
        </View>

        {!editingContact ? (
          /* Clean Summary Display */
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Full Name</Text>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {name || "Add your full name"}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Mobile Phone</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.summaryValue, { color: colors.ink }]}>
                  {phone ? `+880 ${phone}` : "Add mobile number"}
                </Text>
                {Boolean(phone && phone.length === 11) && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.emeraldLight }]}>
                    <Text style={[styles.verifiedText, { color: colors.emerald }]}>BD</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Email Address</Text>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {email || "Add email for parcel receipts"}
              </Text>
            </View>
          </View>
        ) : (
          /* Editable Form */
          <View style={{ marginTop: 8 }}>
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
                keyboardType="phone-pad"
                value={phone}
                onChangeText={onPhoneChange}
                placeholder="01XXXXXXXXX"
                placeholderTextColor={colors.faint}
                maxLength={11}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={onEmailChange}
                placeholder="tanvir@example.com"
                placeholderTextColor={colors.faint}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveSectionBtn, { backgroundColor: colors.indigo }]}
              activeOpacity={0.88}
              onPress={handleSaveContact}
            >
              <Text style={styles.saveSectionBtnText}>✓ SAVE CONTACT DETAILS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Default Delivery Address Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderBetween}>
          <View style={styles.headerLeftRow}>
            <MapPin size={17} color={colors.indigo} />
            <Text style={[styles.cardTitle, { color: colors.ink }]}>DELIVERY ADDRESS & DISTRICT</Text>
          </View>
          <TouchableOpacity
            style={[styles.editChip, { backgroundColor: colors.paper, borderColor: colors.border }]}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={editingAddress ? "Finish editing delivery address" : "Edit delivery address"}
            onPress={() => {
              if (editingAddress) {
                handleSaveAddress();
              } else {
                setEditingAddress(true);
              }
            }}
          >
            <Edit size={12} color={colors.indigo} />
            <Text style={[styles.editChipText, { color: colors.indigo }]}>
              {editingAddress ? "DONE" : "EDIT"}
            </Text>
          </TouchableOpacity>
        </View>

        {!editingAddress ? (
          /* Clean Summary Display */
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Primary District</Text>
              <Text style={[styles.summaryValue, { color: colors.indigo, fontWeight: "800" }]}>
                📍 {district?.name || "Dhaka"} ({district?.code || "BD-13"})
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>City / Thana</Text>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {city || "Dhaka"}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.sub }]}>Street Address</Text>
              <Text style={[styles.summaryValue, { color: colors.ink, flex: 1, textAlign: "right" }]} numberOfLines={2}>
                {address || "No street address saved yet"}
              </Text>
            </View>

            {/* Saved Address Chips */}
            {profile.savedAddresses && profile.savedAddresses.length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={{ paddingTop: 6 }}>
                  <Text style={[styles.summaryLabel, { color: colors.sub, marginBottom: 8 }]}>Saved Locations</Text>
                  <View style={styles.savedChipRow}>
                    {profile.savedAddresses.map((sa) => (
                      <View key={sa.id} style={[styles.addrTag, { backgroundColor: colors.paper, borderColor: colors.border }]}>
                        <Text style={[styles.addrTagText, { color: colors.ink }]}>🏷️ {sa.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        ) : (
          /* Editable Form */
          <View style={{ marginTop: 8 }}>
            {/* District Selector */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>District (All 64 BD Districts) *</Text>
              <TouchableOpacity
                style={[styles.districtSelectInput, { backgroundColor: colors.paper, borderColor: colors.indigo }]}
                onPress={() => setDistrictModalOpen(true)}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.ink }}>
                  📍 {district?.name || "Dhaka"} ({district?.code || "BD-13"})
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "800", color: colors.indigo }}>CHANGE ▼</Text>
              </TouchableOpacity>
            </View>

            {/* City / Thana */}
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

            {/* Street Address */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Street Delivery Address *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={onAddressChange}
                placeholder="House #, Road #, Sector / Area details..."
                placeholderTextColor={colors.faint}
              />
            </View>

            {/* Saved Address Book Management */}
            {profile.savedAddresses && profile.savedAddresses.length > 0 && (
              <View style={{ marginTop: 6, marginBottom: 12 }}>
                <Text style={[styles.label, { color: colors.ink, marginBottom: 8 }]}>Saved Addresses</Text>
                {profile.savedAddresses.map((sa) => (
                  <View key={sa.id} style={[styles.savedAddrRow, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.savedAddrLabel, { color: colors.indigo }]}>🏷️ {sa.label}</Text>
                      <Text style={[styles.savedAddrText, { color: colors.ink }]} numberOfLines={1}>{sa.address}, {sa.city}</Text>
                    </View>
                    <TouchableOpacity onPress={() => onRemoveAddress(sa.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={15} color={colors.crimson} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.saveSectionBtn, { flex: 1, backgroundColor: colors.indigo }]}
                activeOpacity={0.88}
                onPress={handleSaveAddress}
              >
                <Text style={styles.saveSectionBtnText}>✓ SAVE ADDRESS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addNewAddrBtn, { backgroundColor: colors.paper, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setAddAddressModalOpen(true)}
              >
                <Plus size={14} color={colors.indigo} />
                <Text style={[styles.addNewAddrBtnText, { color: colors.indigo }]}>+ NEW</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 64 District Modal */}
      <Modal visible={districtModalOpen} animationType="slide" transparent onRequestClose={() => setDistrictModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.ink }]}>Select Bangladesh District</Text>
              <TouchableOpacity onPress={() => setDistrictModalOpen(false)}>
                <Text style={[styles.closeBtn, { color: colors.sub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
              placeholder="Search district name or code (e.g. Dhaka, BD-13)..."
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
                    style={[styles.districtItem, { borderBottomColor: colors.borderLight }, isSelected && { backgroundColor: colors.indigoLight }]}
                    onPress={() => {
                      onDistrictChange(d);
                      setDistrictModalOpen(false);
                      setDistrictSearch("");
                    }}
                  >
                    <View>
                      <Text style={[styles.districtName, { color: isSelected ? colors.indigo : colors.ink }]}>{d.name}</Text>
                      <Text style={[styles.districtCode, { color: colors.sub }]}>State Code: {d.code}</Text>
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
      <Modal visible={addAddressModalOpen} animationType="slide" transparent onRequestClose={() => setAddAddressModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.ink }]}>Save New Address</Text>
              <TouchableOpacity onPress={() => setAddAddressModalOpen(false)}>
                <Text style={[styles.closeBtn, { color: colors.sub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Address Label</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Home", "Office", "Studio", "Other"].map((lbl) => (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.labelChip, { backgroundColor: colors.paper, borderColor: colors.border }, newAddrLabel === lbl && { backgroundColor: colors.indigo, borderColor: colors.indigo }]}
                    onPress={() => setNewAddrLabel(lbl)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: newAddrLabel === lbl ? "#FFF" : colors.ink }}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.ink }]}>Street Details *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.paper, borderColor: colors.border, color: colors.ink }]}
                multiline
                numberOfLines={3}
                value={newAddrAddress}
                onChangeText={setNewAddrAddress}
                placeholder="House, Road, Area..."
                placeholderTextColor={colors.faint}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveSectionBtn, { backgroundColor: colors.indigo, marginTop: 12 }]}
              onPress={handleAddNewAddress}
            >
              <Text style={styles.saveSectionBtnText}>SAVE TO ADDRESS BOOK</Text>
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
    field: s.field,
    label: s.label,
    input: s.input,
    textArea: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      minHeight: 70,
      textAlignVertical: "top",
    },
    cardHeaderBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    headerLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: s.cardTitle,
    editChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
    },
    editChipText: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    summaryList: {
      paddingVertical: 2,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: "700",
    },
    summaryDivider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      marginVertical: 2,
    },
    verifiedBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: "900",
    },
    savedChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    addrTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    addrTagText: {
      fontSize: 11,
      fontWeight: "700",
    },
    saveSectionBtn: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    saveSectionBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    addNewAddrBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 6,
    },
    addNewAddrBtnText: {
      fontSize: 12,
      fontWeight: "800",
    },
    districtSelectInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    savedAddrRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 6,
    },
    savedAddrLabel: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 2,
    },
    savedAddrText: {
      fontSize: 12,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      padding: 20,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "900",
    },
    closeBtn: {
      fontSize: 20,
      fontWeight: "900",
      padding: 4,
    },
    searchInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      marginBottom: 12,
    },
    districtItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    districtName: {
      fontSize: 14,
      fontWeight: "700",
    },
    districtCode: {
      fontSize: 11,
      marginTop: 2,
    },
    labelChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
    },
  });
}
