/**
 * Typography — dashboard.md Section 7
 *
 * Uses system fonts: SF Pro (iOS) / Roboto (Android).
 * SpaceGrotesk is kept as an optional loaded font but no longer primary.
 *
 * Scale:
 *   title:     Bold,    24pt
 *   heading:   SemiBold,18pt
 *   body:      Regular, 16pt
 *   caption:   Regular, 13pt
 *   pinLabel:  Medium,  12pt
 */

import { Platform } from "react-native"
import {
  SpaceGrotesk_300Light as spaceGroteskLight,
  SpaceGrotesk_400Regular as spaceGroteskRegular,
  SpaceGrotesk_500Medium as spaceGroteskMedium,
  SpaceGrotesk_600SemiBold as spaceGroteskSemiBold,
  SpaceGrotesk_700Bold as spaceGroteskBold,
} from "@expo-google-fonts/space-grotesk"

export const customFontsToLoad = {
  spaceGroteskLight,
  spaceGroteskRegular,
  spaceGroteskMedium,
  spaceGroteskSemiBold,
  spaceGroteskBold,
}

const fonts = {
  spaceGrotesk: {
    light: "spaceGroteskLight",
    normal: "spaceGroteskRegular",
    medium: "spaceGroteskMedium",
    semiBold: "spaceGroteskSemiBold",
    bold: "spaceGroteskBold",
  },
  system: {
    light: Platform.select({ ios: "System", android: "sans-serif-light" }) as string,
    normal: Platform.select({ ios: "System", android: "sans-serif" }) as string,
    medium: Platform.select({ ios: "System", android: "sans-serif-medium" }) as string,
    semiBold: Platform.select({ ios: "System", android: "sans-serif-medium" }) as string,
    bold: Platform.select({ ios: "System", android: "sans-serif" }) as string,
  },
  courier: {
    normal: "Courier",
  },
  monospace: {
    normal: "monospace",
  },
}

export const typography = {
  fonts,
  /**
   * Primary font — system (SF Pro on iOS, Roboto on Android).
   */
  primary: fonts.system,
  /**
   * Secondary font — SpaceGrotesk for display/accent use.
   */
  secondary: fonts.spaceGrotesk,
  /**
   * Monospace font.
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}

/**
 * Pre-defined type scale from the dashboard design system.
 * Use these in StyleSheet definitions for consistency.
 */
export const typeScale = {
  title: { fontSize: 24, fontWeight: "700" as const },
  heading: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  pinLabel: { fontSize: 12, fontWeight: "500" as const },
} as const
