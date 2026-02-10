import { createContext, FC, PropsWithChildren, useCallback, useContext } from "react"
import { useMMKVString } from "react-native-mmkv"

export type AuthContextType = {
  isAuthenticated: boolean
  accessToken?: string
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accessToken, setAccessToken] = useMMKVString("impulse:accessToken")
  const [, setRefreshToken] = useMMKVString("impulse:refreshToken")

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
  }, [setAccessToken, setRefreshToken])

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    accessToken,
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
