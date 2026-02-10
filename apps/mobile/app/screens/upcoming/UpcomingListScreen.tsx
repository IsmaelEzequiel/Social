import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { api } from "@/services/api"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import type { Activity } from "@impulse/shared"

type Nav = NativeStackNavigationProp<AppStackParamList>

interface UpcomingActivity extends Activity {
  participant_count?: number
  my_status?: string
  preset?: { name: string; icon: string }
}

export const UpcomingListScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const [activities, setActivities] = useState<UpcomingActivity[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadUpcoming = useCallback(async () => {
    const res = await api.get<{ data: UpcomingActivity[] }>("/activities/upcoming")
    if (res.ok && res.data) {
      setActivities(res.data.data)
    }
  }, [])

  useEffect(() => {
    loadUpcoming()
  }, [loadUpcoming])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUpcoming()
    setRefreshing(false)
  }, [loadUpcoming])

  const handleConfirm = useCallback(
    async (activityId: string) => {
      const res = await api.post(`/activities/${activityId}/confirm`)
      if (res.ok) {
        loadUpcoming()
      } else {
        Alert.alert("Erro", "Falha ao confirmar presença")
      }
    },
    [loadUpcoming],
  )

  const renderItem = ({ item }: { item: UpcomingActivity }) => {
    const startsAt = new Date(item.starts_at)
    const timeStr = startsAt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ActivityDetail", { activityId: item.id })}
      >
        <Text style={styles.icon}>{item.preset?.icon || "?"}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{timeStr}</Text>
          <Text style={styles.meta}>
            {item.participant_count || 0}/{item.max_participants}
          </Text>
        </View>
        {item.my_status === "joined" && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => handleConfirm(item.id)}
          >
            <Text style={styles.confirmText}>{t("upcoming:confirm")}</Text>
          </TouchableOpacity>
        )}
        {item.my_status === "confirmed" && (
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedText}>OK</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("upcoming:title")}</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>{t("upcoming:empty")}</Text>}
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: { fontSize: 24, fontWeight: "700", padding: 16, paddingTop: 60 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: { fontSize: 28, marginRight: 12 },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666", marginTop: 2 },
  confirmBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  confirmedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmedText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", fontSize: 16, color: "#999" },
  emptyContainer: { flex: 1, justifyContent: "center" },
})
