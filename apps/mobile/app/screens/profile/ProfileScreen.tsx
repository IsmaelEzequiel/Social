import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { colors } from "@/theme/colors"
const C = colors.palette

type Nav = NativeStackNavigationProp<AppStackParamList>

interface UserProfile {
  id: string
  display_name: string
  avatar_preset: number
  activities_joined: number
  activities_created: number
  subscription_tier: string
}

export const ProfileScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const loadProfile = useCallback(async () => {
    const res = await api.get<{ data: UserProfile }>("/me")
    if (res.ok && res.data) {
      setProfile(res.data.data)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {profile ? (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.avatar_preset}</Text>
            </View>
            <Text style={styles.name}>{profile.display_name}</Text>
            {profile.subscription_tier === "pro" && (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </>
        ) : (
          <Text>{t("common:loading")}</Text>
        )}
      </View>

      {profile && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.activities_joined}</Text>
            <Text style={styles.statLabel}>{t("profile:activitiesJoined")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.activities_created}</Text>
            <Text style={styles.statLabel}>{t("profile:activitiesCreated")}</Text>
          </View>
        </View>
      )}

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Badges")}>
          <Text style={styles.menuText}>{t("profile:badges")}</Text>
          <Text style={styles.menuArrow}>{">"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Trophies")}>
          <Text style={styles.menuText}>{t("profile:trophies")}</Text>
          <Text style={styles.menuArrow}>{">"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Subscription")}
        >
          <Text style={styles.menuText}>{t("profile:subscription")}</Text>
          <Text style={styles.menuArrow}>{">"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.menuText}>{t("profile:settings")}</Text>
          <Text style={styles.menuArrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t("common:logOut")}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: C.white, fontSize: 28, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  proBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  proText: { fontWeight: "800", fontSize: 12, color: C.textSecondary },
  stats: {
    flexDirection: "row",
    backgroundColor: C.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: C.primary },
  statLabel: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: C.divider },
  menu: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.inputBg,
  },
  menuText: { fontSize: 16, fontWeight: "500" },
  menuArrow: { fontSize: 18, color: C.disabled },
  logoutBtn: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: C.white,
  },
  logoutText: { color: "#FF3B30", fontWeight: "600", fontSize: 16 },
})
