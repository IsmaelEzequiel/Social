import { useState, useCallback } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import type { AuthStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/api/auth-service"
import { colors } from "@/theme/colors"
const C = colors.palette

export const PhoneEntryScreen = ({ navigation }: AuthStackScreenProps<"PhoneEntry">) => {
  const { t } = useTranslation()
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+55")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSend = useCallback(async () => {
    const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Número inválido")
      return
    }

    setLoading(true)
    setError("")

    try {
      await authService.requestCode(fullPhone)
      navigation.navigate("CodeVerification", { phone: fullPhone, countryCode })
    } catch (e: any) {
      setError(e.message || "Erro ao enviar código")
    } finally {
      setLoading(false)
    }
  }, [phone, countryCode, navigation])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth:phoneEntry.title")}</Text>
      <Text style={styles.subtitle}>{t("auth:phoneEntry.subtitle")}</Text>

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.countryCode}>
          <Text style={styles.countryCodeText}>{countryCode}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t("auth:phoneEntry.placeholder")}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <Text style={styles.buttonText}>{t("auth:phoneEntry.send")}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: C.textSecondary, marginBottom: 32 },
  inputRow: { flexDirection: "row", marginBottom: 16 },
  countryCode: {
    backgroundColor: C.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  countryCodeText: { fontSize: 18, fontWeight: "600" },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 18,
  },
  error: { color: "#e53935", marginBottom: 12 },
  button: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: C.white, fontSize: 18, fontWeight: "600" },
})
