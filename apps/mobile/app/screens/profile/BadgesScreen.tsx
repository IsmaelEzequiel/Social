import { useState, useEffect, useCallback } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { api } from "@/services/api"

interface Badge {
  id: string
  type: string
  earned_at: string
}

const BADGE_LABELS: Record<string, string> = {
  first_activity: "Primeira Atividade",
  social_butterfly: "Borboleta Social",
  organizer: "Organizador",
  explorer: "Explorador",
  streak_7: "7 Dias Seguidos",
  streak_30: "30 Dias Seguidos",
  trusted: "Confiavel",
  pro_member: "Membro Pro",
}

export const BadgesScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [badges, setBadges] = useState<Badge[]>([])

  const loadBadges = useCallback(async () => {
    const res = await api.get<{ data: Badge[] }>("/me/badges")
    if (res.ok && res.data) {
      setBadges(res.data.data)
    }
  }, [])

  useEffect(() => {
    loadBadges()
  }, [loadBadges])

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={styles.badge}>
      <View style={styles.badgeIcon}>
        <Text style={styles.badgeEmoji}>*</Text>
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{BADGE_LABELS[item.type] || item.type}</Text>
        <Text style={styles.badgeDate}>
          {new Date(item.earned_at).toLocaleDateString("pt-BR")}
        </Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("common:back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("profile:badges")}</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={badges}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma conquista ainda</Text>}
      />
    </View>
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
  },
  backText: { color: "#6C63FF", fontSize: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  list: { padding: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF3CD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  badgeEmoji: { fontSize: 24 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 16, fontWeight: "600" },
  badgeDate: { fontSize: 13, color: "#666", marginTop: 2 },
  empty: { textAlign: "center", fontSize: 16, color: "#999", marginTop: 60 },
})
