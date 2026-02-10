import { loadString, saveString, remove } from "@/utils/storage"

const ACCESS_TOKEN_KEY = "impulse:accessToken"
const REFRESH_TOKEN_KEY = "impulse:refreshToken"

export const authStorage = {
  getAccessToken: () => loadString(ACCESS_TOKEN_KEY),
  getRefreshToken: () => loadString(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string) => {
    saveString(ACCESS_TOKEN_KEY, accessToken)
    saveString(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens: () => {
    remove(ACCESS_TOKEN_KEY)
    remove(REFRESH_TOKEN_KEY)
  },

  hasTokens: () => {
    return !!loadString(ACCESS_TOKEN_KEY)
  },
}
