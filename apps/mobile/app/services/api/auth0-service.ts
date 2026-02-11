import Auth0 from "react-native-auth0"
import { api } from "./index"
import { authStorage } from "../storage/auth-storage"
import { getDeviceFingerprint } from "../device/fingerprint"
import type { AuthTokensResponse } from "./auth-service"

const auth0 = new Auth0({
  domain: "your-tenant.auth0.com",
  clientId: "your-client-id",
})

async function exchangeTokenWithBackend(idToken: string): Promise<AuthTokensResponse> {
  const fingerprint = await getDeviceFingerprint()
  const response = await api.post<AuthTokensResponse>("/auth/social", {
    id_token: idToken,
    device_fingerprint: fingerprint,
  })
  if (!response.ok) throw new Error(response.data?.message || "Social login failed")
  const data = response.data!
  authStorage.setTokens(data.access_token, data.refresh_token)
  return data
}

export const auth0Service = {
  loginWithGoogle: async (): Promise<AuthTokensResponse> => {
    const credentials = await auth0.webAuth.authorize({
      connection: "google-oauth2",
      scope: "openid profile email",
    })
    return exchangeTokenWithBackend(credentials.idToken)
  },

  loginWithApple: async (): Promise<AuthTokensResponse> => {
    const credentials = await auth0.webAuth.authorize({
      connection: "apple",
      scope: "openid profile email",
    })
    return exchangeTokenWithBackend(credentials.idToken)
  },
}
