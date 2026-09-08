import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { ArrowRight } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import type { StoryCardData } from "../data/storyCards";

const { width } = Dimensions.get("window");
const RAIL_GAP = 12;

interface HorizontalStoryRailProps {
  cards: StoryCardData[];
  /** Card width as a fraction of the screen (default 0.84). */
  cardWidth?: number;
}

/**
 * Reusable, theme-aware horizontal story rail (snaps card by card).
 * Content is driven entirely by StoryCardData — add future story cards to
 * `src/data/storyCards.ts`, never as new markup here.
 */
export const HorizontalStoryRail: React.FC<HorizontalStoryRailProps> = ({
  cards,
  cardWidth = 0.84,
}) => {
  const { colors } = useTheme();
  const CARD_W = width * cardWidth;

  const toneColor = (card: StoryCardData): string => {
    if (card.tone === "emerald") return colors.emerald;
    if (card.tone === "crimson") return colors.crimson;
    return colors.indigo;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + RAIL_GAP}
      decelerationRate="fast"
      contentContainerStyle={styles.rail}
    >
      {cards.map((card) => {
        const tone = toneColor(card);
        const hasPoints = card.points && card.points.length > 0;
        return (
          <View
            key={card.id}
            style={[
              styles.card,
              { width: CARD_W, backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Card header */}
            <View style={styles.headerRow}>
              {card.badge ? (
                <View style={[styles.badgePill, { backgroundColor: colors.indigoLight }]}>
                  {card.badge.icon ? (
                    <card.badge.icon size={13} color={tone} />
                  ) : null}
                  <Text style={[styles.badgeText, { color: tone }]}>{card.badge.text}</Text>
                </View>
              ) : card.icon ? (
                <View style={[styles.iconCircle, { backgroundColor: colors.cardSecondary }]}>
                  <card.icon size={18} color={tone} />
                </View>
              ) : null}
              {card.rightTag ? (
                <Text style={[styles.rightTag, { color: colors.sub }]}>{card.rightTag}</Text>
              ) : null}
            </View>

            <Text style={[styles.title, { color: colors.ink }]}>{card.title}</Text>
            <Text style={[styles.description, { color: colors.sub }]}>{card.description}</Text>

            {/* Optional 2-column chips (craft details) */}
            {card.chips && card.chips.length > 0 ? (
              <View style={styles.chipsGrid}>
                {card.chips.map((chip) => (
                  <View
                    key={chip.title}
                    style={[styles.chip, { backgroundColor: colors.cardSecondary }]}
                  >
                    <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                    <Text style={[styles.chipTitle, { color: colors.ink }]}>{chip.title}</Text>
                    <Text style={[styles.chipSub, { color: colors.sub }]}>{chip.sub}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Optional bullet facts */}
            {hasPoints ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                <View style={styles.pointsList}>
                  {card.points!.map((point) => (
                    <View key={point} style={styles.pointRow}>
                      <View style={[styles.pointDot, { backgroundColor: tone }]} />
                      <Text style={[styles.pointText, { color: colors.ink }]}>{point}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={{ flex: 1 }} />

            {card.footerTag ? (
              <Text style={[styles.footerTag, { color: colors.sub }]}>{card.footerTag}</Text>
            ) : null}

            {card.cta ? (
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: colors.indigo }]}
                activeOpacity={0.88}
                onPress={card.cta.onPress}
                accessibilityRole="button"
                accessibilityLabel={card.cta.accessibilityLabel || card.cta.label}
              >
                <Text style={styles.ctaText}>{card.cta.label}</Text>
                <ArrowRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  rail: {
    paddingHorizontal: 16,
    gap: RAIL_GAP,
    paddingVertical: 2,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rightTag: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chip: {
    width: "48%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  chipEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  chipTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  chipSub: {
    fontSize: 10,
    lineHeight: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  pointsList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pointText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  footerTag: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 12,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
