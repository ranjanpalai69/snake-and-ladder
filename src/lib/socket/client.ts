import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "", {
      autoConnect: false,
      withCredentials: true,
      // Transport order: WebSocket first (fastest), polling as fallback
      transports: ["websocket", "polling"],
      // Automatic reconnection with exponential backoff
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.3,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(
  token: string,
  avatarId: string,
  rank: object,
  level: number
): AppSocket {
  const s = getSocket();
  // Update auth before (re)connecting — token may be refreshed
  s.auth = { token, avatarId, rank, level };
  if (!s.connected) s.connect();
  return s;
}

/** Call this on sign-out only. Refresh should NOT disconnect. */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
