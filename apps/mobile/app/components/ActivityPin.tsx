import { useEffect } from "react"
import { View, Text, StyleSheet } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated"

interface ActivityPinProps {
  presetIcon: string
  presetName: string
  participantCount: number
  maxParticipants: number
  status: string
  animate?: boolean
}

export const ActivityPin = ({
  presetIcon,
  participantCount,
  maxParticipants,
  status,
  animate = false,
}: ActivityPinProps) => {
  const isFull = status === "full"
  const scale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0)

  useEffect(() => {
    if (animate) {
      // Join pulse animation
      scale.value = withSequence(
        withTiming(1.3, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) }),
      )
    }
  }, [animate, participantCount, scale])

  useEffect(() => {
    if (status === "active") {
      // Breathing pulse for active activities
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      )
    }
  }, [status, pulseOpacity])

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  return (
    <View style={styles.wrapper}>
      {status === "active" && (
        <Animated.View style={[styles.pulse, pulseStyle]} />
      )}
      <Animated.View style={[styles.container, isFull && styles.fullContainer, pinStyle]}>
        <Text style={styles.icon}>{presetIcon}</Text>
        <Text style={styles.count}>
          {participantCount}/{maxParticipants}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6C63FF",
  },
  container: {
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullContainer: { backgroundColor: "#FF6B6B" },
  icon: { fontSize: 16 },
  count: { color: "#fff", fontSize: 12, fontWeight: "bold" },
})
