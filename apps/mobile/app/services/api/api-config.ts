export const API_URL = __DEV__
  ? "http://localhost:4000/api/v1"
  : "https://api.impulse.app/api/v1"

export const WS_URL = __DEV__
  ? "ws://localhost:4000/socket"
  : "wss://api.impulse.app/socket"
