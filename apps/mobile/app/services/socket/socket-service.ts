import { Socket, Channel } from "phoenix"
import { WS_URL } from "../api/api-config"
import { authStorage } from "../storage/auth-storage"

class SocketService {
  private socket: Socket | null = null
  private channels: Map<string, Channel> = new Map()

  connect() {
    const token = authStorage.getAccessToken()
    if (!token) return

    this.socket = new Socket(WS_URL, {
      params: { token },
      reconnectAfterMs: (tries: number) => [1000, 2000, 5000, 10000][Math.min(tries - 1, 3)],
    })

    this.socket.connect()
  }

  disconnect() {
    this.channels.forEach((channel) => channel.leave())
    this.channels.clear()
    this.socket?.disconnect()
    this.socket = null
  }

  joinChannel(topic: string, params: Record<string, unknown> = {}): Channel | null {
    if (!this.socket) return null

    const existing = this.channels.get(topic)
    if (existing) return existing

    const channel = this.socket.channel(topic, params)
    channel
      .join()
      .receive("ok", () => console.log(`Joined ${topic}`))
      .receive("error", (resp: unknown) => console.error(`Failed to join ${topic}:`, resp))

    this.channels.set(topic, channel)
    return channel
  }

  leaveChannel(topic: string) {
    const channel = this.channels.get(topic)
    if (channel) {
      channel.leave()
      this.channels.delete(topic)
    }
  }

  getChannel(topic: string): Channel | null {
    return this.channels.get(topic) || null
  }

  isConnected(): boolean {
    return this.socket?.isConnected() || false
  }
}

export const socketService = new SocketService()
