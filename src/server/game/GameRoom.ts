import { createInitialGameState, applyMove, rollDice } from "@/lib/game/engine";
import { generateRoomCode, generateId, shuffle } from "@/lib/utils";
import type { GameState, GamePlayer, PlayerColor, AvatarId } from "@/types/game";
import type { Room, CreateRoomPayload } from "@/types/room";

const COLORS: PlayerColor[] = ["red", "blue", "green", "yellow", "purple", "orange"];

export class GameRoom {
  public room: Room;
  public gameState: GameState | null = null;

  constructor(
    payload: CreateRoomPayload,
    hostId: string,
    hostUsername: string,
    hostAvatarId: AvatarId,
    hostRank: GamePlayer["rank"] = { tier: "bronze", stars: 0, totalStars: 0, points: 0 },
    hostLevel = 1,
  ) {
    const hostPlayer: GamePlayer = {
      id: generateId(),
      userId: hostId,
      username: hostUsername,
      avatarId: hostAvatarId,
      color: "red",
      position: 0,
      isReady: false,
      isConnected: true,
      rank: hostRank,
      level: hostLevel,
    };

    this.room = {
      id: generateId(),
      code: generateRoomCode(),
      name: payload.name,
      hostId,
      maxPlayers: payload.maxPlayers,
      visibility: payload.visibility,
      status: "waiting",
      players: [hostPlayer],
      createdAt: Date.now(),
    };
  }

  addPlayer(userId: string, username: string, avatarId: AvatarId, rank: GamePlayer["rank"], level: number): GamePlayer | null {
    if (this.room.players.length >= this.room.maxPlayers) return null;
    if (this.room.status !== "waiting") return null;
    if (this.room.players.find((p) => p.userId === userId)) return null;

    const usedColors = this.room.players.map((p) => p.color);
    const color = COLORS.find((c) => !usedColors.includes(c)) ?? "blue";

    const player: GamePlayer = {
      id: generateId(),
      userId,
      username,
      avatarId,
      color,
      position: 0,
      isReady: false,
      isConnected: true,
      rank,
      level,
    };

    this.room.players.push(player);
    return player;
  }

  removePlayer(userId: string): void {
    this.room.players = this.room.players.filter((p) => p.userId !== userId);

    if (this.room.players.length === 0) return;

    // Transfer host if host left
    if (this.room.hostId === userId) {
      this.room.hostId = this.room.players[0].userId;
    }

    if (this.gameState) {
      this.gameState.players = this.gameState.players.filter((p) => p.userId !== userId);
      if (this.gameState.players.length < 2 && this.gameState.status === "playing") {
        this.gameState.status = "finished";
      }
    }
  }

  chooseColor(userId: string, color: PlayerColor): boolean {
    const taken = this.room.players.some((p) => p.userId !== userId && p.color === color);
    if (taken) return false;
    const player = this.room.players.find((p) => p.userId === userId);
    if (player) player.color = color;
    return true;
  }

  setPlayerReady(userId: string): boolean {
    const player = this.room.players.find((p) => p.userId === userId);
    if (!player) return false;
    player.isReady = true;
    return this.room.players.length >= 2 && this.room.players.every((p) => p.isReady);
  }

  startGame(): GameState {
    const shuffledPlayers = shuffle([...this.room.players]);
    this.gameState = createInitialGameState(this.room.id, shuffledPlayers);
    this.room.status = "playing";
    return this.gameState;
  }

  processRoll(userId: string): { move: ReturnType<typeof applyMove>["move"]; newState: GameState } | null {
    if (!this.gameState || this.gameState.status !== "playing") return null;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (currentPlayer.userId !== userId) return null;

    const diceValue = rollDice();
    const { newState, move } = applyMove(this.gameState, currentPlayer.id, diceValue);
    this.gameState = newState;

    return { move, newState };
  }

  get isFull(): boolean {
    return this.room.players.length >= this.room.maxPlayers;
  }

  get isEmpty(): boolean {
    return this.room.players.length === 0;
  }

  setPlayerDisconnected(userId: string): void {
    const player = this.room.players.find((p) => p.userId === userId);
    if (player) player.isConnected = false;
    if (this.gameState) {
      const gp = this.gameState.players.find((p) => p.userId === userId);
      if (gp) gp.isConnected = false;
    }
  }

  setPlayerReconnected(userId: string): void {
    const player = this.room.players.find((p) => p.userId === userId);
    if (player) player.isConnected = true;
    if (this.gameState) {
      const gp = this.gameState.players.find((p) => p.userId === userId);
      if (gp) gp.isConnected = true;
    }
  }
}
