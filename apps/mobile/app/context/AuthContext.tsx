import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect } from "react"
import { useMMKVString } from "react-native-mmkv"

import { api } from "@/services/api"

export type AuthContextType = {
  isAuthenticated: boolean
  accessToken?: string
  userId?: string
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accessToken, setAccessToken] = useMMKVString("impulse:accessToken")
  const [, setRefreshToken] = useMMKVString("impulse:refreshToken")
  const [userId, setUserId] = useMMKVString("impulse:userId")

  const setTokens = useCallback(
    (access: string, refresh: string) => {
      setAccessToken(access)
      setRefreshToken(refresh)
    },
    [setAccessToken, setRefreshToken],
  )

  const logout = useCallback(() => {
    setAccessToken(undefined)
    setRefreshToken(undefined)
    setUserId(undefined)
  }, [setAccessToken, setRefreshToken, setUserId])

  // Fetch user ID when authenticated and not yet stored
  useEffect(() => {
    if (accessToken && !userId) {
      api.get<{ data: { id: string } }>("/me").then((res) => {
        if (res.ok && res.data) {
          setUserId(res.data.data.id)
        }
      })
    }
  }, [accessToken, userId, setUserId])

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    accessToken,
    userId,
    setTokens,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
