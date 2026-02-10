import { View, Text, StyleSheet } from "react-native"
import { useRoute } from "@react-navigation/native"

export const PlaceholderScreen = () => {
  const route = useRoute()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{route.name}</Text>
      <Text style={styles.subtext}>Em construção</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtext: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
})
