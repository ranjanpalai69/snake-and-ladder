import type { GameState, GameMove } from "./game";
import type { Room, RoomSummary, CreateRoomPayload, JoinRoomPayload } from "./room";

// ── Events the CLIENT sends to the SERVER ──────────────────────────────────
export interface ClientToServerEvents {
  // Room
  "room:create": (payload: CreateRoomPayload, cb: (res: SocketResponse<Room>) => void) => void;
  "room:join": (payload: JoinRoomPayload, cb: (res: SocketResponse<Room>) => void) => void;
  "room:reconnect": (payload: { roomId: string }, cb: (res: SocketResponse<{ room: Room; gameState: import("./game").GameState | null }>) => void) => void;
  "room:leave": () => void;
  "room:list": (cb: (res: SocketResponse<RoomSummary[]>) => void) => void;
  "room:ready": () => void;
  "room:choose_color": (payload: { color: import("./game").PlayerColor }, cb: (res: SocketResponse<Room>) => void) => void;

  // Game
  "game:roll": (cb: (res: SocketResponse<GameMove>) => void) => void;

  // Chat
  "chat:message": (message: string) => void;

  // Presence
  "presence:ping": () => void;

  // Ready reminder (sent by a ready player to ping unready ones)
  "room:ping_ready": () => void;

  // Explicit state refresh — call when UI may have missed events
  "room:get_state": (cb: (res: SocketResponse<{ room: Room; gameState: GameState | null }>) => void) => void;
}

// ── Events the SERVER sends to the CLIENT ──────────────────────────────────
export interface ServerToClientEvents {
  // Room
  "room:updated": (room: Room) => void;
  "room:list:updated": (rooms: RoomSummary[]) => void;
  "room:player:joined": (player: { id: string; username: string }) => void;
  "room:player:left": (playerId: string) => void;

  // Game
  "game:started": (state: GameState) => void;
  "game:state": (state: GameState) => void;
  "game:move": (move: GameMove & { newState: GameState }) => void;
  "game:finished": (state: GameState) => void;
  "game:turn": (playerId: string) => void;

  // Chat
  "chat:message": (msg: ChatMessage) => void;

  // System
  "system:error": (message: string) => void;
  "system:notification": (notification: SystemNotification) => void;
  "presence:pong": () => void;

  // Sent to unready players when another player pings them
  "room:remind_ready": (payload: { fromUsername: string }) => void;

  // Countdown before game starts (server-driven, emitted once with seconds=3)
  "room:countdown": (payload: { seconds: number }) => void;
}

// ── Inter-server events (for scaling with Redis adapter) ───────────────────
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
  roomId?: string;
}

export interface SocketResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarId: string;
  message: string;
  timestamp: number;
}

export interface SystemNotification {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: number;
}
