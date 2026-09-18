export const LightColors = {
  // Brand Denim Palette (deencommerce.com aesthetic)
  indigo: "#046BD2",
  indigoDark: "#1A2350",
  indigoLight: "#F0F5FA",
  denimStitch: "#D49439",

  // Background & Surfaces (Crisp modern editorial look)
  paper: "#FFFFFF",
  card: "#FFFFFF",
  cardSecondary: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Typography (High-contrast slate/navy ink)
  ink: "#0F172A",
  sub: "#475569",
  faint: "#94A3B8",

  // Status & Accents
  crimson: "#C93B36",
  crimsonLight: "#FDECEC",
  emerald: "#2E7D5B",
  emeraldLight: "#EBF7F1",
  amber: "#D97706",
  amberLight: "#FEF3C7",

  // Bangladeshi Payment Accents
  bkash: "#E2136E",
  nagad: "#F7941D",
  cod: "#1A2350",
};

export const DarkColors: typeof LightColors = {
  // Brand Denim Palette
  indigo: "#5B6EE1",
  indigoDark: "#4354BF",
  indigoLight: "#161622",
  denimStitch: "#EAA74B",

  // Background & Surfaces (True AMOLED Deep Black)
  paper: "#000000",
  card: "#101010",
  cardSecondary: "#181818",
  border: "#262626",
  borderLight: "#181818",

  // Typography (Neutral Crisp Monochromes)
  ink: "#FFFFFF",
  sub: "#A3A3A3",
  faint: "#737373",

  // Status & Accents
  crimson: "#F25F5C",
  crimsonLight: "#220E10",
  emerald: "#34D399",
  emeraldLight: "#082218",
  amber: "#FBBF24",
  amberLight: "#261C08",

  // Bangladeshi Payment Accents
  bkash: "#FF3388",
  nagad: "#FFA63D",
  cod: "#5B6EE1",
};

export type ThemeColors = typeof LightColors;

// Default fallback export
export const Colors = LightColors;

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.5 },
  titleMedium: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.3 },
  titleSmall: { fontSize: 15, fontWeight: "600" as const },
  body: { fontSize: 14, lineHeight: 20 },
  bodySmall: { fontSize: 12, lineHeight: 16 },
  caption: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" as const },
};
