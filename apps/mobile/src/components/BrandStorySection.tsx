import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Award, Store, ShieldCheck, ArrowRight } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { AboutModal } from "./AboutModal";

const { width } = Dimensions.get("window");

export const BrandStorySection: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [aboutVisible, setAboutVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top Tag */}
        <View style={styles.headerRow}>
          <View style={[styles.badgePill, { backgroundColor: colors.indigoLight }]}>
            <Award size={13} color={colors.indigo} />
            <Text style={[styles.badgeText, { color: colors.indigo }]}>HERITAGE & CRAFT</Text>
          </View>
          <Text style={[styles.estText, { color: colors.sub }]}>EST. DHAKA 2020</Text>
        </View>

        {/* Narrative Title */}
        <Text style={[styles.title, { color: colors.ink }]}>
          Slow Craftsmanship. Pure Indigo Selvedge.
        </Text>

        <Text style={[styles.description, { color: colors.sub }]}>
          DEEN was born from a singular obsession: reviving the tactile weight and timeless honesty of shuttle-loom selvedge denim in Bangladesh. We weave with vintage shuttle looms, using deep rope-dyed yarn that fades uniquely with every journey you take.
        </Text>

        {/* Visual Pillars Grid */}
        <View style={styles.pillarsGrid}>
          <View style={[styles.pillarItem, { backgroundColor: colors.cardSecondary }]}>
            <Text style={styles.pillarIcon}>🧵</Text>
            <Text style={[styles.pillarTitle, { color: colors.ink }]}>Red-Line Selvedge</Text>
            <Text style={[styles.pillarDesc, { color: colors.sub }]}>13.5oz vintage shuttle loom</Text>
          </View>

          <View style={[styles.pillarItem, { backgroundColor: colors.cardSecondary }]}>
            <Text style={styles.pillarIcon}>✂️</Text>
            <Text style={[styles.pillarTitle, { color: colors.ink }]}>Dhaka Central Studio</Text>
            <Text style={[styles.pillarDesc, { color: colors.sub }]}>In-house artisan master tailors</Text>
          </View>

          <View style={[styles.pillarItem, { backgroundColor: colors.cardSecondary }]}>
            <Text style={styles.pillarIcon}>🏬</Text>
            <Text style={[styles.pillarTitle, { color: colors.ink }]}>4 Retail Showrooms</Text>
            <Text style={[styles.pillarDesc, { color: colors.sub }]}>Mirpur 12, Wari & Cumilla</Text>
          </View>

          <View style={[styles.pillarItem, { backgroundColor: colors.cardSecondary }]}>
            <Text style={styles.pillarIcon}>🔄</Text>
            <Text style={[styles.pillarTitle, { color: colors.ink }]}>Doorstep Exchange</Text>
            <Text style={[styles.pillarDesc, { color: colors.sub }]}>7-day hassle-free size swaps</Text>
          </View>
        </View>

        {/* CTA to About DEEN */}
        <TouchableOpacity
          style={[styles.storyCta, { backgroundColor: colors.indigo }]}
          activeOpacity={0.88}
          onPress={() => setAboutVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Read full DEEN heritage story and store locations"
        >
          <Text style={styles.storyCtaText}>DISCOVER OUR STORY &amp; SHOWROOMS</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  estText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 8,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  pillarsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  pillarItem: {
    width: (width - 64 - 8) / 2,
    padding: 10,
    borderRadius: 10,
  },
  pillarIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  pillarTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  storyCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  storyCtaText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
