import { useState, useEffect, useCallback, useRef } from "react"
import { View, TouchableOpacity, Text, StyleSheet, Modal } from "react-native"
import { useTranslation } from "react-i18next"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"
import { CreateActivitySheet } from "./CreateActivitySheet"
import { ActivityDetailModal } from "./ActivityDetailModal"
import type { Activity } from "@impulse/shared"

// Note: react-native-maps will be integrated when running on device
// For now, this is a list-based view that can be swapped for MapView

interface MapActivity extends Activity {
  participant_count?: number
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

export const MapScreen = () => {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<MapActivity[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<MapActivity | null>(null)
  const channelRef = useRef<ReturnType<typeof socketService.joinChannel>>(null)

  // Default to São Paulo center
  const [region] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latDelta: 0.05,
    lngDelta: 0.05,
  })

  const loadActivities = useCallback(async () => {
    const res = await api.get<{ data: MapActivity[] }>("/activities", {
      lat: region.latitude,
      lng: region.longitude,
      radius: 5000,
    })
    if (res.ok && res.data) {
      setActivities(res.data.data)
    }
  }, [region])

  useEffect(() => {
    loadActivities()

    socketService.connect()
    const channel = socketService.joinChannel("map:sao_paulo")
    channelRef.current = channel

    if (channel) {
      channel.on("activity:created", (payload: MapActivity) => {
        setActivities((prev) => [payload, ...prev])
      })

      channel.on("activity:joined", (payload: { activity_id: string; participant_count: number }) => {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === payload.activity_id
              ? { ...a, participant_count: payload.participant_count }
              : a,
          ),
        )
      })

      channel.on("activity:left", (payload: { activity_id: string; participant_count: number }) => {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === payload.activity_id
              ? { ...a, participant_count: payload.participant_count }
              : a,
          ),
        )
      })

      channel.on("activity:completed", (payload: { activity_id: string }) => {
        setActivities((prev) => prev.filter((a) => a.id !== payload.activity_id))
      })
    }

    return () => {
      socketService.leaveChannel("map:sao_paulo")
    }
  }, [loadActivities])

  return (
    <View style={styles.container}>
      {/* Activity list (placeholder for MapView) */}
      <View style={styles.list}>
        {activities.length === 0 && (
          <Text style={styles.empty}>{t("map:noActivities")}</Text>
        )}
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityItem}
            onPress={() => setSelectedActivity(activity)}
          >
            <Text style={styles.activityIcon}>{activity.preset?.icon || "?"}</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityMeta}>
                {activity.participant_count || 0}/{activity.max_participants} participants
              </Text>
            </View>
            <Text style={styles.activityMode}>{activity.mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Sheet */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CreateActivitySheet
            latitude={region.latitude}
            longitude={region.longitude}
            onCreated={() => {
              setShowCreate(false)
              loadActivities()
            }}
            onClose={() => setShowCreate(false)}
          />
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!selectedActivity} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          {selectedActivity && (
            <ActivityDetailModal
              activity={selectedActivity}
              onJoined={() => {
                setSelectedActivity(null)
                loadActivities()
              }}
              onLeft={() => {
                setSelectedActivity(null)
                loadActivities()
              }}
              onClose={() => setSelectedActivity(null)}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  list: { flex: 1, padding: 16 },
  empty: { textAlign: "center", marginTop: 100, fontSize: 16, color: "#999" },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: { fontSize: 28, marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: "600" },
  activityMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  activityMode: { fontSize: 12, color: "#6C63FF", fontWeight: "600", textTransform: "uppercase" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
})
