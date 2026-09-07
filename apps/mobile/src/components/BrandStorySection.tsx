import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { HorizontalStoryRail } from "./HorizontalStoryRail";
import { HOME_STORY_CARDS } from "../data/storyCards";
import { AboutModal } from "./AboutModal";

/** Home story block: swipeable Heritage & Craft + Authenticity rail (data-driven). */
export const BrandStorySection: React.FC = () => {
  const [aboutVisible, setAboutVisible] = useState(false);

  // Wire the Heritage card's CTA to open the About modal on the home screen.
  const cards = HOME_STORY_CARDS.map((card) =>
    card.id === "heritage_and_craft" && card.cta
      ? { ...card, cta: { ...card.cta, onPress: () => setAboutVisible(true) } }
      : card
  );

  return (
    <View style={styles.container}>
      <HorizontalStoryRail cards={cards} />
      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
});
