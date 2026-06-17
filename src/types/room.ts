import type { GamePlayer, GameStatus } from "./game";

export type RoomVisibility = "public" | "private";

export interface Room {
  id: string;
  code: string;         // 6-char join code
  name: string;
  hostId: string;
  maxPlayers: 2 | 3 | 4 | 5 | 6;
  visibility: RoomVisibility;
  status: GameStatus;
  players: GamePlayer[];
  createdAt: number;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  status: GameStatus;
  visibility: RoomVisibility;
}

export interface CreateRoomPayload {
  name: string;
  maxPlayers: 2 | 3 | 4 | 5 | 6;
  visibility: RoomVisibility;
}

export interface JoinRoomPayload {
  code: string;
}
