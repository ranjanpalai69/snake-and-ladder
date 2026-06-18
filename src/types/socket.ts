import type { GameState, GameMove } from "./game";
import type { Room, RoomSummary, CreateRoomPayload, JoinRoomPayload } from "./room";

// ── Events the CLIENT sends to the SERVER ──────────────────────────────────
export interface ClientToServerEvents {
  // Room
  "room:create": (payload: CreateRoomPayload, cb: (res: SocketResponse<Room>) => void) => void;
  "room:join": (payload: JoinRoomPayload, cb: (res: SocketResponse<Room>) => void) => void;
  "room:reconnect": (payload: { roomId: string }, cb: (res: SocketResponse<{ room: Room; gameState: GameState | null }>) => void) => void;
  "room:leave": () => void;
  "room:list": (cb: (res: SocketResponse<RoomSummary[]>) => void) => void;
  "room:ready": () => void;
  /** Host explicitly starts the game (replaces auto-start when all ready) */
  "room:start": (cb: (res: SocketResponse<void>) => void) => void;
  "room:choose_color": (payload: { color: import("./game").PlayerColor }, cb: (res: SocketResponse<Room>) => void) => void;
  "room:get_state": (cb: (res: SocketResponse<{ room: Room; gameState: GameState | null }>) => void) => void;

  // Game
  "game:roll": (cb: (res: SocketResponse<GameMove>) => void) => void;
  /** Host kicks a disconnected player — game continues with remaining players */
  "game:kick_player": (payload: { targetUserId: string }, cb: (res: SocketResponse<GameState>) => void) => void;
  /** Send/re-send a rejoin invite to a disconnected player */
  "game:invite_rejoin": (payload: { targetUserId: string }) => void;

  // Chat
  "chat:message": (message: string) => void;
  "chat:typing": (payload: { isTyping: boolean }) => void;

  // Presence
  "presence:ping": () => void;

  // Ready reminder (sent by a ready player to ping unready ones)
  "room:ping_ready": () => void;
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
  /** Sent to a disconnected player when they reconnect — invites them back */
  "game:rejoin_invite": (payload: { roomId: string; roomName: string; invitedBy: string }) => void;
  /** Sent to all remaining players when someone leaves during an active game */
  "game:player_left": (payload: { userId: string; username: string; remainingCount: number }) => void;

  // Chat
  "chat:message": (msg: ChatMessage) => void;
  "chat:typing": (payload: { userId: string; username: string; isTyping: boolean }) => void;

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
