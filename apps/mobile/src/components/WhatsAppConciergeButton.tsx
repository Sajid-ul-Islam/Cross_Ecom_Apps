import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Modal,
  Dimensions,
} from "react-native";
import { MessageCircle, PhoneCall, X, Sparkles, CheckCircle2, Store } from "./Icons";
import { Colors } from "../theme/colors";
import { useStore } from "../context/StoreContext";

const { width } = Dimensions.get("window");

interface WhatsAppConciergeProps {
  productName?: string;
  category?: string;
  customText?: string;
}

export const WhatsAppConciergeButton: React.FC<WhatsAppConciergeProps> = ({
  productName,
  category,
  customText,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { info } = useStore();
  const phone = "+88" + info.whatsapp.replace(/[^0-9]/g, "");
  const defaultMsg = productName
    ? `Hi DEEN Stylist! I need fit & sizing consultation for "${productName}" (${category}).`
    : customText || "Hi DEEN Stylist! I need assistance with custom fit and raw denim care.";

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
      defaultMsg
    )}`;
    Linking.openURL(url).catch(() => {
      setModalVisible(true);
    });
  };

  const handleDirectCall = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.conciergeBar}
        activeOpacity={0.88}
        onPress={handleOpenWhatsApp}
      >
        <View style={styles.conciergeIcon}>
          <MessageCircle size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.conciergeTitle}>TALK TO A DEEN STYLIST</Text>
          <Text style={styles.conciergeSub}>Free fit &amp; size consultation on WhatsApp</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </TouchableOpacity>

      {/* Fallback Dialog Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color={Colors.emerald} />
                <Text style={styles.dialogTitle}>DEEN TAILOR CONCIERGE</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={18} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogBody}>
              Our master tailors in Dhaka are available for live fitting and fabric consultations.
            </Text>

            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.actionCallBtn} onPress={handleDirectCall}>
                <PhoneCall size={14} color="#FFFFFF" />
                <Text style={styles.actionCallBtnText}>CALL HOTLINE ({info.hotline})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  conciergeBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16281F",
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  conciergeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  conciergeTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  conciergeSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 9,
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald,
  },
  onlineText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 18,
    gap: 12,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.6,
  },
  dialogBody: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
  },
  dialogActions: {
    gap: 8,
    marginTop: 4,
  },
  actionCallBtn: {
    backgroundColor: Colors.emerald,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionCallBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
