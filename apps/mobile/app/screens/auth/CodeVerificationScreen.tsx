import { useState, useCallback, useEffect, useRef } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { useTranslation } from "react-i18next"
import type { AuthStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/api/auth-service"
import { getDeviceFingerprint } from "@/services/device/fingerprint"

const CODE_LENGTH = 6
const RESEND_DELAY = 60

export const CodeVerificationScreen = ({
  navigation,
  route,
}: AuthStackScreenProps<"CodeVerification">) => {
  const { t } = useTranslation()
  const { setTokens } = useAuth()
  const { phone } = route.params
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleVerify = useCallback(async () => {
    if (code.length !== CODE_LENGTH) return

    setLoading(true)
    setError("")

    try {
      const fingerprint = await getDeviceFingerprint()
      const data = await authService.verify(phone, code, fingerprint)
      setTokens(data.access_token, data.refresh_token)
      // Navigation will auto-switch to Main stack via AuthContext
    } catch (e: any) {
      setError(e.message || "Código inválido")
    } finally {
      setLoading(false)
    }
  }, [code, phone, setTokens])

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      handleVerify()
    }
  }, [code, handleVerify])

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return
    try {
      await authService.requestCode(phone)
      setResendTimer(RESEND_DELAY)
    } catch {
      setError("Erro ao reenviar código")
    }
  }, [phone, resendTimer])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth:codeVerification.title")}</Text>
      <Text style={styles.subtitle}>
        {t("auth:codeVerification.subtitle", { phone: phone.replace(/(\d{2})(\d+)(\d{4})/, "+$1 ••••• $3") })}
      </Text>

      <TextInput
        ref={inputRef}
        style={styles.codeInput}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        autoFocus
        textContentType="oneTimeCode"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && <ActivityIndicator style={styles.loader} />}

      <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
        <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0
            ? t("auth:codeVerification.resendIn", { seconds: resendTimer })
            : t("auth:codeVerification.resend")}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  codeInput: {
    backgroundColor: "#f0f0f0",
    fontSize: 32,
    letterSpacing: 12,
    textAlign: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  error: { color: "#e53935", textAlign: "center", marginBottom: 12 },
  loader: { marginBottom: 12 },
  resend: { textAlign: "center", color: "#6C63FF", fontSize: 16 },
  resendDisabled: { color: "#999" },
})
