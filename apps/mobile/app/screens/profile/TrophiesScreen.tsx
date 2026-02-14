import { useState, useEffect, useCallback } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"
const C = colors.palette

interface Trophy {
  id: string
  type: string
  earned_at: string
}

const TROPHY_LABELS: Record<string, string> = {
  activities_10: "10 Atividades",
  activities_50: "50 Atividades",
  activities_100: "100 Atividades",
  created_10: "10 Criadas",
  created_50: "50 Criadas",
  perfect_score_5: "5 Notas Perfeitas",
  trust_master: "Mestre da Confianca",
}

export const TrophiesScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [trophies, setTrophies] = useState<Trophy[]>([])

  const loadTrophies = useCallback(async () => {
    const res = await api.get<{ data: Trophy[] }>("/me/trophies")
    if (res.ok && res.data) {
      setTrophies(res.data.data)
    }
  }, [])

  useEffect(() => {
    loadTrophies()
  }, [loadTrophies])

  const renderTrophy = ({ item }: { item: Trophy }) => (
    <View style={styles.trophy}>
      <View style={styles.trophyIcon}>
        <Text style={styles.trophyEmoji}>*</Text>
      </View>
      <View style={styles.trophyInfo}>
        <Text style={styles.trophyName}>{TROPHY_LABELS[item.type] || item.type}</Text>
        <Text style={styles.trophyDate}>
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
        <Text style={styles.title}>{t("profile:trophies")}</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={trophies}
        keyExtractor={(item) => item.id}
        renderItem={renderTrophy}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum trofeu ainda</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.card },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backText: { color: C.primary, fontSize: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  list: { padding: 16 },
  trophy: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  trophyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trophyEmoji: { fontSize: 24 },
  trophyInfo: { flex: 1 },
  trophyName: { fontSize: 16, fontWeight: "600" },
  trophyDate: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  empty: { textAlign: "center", fontSize: 16, color: C.subtle, marginTop: 60 },
})
