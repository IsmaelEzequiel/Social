import { MaterialCommunityIcons } from "@expo/vector-icons"

/** Map of preset icon names (from DB) to MaterialCommunityIcons names */
const ICON_MAP: Record<string, string> = {
  "soccer-ball": "soccer",
  running: "run",
  basketball: "basketball",
  volleyball: "volleyball",
  skateboard: "skateboarding",
  bicycle: "bike",
  walking: "walk",
  "lightning-bolt": "lightning-bolt",
}

interface PresetIconProps {
  icon: string
  size?: number
  color?: string
}

export const PresetIcon = ({ icon, size = 24, color = "#333" }: PresetIconProps) => {
  const mapped = ICON_MAP[icon] ?? icon
  return (
    <MaterialCommunityIcons
      name={mapped as keyof typeof MaterialCommunityIcons.glyphMap}
      size={size}
      color={color}
    />
  )
}
