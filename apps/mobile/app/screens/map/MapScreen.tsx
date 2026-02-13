import { useState, useEffect, useCallback, useRef } from "react"
import { View, TouchableOpacity, Text, StyleSheet, Modal } from "react-native"
import * as Location from "expo-location"
import type { Activity } from "@impulse/shared"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import MapboxGL from "@rnmapbox/maps"
import { useTranslation } from "react-i18next"

import { ActivityPin } from "@/components/ActivityPin"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"

import { ActivityDetailModal } from "./ActivityDetailModal"
import { CreateActivitySheet } from "./CreateActivitySheet"

type Nav = NativeStackNavigationProp<AppStackParamList>

interface MapActivity extends Activity {
  participant_count?: number
  my_participation_status?: string | null
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

const RADIUS_OPTIONS = [
  { label: "1 km", meters: 1000 },
  { label: "5 km", meters: 5000 },
  { label: "10 km", meters: 10000 },
  { label: "25 km", meters: 25000 },
]

export const MapScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const [activities, setActivities] = useState<MapActivity[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<MapActivity | null>(null)
  const [radiusIndex, setRadiusIndex] = useState(1) // default 5km
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const channelRef = useRef<ReturnType<typeof socketService.joinChannel>>(null)
  const cameraRef = useRef<MapboxGL.Camera>(null)

  // Request location on mount
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
      } else {
        // Fallback to São Paulo
        setUserLocation({ latitude: -23.5505, longitude: -46.6333 })
      }
    })()
  }, [])

  const radiusMeters = RADIUS_OPTIONS[radiusIndex].meters

  const loadActivities = useCallback(
    async (lat: number, lng: number) => {
      const res = await api.get<{ data: MapActivity[] }>("/activities", {
        lat,
        lng,
        radius: radiusMeters,
      })
      if (res.ok && res.data) {
        setActivities(res.data.data)
      }
    },
    [radiusMeters],
  )

  // Load activities when location or radius changes
  useEffect(() => {
    if (!userLocation) return
    loadActivities(userLocation.latitude, userLocation.longitude)
  }, [userLocation, loadActivities])

  // Real-time channel
  useEffect(() => {
    socketService.connect()
    const channel = socketService.joinChannel("map:activity_updates")
    channelRef.current = channel

    if (channel) {
      channel.on("activity:created", (payload: MapActivity) => {
        setActivities((prev) => [payload, ...prev])
      })

      channel.on(
        "activity:joined",
        (payload: { activity_id: string; participant_count: number }) => {
          setActivities((prev) =>
            prev.map((a) =>
              a.id === payload.activity_id
                ? { ...a, participant_count: payload.participant_count }
                : a,
            ),
          )
        },
      )

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
      socketService.leaveChannel("map:activity_updates")
    }
  }, [])

  const handleMarkerPress = (activity: MapActivity) => {
    const status = activity.my_participation_status
    if (status === "joined" || status === "confirmed" || status === "attended") {
      navigation.navigate("EventRoom", { activityId: activity.id })
    } else {
      setSelectedActivity(activity)
    }
  }

  const handleRegionChange = useCallback(
    (feature: GeoJSON.Feature) => {
      if (!feature.properties) return
      const center = (feature.geometry as GeoJSON.Point).coordinates
      if (center) {
        loadActivities(center[1], center[0])
      }
    },
    [loadActivities],
  )

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t("common:loading")}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onRegionDidChange={handleRegionChange}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          zoomLevel={13}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible />

        {activities.map((activity) => (
          <MapboxGL.MarkerView
            key={activity.id}
            coordinate={[activity.location.longitude, activity.location.latitude]}
          >
            <TouchableOpacity onPress={() => handleMarkerPress(activity)}>
              <ActivityPin
                presetIcon={activity.preset?.icon || "?"}
                presetName={activity.preset?.name || ""}
                participantCount={activity.participant_count || 0}
                maxParticipants={activity.max_participants}
                status={activity.status}
              />
            </TouchableOpacity>
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      {/* Radius Filter */}
      <View style={styles.radiusBar}>
        {RADIUS_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.meters}
            style={[styles.radiusPill, i === radiusIndex && styles.radiusPillActive]}
            onPress={() => setRadiusIndex(i)}
          >
            <Text style={[styles.radiusText, i === radiusIndex && styles.radiusTextActive]}>
              {opt.label}
            </Text>
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
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            onCreated={() => {
              setShowCreate(false)
              loadActivities(userLocation.latitude, userLocation.longitude)
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
                loadActivities(userLocation.latitude, userLocation.longitude)
              }}
              onLeft={() => {
                setSelectedActivity(null)
                loadActivities(userLocation.latitude, userLocation.longitude)
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
  container: { flex: 1 },
  fab: {
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 28,
    bottom: 24,
    elevation: 8,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: 56,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
  loadingContainer: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#999", fontSize: 16 },
  map: { flex: 1 },
  modalOverlay: { backgroundColor: "rgba(0,0,0,0.3)", flex: 1, justifyContent: "flex-end" },
  radiusBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    right: 16,
    top: 60,
  },
  radiusPill: {
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  radiusPillActive: {
    backgroundColor: "#6C63FF",
  },
  radiusText: {
    color: "#333",
    fontSize: 13,
    fontWeight: "600",
  },
  radiusTextActive: {
    color: "#fff",
  },
})
