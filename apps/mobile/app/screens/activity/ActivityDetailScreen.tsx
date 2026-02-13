import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native"
import type { Activity } from "@impulse/shared"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { Channel } from "phoenix"
import { useTranslation } from "react-i18next"

import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, "ActivityDetail">

interface ActivityDetail extends Activity {
  participant_count?: number
  my_participation_status?: string | null
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

export const ActivityDetailScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { activityId } = route.params
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const channelRef = useRef<Channel | null>(null)

  const loadActivity = useCallback(async () => {
    const res = await api.get<{ data: ActivityDetail }>(`/activities/${activityId}`)
    if (res.ok && res.data) {
      setActivity(res.data.data)
    }
  }, [activityId])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  // Listen for approval when pending
  useEffect(() => {
    if (activity?.my_participation_status !== "pending") return

    socketService.connect()
    const channel = socketService.joinChannel(`activity:${activityId}`)
    channelRef.current = channel

    if (channel) {
      channel.on("participant:joined", (payload: { user_id: string }) => {
        // If this user got approved, navigate to EventRoom
        // We reload the activity to check status
        loadActivity().then(() => {
          // Will re-render and the status check below will handle navigation
        })
      })
    }

    return () => {
      socketService.leaveChannel(`activity:${activityId}`)
    }
  }, [activity?.my_participation_status, activityId, loadActivity])

  // Auto-navigate to EventRoom when status changes to joined (from pending)
  useEffect(() => {
    if (activity?.my_participation_status === "joined" && activity.requires_approval) {
      navigation.replace("EventRoom", { activityId })
    }
  }, [activity?.my_participation_status, activity?.requires_approval, activityId, navigation])

  const handleJoin = async () => {
    const res = await api.post<{ status: string }>(`/activities/${activityId}/join`)
    if (res.ok) {
      loadActivity()
    } else {
      Alert.alert("Erro", "Falha ao participar")
    }
  }

  const handleLeave = async () => {
    const res = await api.post(`/activities/${activityId}/leave`)
    if (res.ok) loadActivity()
    else Alert.alert("Erro", "Falha ao sair")
  }

  const handleConfirm = async () => {
    const res = await api.post(`/activities/${activityId}/confirm`)
    if (res.ok) {
      navigation.replace("EventRoom", { activityId })
    } else {
      Alert.alert("Erro", "Falha ao confirmar")
    }
  }

  if (!activity) {
    return (
      <View style={styles.loading}>
        <Text>{t("common:loading")}</Text>
      </View>
    )
  }

  const myStatus = activity.my_participation_status
  const spotsLeft = activity.max_participants - (activity.participant_count || 0)
  const isFull = spotsLeft <= 0
  const isParticipant = !!myStatus && myStatus !== "cancelled" && myStatus !== "pending"
  const isPending = myStatus === "pending"

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t("common:back")}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.icon}>{activity.preset?.icon || "?"}</Text>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.mode}>
          {activity.mode === "flash" ? t("activity:flash") : t("activity:planned")}
        </Text>
      </View>

      <View style={styles.info}>
        {activity.creator && (
          <Text style={styles.detail}>
            {t("activity:detail.creator", { name: activity.creator.display_name })}
          </Text>
        )}
        <Text style={styles.detail}>{t("activity:detail.spotsLeft", { count: spotsLeft })}</Text>
        <Text style={styles.detail}>
          {t("activity:detail.confirmed", { count: activity.participant_count || 0 })}
        </Text>
      </View>

      <View style={styles.actions}>
        {/* Not a participant, not pending, not full */}
        {!isParticipant && !isPending && !isFull && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleJoin}>
            <Text style={styles.primaryText}>
              {activity.requires_approval ? t("activity:requestToJoin") : t("map:join")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Not a participant, full */}
        {!isParticipant && !isPending && isFull && (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledText}>{t("map:full")}</Text>
          </View>
        )}

        {/* Pending approval */}
        {isPending && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{t("activity:pendingApproval")}</Text>
          </View>
        )}

        {/* Joined — can confirm */}
        {myStatus === "joined" && (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
              <Text style={styles.primaryText}>{t("upcoming:confirm")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeave}>
              <Text style={styles.secondaryText}>{t("map:leave")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Confirmed — enter event room */}
        {myStatus === "confirmed" && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("EventRoom", { activityId })}
            >
              <Text style={styles.primaryText}>Entrar ao vivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeave}>
              <Text style={styles.secondaryText}>{t("map:leave")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Participant — can go to event room */}
        {isParticipant && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate("EventRoom", { activityId })}
          >
            <Text style={styles.chatText}>{t("eventRoom:tabs.chat")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  actions: { gap: 12, padding: 24 },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { color: "#6C63FF", fontSize: 16 },
  chatBtn: {
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
  },
  chatText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  container: { backgroundColor: "#f8f8f8", flex: 1 },
  detail: { color: "#444", fontSize: 15 },
  disabledBtn: {
    alignItems: "center",
    backgroundColor: "#ccc",
    borderRadius: 12,
    padding: 16,
  },
  disabledText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  header: { alignItems: "center", padding: 24 },
  icon: { fontSize: 48 },
  info: { gap: 4, paddingHorizontal: 24 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  mode: {
    color: "#6C63FF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  pendingBadge: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 16,
  },
  pendingText: { color: "#856404", fontSize: 15, fontWeight: "600" },
  primaryBtn: {
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    padding: 16,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  secondaryText: { color: "#666", fontSize: 16, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", marginTop: 8, textAlign: "center" },
})
