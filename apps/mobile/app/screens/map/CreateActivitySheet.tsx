import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { useTranslation } from "react-i18next"
import { api } from "@/services/api"
import { PresetGrid } from "@/components/PresetGrid"
import type { Preset } from "@impulse/shared"

interface CreateActivitySheetProps {
  latitude: number
  longitude: number
  onCreated: () => void
  onClose: () => void
}

const DURATION_OPTIONS = [30, 60, 90, 120, 180]
const PARTICIPANT_OPTIONS = [3, 5, 8, 10, 15, 20]

export const CreateActivitySheet = ({
  latitude,
  longitude,
  onCreated,
  onClose,
}: CreateActivitySheetProps) => {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
  const [duration, setDuration] = useState(60)
  const [maxParticipants, setMaxParticipants] = useState(5)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ data: Preset[] }>("/presets").then((res) => {
      if (res.ok && res.data) setPresets(res.data.data)
    })
  }, [])

  const handleCreate = useCallback(async () => {
    if (!selectedPreset) return
    setLoading(true)

    const startsAt = new Date()
    startsAt.setMinutes(startsAt.getMinutes() + 5) // Flash: starts in 5 min

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
      onCreated()
    }
  }, [selectedPreset, latitude, longitude, duration, maxParticipants, onCreated])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("activity:create.title")}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>X</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {step === 0 && (
          <View>
            <Text style={styles.stepLabel}>{t("activity:create.choosePreset")}</Text>
            <PresetGrid
              presets={presets}
              selectedId={selectedPreset?.id}
              onSelect={(p) => {
                setSelectedPreset(p)
                setStep(1)
              }}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepLabel}>{t("activity:create.duration")}</Text>
            <View style={styles.optionRow}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.option, duration === d && styles.optionSelected]}
                  onPress={() => {
                    setDuration(d)
                    setStep(2)
                  }}
                >
                  <Text style={[styles.optionText, duration === d && styles.optionTextSelected]}>
                    {t("activity:create.minutes", { count: d })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepLabel}>{t("activity:create.chooseParticipants")}</Text>
            <View style={styles.optionRow}>
              {PARTICIPANT_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.option, maxParticipants === p && styles.optionSelected]}
                  onPress={() => setMaxParticipants(p)}
                >
                  <Text
                    style={[styles.optionText, maxParticipants === p && styles.optionTextSelected]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>{t("activity:create.create")}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold" },
  close: { fontSize: 20, color: "#999", padding: 4 },
  stepLabel: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  optionSelected: { backgroundColor: "#6C63FF" },
  optionText: { fontSize: 16, fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
  createButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
})
