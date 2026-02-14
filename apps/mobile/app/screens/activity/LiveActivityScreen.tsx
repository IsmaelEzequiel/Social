import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import * as Haptics from "expo-haptics"
import { useTranslation } from "react-i18next"
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { PresetIcon } from "@/components/PresetIcon"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"
import type { Activity } from "@impulse/shared"

const C = colors.palette

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, "LiveActivity">

interface LiveActivityData extends Activity {
  participant_count?: number
  my_status?: string
  preset?: { name: string; icon: string }
}

const EMOJI_SCORES = [
  { emoji: "\uD83D\uDE15", score: 1 }, // 😕
  { emoji: "\uD83D\uDE42", score: 2 }, // 🙂
  { emoji: "\uD83D\uDE0A", score: 4 }, // 😊
  { emoji: "\uD83E\uDD29", score: 5 }, // 🤩
]

export const LiveActivityScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { activityId } = route.params
  const [activity, setActivity] = useState<LiveActivityData | null>(null)
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)
  const [doAgain, setDoAgain] = useState<string | null>(null)
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

  const handleSubmitFeedback = async () => {
    if (!feedbackScore) return
    const res = await api.post(`/activities/${activityId}/feedback`, {
      score: feedbackScore,
      text: doAgain ? `Would do again: ${doAgain}` : undefined,
    })
    if (res.ok) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setSubmitted(true)
    }
  }

  const handleDone = () => {
    navigation.goBack()
  }

  if (!activity) {
    return (
      <View style={styles.loading}>
        <Text>{t("common:loading")}</Text>
      </View>
    )
  }

  const isCompleted = activity.status === "completed"

  if (!isCompleted) {
    // Redirect to EventRoom for active activities
    navigation.replace("EventRoom", { activityId })
    return null
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t("common:back")}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <PresetIcon icon={activity.preset?.icon || "lightning-bolt"} size={48} color={C.primary} />
        <Text style={styles.title}>{activity.title}</Text>
      </View>

      {!submitted && (
        <View style={styles.feedbackCard}>
          {/* Emoji rating */}
          <Text style={styles.feedbackTitle}>{t("activity:feedback.title")}</Text>
          <View style={styles.emojiRow}>
            {EMOJI_SCORES.map((item) => (
              <TouchableOpacity
                key={item.score}
                onPress={() => {
                  setFeedbackScore(item.score)
                  Haptics.selectionAsync()
                }}
                style={[styles.emojiBtn, feedbackScore === item.score && styles.emojiBtnSelected]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Would you do this again? */}
          {feedbackScore !== null && (
            <>
              <Text style={styles.doAgainLabel}>{t("activity:feedback.doAgain")}</Text>
              <View style={styles.doAgainRow}>
                {(["yes", "maybe", "no"] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.doAgainBtn, doAgain === opt && styles.doAgainBtnSelected]}
                    onPress={() => setDoAgain(opt)}
                  >
                    <Text
                      style={[
                        styles.doAgainText,
                        doAgain === opt && styles.doAgainTextSelected,
                      ]}
                    >
                      {t(`activity:feedback.${opt}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !feedbackScore && styles.submitBtnDisabled]}
            onPress={handleSubmitFeedback}
            disabled={!feedbackScore}
          >
            <Text style={styles.submitText}>{t("activity:feedback.done")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {submitted && (
        <View style={styles.feedbackCard}>
          <Text style={styles.thankYou}>{t("activity:feedback.thankYou")}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneText}>{t("activity:feedback.done")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  backBtn: { padding: 16, paddingTop: 60 },
  backText: { color: C.primary, fontSize: 16 },
  container: { backgroundColor: C.card, flex: 1 },
  doAgainBtn: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  doAgainBtnSelected: { backgroundColor: C.primary },
  doAgainLabel: { color: C.text, fontSize: 16, fontWeight: "600", marginBottom: 12, marginTop: 20 },
  doAgainRow: { flexDirection: "row", gap: 12 },
  doAgainText: { color: C.textSecondary, fontSize: 15, fontWeight: "600" },
  doAgainTextSelected: { color: C.white },
  doneBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  doneText: { color: C.white, fontSize: 16, fontWeight: "700" },
  emoji: { fontSize: 36 },
  emojiBtn: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 3,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  emojiBtnSelected: { backgroundColor: C.primaryLight, borderColor: C.primary },
  emojiRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
  },
  feedbackTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  header: { alignItems: "center", padding: 24 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  submitBtn: {
    backgroundColor: C.success,
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: C.white, fontSize: 16, fontWeight: "700" },
  thankYou: { color: C.success, fontSize: 20, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700", marginTop: 12 },
})
