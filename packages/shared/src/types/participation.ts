export type ParticipationStatus =
  | "pending"
  | "joined"
  | "confirmed"
  | "attended"
  | "no_show"
  | "cancelled"

export interface Participation {
  id: string
  user_id: string
  activity_id: string
  status: ParticipationStatus
  joined_at: string
  confirmed_at: string | null
  attended_at: string | null
  feedback_score: number | null
  feedback_text: string | null
}
