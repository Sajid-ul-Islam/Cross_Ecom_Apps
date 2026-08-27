import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Truck } from "../Icons";
import { ThemeColors } from "../../theme/colors";
import { sharedStyles } from "../../theme/sharedStyles";
import { useTheme } from "../../context/ThemeContext";
import { DeliveryOptionKey } from "../../types";
import { DELIVERY_OPTIONS, bdt } from "../../services/gateway";

interface DeliveryOptionsProps {
  selectedArea: DeliveryOptionKey;
  onSelectArea: (area: DeliveryOptionKey) => void;
}

export const DeliveryOptions: React.FC<DeliveryOptionsProps> = ({ selectedArea, onSelectArea }) => {
  const { colors } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Truck size={17} color={colors.indigo} />
        <Text style={[styles.cardTitle, { color: colors.ink }]}>PREFERRED DELIVERY SPEED & ZONE</Text>
      </View>

      <View style={styles.deliveryOptionsList}>
        {(Object.keys(DELIVERY_OPTIONS) as DeliveryOptionKey[]).map((key) => {
          const opt = DELIVERY_OPTIONS[key];
          const isSelected = selectedArea === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.deliveryTier,
                { backgroundColor: colors.paper, borderColor: colors.border },
                isSelected && { borderColor: colors.indigo, backgroundColor: colors.indigoLight },
              ]}
              activeOpacity={0.85}
              onPress={() => onSelectArea(key)}
            >
              <View style={[styles.radioOuter, { borderColor: colors.indigo }]}>
                {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.indigo }]} />}
              </View>
              <View style={styles.tierInfo}>
                <View style={styles.tierTop}>
                  <Text style={[styles.tierName, { color: isSelected ? colors.indigoDark : colors.ink }]}>
                    {opt.name}
                  </Text>
                  {opt.badge ? (
                    <View style={[styles.tierBadge, opt.badge === "FREE" ? { backgroundColor: colors.emerald } : { backgroundColor: colors.indigo }]}>
                      <Text style={styles.tierBadgeText}>{opt.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.tierSub, { color: isSelected ? colors.indigoDark : colors.sub }]}>{opt.sub}</Text>
              </View>
              <Text style={[styles.tierFee, { color: isSelected ? colors.indigoDark : colors.ink }]}>
                {opt.fee === 0 ? "FREE" : bdt(opt.fee)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    card: s.card,
    cardHeader: s.cardHeader,
    cardTitle: s.cardTitle,
    deliveryOptionsList: {
      gap: 8,
    },
    deliveryTier: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      gap: 10,
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
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
      fontWeight: "800",
    },
    tierSub: {
      fontSize: 10,
      marginTop: 2,
    },
    tierBadge: {
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 3,
    },
    tierBadgeText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
    },
    tierFee: {
      fontSize: 13,
      fontWeight: "900",
    },
  });
}
