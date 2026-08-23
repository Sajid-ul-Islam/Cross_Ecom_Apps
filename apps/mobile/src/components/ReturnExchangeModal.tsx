import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  RotateCcw,
  CheckCircle2,
  Camera,
  ImageIcon,
  Truck,
  Store,
  FileText,
  Tag,
  ShieldCheck,
  AlertCircle,
} from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { Order, ReturnType, ReturnReason, ReturnExchangeItem } from "../types";
import { useReturns } from "../context/ReturnContext";

const { width, height } = Dimensions.get("window");

const REASONS: { key: ReturnReason; label: string; sub: string }[] = [
  { key: "SIZE_FIT_TOO_TIGHT", label: "Too Tight / Small", sub: "Garment waist or chest is tighter than expected" },
  { key: "SIZE_FIT_TOO_LOOSE", label: "Too Loose / Big", sub: "Garment is larger or looser than desired" },
  { key: "FABRIC_DEFECT", label: "Fabric / Weave Defect", sub: "Flaw, uneven dye, or pull in the cloth" },
  { key: "STITCHING_ISSUE", label: "Stitching / Button Issue", sub: "Loose thread, missing rivet or button" },
  { key: "WRONG_ITEM_SENT", label: "Wrong Item Received", sub: "Different item or size inside the package" },
  { key: "TRANSIT_DAMAGE", label: "Courier Transit Damage", sub: "Parcel was crushed or torn upon delivery" },
  { key: "CHANGED_MIND", label: "Changed Mind", sub: "Want to try a different style or collection" },
];

const SAMPLE_PHOTO_PRESETS = [
  {
    label: "📸 Garment Front",
    uri: "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
  },
  {
    label: "🔍 Seam / Stitch Detail",
    uri: "https://image.qwenlm.ai/generated-images/17924dca-20ea-46df-bf74-0f2c41872df8/_result.png",
  },
  {
    label: "🏷️ Size Label & Tag",
    uri: "https://image.qwenlm.ai/generated-images/d73b64c1-f3b3-4f96-857c-880c1074e0d4/_result.png",
  },
];

const REPLACEMENT_SIZES = ["28", "30", "32", "34", "36", "38", "S", "M", "L", "XL", "XXL"];

interface ReturnExchangeModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess?: (ticketId: string) => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess,
}) => {
  const { createReturnRequest } = useReturns();
  const { colors, isDark } = useTheme();

  const [type, setType] = useState<ReturnType>("EXCHANGE");
  const [selectedReason, setSelectedReason] = useState<ReturnReason>("SIZE_FIT_TOO_TIGHT");
  const [desiredSize, setDesiredSize] = useState<string>("32");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [images, setImages] = useState<string[]>([
    "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
  ]);
  const [pickupMethod, setPickupMethod] = useState<"courier_pickup" | "studio_dropoff">("courier_pickup");
  const [pickupAddress, setPickupAddress] = useState<string>(order?.address || "");
  const [contactPhone, setContactPhone] = useState<string>(order?.phone || "");
  const [refundMethod, setRefundMethod] = useState<"bkash" | "nagad" | "bank" | "store_credit">("bkash");
  const [refundAccount, setRefundAccount] = useState<string>(order?.phone || "");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!order) return null;

  const targetLine = order.lines[0]; // Primary item
  const selectedReasonObj = REASONS.find((r) => r.key === selectedReason);

  const handleAddSamplePhoto = (uri: string) => {
    if (images.includes(uri)) return;
    setImages([...images, uri]);
  };

  const handleRemovePhoto = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    setImages(next);
  };

  const handleSubmit = async () => {
    if (!pickupAddress.trim()) {
      Alert.alert("Address Required", "Please enter the pickup address for courier collection.");
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert("Phone Required", "Please enter a contact number for pickup coordination.");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Photo Required", "Please attach at least 1 photo of the product/defect for inspection.");
      return;
    }

    setSubmitting(true);
    try {
      const returnItems: ReturnExchangeItem[] = order.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        sku: l.sku,
        currentSize: l.size,
        desiredSize: type === "EXCHANGE" ? desiredSize : undefined,
        qty: l.qty,
        unit: l.unit,
      }));

      const ticket = await createReturnRequest({
        orderId: order.id,
        orderNumber: order.number,
        type,
        reason: selectedReason,
        reasonText: selectedReasonObj?.label || "Exchange / Return Request",
        customerNotes: customerNotes.trim(),
        images,
        items: returnItems,
        pickupMethod,
        pickupAddress: pickupAddress.trim(),
        contactPhone: contactPhone.trim(),
        customerName: order.name,
        refundMethod: type === "RETURN" ? refundMethod : undefined,
        refundAccount: type === "RETURN" ? refundAccount.trim() : undefined,
      });

      Alert.alert(
        "Request Submitted! 🎉",
        `Your ${type === "EXCHANGE" ? "Exchange" : "Return"} ticket #${ticket.ticketNumber} is confirmed.\n\nOur courier will collect the item from your address within 24-48 hours.`,
        [
          {
            text: "View Status in Orders",
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess(ticket.ticketNumber);
            },
          },
        ]
      );
    } catch {
      Alert.alert("Submission Failed", "Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigo }]}>
                <RotateCcw size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>EXCHANGE &amp; RETURN PORTAL</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Order #{order.number} · 7-Day Hassle Free</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Policy Banner */}
            <View style={styles.policyBanner}>
              <ShieldCheck size={16} color={colors.emerald} />
              <Text style={styles.policyText}>
                <Text style={styles.bold}>100% Guaranteed:</Text> Free courier pickup in Dhaka &amp; Nationwide. Item must be unwashed with original tags attached.
              </Text>
            </View>

            {/* 1. Request Type Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>1. SELECT REQUEST TYPE</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === "EXCHANGE" && styles.typeBtnActive]}
                  onPress={() => setType("EXCHANGE")}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={16} color={type === "EXCHANGE" ? "#FFFFFF" : colors.ink} />
                  <View>
                    <Text style={[styles.typeTitle, type === "EXCHANGE" && styles.typeTitleActive]}>
                      EXCHANGE SIZE / FIT
                    </Text>
                    <Text style={[styles.typeSub, type === "EXCHANGE" && styles.typeSubActive]}>
                      Swap for another size (Free Delivery)
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, type === "RETURN" && styles.typeBtnActive]}
                  onPress={() => setType("RETURN")}
                  activeOpacity={0.8}
                >
                  <AlertCircle size={16} color={type === "RETURN" ? "#FFFFFF" : colors.ink} />
                  <View>
                    <Text style={[styles.typeTitle, type === "RETURN" && styles.typeTitleActive]}>
                      RETURN &amp; REFUND
                    </Text>
                    <Text style={[styles.typeSub, type === "RETURN" && styles.typeSubActive]}>
                      Full refund to bKash / Bank / Credit
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Order Item & Size Selection */}
            {targetLine && (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>PRODUCT FOR {type}:</Text>
                  <Text style={styles.itemName}>{targetLine.name}</Text>
                  <Text style={styles.itemSku}>
                    SKU: {targetLine.sku} · Ordered Size: <Text style={styles.bold}>{targetLine.size}</Text>
                  </Text>
                </View>

                {type === "EXCHANGE" && (
                  <View style={styles.sizeSection}>
                    <Text style={styles.fieldLabel}>DESIRED REPLACEMENT SIZE *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizesScroll}>
                      {REPLACEMENT_SIZES.map((sz) => {
                        const active = desiredSize === sz;
                        const isSame = sz === targetLine.size;
                        return (
                          <TouchableOpacity
                            key={sz}
                            style={[
                              styles.sizeChip,
                              active && styles.sizeChipActive,
                              isSame && styles.sizeChipSame,
                            ]}
                            onPress={() => setDesiredSize(sz)}
                          >
                            <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                              {sz}
                            </Text>
                            {isSame && <Text style={styles.sameTag}>CURRENT</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* 3. Reason Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>2. REASON FOR {type} *</Text>
              <View style={styles.reasonsList}>
                {REASONS.map((r) => {
                  const active = selectedReason === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.reasonCard, active && styles.reasonCardActive]}
                      onPress={() => setSelectedReason(r.key)}
                    >
                      <View style={styles.radioOuter}>
                        {active && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>
                          {r.label}
                        </Text>
                        <Text style={styles.reasonSub}>{r.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Customer Notes / Comments */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>3. EXPLAIN THE ISSUE / NOTES</Text>
              <TextInput
                style={styles.notesInput}
                value={customerNotes}
                onChangeText={setCustomerNotes}
                multiline
                numberOfLines={3}
                placeholder="Describe any fit issues, defect location, or special instructions for our inspection team..."
                placeholderTextColor={colors.faint}
              />
            </View>

            {/* 5. Product Image Upload & Evidence */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>4. ATTACH PRODUCT PHOTOS *</Text>
                <Text style={styles.photoCount}>{images.length} Attached</Text>
              </View>
              <Text style={styles.hintText}>
                Please attach clear photos of the garment, tags, and any defect areas.
              </Text>

              {/* Uploaded Photos Strip */}
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.photoThumbWrapper}>
                      <Image source={{ uri: img }} style={styles.photoThumb} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => handleRemovePhoto(idx)}
                      >
                        <X size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Sample Photo Presets (Quick Attach) */}
              <Text style={styles.sampleHeader}>Tap to attach verification photo:</Text>
              <View style={styles.samplePresetRow}>
                {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => handleAddSamplePhoto(preset.uri)}
                  >
                    <Camera size={13} color={colors.indigo} />
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 6. Handover & Pickup Details */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>5. HANDOVER PREFERENCE</Text>
              <View style={styles.handoverRow}>
                <TouchableOpacity
                  style={[styles.handoverCard, pickupMethod === "courier_pickup" && styles.handoverCardActive]}
                  onPress={() => setPickupMethod("courier_pickup")}
                >
                  <Truck size={16} color={pickupMethod === "courier_pickup" ? colors.indigoDark : colors.sub} />
                  <Text style={[styles.handoverTitle, pickupMethod === "courier_pickup" && styles.handoverTitleActive]}>
                    Courier Pickup (Doorstep)
                  </Text>
                  <Text style={styles.handoverSub}>Steadfast courier collects from your address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.handoverCard, pickupMethod === "studio_dropoff" && styles.handoverCardActive]}
                  onPress={() => setPickupMethod("studio_dropoff")}
                >
                  <Store size={16} color={pickupMethod === "studio_dropoff" ? colors.indigoDark : colors.sub} />
                  <Text style={[styles.handoverTitle, pickupMethod === "studio_dropoff" && styles.handoverTitleActive]}>
                    DEEN Outlet Dropoff (4 Outlets)
                  </Text>
                  <Text style={styles.handoverSub}>Instant on-spot inspection &amp; size swap</Text>
                </TouchableOpacity>
              </View>

              {pickupMethod === "courier_pickup" && (
                <View style={styles.pickupFields}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Pickup Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      placeholder="Full pickup address (house, road, area)"
                      placeholderTextColor={colors.faint}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Contact Mobile for Courier *</Text>
                    <TextInput
                      style={styles.input}
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      placeholder="01XXXXXXXXX"
                      placeholderTextColor={colors.faint}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 7. Refund Details (if RETURN) */}
            {type === "RETURN" && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>6. REFUND METHOD *</Text>
                <View style={styles.refundMethodGrid}>
                  {(["bkash", "nagad", "bank", "store_credit"] as const).map((m) => {
                    const active = refundMethod === m;
                    const labels: Record<string, string> = {
                      bkash: "bKash Wallet",
                      nagad: "Nagad Wallet",
                      bank: "Bank Transfer",
                      store_credit: "DEEN Store Voucher (+5% Bonus)",
                    };
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.refundCard, active && styles.refundCardActive]}
                        onPress={() => setRefundMethod(m)}
                      >
                        <Text style={[styles.refundLabel, active && styles.refundLabelActive]}>
                          {labels[m]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.field, { marginTop: 8 }]}>
                  <Text style={styles.fieldLabel}>
                    {refundMethod === "bank" ? "Bank Account Details (Bank, Branch, A/C No)" : "Mobile Wallet Number (01XXXXXXXXX)"}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={refundAccount}
                    onChangeText={setRefundAccount}
                    placeholder="e.g. 01711223344"
                    placeholderTextColor={colors.faint}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.88}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    SUBMIT {type === "EXCHANGE" ? "EXCHANGE" : "RETURN"} REQUEST
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.92,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 36,
  },
  policyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.emeraldLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.emerald,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.ink,
    lineHeight: 16,
  },
  bold: {
    fontWeight: "800",
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  photoCount: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.indigo,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  typeTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
  },
  typeTitleActive: {
    color: "#FFFFFF",
  },
  typeSub: {
    fontSize: 9,
    color: Colors.sub,
    marginTop: 2,
  },
  typeSubActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  itemInfo: {
    gap: 2,
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  itemSku: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  sizeSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  sizesScroll: {
    gap: 8,
    paddingTop: 6,
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  sizeChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  sizeChipSame: {
    opacity: 0.6,
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
  },
  sizeChipTextActive: {
    color: "#FFFFFF",
  },
  sameTag: {
    fontSize: 7,
    fontWeight: "900",
    color: Colors.sub,
    marginTop: 1,
  },
  reasonsList: {
    gap: 6,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  reasonCardActive: {
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
  reasonLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  reasonLabelActive: {
    color: Colors.indigoDark,
  },
  reasonSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: Colors.ink,
    minHeight: 70,
    textAlignVertical: "top",
  },
  hintText: {
    fontSize: 11,
    color: Colors.sub,
  },
  photoScroll: {
    gap: 10,
    paddingVertical: 6,
  },
  photoThumbWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sampleHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sub,
    marginTop: 4,
  },
  samplePresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.indigoDark,
  },
  handoverRow: {
    gap: 8,
  },
  handoverCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  handoverCardActive: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoLight,
  },
  handoverTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
  },
  handoverTitleActive: {
    color: Colors.indigoDark,
  },
  handoverSub: {
    fontSize: 10,
    color: Colors.sub,
  },
  pickupFields: {
    gap: 10,
    marginTop: 6,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: Colors.ink,
  },
  refundMethodGrid: {
    gap: 6,
  },
  refundCard: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refundCardActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  refundLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  refundLabelActive: {
    color: "#FFFFFF",
  },
  submitBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
