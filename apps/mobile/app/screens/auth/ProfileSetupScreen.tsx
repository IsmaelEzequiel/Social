import { useState, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { useTranslation } from "react-i18next"
import { api } from "@/services/api"
import { colors } from "@/theme/colors"
const C = colors.palette

const AVATARS = Array.from({ length: 20 }, (_, i) => i + 1)

export const ProfileSetupScreen = () => {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFinish = useCallback(async () => {
    if (displayName.trim().length < 2) {
      setError("Nome precisa ter pelo menos 2 caracteres")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.patch("/me", {
        display_name: displayName.trim(),
        avatar_preset: selectedAvatar,
      })
      // Navigation will auto-switch since we already have tokens
    } catch (e: any) {
      setError(e.message || "Erro ao salvar perfil")
    } finally {
      setLoading(false)
    }
  }, [displayName, selectedAvatar])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("auth:profileSetup.title")}</Text>

      <Text style={styles.label}>{t("auth:profileSetup.displayName")}</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t("auth:profileSetup.displayNamePlaceholder")}
        maxLength={30}
        autoFocus
      />

      <Text style={styles.label}>{t("auth:profileSetup.avatar")}</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((id) => (
          <TouchableOpacity
            key={id}
            style={[styles.avatarItem, selectedAvatar === id && styles.avatarSelected]}
            onPress={() => setSelectedAvatar(id)}
          >
            <Text style={styles.avatarText}>{id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <Text style={styles.buttonText}>{t("auth:profileSetup.finish")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: C.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 18,
  },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSelected: { backgroundColor: C.primary },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  error: { color: "#e53935", marginTop: 12 },
  button: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: C.white, fontSize: 18, fontWeight: "600" },
})
