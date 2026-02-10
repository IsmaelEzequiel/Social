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
} from "react-native"
import { useTranslation } from "react-i18next"
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native"
import { socketService } from "@/services/socket/socket-service"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import type { Channel } from "phoenix"

type Route = RouteProp<AppStackParamList, "Chat">

interface ChatMessage {
  id: string
  user_id: string
  display_name: string
  avatar_preset: number
  body: string
  inserted_at: string
}

export const ChatScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute<Route>()
  const { activityId } = route.params
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const channelRef = useRef<Channel | null>(null)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    socketService.connect()
    const channel = socketService.joinChannel(`activity:${activityId}`)
    channelRef.current = channel

    if (channel) {
      // Load history
      channel.push("chat:history", {}).receive("ok", (resp: { messages: ChatMessage[] }) => {
        setMessages(resp.messages)
      })

      // Listen for new messages
      channel.on("chat:message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg])
      })
    }

    return () => {
      socketService.leaveChannel(`activity:${activityId}`)
    }
  }, [activityId])

  const sendMessage = useCallback(() => {
    const body = input.trim()
    if (!body || !channelRef.current) return

    channelRef.current.push("chat:message", { body })
    setInput("")
  }, [input])

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
        {new Date(item.inserted_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("common:back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 50 }} />
      </View>

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
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backText: { color: "#6C63FF", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  ephemeralNotice: {
    backgroundColor: "#FFF3CD",
    padding: 10,
    alignItems: "center",
  },
  ephemeralText: { fontSize: 12, color: "#856404" },
  listContent: { padding: 16, paddingBottom: 8 },
  message: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  msgContent: { flex: 1 },
  msgName: { fontWeight: "600", fontSize: 14, color: "#333" },
  msgBody: { fontSize: 15, color: "#444", marginTop: 2 },
  msgTime: { fontSize: 11, color: "#999", marginLeft: 8, marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#6C63FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendText: { color: "#fff", fontWeight: "600" },
})
