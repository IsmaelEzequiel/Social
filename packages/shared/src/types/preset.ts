export interface Preset {
  id: string
  name: string
  icon: string
  locale: string
  allowed_hours: {
    start: number
    end: number
  }
  max_duration: number
  sort_order: number
  active: boolean
}
