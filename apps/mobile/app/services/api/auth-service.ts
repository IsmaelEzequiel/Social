import { api } from "./index"
import { authStorage } from "../storage/auth-storage"

export interface AuthTokensResponse {
  user: {
    id: string
    display_name: string
    avatar_preset: number
    preferred_presets: number[]
    zone_id: string | null
    subscription_tier: "free" | "pro"
    auth_provider: "phone" | "google" | "apple"
    activities_joined_count: number
    activities_created_count: number
  }
  access_token: string
  refresh_token: string
  message?: string
}

export const authService = {
  requestCode: async (phone: string) => {
    const response = await api.post<{ message: string }>("/auth/request-code", { phone })
    if (!response.ok) throw new Error(response.data?.message || "Failed to send code")
    return response.data!
  },

  verify: async (phone: string, code: string, deviceFingerprint: string) => {
    const response = await api.post<AuthTokensResponse>("/auth/verify", {
      phone,
      code,
      device_fingerprint: deviceFingerprint,
    })
    if (!response.ok) throw new Error(response.data?.message || "Verification failed")
    const data = response.data!
    authStorage.setTokens(data.access_token, data.refresh_token)
    return data
  },

  refresh: async () => {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) throw new Error("No refresh token")

    const response = await api.post<AuthTokensResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    })
    if (!response.ok) {
      authStorage.clearTokens()
      throw new Error("Refresh failed")
    }
    const data = response.data!
    authStorage.setTokens(data.access_token, data.refresh_token)
    return data
  },

  logout: () => {
    authStorage.clearTokens()
  },
}
