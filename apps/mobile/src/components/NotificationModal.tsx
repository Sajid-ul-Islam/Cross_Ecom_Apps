import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  X,
  Bell,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  Layers,
  Store,
} from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { NotificationItem, NotificationType } from "../types";

const { width, height } = Dimensions.get("window");

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const [activeTab, setActiveTab] = useState<"ALL" | NotificationType>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    return n.type === activeTab;
  });

  const handleAction = async (notif: NotificationItem) => {
    await markAsRead(notif.id);
    onClose();
    if (notif.actionUrl) {
      router.push(notif.actionUrl as any);
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const formatTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getBadgeStyle = (type: NotificationType) => {
    switch (type) {
      case "PROMO":
        return { bg: colors.amberLight, text: colors.amber, label: "PROMOTION" };
      case "ORDER":
        return { bg: colors.emeraldLight, text: colors.emerald, label: "ORDER STATUS" };
      case "RESTOCK":
        return { bg: colors.crimsonLight, text: colors.crimson, label: "RESTOCK ALERT" };
      case "BROADCAST":
        return { bg: colors.indigoLight, text: colors.indigo, label: "STORE NOTICE" };
      default:
        return { bg: colors.cardSecondary, text: colors.sub, label: "SYSTEM" };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.indigoLight }]}>
                <Bell size={18} color={colors.indigo} />
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.title, { color: colors.ink }]}>NOTIFICATIONS</Text>
                  {unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.crimson }]}>
                      <Text style={styles.unreadBadgeText}>{unreadCount} NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Order updates, drops & exclusive promos</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Action Row & Tabs */}
          <View style={styles.toolBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === "ALL" && styles.tabChipActive]}
                onPress={() => setActiveTab("ALL")}
              >
                <Text style={[styles.tabChipText, activeTab === "ALL" && styles.tabChipTextActive]}>
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === "PROMO" && styles.tabChipActive]}
                onPress={() => setActiveTab("PROMO")}
              >
                <Text style={[styles.tabChipText, activeTab === "PROMO" && styles.tabChipTextActive]}>
                  Promos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === "ORDER" && styles.tabChipActive]}
                onPress={() => setActiveTab("ORDER")}
              >
                <Text style={[styles.tabChipText, activeTab === "ORDER" && styles.tabChipTextActive]}>
                  Orders
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === "RESTOCK" && styles.tabChipActive]}
                onPress={() => setActiveTab("RESTOCK")}
              >
                <Text style={[styles.tabChipText, activeTab === "RESTOCK" && styles.tabChipTextActive]}>
                  Restocks
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                <CheckCircle2 size={13} color={colors.indigo} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {copiedCode && (
            <View style={styles.copiedToast}>
              <Text style={styles.copiedToastText}>✓ Copied code "{copiedCode}" to clipboard!</Text>
            </View>
          )}

          {/* Notification Items List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bell size={36} color={colors.faint} />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySub}>You're all caught up with latest drops and updates.</Text>
              </View>
            ) : (
              filtered.map((item) => {
                const badge = getBadgeStyle(item.type);
                return (
                  <View
                    key={item.id}
                    style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                  >
                    {/* Header line of card */}
                    <View style={styles.notifCardHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
                        <TouchableOpacity
                          onPress={() => deleteNotification(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={14} color={colors.sub} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Title and Body */}
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>

                    {/* Optional Promo Code Box */}
                    {item.promoCode && (
                      <View style={styles.promoCodeBox}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Tag size={13} color={colors.indigoDark} />
                          <Text style={styles.promoCodeLabel}>PROMO CODE:</Text>
                          <Text style={styles.promoCodeValue}>{item.promoCode}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopyCode(item.promoCode!)}
                        >
                          <Text style={styles.copyBtnText}>COPY CODE</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Action Button */}
                    {item.actionLabel && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.8}
                        onPress={() => handleAction(item)}
                      >
                        <Text style={styles.actionBtnText}>{item.actionLabel}</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
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
    maxHeight: height * 0.88,
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
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  unreadBadge: {
    backgroundColor: Colors.crimson,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
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
  toolBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabsScroll: {
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sub,
  },
  tabChipTextActive: {
    color: "#FFFFFF",
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.indigo,
  },
  copiedToast: {
    backgroundColor: Colors.emerald,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  copiedToastText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  notifCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifCardUnread: {
    borderColor: Colors.indigo,
    borderLeftWidth: 4,
    borderLeftColor: Colors.indigo,
    backgroundColor: "#FAFBFD",
  },
  notifCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: Colors.sub,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
    marginBottom: 10,
  },
  promoCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.indigo,
    borderStyle: "dashed",
  },
  promoCodeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  promoCodeValue: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
  },
  copyBtn: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  copyBtnText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.indigo,
    paddingVertical: 9,
    borderRadius: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.sub,
    textAlign: "center",
  },
});
