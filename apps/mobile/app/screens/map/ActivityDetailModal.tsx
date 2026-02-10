import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { api } from "@/services/api"
import type { Activity } from "@impulse/shared"

interface ActivityDetailModalProps {
  activity: Activity & { participant_count?: number; preset?: { name: string; icon: string } }
  onJoined: () => void
  onLeft: () => void
  onClose: () => void
}

export const ActivityDetailModal = ({
  activity,
  onJoined,
  onLeft,
  onClose,
}: ActivityDetailModalProps) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleJoin = useCallback(async () => {
    setLoading(true)
    const res = await api.post(`/activities/${activity.id}/join`)
    setLoading(false)
    if (res.ok) onJoined()
  }, [activity.id, onJoined])

  const handleLeave = useCallback(async () => {
    setLoading(true)
    const res = await api.delete(`/activities/${activity.id}/leave`)
    setLoading(false)
    if (res.ok) onLeft()
  }, [activity.id, onLeft])

  const isFull = activity.status === "full"
  const spotsLeft = activity.max_participants - (activity.participant_count || 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.location_name && (
            <Text style={styles.location}>{activity.location_name}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {activity.participant_count}/{activity.max_participants} {t("map:participants", { count: activity.participant_count || 0 })}
        </Text>
        {!isFull && (
          <Text style={styles.spots}>
            {t("activity:detail.spotsLeft", { count: spotsLeft })}
          </Text>
        )}
      </View>

      {isFull ? (
        <View style={[styles.button, styles.fullButton]}>
          <Text style={styles.fullText}>{t("map:full")}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("map:join")}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold" },
  location: { fontSize: 14, color: "#666", marginTop: 2 },
  close: { fontSize: 20, color: "#999", padding: 4 },
  info: { marginBottom: 20 },
  infoText: { fontSize: 16, color: "#333" },
  spots: { fontSize: 14, color: "#6C63FF", marginTop: 4 },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  fullButton: { backgroundColor: "#ccc" },
  fullText: { color: "#666", fontSize: 18, fontWeight: "600" },
})
