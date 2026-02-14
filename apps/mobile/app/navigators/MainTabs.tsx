import { useEffect, useState, useCallback, useRef } from "react"
import { AppState } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { MapScreen } from "@/screens/map/MapScreen"
import { MyEventsScreen } from "@/screens/events/MyEventsScreen"
import { ProfileScreen } from "@/screens/profile/ProfileScreen"
import { UpcomingListScreen } from "@/screens/upcoming/UpcomingListScreen"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"

const C = colors.palette

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

function formatBadge(count: number): string | undefined {
  if (count <= 0) return undefined
  if (count > 9) return "9+"
  return String(count)
}

export const MainTabs = () => {
  const { t } = useTranslation()
  const [messageCount, setMessageCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessageCount = useCallback(async () => {
    const res = await api.get<{ count: number }>("/activities/upcoming/messages-count")
    if (res.ok && res.data) {
      setMessageCount(res.data.count)
    }
  }, [])

  useEffect(() => {
    fetchMessageCount()
    intervalRef.current = setInterval(fetchMessageCount, 30_000)

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchMessageCount()
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      sub.remove()
    }
  }, [fetchMessageCount])

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.subtle,
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: t("map:title"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UpcomingTab"
        component={UpcomingListScreen}
        options={{
          title: t("upcoming:title"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
          ),
          tabBarBadge: formatBadge(messageCount),
          tabBarBadgeStyle: { backgroundColor: C.primary, fontSize: 11 },
        }}
      />
      <Tab.Screen
        name="MyEventsTab"
        component={MyEventsScreen}
        options={{
          title: t("myEvents:title"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightning-bolt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t("profile:title"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
