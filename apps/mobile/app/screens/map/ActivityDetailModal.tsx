import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import type { Activity } from "@impulse/shared"
import { useTranslation } from "react-i18next"

import { api } from "@/services/api"

interface ActivityDetailModalProps {
  activity: Activity & {
    participant_count?: number
    my_participation_status?: string | null
    preset?: { name: string; icon: string }
  }
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
  const [isPending, setIsPending] = useState(activity.my_participation_status === "pending")

  const handleJoin = useCallback(async () => {
    setLoading(true)
    const res = await api.post<{ status: string }>(`/activities/${activity.id}/join`)
    setLoading(false)
    if (res.ok) {
      if (res.data?.status === "pending") {
        setIsPending(true)
      } else {
        onJoined()
      }
    }
  }, [activity.id, onJoined])

  const isFull = activity.status === "full"
  const spotsLeft = activity.max_participants - (activity.participant_count || 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.location_name && <Text style={styles.location}>{activity.location_name}</Text>}
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {activity.participant_count}/{activity.max_participants}{" "}
          {t("map:participants", { count: activity.participant_count || 0 })}
        </Text>
        {!isFull && (
          <Text style={styles.spots}>{t("activity:detail.spotsLeft", { count: spotsLeft })}</Text>
        )}
      </View>

      {isPending ? (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{t("activity:pendingApproval")}</Text>
        </View>
      ) : isFull ? (
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
            <Text style={styles.buttonText}>
              {activity.requires_approval ? t("activity:requestToJoin") : t("map:join")}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  close: { color: "#999", fontSize: 20, padding: 4 },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  fullButton: { backgroundColor: "#ccc" },
  fullText: { color: "#666", fontSize: 18, fontWeight: "600" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  info: { marginBottom: 20 },
  infoText: { color: "#333", fontSize: 16 },
  location: { color: "#666", fontSize: 14, marginTop: 2 },
  pendingBadge: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    paddingVertical: 16,
  },
  pendingText: { color: "#856404", fontSize: 16, fontWeight: "600" },
  spots: { color: "#6C63FF", fontSize: 14, marginTop: 4 },
  title: { fontSize: 22, fontWeight: "bold" },
})
