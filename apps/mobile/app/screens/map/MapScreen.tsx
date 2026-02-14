import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { View, TouchableOpacity, Text, StyleSheet, Modal, Dimensions } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import type { Activity } from "@impulse/shared"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import MapboxGL from "@rnmapbox/maps"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated"
import { useTranslation } from "react-i18next"

import { ActivityPin } from "@/components/ActivityPin"
import { useAuth } from "@/context/AuthContext"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { socketService } from "@/services/socket/socket-service"
import { colors } from "@/theme/colors"

const C = colors.palette

import { ActivityDetailModal } from "./ActivityDetailModal"
import { CreateActivitySheet } from "./CreateActivitySheet"

type Nav = NativeStackNavigationProp<AppStackParamList>

interface MapActivity extends Activity {
  participant_count?: number
  my_participation_status?: string | null
  time_until_start_minutes?: number
  time_remaining_minutes?: number
  preset?: { name: string; icon: string }
  creator?: { display_name: string; avatar_preset: number }
}

const RADIUS_OPTIONS = [
  { label: "1 km", meters: 1000, zoom: 15 },
  { label: "5 km", meters: 5000, zoom: 13 },
  { label: "10 km", meters: 10000, zoom: 12 },
  { label: "25 km", meters: 25000, zoom: 10 },
]

export const MapScreen = () => {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const navigation = useNavigation<Nav>()
  const [activities, setActivities] = useState<MapActivity[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<MapActivity | null>(null)
  const [radiusIndex, setRadiusIndex] = useState(1) // default 5km
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const [pickedLocation, setPickedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [pickingLocation, setPickingLocation] = useState(false)

  const channelRef = useRef<ReturnType<typeof socketService.joinChannel>>(null)
  const cameraRef = useRef<MapboxGL.Camera>(null)

  // Spring animation for bottom sheets (dashboard spec: damping 0.8, stiffness 300)
  const screenHeight = Dimensions.get("window").height
  const createSheetY = useSharedValue(screenHeight)
  const detailSheetY = useSharedValue(screenHeight)

  const SPRING_CONFIG = { damping: 20, stiffness: 300 }

  useEffect(() => {
    createSheetY.value = withSpring(showCreate ? 0 : screenHeight, SPRING_CONFIG)
  }, [showCreate, createSheetY, screenHeight])

  useEffect(() => {
    detailSheetY.value = withSpring(selectedActivity ? 0 : screenHeight, SPRING_CONFIG)
  }, [selectedActivity, detailSheetY, screenHeight])

  const createSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: createSheetY.value }],
  }))

  const detailSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detailSheetY.value }],
  }))

  // FAB pulse animation when no activities
  const fabPulse = useSharedValue(1)

  useEffect(() => {
    if (activities.length === 0 && !pickingLocation) {
      fabPulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        false,
      )
    } else {
      fabPulse.value = 1
    }
  }, [activities.length, pickingLocation, fabPulse])

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabPulse.value }],
  }))

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
    const isOwner = activity.creator_id === userId
    const status = activity.my_participation_status
    if (isOwner || status === "joined" || status === "confirmed" || status === "attended") {
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

  const handleMapPress = useCallback(
    (event: { geometry: { coordinates: number[] } }) => {
      if (pickingLocation) {
        const [lng, lat] = event.geometry.coordinates
        setPickedLocation({ latitude: lat, longitude: lng })
      }
    },
    [pickingLocation],
  )

  const handleRadiusChange = useCallback(
    (index: number) => {
      setRadiusIndex(index)
      // Auto-zoom map to match selected radius
      if (cameraRef.current && userLocation) {
        cameraRef.current.setCamera({
          centerCoordinate: [userLocation.longitude, userLocation.latitude],
          zoomLevel: RADIUS_OPTIONS[index].zoom,
          animationDuration: 500,
          animationMode: "flyTo",
        })
      }
    },
    [userLocation],
  )

  const handleFabPress = () => {
    if (pickingLocation && pickedLocation) {
      setPickingLocation(false)
      setShowCreate(true)
    } else {
      setPickingLocation(true)
      setPickedLocation(null)
    }
  }

  const handleCancelPick = () => {
    setPickingLocation(false)
    setPickedLocation(null)
  }

  const handleJoined = useCallback(
    (activityId: string) => {
      setSelectedActivity(null)
      navigation.navigate("EventRoom", { activityId })
    },
    [navigation],
  )

  // Radius circle GeoJSON for overlay
  const radiusCircleGeoJSON = useMemo(() => {
    if (!userLocation) return null
    const points = 64
    const coords: [number, number][] = []
    const radiusKm = radiusMeters / 1000
    const lat = userLocation.latitude
    const lng = userLocation.longitude

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
      const dy = radiusKm / 110.574
      coords.push([lng + dx * Math.cos(angle), lat + dy * Math.sin(angle)])
    }

    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords],
      },
      properties: {},
    }
  }, [userLocation, radiusMeters])

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t("common:loading")}</Text>
      </View>
    )
  }

  const createLat = pickedLocation?.latitude ?? userLocation.latitude
  const createLng = pickedLocation?.longitude ?? userLocation.longitude

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onRegionDidChange={handleRegionChange}
        onPress={handleMapPress}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          zoomLevel={RADIUS_OPTIONS[radiusIndex].zoom}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible />

        {/* Radius circle overlay */}
        {radiusCircleGeoJSON && !pickingLocation && (
          <MapboxGL.ShapeSource id="radius-circle" shape={radiusCircleGeoJSON}>
            <MapboxGL.FillLayer
              id="radius-fill"
              style={{ fillColor: "rgba(108, 99, 255, 0.08)" }}
            />
            <MapboxGL.LineLayer
              id="radius-line"
              style={{
                lineColor: "rgba(108, 99, 255, 0.25)",
                lineWidth: 1,
                lineDasharray: [4, 4],
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Picked location pin */}
        {pickingLocation && pickedLocation && (
          <MapboxGL.MarkerView
            coordinate={[pickedLocation.longitude, pickedLocation.latitude]}
          >
            <View style={styles.pickedPin}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </View>
          </MapboxGL.MarkerView>
        )}

        {/* Activity markers */}
        {activities
          .filter((a) => a.location?.latitude != null && a.location?.longitude != null)
          .map((activity) => (
            <MapboxGL.MarkerView
              key={activity.id}
              coordinate={[activity.location.longitude, activity.location.latitude]}
            >
              <TouchableOpacity onPress={() => handleMarkerPress(activity)}>
                <ActivityPin
                  presetIcon={activity.preset?.icon || "lightning-bolt"}
                  presetName={activity.preset?.name || ""}
                  participantCount={activity.participant_count || 0}
                  maxParticipants={activity.max_participants}
                  status={activity.status}
                  timeUntilStartMinutes={activity.time_until_start_minutes}
                  timeRemainingMinutes={activity.time_remaining_minutes}
                />
              </TouchableOpacity>
            </MapboxGL.MarkerView>
          ))}
      </MapboxGL.MapView>

      {/* Empty state overlay */}
      {activities.length === 0 && !pickingLocation && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyTitle}>{t("map:empty.title")}</Text>
          <Text style={styles.emptySubtitle}>{t("map:empty.subtitle")}</Text>
        </View>
      )}

      {/* Radius Filter */}
      {!pickingLocation && (
        <View style={styles.radiusBar}>
          {RADIUS_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.meters}
              style={[styles.radiusPill, i === radiusIndex && styles.radiusPillActive]}
              onPress={() => handleRadiusChange(i)}
            >
              <Text style={[styles.radiusText, i === radiusIndex && styles.radiusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Location picking banner */}
      {pickingLocation && (
        <View style={styles.pickBanner}>
          <Text style={styles.pickBannerText}>
            {pickedLocation
              ? t("activity:create.chooseLocation") + " \u2713"
              : t("activity:create.chooseLocation")}
          </Text>
          <TouchableOpacity onPress={handleCancelPick}>
            <Text style={styles.pickCancelText}>{t("common:cancel")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <Animated.View style={[styles.fabContainer, fabAnimStyle]}>
        <TouchableOpacity
          style={[styles.fab, pickingLocation && !pickedLocation && styles.fabDisabled]}
          onPress={handleFabPress}
          disabled={pickingLocation && !pickedLocation}
        >
          <MaterialCommunityIcons
            name={pickingLocation ? "check" : "plus"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Create Sheet — spring-animated bottom sheet */}
      {showCreate && (
        <Animated.View style={[styles.sheetOverlay, createSheetStyle]}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowCreate(false)
              setPickedLocation(null)
            }}
          />
          <CreateActivitySheet
            latitude={createLat}
            longitude={createLng}
            onCreated={() => {
              setShowCreate(false)
              setPickedLocation(null)
              loadActivities(userLocation.latitude, userLocation.longitude)
            }}
            onClose={() => {
              setShowCreate(false)
              setPickedLocation(null)
            }}
          />
        </Animated.View>
      )}

      {/* Detail Sheet — spring-animated bottom sheet */}
      {selectedActivity && (
        <Animated.View style={[styles.sheetOverlay, detailSheetStyle]}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedActivity(null)}
          />
          <ActivityDetailModal
            activity={selectedActivity}
            onJoined={handleJoined}
            onLeft={() => {
              setSelectedActivity(null)
              loadActivities(userLocation.latitude, userLocation.longitude)
            }}
            onClose={() => setSelectedActivity(null)}
          />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    bottom: 100,
    left: 40,
    padding: 20,
    position: "absolute",
    right: 40,
  },
  emptySubtitle: { color: C.subtle, fontSize: 14, textAlign: "center" },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  fab: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 28,
    elevation: 8,
    height: 56,
    justifyContent: "center",
    shadowColor: C.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: 56,
  },
  fabContainer: {
    bottom: 24,
    position: "absolute",
    right: 24,
  },
  fabDisabled: { opacity: 0.4 },
  loadingContainer: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: C.subtle, fontSize: 16 },
  map: { flex: 1 },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  pickBanner: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "absolute",
    right: 16,
    top: 60,
  },
  pickBannerText: { color: C.white, fontSize: 15, fontWeight: "600" },
  pickCancelText: { color: C.white, fontSize: 14, opacity: 0.8 },
  pickedPin: {
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
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
    backgroundColor: C.white,
    borderRadius: 20,
    elevation: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: C.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  radiusPillActive: { backgroundColor: C.primary },
  radiusText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  radiusTextActive: { color: C.white },
})
