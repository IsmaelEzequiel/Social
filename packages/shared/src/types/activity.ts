export type ActivityMode = "flash" | "planned" | "recurring"
export type ActivityStatus = "open" | "full" | "active" | "completed" | "cancelled"

export interface Activity {
  id: string
  creator_id: string
  mode: ActivityMode
  preset_id: string
  title: string
  location: {
    latitude: number
    longitude: number
  }
  location_name: string | null
  starts_at: string
  duration_minutes: number
  max_participants: number
  min_participants: number
  status: ActivityStatus
  confirmed_count: number
  participant_count?: number
  requires_approval: boolean
  inserted_at: string
}
