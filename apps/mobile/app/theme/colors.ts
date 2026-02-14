/**
 * Design system color palette — based on the UX/UI audit (dashboard.md Section 7).
 *
 * Primary:     #6C63FF  (purple — brand)
 * Flash:       #FF6B6B  (warm red — urgency, "happening now")
 * Planned:     #4ECDC4  (teal — calm, "scheduled")
 * Success:     #2ECC71  (green — joined, confirmed)
 * Warning:     #F39C12  (amber — filling up, time running out)
 * Text:        #1A1A2E  (near-black)
 * Subtle:      #8E8E93  (grey for secondary text)
 * Background:  #FFFFFF
 * Card:        #F8F8FA
 */

const palette = {
  // Brand
  primary: "#6C63FF",
  primaryLight: "#F0EFFF",

  // Activity modes
  flash: "#FF6B6B",
  planned: "#4ECDC4",

  // Status
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#C03403",
  errorLight: "#F2D6CD",

  // Pin colors
  pinGreen: "#2ECC71",
  pinBlue: "#2196F3",
  pinYellow: "#F39C12",
  pinPurple: "#6C63FF",
  pinGrey: "#8E8E93",

  // Neutrals
  text: "#1A1A2E",
  textSecondary: "#444444",
  subtle: "#8E8E93",
  border: "#DDDDDD",
  disabled: "#CCCCCC",
  divider: "#E0E0E0",

  // Surfaces
  background: "#FFFFFF",
  card: "#F8F8FA",
  inputBg: "#F0F0F0",

  // Core
  white: "#FFFFFF",
  black: "#000000",

  // Overlays
  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
  shadowBlack: "#000000",

  // Legacy Ignite palette aliases (for boilerplate components: Button, Card, etc.)
  neutral100: "#FFFFFF",
  neutral200: "#F8F8FA",
  neutral300: "#E0E0E0",
  neutral400: "#CCCCCC",
  neutral500: "#8E8E93",
  neutral600: "#666666",
  neutral700: "#444444",
  neutral800: "#1A1A2E",
  neutral900: "#000000",

  primary100: "#F0EFFF",
  primary200: "#D6D3FF",
  primary300: "#ABA5FF",
  primary400: "#8F86FF",
  primary500: "#6C63FF",
  primary600: "#5046CC",

  secondary100: "#E0F7F4",
  secondary200: "#B3ECE3",
  secondary300: "#80E0D2",
  secondary400: "#66D7C6",
  secondary500: "#4ECDC4",

  accent100: "#FFEED4",
  accent200: "#FFE1B2",
  accent300: "#FDD495",
  accent400: "#FBC878",
  accent500: "#FFBB50",

  angry100: "#F2D6CD",
  angry500: "#C03403",
} as const

export const colors = {
  /**
   * The raw palette. Prefer semantic names below.
   */
  palette,
  /**
   * Transparent helper.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * Primary text color.
   */
  text: palette.text,
  /**
   * Secondary/dim text.
   */
  textDim: palette.subtle,
  /**
   * Screen background.
   */
  background: palette.card,
  /**
   * Default border color.
   */
  border: palette.border,
  /**
   * Main brand tint.
   */
  tint: palette.primary,
  /**
   * Inactive tint (for tab bars etc).
   */
  tintInactive: palette.subtle,
  /**
   * Separator lines.
   */
  separator: palette.divider,
  /**
   * Error text/icon.
   */
  error: palette.error,
  /**
   * Error backgrounds.
   */
  errorBackground: palette.errorLight,
} as const
