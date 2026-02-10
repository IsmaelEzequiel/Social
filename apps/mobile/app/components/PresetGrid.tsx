import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import type { Preset } from "@impulse/shared"

interface PresetGridProps {
  presets: Preset[]
  selectedId?: string
  onSelect: (preset: Preset) => void
}

export const PresetGrid = ({ presets, selectedId, onSelect }: PresetGridProps) => {
  return (
    <View style={styles.grid}>
      {presets.map((preset) => (
        <TouchableOpacity
          key={preset.id}
          style={[styles.item, selectedId === preset.id && styles.selected]}
          onPress={() => onSelect(preset)}
        >
          <Text style={styles.icon}>{preset.icon}</Text>
          <Text style={[styles.name, selectedId === preset.id && styles.selectedText]}>
            {preset.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  item: {
    width: "30%",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: "#6C63FF", backgroundColor: "#F0EFFF" },
  icon: { fontSize: 28, marginBottom: 4 },
  name: { fontSize: 13, fontWeight: "600", color: "#333" },
  selectedText: { color: "#6C63FF" },
})
