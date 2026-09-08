import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { X } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

const { height } = Dimensions.get("window");

interface ProfileDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const ProfileDrawerModal: React.FC<ProfileDrawerModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
  scrollable = true,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Subtle Drag Handle Indicator */}
          <View style={styles.dragHandle} />

          {/* Drawer Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              {icon && (
                <View style={[styles.iconCircle, { backgroundColor: colors.indigoLight }]}>
                  {icon}
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: colors.sub }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close drawer"
            >
              <X size={18} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    backdropTouch: {
      flex: 1,
    },
    modalCard: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.9,
      paddingTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    dragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13.5,
      fontWeight: "900",
      letterSpacing: 0.4,
    },
    subtitle: {
      fontSize: 11,
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
  });
}
