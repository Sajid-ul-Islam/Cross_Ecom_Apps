import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getConnection, onConnectionChange, type ConnectionState } from "../services/gateway";

/**
 * Shows a soft "you're offline — showing saved catalog" banner when the
 * gateway is unreachable. Never a hard error: the app keeps working from
 * cache. Hidden when online.
 */
export const ConnectionBanner: React.FC = () => {
  const { colors } = useTheme();
  const [state, setState] = useState<ConnectionState>(getConnection());

  useEffect(() => {
    setState(getConnection());
    return onConnectionChange(setState);
  }, []);

  if (state === "online") return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.amberLight, borderColor: colors.amber }]}>
      <Text style={[styles.text, { color: colors.amber }]}>
        You're offline — showing your saved catalog. Prices may be a few minutes old.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
