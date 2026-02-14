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

import { PresetIcon } from "@/components/PresetIcon"
import { useAuth } from "@/context/AuthContext"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"
import { colors } from "@/theme/colors"

const C = colors.palette

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
  const { userId } = useAuth()

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

      // Listen for new messages and mark as read
      channel.on("chat:message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg])
        channel.push("chat:read", {})
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
      Alert.alert(t("eventRoom:report.title"), t("eventRoom:report.submitted"))
    }
  }, [reportReason, activityId, activity?.creator_id, t])

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user_id === userId

    if (isMe) {
      return (
        <View style={styles.messageMe}>
          <Text style={styles.msgTimeMe}>
            {new Date(item.inserted_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View style={styles.bubbleMe}>
            <Text style={styles.msgBodyMe}>{item.body}</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.message}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.avatar_preset}</Text>
        </View>
        <View style={styles.msgContent}>
          <Text style={styles.msgName}>{item.display_name}</Text>
          <View style={styles.bubbleOther}>
            <Text style={styles.msgBody}>{item.body}</Text>
          </View>
        </View>
        <Text style={styles.msgTime}>
          {new Date(item.inserted_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    )
  }

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
          <PresetIcon icon={activity.preset?.icon || "lightning-bolt"} size={24} color={C.primary} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <Text style={styles.headerMeta}>
            {activity.participant_count || 0}/{activity.max_participants}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => setShowReport(!showReport)}
        >
          <Text style={styles.reportIcon}>{"⚠️"}</Text>
        </TouchableOpacity>
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

      {/* Report Input */}
      {showReport && (
        <View style={styles.reportSheet}>
          <Text style={styles.reportTitle}>{t("eventRoom:report.title")}</Text>
          <TextInput
            style={styles.reportInput}
            value={reportReason}
            onChangeText={setReportReason}
            placeholder={t("eventRoom:report.reasonPlaceholder")}
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
    backgroundColor: C.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveBtnText: { color: C.white, fontSize: 13, fontWeight: "600" },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  avatarText: { color: C.white, fontSize: 14, fontWeight: "700" },
  backBtn: { width: 60 },
  backText: { color: C.primary, fontSize: 16 },
  chatList: { flex: 1 },
  container: { backgroundColor: C.card, flex: 1 },
  emptyText: { color: C.subtle, fontSize: 15, marginTop: 32, textAlign: "center" },
  header: {
    alignItems: "center",
    backgroundColor: C.white,
    borderBottomColor: C.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerIcon: { fontSize: 24 },
  headerMeta: { color: C.textSecondary, fontSize: 13, marginTop: 2 },
  headerRight: { width: 60, alignItems: "flex-end" },
  reportIcon: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 20,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: C.white,
    borderTopColor: C.divider,
    borderTopWidth: 1,
    flexDirection: "row",
    padding: 12,
  },
  listContent: { padding: 16, paddingBottom: 8 },
  loadingContainer: { alignItems: "center", flex: 1, justifyContent: "center" },
  message: { alignItems: "flex-start", flexDirection: "row", marginBottom: 12 },
  messageMe: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  bubbleOther: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    marginTop: 4,
    padding: 10,
    maxWidth: "85%",
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 10,
    maxWidth: "85%",
  },
  msgBody: { color: C.textSecondary, fontSize: 15 },
  msgBodyMe: { color: C.white, fontSize: 15 },
  msgContent: { flex: 1 },
  msgName: { color: C.text, fontSize: 14, fontWeight: "600" },
  msgTime: { color: C.subtle, fontSize: 11, marginLeft: 8, marginTop: 2 },
  msgTimeMe: { color: C.subtle, fontSize: 11, marginRight: 8, marginTop: 2 },
  participantName: { color: C.text, flex: 1, fontSize: 15, fontWeight: "600" },
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
    borderBottomColor: C.divider,
    borderBottomWidth: 1,
    paddingBottom: 4,
    paddingTop: 12,
  },
  rejectBtn: {
    backgroundColor: C.flash,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectBtnText: { color: C.white, fontSize: 13, fontWeight: "600" },
  reportInput: {
    backgroundColor: C.inputBg,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 80,
    padding: 12,
    textAlignVertical: "top",
  },
  reportSheet: {
    backgroundColor: C.white,
    borderTopColor: C.divider,
    borderTopWidth: 1,
    padding: 16,
  },
  reportSubmitBtn: {
    alignItems: "center",
    backgroundColor: C.flash,
    borderRadius: 10,
    marginTop: 12,
    padding: 12,
  },
  reportSubmitText: { color: C.white, fontSize: 15, fontWeight: "700" },
  reportTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sectionTitle: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sendBtn: {
    backgroundColor: C.primary,
    borderRadius: 20,
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: C.white, fontWeight: "600" },
  tab: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: { borderBottomColor: C.primary },
  tabBar: {
    backgroundColor: C.white,
    borderBottomColor: C.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  tabText: { color: C.subtle, fontSize: 15, fontWeight: "600" },
  tabTextActive: { color: C.primary },
})
