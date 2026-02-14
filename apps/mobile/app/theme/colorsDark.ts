const palette = {
  // Brand
  primary: "#6C63FF",
  primaryLight: "#2A2640",

  // Activity modes
  flash: "#FF6B6B",
  planned: "#4ECDC4",

  // Status
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#FF6B6B",
  errorLight: "#3D1515",

  // Pin colors
  pinGreen: "#2ECC71",
  pinBlue: "#2196F3",
  pinYellow: "#F39C12",
  pinPurple: "#6C63FF",
  pinGrey: "#8E8E93",

  // Neutrals
  text: "#F4F2F1",
  textSecondary: "#B6ACA6",
  subtle: "#8E8E93",
  border: "#3C3836",
  disabled: "#564E4A",
  divider: "#3C3836",

  // Surfaces
  background: "#000000",
  card: "#191015",
  inputBg: "#3C3836",

  // Core
  white: "#FFFFFF",
  black: "#000000",

  // Overlays
  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
  shadowBlack: "#000000",

  // Legacy Ignite palette aliases (for boilerplate components)
  neutral100: "#000000",
  neutral200: "#191015",
  neutral300: "#3C3836",
  neutral400: "#564E4A",
  neutral500: "#8E8E93",
  neutral600: "#B6ACA6",
  neutral700: "#D7CEC9",
  neutral800: "#F4F2F1",
  neutral900: "#FFFFFF",

  primary100: "#2A2640",
  primary200: "#3D3866",
  primary300: "#504A8C",
  primary400: "#6C63FF",
  primary500: "#8F86FF",
  primary600: "#F0EFFF",

  secondary100: "#1A3330",
  secondary200: "#264D49",
  secondary300: "#336862",
  secondary400: "#4ECDC4",
  secondary500: "#80E0D2",

  accent100: "#3D2F00",
  accent200: "#664F00",
  accent300: "#8C6E00",
  accent400: "#FBC878",
  accent500: "#FFEED4",

  angry100: "#3D1515",
  angry500: "#FF6B6B",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.text,
  textDim: palette.subtle,
  background: palette.card,
  border: palette.border,
  tint: palette.primary,
  tintInactive: palette.subtle,
  separator: palette.divider,
  error: palette.error,
  errorBackground: palette.errorLight,
} as const
