import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gift, Truck } from "./Icons";
import { Colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { bdt } from "../services/gateway";

export const FreeTeeBanner: React.FC = () => {
  const { freeTeeEligible, freeTeeGap, subtotal } = useCart();
  const progress = Math.min(1, subtotal / 3500);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Gift size={16} color={freeTeeEligible ? Colors.emerald : Colors.indigo} />
        </View>
        <View style={styles.textContainer}>
          {freeTeeEligible ? (
            <Text style={styles.titleSuccess}>🎉 FREE HEAVYWEIGHT TEE UNLOCKED!</Text>
          ) : (
            <Text style={styles.title}>
              Add <Text style={styles.bold}>{bdt(freeTeeGap)}</Text> more for a <Text style={styles.bold}>FREE T-Shirt</Text>
            </Text>
          )}
          <Text style={styles.subtitle}>Orders over ৳3,500 receive a complimentary 240 GSM Tee</Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: freeTeeEligible ? Colors.emerald : Colors.indigo,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const DeliveryNoticeBanner: React.FC = () => {
  return (
    <View style={styles.deliveryContainer}>
      <Truck size={15} color={Colors.indigoDark} />
      <Text style={styles.deliveryText}>
        Dhaka Delivery: <Text style={styles.bold}>৳70</Text> (24-48h) · Outside Dhaka: <Text style={styles.bold}>৳130</Text> (3-5 days)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: Colors.ink,
  },
  titleSuccess: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.emerald,
  },
  bold: {
    fontWeight: "700",
    color: Colors.indigoDark,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.paper,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  deliveryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.indigoLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deliveryText: {
    fontSize: 11,
    color: Colors.indigoDark,
    flex: 1,
  },
});
