import { useEffect, useMemo } from "react"
import { View, Text, StyleSheet } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated"

import { colors } from "@/theme/colors"

import { PresetIcon } from "./PresetIcon"

const C = colors.palette

interface ActivityPinProps {
  presetIcon: string
  presetName: string
  participantCount: number
  maxParticipants: number
  status: string
  timeUntilStartMinutes?: number
  timeRemainingMinutes?: number
  animate?: boolean
}

/** Color coding per dashboard spec:
 * Green  = starting soon (< 15 min)
 * Blue   = active now
 * Yellow = filling up (> 75% full)
 * Purple = default (open, future)
 * Grey   = completed/expired
 */
function getPinColor(
  status: string,
  timeUntilStartMinutes: number,
  participantCount: number,
  maxParticipants: number,
): string {
  if (status === "completed" || status === "cancelled") return C.pinGrey
  if (status === "active") return C.pinBlue
  if (participantCount / maxParticipants > 0.75) return C.pinYellow
  if (timeUntilStartMinutes <= 15) return C.pinGreen
  return C.pinPurple
}

function formatTime(minutes: number): string {
  if (minutes <= 0) return ""
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

export const ActivityPin = ({
  presetIcon,
  participantCount,
  maxParticipants,
  status,
  timeUntilStartMinutes = 0,
  timeRemainingMinutes = 0,
  animate = false,
}: ActivityPinProps) => {
  const scale = useSharedValue(0)
  const pulseOpacity = useSharedValue(0)

  // Entrance animation: scale 0→1 with overshoot (dashboard spec)
  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 300 })
  }, [scale])

  const pinColor = useMemo(
    () => getPinColor(status, timeUntilStartMinutes, participantCount, maxParticipants),
    [status, timeUntilStartMinutes, participantCount, maxParticipants],
  )

  // Time display: active → time remaining; future → time until start
  const timeLabel = useMemo(() => {
    if (status === "active") return formatTime(timeRemainingMinutes)
    if (status === "completed" || status === "cancelled") return ""
    return formatTime(timeUntilStartMinutes)
  }, [status, timeRemainingMinutes, timeUntilStartMinutes])

  // Join/leave bounce animation
  useEffect(() => {
    if (animate) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 400 }),
        withSpring(1, { damping: 8, stiffness: 300 }),
      )
    }
  }, [animate, participantCount, scale])

  useEffect(() => {
    if (status === "active" || timeUntilStartMinutes <= 5) {
      // Pulse for active or starting very soon
      const speed = timeUntilStartMinutes <= 5 && status !== "active" ? 600 : 1000
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: speed }), withTiming(0, { duration: speed })),
        -1,
        false,
      )
    } else {
      pulseOpacity.value = 0
    }
  }, [status, timeUntilStartMinutes, pulseOpacity])

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  return (
    <View style={styles.wrapper}>
      {(status === "active" || timeUntilStartMinutes <= 5) && (
        <Animated.View style={[styles.pulse, { backgroundColor: pinColor }, pulseStyle]} />
      )}
      <Animated.View style={[styles.container, { backgroundColor: pinColor }, pinStyle]}>
        <PresetIcon icon={presetIcon} size={16} color="#fff" />
        <Text style={styles.count}>
          {participantCount}/{maxParticipants}
        </Text>
        {!!timeLabel && <Text style={styles.time}>{timeLabel}</Text>}
      </Animated.View>
      <View style={[styles.pointer, { borderTopColor: pinColor }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 20,
    elevation: 4,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  count: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  pointer: {
    alignSelf: "center",
    borderLeftColor: "transparent",
    borderLeftWidth: 6,
    borderRightColor: "transparent",
    borderRightWidth: 6,
    borderTopWidth: 6,
    height: 0,
    width: 0,
  },
  pulse: {
    borderRadius: 30,
    height: 60,
    position: "absolute",
    width: 60,
  },
  time: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "600" },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
})
