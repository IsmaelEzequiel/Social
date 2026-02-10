import { ApisauceInstance, create } from "apisauce"
import { API_URL } from "./api-config"
import { loadString } from "@/utils/storage"

const STORAGE_KEY_ACCESS_TOKEN = "impulse:accessToken"

const api: ApisauceInstance = create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

// JWT interceptor — attach access token to every request
api.addRequestTransform((request) => {
  const token = loadString(STORAGE_KEY_ACCESS_TOKEN)
  if (token && request.headers) {
    ;(request.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
})

export { api }
export { API_URL, WS_URL } from "./api-config"
