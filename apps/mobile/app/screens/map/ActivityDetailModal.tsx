import { useState, useCallback, useMemo } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { Activity } from "@impulse/shared"
import * as Haptics from "expo-haptics"
import { useTranslation } from "react-i18next"

import { PresetIcon } from "@/components/PresetIcon"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"

const C = colors.palette

interface ActivityDetailModalProps {
  activity: Activity & {
    participant_count?: number
    my_participation_status?: string | null
    time_until_start_minutes?: number
    time_remaining_minutes?: number
    preset?: { name: string; icon: string }
    creator?: { display_name: string; avatar_preset: number; activities_created_count?: number }
  }
  onJoined: (activityId: string) => void
  onLeft: () => void
  onClose: () => void
  onReport?: () => void
}

function formatTimeLabel(minutes: number): string {
  if (minutes <= 0) return ""
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export const ActivityDetailModal = ({
  activity,
  onJoined,
  onClose,
  onReport,
}: ActivityDetailModalProps) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [isPending, setIsPending] = useState(activity.my_participation_status === "pending")

  const handleJoin = useCallback(async () => {
    setLoading(true)
    const res = await api.post<{ status: string }>(`/activities/${activity.id}/join`)
    setLoading(false)
    if (res.ok) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      if (res.data?.status === "pending") {
        setIsPending(true)
      } else {
        onJoined(activity.id)
      }
    }
  }, [activity.id, onJoined])

  const isFull = activity.status === "full"
  const spotsLeft = activity.max_participants - (activity.participant_count || 0)
  const timeUntilStart = activity.time_until_start_minutes ?? 0
  const timeRemaining = activity.time_remaining_minutes ?? 0
  const isActive = activity.status === "active"

  const timeDisplay = useMemo(() => {
    if (isActive) return t("map:endsIn", { time: formatTimeLabel(timeRemaining) })
    if (timeUntilStart <= 0) return t("activity:detail.startingNow")
    return t("map:startsIn", { time: formatTimeLabel(timeUntilStart) })
  }, [isActive, timeUntilStart, timeRemaining, t])

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PresetIcon icon={activity.preset?.icon || "lightning-bolt"} size={28} color={C.primary} />
          <Text style={styles.title} numberOfLines={1}>
            {activity.preset?.name || activity.title}
          </Text>
        </View>
        <Text style={styles.timeLabel}>{timeDisplay}</Text>
      </View>

      {/* Info rows */}
      <View style={styles.infoSection}>
        {activity.location_name && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={C.subtle} />
            <Text style={styles.infoText}>{activity.location_name}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={C.subtle} />
          <Text style={styles.infoText}>{activity.duration_minutes} min</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color={C.subtle} />
          <Text style={styles.infoText}>
            {activity.participant_count || 0}/{activity.max_participants}{" "}
            {t("map:participants", { count: activity.participant_count || 0 })}
          </Text>
        </View>
      </View>

      {/* Creator */}
      {activity.creator && (
        <View style={styles.creatorRow}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>{activity.creator.avatar_preset}</Text>
          </View>
          <Text style={styles.creatorName}>
            {t("activity:detail.creator", { name: activity.creator.display_name })}
          </Text>
        </View>
      )}

      {/* Action buttons */}
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

      {/* Share + Report row */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={onReport}>
          <Text style={styles.footerAction}>{t("eventRoom:report.button")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: C.white, fontSize: 18, fontWeight: "600" },
  container: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  creatorAvatar: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    marginRight: 8,
    width: 28,
  },
  creatorAvatarText: { color: C.white, fontSize: 12, fontWeight: "700" },
  creatorName: { color: C.textSecondary, fontSize: 14 },
  creatorRow: { alignItems: "center", flexDirection: "row", marginBottom: 20 },
  footerAction: { color: C.subtle, fontSize: 14 },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
  },
  fullButton: { backgroundColor: C.disabled },
  fullText: { color: C.textSecondary, fontSize: 18, fontWeight: "600" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { alignItems: "center", flexDirection: "row", flex: 1, gap: 10 },
  infoRow: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 6 },
  infoSection: { marginBottom: 16 },
  infoText: { color: C.textSecondary, fontSize: 14 },
  pendingBadge: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    paddingVertical: 16,
  },
  pendingText: { color: "#856404", fontSize: 16, fontWeight: "600" },
  timeLabel: { color: C.success, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", flex: 1 },
})
