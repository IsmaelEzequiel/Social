import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native"
import { useTranslation } from "react-i18next"
import type { AuthStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { auth0Service } from "@/services/api/auth0-service"

export const AuthMethodScreen = ({ navigation }: AuthStackScreenProps<"AuthMethod">) => {
  const { t } = useTranslation()
  const { setTokens } = useAuth()
  const [loading, setLoading] = useState<"google" | "apple" | null>(null)
  const [error, setError] = useState("")

  const handleSocialLogin = useCallback(
    async (provider: "google" | "apple") => {
      setLoading(provider)
      setError("")
      try {
        const loginFn =
          provider === "google" ? auth0Service.loginWithGoogle : auth0Service.loginWithApple
        const data = await loginFn()
        setTokens(data.access_token, data.refresh_token)

        // If user has default name, navigate to profile setup
        if (data.user.display_name === "Impulser") {
          navigation.navigate("ProfileSetup")
        }
        // Otherwise, AuthContext will auto-switch to Main stack
      } catch (e: any) {
        setError(e.message || t("auth:authMethod.error"))
      } finally {
        setLoading(null)
      }
    },
    [setTokens, navigation, t],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth:authMethod.title")}</Text>
      <Text style={styles.subtitle}>{t("auth:authMethod.subtitle")}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleSocialLogin("google")}
          disabled={loading !== null}
        >
          {loading === "google" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("auth:authMethod.google")}</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={() => handleSocialLogin("apple")}
            disabled={loading !== null}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("auth:authMethod.apple")}</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.phoneButton]}
          onPress={() => navigation.navigate("PhoneEntry")}
          disabled={loading !== null}
        >
          <Text style={styles.phoneButtonText}>{t("auth:authMethod.phone")}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 40 },
  buttons: { gap: 12 },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  googleButton: { backgroundColor: "#4285F4" },
  appleButton: { backgroundColor: "#000" },
  phoneButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6C63FF",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  phoneButtonText: { color: "#6C63FF", fontSize: 18, fontWeight: "600" },
  error: { color: "#e53935", textAlign: "center", marginTop: 16 },
})
