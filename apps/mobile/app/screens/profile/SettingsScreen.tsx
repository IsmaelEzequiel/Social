import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { api } from "@/services/api"

interface UserProfile {
  display_name: string
  avatar_preset: number
}

export const SettingsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [displayName, setDisplayName] = useState("")
  const [avatarPreset, setAvatarPreset] = useState(1)
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    const res = await api.get<{ data: UserProfile }>("/me")
    if (res.ok && res.data) {
      setDisplayName(res.data.data.display_name)
      setAvatarPreset(res.data.data.avatar_preset)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async () => {
    setSaving(true)
    const res = await api.patch("/me", { display_name: displayName, avatar_preset: avatarPreset })
    setSaving(false)

    if (res.ok) {
      Alert.alert("OK", "Perfil atualizado")
    } else {
      Alert.alert("Erro", "Falha ao salvar")
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("common:back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("profile:settings")}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={30}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Avatar</Text>
        <View style={styles.avatarGrid}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.avatarOption, avatarPreset === preset && styles.avatarSelected]}
              onPress={() => setAvatarPreset(preset)}
            >
              <Text style={styles.avatarNum}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? t("common:loading") : t("common:save")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
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
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSelected: { backgroundColor: "#6C63FF" },
  avatarNum: { fontWeight: "700", fontSize: 16 },
  saveBtn: {
    backgroundColor: "#6C63FF",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
