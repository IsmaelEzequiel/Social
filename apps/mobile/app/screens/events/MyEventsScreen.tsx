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
import { PresetIcon } from "@/components/PresetIcon"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"
import type { Activity } from "@impulse/shared"

const C = colors.palette

type Nav = NativeStackNavigationProp<AppStackParamList>

interface MyActivity extends Activity {
  participant_count?: number
  message_count?: number
  preset?: { name: string; icon: string }
}

function formatBadge(count: number): string {
  if (count > 9) return "9+"
  return String(count)
}

export const MyEventsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const [activities, setActivities] = useState<MyActivity[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadMyEvents = useCallback(async () => {
    const res = await api.get<{ data: MyActivity[] }>("/activities/mine")
    if (res.ok && res.data) {
      setActivities(res.data.data)
    }
  }, [])

  useEffect(() => {
    loadMyEvents()
  }, [loadMyEvents])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadMyEvents()
    setRefreshing(false)
  }, [loadMyEvents])

  const handleDelete = useCallback(
    (activityId: string, title: string) => {
      Alert.alert(
        t("myEvents:deleteTitle"),
        t("myEvents:deleteConfirm", { title }),
        [
          { text: t("common:cancel"), style: "cancel" },
          {
            text: t("common:delete"),
            style: "destructive",
            onPress: async () => {
              const res = await api.delete(`/activities/${activityId}`)
              if (res.ok) {
                setActivities((prev) => prev.filter((a) => a.id !== activityId))
              } else {
                Alert.alert(t("common:error"), t("common:failedAction"))
              }
            },
          },
        ],
      )
    },
    [t],
  )

  const renderItem = ({ item }: { item: MyActivity }) => {
    const startsAt = new Date(item.starts_at)
    const timeStr = startsAt.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    const msgCount = item.message_count || 0

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("EventRoom", { activityId: item.id })}
      >
        <View style={styles.iconContainer}>
          <PresetIcon icon={item.preset?.icon || "lightning-bolt"} size={28} color={C.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{timeStr}</Text>
          <Text style={styles.meta}>
            {item.participant_count || 0}/{item.max_participants}
          </Text>
        </View>
        {msgCount > 0 && (
          <View style={styles.msgBadge}>
            <Text style={styles.msgBadgeText}>{formatBadge(msgCount)}</Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id, item.title)}
        >
          <Text style={styles.deleteBtnText}>{"🗑"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("myEvents:title")}</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>{t("myEvents:empty")}</Text>}
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: { fontSize: 24, fontWeight: "700", padding: 16, paddingTop: 60 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: C.shadowBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: { marginRight: 12 },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  msgBadge: {
    backgroundColor: C.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 8,
  },
  msgBadgeText: { color: C.white, fontSize: 12, fontWeight: "700" },
  statusBadge: {
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: { color: C.white, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: { fontSize: 18 },
  empty: { textAlign: "center", fontSize: 16, color: C.subtle },
  emptyContainer: { flex: 1, justifyContent: "center" },
})
