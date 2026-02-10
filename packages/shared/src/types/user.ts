export type UserStatus = "active" | "shadow_banned" | "suspended"
export type SubscriptionTier = "free" | "pro"

export interface User {
  id: string
  display_name: string
  avatar_preset: number
  preferred_presets: number[]
  zone_id: string | null
  subscription_tier: SubscriptionTier
  activities_joined_count: number
  activities_created_count: number
  inserted_at: string
  updated_at: string
}
