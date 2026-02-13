import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native"
import type { Activity } from "@impulse/shared"
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { Channel } from "phoenix"
import { useTranslation } from "react-i18next"

import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, "EventRoom">

interface ActivityDetail extends Activity {
  participant_count?: number
  my_participation_status?: string | null
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

interface ChatMessage {
  id: string
  user_id: string
  display_name: string
  avatar_preset: number
  body: string
  inserted_at: string
}

interface ParticipantData {
  id: string
  user_id: string
  status: string
  joined_at: string
  display_name: string
  avatar_preset: number
}

export const EventRoomScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { activityId } = route.params

  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat")

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const channelRef = useRef<Channel | null>(null)
  const listRef = useRef<FlatList>(null)

  // Participants state
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [pendingParticipants, setPendingParticipants] = useState<ParticipantData[]>([])

  // Report state
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState("")

  const loadActivity = useCallback(async () => {
    const res = await api.get<{ data: ActivityDetail }>(`/activities/${activityId}`)
    if (res.ok && res.data) {
      setActivity(res.data.data)
    }
  }, [activityId])

  const loadParticipants = useCallback(async () => {
    const res = await api.get<{ data: ParticipantData[] }>(`/activities/${activityId}/participants`)
    if (res.ok && res.data) {
      setParticipants(res.data.data)
    }
  }, [activityId])

  const loadPendingParticipants = useCallback(async () => {
    const res = await api.get<{ data: ParticipantData[] }>(
      `/activities/${activityId}/participants/pending`,
    )
    if (res.ok && res.data) {
      setPendingParticipants(res.data.data)
    }
  }, [activityId])

  // Load activity on mount
  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  // Channel + chat setup
  useEffect(() => {
    socketService.connect()
    const channel = socketService.joinChannel(`activity:${activityId}`)
    channelRef.current = channel

    if (channel) {
      // Load chat history
      channel.push("chat:history", {}).receive("ok", (resp: { messages: ChatMessage[] }) => {
        setMessages(resp.messages)
      })

      // Listen for new messages
      channel.on("chat:message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg])
      })

      // Listen for participant events
      channel.on("participant:joined", (payload: ParticipantData) => {
        setParticipants((prev) => [...prev.filter((p) => p.user_id !== payload.user_id), payload])
        setPendingParticipants((prev) => prev.filter((p) => p.user_id !== payload.user_id))
      })

      channel.on("participant:left", (payload: { user_id: string }) => {
        setParticipants((prev) => prev.filter((p) => p.user_id !== payload.user_id))
      })

      channel.on("participant:pending", (payload: ParticipantData) => {
        setPendingParticipants((prev) => [...prev, payload])
      })

      channel.on("participant:rejected", (payload: { user_id: string }) => {
        setPendingParticipants((prev) => prev.filter((p) => p.user_id !== payload.user_id))
      })
    }

    return () => {
      socketService.leaveChannel(`activity:${activityId}`)
    }
  }, [activityId])

  // Load participants when switching to tab
  useEffect(() => {
    if (activeTab === "participants") {
      loadParticipants()
      if (activity?.creator_id) {
        loadPendingParticipants()
      }
    }
  }, [activeTab, loadParticipants, loadPendingParticipants, activity?.creator_id])

  const sendMessage = useCallback(() => {
    const body = input.trim()
    if (!body || !channelRef.current) return
    channelRef.current.push("chat:message", { body })
    setInput("")
  }, [input])

  const handleApprove = useCallback(
    async (userId: string) => {
      const res = await api.post(`/activities/${activityId}/participants/${userId}/approve`)
      if (res.ok) {
        setPendingParticipants((prev) => prev.filter((p) => p.user_id !== userId))
        loadParticipants()
      }
    },
    [activityId, loadParticipants],
  )

  const handleReject = useCallback(
    async (userId: string) => {
      const res = await api.post(`/activities/${activityId}/participants/${userId}/reject`)
      if (res.ok) {
        setPendingParticipants((prev) => prev.filter((p) => p.user_id !== userId))
      }
    },
    [activityId],
  )

  const submitReport = useCallback(async () => {
    if (!reportReason.trim()) return
    const res = await api.post("/reports", {
      reported_id: activity?.creator_id,
      reason: reportReason,
      activity_id: activityId,
    })
    if (res.ok) {
      setShowReport(false)
      setReportReason("")
      Alert.alert(t("eventRoom:report.title"), "Report submitted.")
    }
  }, [reportReason, activityId, activity?.creator_id, t])

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.message}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.avatar_preset}</Text>
      </View>
      <View style={styles.msgContent}>
        <Text style={styles.msgName}>{item.display_name}</Text>
        <Text style={styles.msgBody}>{item.body}</Text>
      </View>
      <Text style={styles.msgTime}>
        {new Date(item.inserted_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  )

  const renderParticipant = ({ item }: { item: ParticipantData }) => (
    <View style={styles.participantRow}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.avatar_preset}</Text>
      </View>
      <Text style={styles.participantName}>{item.display_name}</Text>
    </View>
  )

  const renderPendingParticipant = ({ item }: { item: ParticipantData }) => (
    <View style={styles.participantRow}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.avatar_preset}</Text>
      </View>
      <Text style={styles.participantName}>{item.display_name}</Text>
      <View style={styles.pendingActions}>
        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.user_id)}>
          <Text style={styles.approveBtnText}>{t("eventRoom:participants.approve")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.user_id)}>
          <Text style={styles.rejectBtnText}>{t("eventRoom:participants.reject")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (!activity) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t("common:loading")}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t("common:back")}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{activity.preset?.icon || "?"}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <Text style={styles.headerMeta}>
            {activity.participant_count || 0}/{activity.max_participants}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.tabActive]}
          onPress={() => setActiveTab("chat")}
        >
          <Text style={[styles.tabText, activeTab === "chat" && styles.tabTextActive]}>
            {t("eventRoom:tabs.chat")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "participants" && styles.tabActive]}
          onPress={() => setActiveTab("participants")}
        >
          <Text style={[styles.tabText, activeTab === "participants" && styles.tabTextActive]}>
            {t("eventRoom:tabs.participants")}
            {pendingParticipants.length > 0 && ` (${pendingParticipants.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <>
          <View style={styles.ephemeralNotice}>
            <Text style={styles.ephemeralText}>{t("activity:chat.ephemeralNotice")}</Text>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            style={styles.chatList}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t("activity:chat.placeholder")}
              placeholderTextColor="#999"
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendText}>{t("common:ok")}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Participants Tab */}
      {activeTab === "participants" && (
        <View style={styles.participantsContainer}>
          {pendingParticipants.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.sectionTitle}>{t("eventRoom:participants.pending")}</Text>
              <FlatList
                data={pendingParticipants}
                keyExtractor={(item) => item.id}
                renderItem={renderPendingParticipant}
                scrollEnabled={false}
              />
            </View>
          )}

          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            renderItem={renderParticipant}
            contentContainerStyle={styles.participantsList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t("eventRoom:participants.empty")}</Text>
            }
          />
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(!showReport)}>
          <Text style={styles.reportBtnText}>{t("eventRoom:report.button")}</Text>
        </TouchableOpacity>
      </View>

      {/* Report Input */}
      {showReport && (
        <View style={styles.reportSheet}>
          <Text style={styles.reportTitle}>{t("eventRoom:report.title")}</Text>
          <TextInput
            style={styles.reportInput}
            value={reportReason}
            onChangeText={setReportReason}
            placeholder="Reason..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity style={styles.reportSubmitBtn} onPress={submitReport}>
            <Text style={styles.reportSubmitText}>{t("common:confirm")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  approveBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  backBtn: { width: 60 },
  backText: { color: "#6C63FF", fontSize: 16 },
  bottomBar: {
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatList: { flex: 1 },
  container: { backgroundColor: "#f8f8f8", flex: 1 },
  emptyText: { color: "#999", fontSize: 15, marginTop: 32, textAlign: "center" },
  ephemeralNotice: { alignItems: "center", backgroundColor: "#FFF3CD", padding: 10 },
  ephemeralText: { color: "#856404", fontSize: 12 },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerIcon: { fontSize: 24 },
  headerMeta: { color: "#666", fontSize: 13, marginTop: 2 },
  headerRight: { width: 60 },
  headerTitle: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: 1,
    flexDirection: "row",
    padding: 12,
  },
  listContent: { padding: 16, paddingBottom: 8 },
  loadingContainer: { alignItems: "center", flex: 1, justifyContent: "center" },
  message: { alignItems: "flex-start", flexDirection: "row", marginBottom: 12 },
  msgBody: { color: "#444", fontSize: 15, marginTop: 2 },
  msgContent: { flex: 1 },
  msgName: { color: "#333", fontSize: 14, fontWeight: "600" },
  msgTime: { color: "#999", fontSize: 11, marginLeft: 8, marginTop: 2 },
  participantName: { color: "#333", flex: 1, fontSize: 15, fontWeight: "600" },
  participantRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  participantsContainer: { flex: 1 },
  participantsList: { padding: 16 },
  pendingActions: { flexDirection: "row", gap: 8 },
  pendingSection: {
    backgroundColor: "#FFF9E6",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingBottom: 4,
    paddingTop: 12,
  },
  rejectBtn: {
    backgroundColor: "#FF5252",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  reportBtn: {
    borderColor: "#FF5252",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reportBtnText: { color: "#FF5252", fontSize: 14, fontWeight: "600" },
  reportInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    fontSize: 15,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
  },
  reportSheet: {
    backgroundColor: "#fff",
    borderTopColor: "#eee",
    borderTopWidth: 1,
    padding: 16,
  },
  reportSubmitBtn: {
    alignItems: "center",
    backgroundColor: "#FF5252",
    borderRadius: 10,
    marginTop: 12,
    padding: 12,
  },
  reportSubmitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  reportTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sectionTitle: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sendBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: "#fff", fontWeight: "600" },
  tab: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: { borderBottomColor: "#6C63FF" },
  tabBar: {
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  tabText: { color: "#999", fontSize: 15, fontWeight: "600" },
  tabTextActive: { color: "#6C63FF" },
})
