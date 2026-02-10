import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { api } from "@/services/api"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import type { Activity } from "@impulse/shared"

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, "ActivityDetail">

interface ActivityDetail extends Activity {
  participant_count?: number
  my_status?: string | null
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

export const ActivityDetailScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { activityId } = route.params
  const [activity, setActivity] = useState<ActivityDetail | null>(null)

  const loadActivity = useCallback(async () => {
    const res = await api.get<{ data: ActivityDetail }>(`/activities/${activityId}`)
    if (res.ok && res.data) {
      setActivity(res.data.data)
    }
  }, [activityId])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  const handleJoin = async () => {
    const res = await api.post(`/activities/${activityId}/join`)
    if (res.ok) loadActivity()
    else Alert.alert("Erro", "Falha ao participar")
  }

  const handleLeave = async () => {
    const res = await api.post(`/activities/${activityId}/leave`)
    if (res.ok) loadActivity()
    else Alert.alert("Erro", "Falha ao sair")
  }

  const handleConfirm = async () => {
    const res = await api.post(`/activities/${activityId}/confirm`)
    if (res.ok) loadActivity()
    else Alert.alert("Erro", "Falha ao confirmar")
  }

  if (!activity) {
    return (
      <View style={styles.loading}>
        <Text>{t("common:loading")}</Text>
      </View>
    )
  }

  const spotsLeft = activity.max_participants - (activity.participant_count || 0)
  const isFull = spotsLeft <= 0
  const isParticipant = !!activity.my_status && activity.my_status !== "cancelled"

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
        <Text style={styles.detail}>
          {t("activity:detail.spotsLeft", { count: spotsLeft })}
        </Text>
        <Text style={styles.detail}>
          {t("activity:detail.confirmed", { count: activity.participant_count || 0 })}
        </Text>
      </View>

      {activity.description && <Text style={styles.description}>{activity.description}</Text>}

      <View style={styles.actions}>
        {!isParticipant && !isFull && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleJoin}>
            <Text style={styles.primaryText}>{t("map:join")}</Text>
          </TouchableOpacity>
        )}

        {!isParticipant && isFull && (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledText}>{t("map:full")}</Text>
          </View>
        )}

        {activity.my_status === "joined" && (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
              <Text style={styles.primaryText}>{t("upcoming:confirm")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeave}>
              <Text style={styles.secondaryText}>{t("map:leave")}</Text>
            </TouchableOpacity>
          </>
        )}

        {activity.my_status === "confirmed" && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("LiveActivity", { activityId })}
            >
              <Text style={styles.primaryText}>Entrar ao vivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeave}>
              <Text style={styles.secondaryText}>{t("map:leave")}</Text>
            </TouchableOpacity>
          </>
        )}

        {isParticipant && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate("Chat", { activityId })}
          >
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { color: "#6C63FF", fontSize: 16 },
  header: { alignItems: "center", padding: 24 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 8, textAlign: "center" },
  mode: { fontSize: 14, color: "#6C63FF", fontWeight: "600", marginTop: 4, textTransform: "uppercase" },
  info: { paddingHorizontal: 24, gap: 4 },
  detail: { fontSize: 15, color: "#444" },
  description: { fontSize: 15, color: "#666", paddingHorizontal: 24, marginTop: 16, lineHeight: 22 },
  actions: { padding: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: "#6C63FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  secondaryText: { color: "#666", fontWeight: "600", fontSize: 16 },
  disabledBtn: {
    backgroundColor: "#ccc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chatBtn: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  chatText: { color: "#fff", fontWeight: "600", fontSize: 16 },
})
