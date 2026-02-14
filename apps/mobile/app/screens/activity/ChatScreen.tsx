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
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native"
import type { Channel } from "phoenix"
import { useTranslation } from "react-i18next"

import type { AppStackParamList } from "@/navigators/navigationTypes"
import { socketService } from "@/services/socket/socket-service"
import { colors } from "@/theme/colors"
const C = colors.palette

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
          placeholderTextColor={C.subtle}
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
  backText: { color: C.primary, fontSize: 16 },
  container: { backgroundColor: C.card, flex: 1 },
  ephemeralNotice: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    padding: 10,
  },
  ephemeralText: { color: "#856404", fontSize: 12 },
  header: {
    alignItems: "center",
    backgroundColor: C.white,
    borderBottomColor: C.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
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
  message: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 12,
  },
  msgBody: { color: C.textSecondary, fontSize: 15, marginTop: 2 },
  msgContent: { flex: 1 },
  msgName: { color: C.text, fontSize: 14, fontWeight: "600" },
  msgTime: { color: C.subtle, fontSize: 11, marginLeft: 8, marginTop: 2 },
  sendBtn: {
    backgroundColor: C.primary,
    borderRadius: 20,
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: C.white, fontWeight: "600" },
})
