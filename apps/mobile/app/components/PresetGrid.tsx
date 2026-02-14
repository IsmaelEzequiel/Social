import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import type { Preset } from "@impulse/shared"

import { colors } from "@/theme/colors"

import { PresetIcon } from "./PresetIcon"

const C = colors.palette

interface PresetGridProps {
  presets: Preset[]
  selectedId?: string
  onSelect: (preset: Preset) => void
}

export const PresetGrid = ({ presets, selectedId, onSelect }: PresetGridProps) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[styles.item, selectedId === preset.id && styles.selected]}
            onPress={() => onSelect(preset)}
          >
            <PresetIcon
              icon={preset.icon}
              size={28}
              color={selectedId === preset.id ? C.primary : C.textSecondary}
            />
            <Text style={[styles.name, selectedId === preset.id && styles.selectedText]}>
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10, paddingHorizontal: 4 },
  item: {
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 80,
  },
  name: { color: C.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" },
  selected: { backgroundColor: C.primaryLight, borderColor: C.primary },
  selectedText: { color: C.primary },
})
