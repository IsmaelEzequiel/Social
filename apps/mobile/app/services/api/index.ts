import { ApiResponse, ApisauceInstance, create } from "apisauce"
import { API_URL } from "./api-config"
import { loadString, saveString, remove } from "@/utils/storage"

const ACCESS_TOKEN_KEY = "impulse:accessToken"
const REFRESH_TOKEN_KEY = "impulse:refreshToken"

const apisauceInstance: ApisauceInstance = create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

// JWT interceptor — attach access token to every request
apisauceInstance.addRequestTransform((request) => {
  const token = loadString(ACCESS_TOKEN_KEY)
  if (token && request.headers) {
    ;(request.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
})

// Auto-refresh wrapper
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = loadString(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false

  // Create a separate instance to avoid interceptor loops
  const refreshApi = create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  })

  const res = await refreshApi.post<{ access_token: string; refresh_token: string }>(
    "/auth/refresh",
    { refresh_token: refreshToken },
  )

  if (res.ok && res.data) {
    saveString(ACCESS_TOKEN_KEY, res.data.access_token)
    saveString(REFRESH_TOKEN_KEY, res.data.refresh_token)
    return true
  }

  // Refresh failed — session is truly expired
  remove(ACCESS_TOKEN_KEY)
  remove(REFRESH_TOKEN_KEY)
  return false
}

function refreshTokenOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false
    refreshPromise = null
  })

  return refreshPromise
}

// Wrap apisauce methods with auto-refresh retry on 401
function withAutoRefresh<T>(
  method: (...args: unknown[]) => Promise<ApiResponse<T>>,
  ...args: unknown[]
): Promise<ApiResponse<T>> {
  return method.apply(apisauceInstance, args).then(async (response: ApiResponse<T>) => {
    if (response.status === 401) {
      const refreshed = await refreshTokenOnce()
      if (refreshed) {
        // Retry the original request with new token
        return method.apply(apisauceInstance, args) as Promise<ApiResponse<T>>
      }
    }
    return response
  })
}

// Proxy that auto-refreshes on 401 for all methods
const api = {
  get: <T>(...args: Parameters<ApisauceInstance["get"]>) =>
    withAutoRefresh<T>(apisauceInstance.get, ...args),
  post: <T>(...args: Parameters<ApisauceInstance["post"]>) =>
    withAutoRefresh<T>(apisauceInstance.post, ...args),
  put: <T>(...args: Parameters<ApisauceInstance["put"]>) =>
    withAutoRefresh<T>(apisauceInstance.put, ...args),
  patch: <T>(...args: Parameters<ApisauceInstance["patch"]>) =>
    withAutoRefresh<T>(apisauceInstance.patch, ...args),
  delete: <T>(...args: Parameters<ApisauceInstance["delete"]>) =>
    withAutoRefresh<T>(apisauceInstance.delete, ...args),
} as unknown as ApisauceInstance

export { api }
export { API_URL, WS_URL } from "./api-config"
