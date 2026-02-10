import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from "react-native"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { api } from "@/services/api"

export const SubscriptionScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    const res = await api.post<{ checkout_url: string }>("/subscriptions")
    setLoading(false)

    if (res.ok && res.data?.checkout_url) {
      Linking.openURL(res.data.checkout_url)
    } else {
      Alert.alert("Erro", "Falha ao iniciar assinatura")
    }
  }

  const handleCancel = async () => {
    Alert.alert(
      t("subscription:cancel"),
      "Tem certeza?",
      [
        { text: t("common:cancel"), style: "cancel" },
        {
          text: t("common:confirm"),
          style: "destructive",
          onPress: async () => {
            const res = await api.delete("/subscriptions")
            if (res.ok) {
              Alert.alert("OK", "Assinatura cancelada")
            } else {
              Alert.alert("Erro", "Falha ao cancelar")
            }
          },
        },
      ],
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("common:back")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>{t("subscription:title")}</Text>
        <Text style={styles.price}>{t("subscription:price")}</Text>
      </View>

      <View style={styles.benefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitCheck}>*</Text>
          <Text style={styles.benefitText}>{t("subscription:benefits.unlimitedPlanned")}</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitCheck}>*</Text>
          <Text style={styles.benefitText}>{t("subscription:benefits.extendedDuration")}</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitCheck}>*</Text>
          <Text style={styles.benefitText}>{t("subscription:benefits.priorityVisibility")}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
      >
        <Text style={styles.subscribeBtnText}>
          {loading ? t("common:loading") : t("subscription:subscribe")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
        <Text style={styles.cancelText}>{t("subscription:cancel")}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: { padding: 16, paddingTop: 60 },
  backText: { color: "#6C63FF", fontSize: 16 },
  hero: { alignItems: "center", paddingVertical: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#6C63FF" },
  price: { fontSize: 20, fontWeight: "600", color: "#333", marginTop: 8 },
  benefits: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  benefitItem: { flexDirection: "row", alignItems: "center" },
  benefitCheck: { fontSize: 20, marginRight: 12, color: "#4CAF50" },
  benefitText: { fontSize: 16, color: "#333", flex: 1 },
  subscribeBtn: {
    backgroundColor: "#6C63FF",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  cancelLink: {
    alignItems: "center",
    marginTop: 16,
    padding: 12,
  },
  cancelText: { color: "#FF3B30", fontSize: 14 },
})
