import { useState, useCallback, useEffect, useMemo } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTranslation } from "react-i18next"

import { PresetIcon } from "@/components/PresetIcon"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"
import type { Preset } from "@impulse/shared"

const C = colors.palette

interface CreateActivitySheetProps {
  latitude: number
  longitude: number
  locationName?: string
  onCreated: () => void
  onClose: () => void
}

const WHEN_OPTIONS = [
  { label: "now", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
]

const DURATION_OPTIONS = [30, 60, 90, 120]

const MIN_PARTICIPANTS = 3
const MAX_PARTICIPANTS = 20
const DEFAULT_PARTICIPANTS = 5

export const CreateActivitySheet = ({
  latitude,
  longitude,
  locationName,
  onCreated,
  onClose,
}: CreateActivitySheetProps) => {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
  const [whenIndex, setWhenIndex] = useState(0) // default "Now"
  const [duration, setDuration] = useState(60)
  const [maxParticipants, setMaxParticipants] = useState(DEFAULT_PARTICIPANTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ data: Preset[] }>("/presets").then((res) => {
      if (res.ok && res.data) setPresets(res.data.data)
    })
  }, [])

  const estimatedEndTime = useMemo(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + WHEN_OPTIONS[whenIndex].minutes + duration)
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [whenIndex, duration])

  const handleCreate = useCallback(async () => {
    if (!selectedPreset) return
    setLoading(true)

    const startsAt = new Date()
    startsAt.setMinutes(startsAt.getMinutes() + WHEN_OPTIONS[whenIndex].minutes)

    const res = await api.post("/activities", {
      mode: "flash",
      preset_id: selectedPreset.id,
      title: selectedPreset.name,
      latitude,
      longitude,
      starts_at: startsAt.toISOString(),
      duration_minutes: duration,
      max_participants: maxParticipants,
    })

    setLoading(false)
    if (res.ok) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      onCreated()
    }
  }, [selectedPreset, whenIndex, latitude, longitude, duration, maxParticipants, onCreated])

  const canCreate = !!selectedPreset

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("activity:create.title")}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* What? — Preset selector (2 scrollable rows) */}
        <Text style={styles.sectionLabel}>{t("activity:create.choosePreset")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          <View style={styles.presetGrid}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, selectedPreset?.id === preset.id && styles.presetChipSelected]}
                onPress={() => setSelectedPreset(preset)}
              >
                <PresetIcon
                  icon={preset.icon}
                  size={24}
                  color={selectedPreset?.id === preset.id ? C.primary : C.textSecondary}
                />
                <Text
                  style={[
                    styles.presetLabel,
                    selectedPreset?.id === preset.id && styles.presetLabelSelected,
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* When? */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t("activity:create.chooseTime")}</Text>
          <Text style={styles.flashBadge}>{t("activity:flash")}</Text>
        </View>
        <View style={styles.pillRow}>
          {WHEN_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.pill, whenIndex === i && styles.pillSelected]}
              onPress={() => setWhenIndex(i)}
            >
              <Text style={[styles.pillText, whenIndex === i && styles.pillTextSelected]}>
                {i === 0 ? t("activity:create.now") : opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.sectionLabel}>{t("activity:create.duration")}</Text>
        <View style={styles.pillRow}>
          {DURATION_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.pill, duration === d && styles.pillSelected]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.pillText, duration === d && styles.pillTextSelected]}>
                {t("activity:create.minutes", { count: d })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.endsAtHint}>
          {t("activity:create.endsAt", { time: estimatedEndTime })}
        </Text>

        {/* How many? — Compact buttons */}
        <Text style={styles.sectionLabel}>{t("activity:create.chooseParticipants")}</Text>
        <View style={styles.pillRow}>
          {[3, 5, 8, 10, 15, 20].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.countPill, maxParticipants === p && styles.pillSelected]}
              onPress={() => setMaxParticipants(p)}
            >
              <Text style={[styles.pillText, maxParticipants === p && styles.pillTextSelected]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.participantHint}>
          {t("activity:create.includingYou", { count: maxParticipants })}
        </Text>

        {/* Where? — Auto-filled */}
        <Text style={styles.sectionLabel}>{t("activity:create.chooseLocation")}</Text>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={C.primary} />
          <Text style={styles.locationText}>
            {locationName || t("activity:create.currentLocation")}
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.createBtn, (!canCreate || loading) && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={!canCreate || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>{t("activity:create.createFlash")}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  closeBtn: { padding: 4 },
  container: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 20,
  },
  countPill: {
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  createBtn: {
    alignItems: "center",
    backgroundColor: C.flash,
    borderRadius: 14,
    marginTop: 16,
    paddingVertical: 16,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: C.white, fontSize: 17, fontWeight: "700" },
  endsAtHint: { color: C.subtle, fontSize: 12, marginBottom: 16, marginTop: 4 },
  flashBadge: {
    backgroundColor: C.flash,
    borderRadius: 6,
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  locationRow: {
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    padding: 12,
  },
  locationText: { color: C.textSecondary, fontSize: 14 },
  participantHint: { color: C.subtle, fontSize: 12, marginBottom: 16, marginTop: 4 },
  pill: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  pillSelected: { backgroundColor: C.primary },
  pillText: { color: C.textSecondary, fontSize: 14, fontWeight: "600" },
  pillTextSelected: { color: C.white },
  presetChip: {
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 76,
  },
  presetChipSelected: { backgroundColor: C.primaryLight, borderColor: C.primary },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" },
  presetLabelSelected: { color: C.primary },
  presetScroll: { marginBottom: 16 },
  sectionLabel: { color: C.text, fontSize: 15, fontWeight: "600", marginBottom: 8 },
  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8,
  },
})
