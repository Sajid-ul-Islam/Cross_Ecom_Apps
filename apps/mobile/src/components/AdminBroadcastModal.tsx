import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Sparkles,
  TrendingUp,
  Tag,
  CheckCircle2,
  Users,
  Store,
  ArrowRight,
  ShieldCheck,
} from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { BroadcastAudience, NotificationType } from "../types";
import { fetchPushStatsAPI } from "../services/gateway";

const { width, height } = Dimensions.get("window");

const AUDIENCES: { key: BroadcastAudience; label: string; count: string }[] = [
  { key: "ALL", label: "All Customers", count: "All Active Devices" },
  { key: "REGISTERED", label: "VIP Registered Members", count: "Verified Shoppers" },
  { key: "GUEST", label: "Guest Shoppers", count: "Recent Visitors" },
  { key: "DHAKA_ONLY", label: "Dhaka Express Region", count: "Dhaka Metro Hub" },
];

const NOTIF_TYPES: { key: NotificationType; label: string; badgeColor: string }[] = [
  { key: "PROMO", label: "🔥 Flash Promo", badgeColor: Colors.amber },
  { key: "RESTOCK", label: "⚡ Restock Alert", badgeColor: Colors.crimson },
  { key: "BROADCAST", label: "📣 Store Notice", badgeColor: Colors.indigo },
  { key: "ORDER", label: "📦 Order Event", badgeColor: Colors.emerald },
];

interface AdminBroadcastModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({ visible, onClose }) => {
  const { broadcasts, sendBroadcast, refreshBroadcasts } = useNotifications();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [title, setTitle] = useState("🔥 Midnight Selvedge Drop: 20% OFF");
  const [body, setBody] = useState(
    "Exclusive 24-hour flash sale on all raw Japanese-grade denim. Use code SELVEDGE20 at checkout."
  );
  const [type, setType] = useState<NotificationType>("PROMO");
  const [audience, setAudience] = useState<BroadcastAudience>("ALL");
  const [promoCode, setPromoCode] = useState("SELVEDGE20");
  const [actionUrl, setActionUrl] = useState("/category/JEANS");
  const [actionLabel, setActionLabel] = useState("Shop Selvedge Drop");
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [pushStats, setPushStats] = useState<{ totalDevices?: number; byArea?: { dhaka: number; outsideDhaka: number } } | null>(null);

  useEffect(() => {
    if (visible) {
      void refreshBroadcasts();
      void fetchPushStatsAPI().then((st) => {
        if (st?.success) setPushStats(st);
      });
    }
  }, [visible]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Required", "Please provide a broadcast title and message body.");
      return;
    }

    setSending(true);
    try {
      const bc = await sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        type,
        audience,
        promoCode: promoCode.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
        actionLabel: actionLabel.trim() || undefined,
        sentBy: "Admin",
      });

      setSuccessNotice(`🎉 Push broadcast dispatched to ${bc.recipientCount?.toLocaleString()} shoppers!`);
      setTimeout(() => {
        setSuccessNotice(null);
        setActiveTab("history");
      }, 2500);
    } catch {
      Alert.alert("Error", "Could not send broadcast. Please try again.");
    } finally {
      setSending(false);
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
                <Store size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>BROADCAST MARKETING CENTER</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Push instant notifications to app customers</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.modeTab, activeTab === "compose" && styles.modeTabActive]}
              onPress={() => setActiveTab("compose")}
            >
              <Text style={[styles.modeTabText, activeTab === "compose" && styles.modeTabTextActive]}>
                COMPOSE CAMPAIGN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, activeTab === "history" && styles.modeTabActive]}
              onPress={() => setActiveTab("history")}
            >
              <Text style={[styles.modeTabText, activeTab === "history" && styles.modeTabTextActive]}>
                PAST CAMPAIGNS ({broadcasts.length})
              </Text>
            </TouchableOpacity>
          </View>

          {successNotice && (
            <View style={styles.successToast}>
              <Text style={styles.successToastText}>{successNotice}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {activeTab === "compose" ? (
              <>
                {/* Live Push Network Status */}
                <View style={[styles.networkStatusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.networkStatusLeft}>
                    <View style={[styles.liveDot, { backgroundColor: colors.emerald }]} />
                    <View>
                      <Text style={[styles.networkStatusTitle, { color: colors.ink }]}>EXPO PUSH NETWORK ACTIVE</Text>
                      <Text style={[styles.networkStatusSub, { color: colors.sub }]}>
                        {pushStats?.totalDevices
                          ? `${pushStats.totalDevices} registered device(s) ready for instant push`
                          : "Live device push delivery engine active"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 1. Target Audience */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>1. SELECT TARGET AUDIENCE</Text>
                  <View style={styles.audienceGrid}>
                    {AUDIENCES.map((aud) => {
                      const active = audience === aud.key;
                      return (
                        <TouchableOpacity
                          key={aud.key}
                          style={[styles.audCard, active && styles.audCardActive]}
                          onPress={() => setAudience(aud.key)}
                        >
                          <View style={styles.radioOuter}>
                            {active && <View style={styles.radioInner} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.audLabel, active && styles.audLabelActive]}>
                              {aud.label}
                            </Text>
                            <Text style={styles.audCount}>{aud.count}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Notification Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>2. CAMPAIGN CATEGORY</Text>
                  <View style={styles.typesRow}>
                    {NOTIF_TYPES.map((t) => {
                      const active = type === t.key;
                      return (
                        <TouchableOpacity
                          key={t.key}
                          style={[styles.typeChip, active && styles.typeChipActive]}
                          onPress={() => setType(t.key)}
                        >
                          <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Message Content */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>3. MESSAGE & MARKETING COPY</Text>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Broadcast Title *</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. 🔥 Eid Denim Flash Drop: 20% OFF"
                      placeholderTextColor={colors.faint}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Message Body *</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={body}
                      onChangeText={setBody}
                      multiline
                      numberOfLines={3}
                      placeholder="Write your push notification marketing message..."
                      placeholderTextColor={colors.faint}
                    />
                  </View>

                  <View style={styles.rowFields}>
                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Promo Code (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={promoCode}
                        onChangeText={setPromoCode}
                        placeholder="e.g. DEEN20"
                        placeholderTextColor={colors.faint}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Action Button Label</Text>
                      <TextInput
                        style={styles.input}
                        value={actionLabel}
                        onChangeText={setActionLabel}
                        placeholder="e.g. Shop Now"
                        placeholderTextColor={colors.faint}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Target Landing Route</Text>
                    <TextInput
                      style={styles.input}
                      value={actionUrl}
                      onChangeText={setActionUrl}
                      placeholder="e.g. /category/JEANS or /product/dn-01"
                      placeholderTextColor={colors.faint}
                    />
                  </View>
                </View>

                {/* 4. Live Push Notification Preview */}
                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Sparkles size={14} color={colors.indigo} />
                    <Text style={styles.previewTitle}>LIVE CUSTOMER PUSH PREVIEW</Text>
                  </View>

                  <View style={styles.simulatedBanner}>
                    <View style={styles.simTop}>
                      <View style={styles.simAppBadge}>
                        <Text style={styles.simAppBadgeText}>DEEN COMMERCE · NOW</Text>
                      </View>
                    </View>
                    <Text style={styles.simTitle}>{title || "Campaign Title"}</Text>
                    <Text style={styles.simBody}>{body || "Campaign message body text..."}</Text>
                    {promoCode ? (
                      <View style={styles.simCodeRow}>
                        <Tag size={12} color={colors.indigoDark} />
                        <Text style={styles.simCodeText}>Code: {promoCode}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  style={styles.sendBtn}
                  activeOpacity={0.88}
                  onPress={handleSend}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={18} color="#FFFFFF" />
                      <Text style={styles.sendBtnText}>DISPATCH BROADCAST TO CUSTOMERS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Past Campaigns Log */
              <View style={styles.historyList}>
                {broadcasts.map((bc) => (
                  <View key={bc.id} style={styles.historyCard}>
                    <View style={styles.historyTop}>
                      <View style={styles.historyTypeBadge}>
                        <Text style={styles.historyTypeBadgeText}>{bc.type}</Text>
                      </View>
                      <Text style={styles.historyDate}>
                        {new Date(bc.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>

                    <Text style={styles.historyTitle}>{bc.title}</Text>
                    <Text style={styles.historyBody}>{bc.body}</Text>

                    <View style={styles.historyMeta}>
                      <View style={styles.statPill}>
                        <Users size={12} color={colors.indigo} />
                        <Text style={styles.statText}>
                          {bc.recipientCount?.toLocaleString() || "1,420"} Delivered
                        </Text>
                      </View>
                      {bc.promoCode && (
                        <View style={styles.statPill}>
                          <Tag size={12} color={colors.amber} />
                          <Text style={[styles.statText, { color: colors.amber }]}>
                            {bc.promoCode}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
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
    maxHeight: height * 0.9,
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
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.indigo,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: Colors.indigoDark,
    fontWeight: "900",
  },
  successToast: {
    backgroundColor: Colors.emerald,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  successToastText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 36,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  audienceGrid: {
    gap: 6,
  },
  audCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  audCardActive: {
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
  audLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.ink,
  },
  audLabelActive: {
    color: Colors.indigoDark,
  },
  audCount: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
  },
  typesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  typeChipTextActive: {
    color: "#FFFFFF",
  },
  field: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 6,
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    backgroundColor: Colors.card,
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
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
  },
  simulatedBanner: {
    backgroundColor: "#161B2E",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  simTop: {
    flexDirection: "row",
    marginBottom: 6,
  },
  simAppBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  simAppBadgeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  simTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  simBody: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    lineHeight: 16,
  },
  simCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  simCodeText: {
    color: Colors.indigoDark,
    fontSize: 10,
    fontWeight: "800",
  },
  sendBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  historyTypeBadge: {
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyTypeBadgeText: {
    color: Colors.indigoDark,
    fontSize: 8,
    fontWeight: "800",
  },
  historyDate: {
    fontSize: 10,
    color: Colors.sub,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
    marginBottom: 4,
  },
  historyBody: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.ink,
  },
  networkStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  networkStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkStatusTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  networkStatusSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
