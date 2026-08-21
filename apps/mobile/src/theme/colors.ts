export const LightColors = {
  // Brand Denim Palette
  indigo: "#2A3680",
  indigoDark: "#1A2350",
  indigoLight: "#EEF0F8",
  denimStitch: "#D49439",

  // Background & Surfaces
  paper: "#F7F6F0",
  card: "#FFFFFF",
  cardSecondary: "#F0EFE8",
  border: "#E5E2D8",
  borderLight: "#F0EDE4",

  // Typography
  ink: "#151A2C",
  sub: "#636B7F",
  faint: "#9DA3B4",

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
  cod: "#2A3680",
};

export const DarkColors: typeof LightColors = {
  // Brand Denim Palette
  indigo: "#5B6EE1",
  indigoDark: "#4354BF",
  indigoLight: "#1F2848",
  denimStitch: "#EAA74B",

  // Background & Surfaces
  paper: "#0D111A",
  card: "#161C2A",
  cardSecondary: "#1F273B",
  border: "#2A344D",
  borderLight: "#1E2638",

  // Typography
  ink: "#F4F6FC",
  sub: "#A2ABC3",
  faint: "#6C7691",

  // Status & Accents
  crimson: "#F25F5C",
  crimsonLight: "#3A191D",
  emerald: "#34D399",
  emeraldLight: "#143828",
  amber: "#FBBF24",
  amberLight: "#382B0E",

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
