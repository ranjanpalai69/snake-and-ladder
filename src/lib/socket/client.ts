import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    // Empty string → Socket.IO uses window.location.origin (same-origin, correct for Render)
    // Explicit URL → used in development or custom deployments
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
    socket = io(url, {
      autoConnect: false,
      withCredentials: true,
      // WebSocket first for lowest latency; polling as reliable fallback
      transports: ["websocket", "polling"],
      // Exponential back-off reconnect — unlimited attempts
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.4,
      timeout: 15000,
      // Force a new connection (don't multiplex with unrelated sockets on the same origin)
      forceNew: false,
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
