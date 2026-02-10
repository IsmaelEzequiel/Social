import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useTranslation } from "react-i18next"
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { api } from "@/services/api"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import type { Activity } from "@impulse/shared"

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, "LiveActivity">

interface LiveActivityData extends Activity {
  participant_count?: number
  my_status?: string
  preset?: { name: string; icon: string }
}

export const LiveActivityScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { activityId } = route.params
  const [activity, setActivity] = useState<LiveActivityData | null>(null)
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const loadActivity = useCallback(async () => {
    const res = await api.get<{ data: LiveActivityData }>(`/activities/${activityId}`)
    if (res.ok && res.data) {
      setActivity(res.data.data)
    }
  }, [activityId])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  const handleFeedback = async () => {
    if (!feedbackScore) return
    const res = await api.post(`/activities/${activityId}/feedback`, { score: feedbackScore })
    if (res.ok) {
      setSubmitted(true)
    } else {
      Alert.alert("Erro", "Falha ao enviar feedback")
    }
  }

  if (!activity) {
    return (
      <View style={styles.loading}>
        <Text>{t("common:loading")}</Text>
      </View>
    )
  }

  const isCompleted = activity.status === "completed"

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t("common:back")}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.icon}>{activity.preset?.icon || "?"}</Text>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.status}>{activity.status?.toUpperCase()}</Text>
        <Text style={styles.participants}>
          {activity.participant_count || 0}/{activity.max_participants}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate("Chat", { activityId })}
        >
          <Text style={styles.chatText}>Abrir Chat</Text>
        </TouchableOpacity>
      </View>

      {isCompleted && !submitted && (
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>{t("activity:feedback.title")}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                onPress={() => setFeedbackScore(score)}
                style={[styles.star, feedbackScore === score && styles.starSelected]}
              >
                <Text style={styles.starText}>{score}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, !feedbackScore && styles.submitBtnDisabled]}
            onPress={handleFeedback}
            disabled={!feedbackScore}
          >
            <Text style={styles.submitText}>{t("activity:feedback.submit")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {submitted && (
        <View style={styles.feedbackSection}>
          <Text style={styles.thankYou}>Obrigado pelo feedback!</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { color: "#6C63FF", fontSize: 16 },
  header: { alignItems: "center", padding: 24 },
  icon: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  status: { fontSize: 14, color: "#6C63FF", fontWeight: "700", marginTop: 4 },
  participants: { fontSize: 16, color: "#666", marginTop: 4 },
  actions: { padding: 24, gap: 12 },
  chatBtn: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  chatText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  feedbackSection: {
    padding: 24,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  feedbackTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  stars: { flexDirection: "row", gap: 12, marginBottom: 16 },
  star: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  starSelected: { backgroundColor: "#6C63FF" },
  starText: { fontSize: 18, fontWeight: "700", color: "#333" },
  submitBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  thankYou: { fontSize: 18, fontWeight: "600", color: "#4CAF50" },
})
