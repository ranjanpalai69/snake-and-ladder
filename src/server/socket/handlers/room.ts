import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/types/socket";
import type { CreateRoomPayload, JoinRoomPayload, RoomSummary } from "@/types/room";
import type { AvatarId } from "@/types/game";
import { GameRoom } from "@/server/game/GameRoom";
import { generateId } from "@/lib/utils";
import { persistMatchResult } from "./persist";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// In-memory store — for production use Redis
export const rooms = new Map<string, GameRoom>();

// Map roomCode → roomId
const codeIndex = new Map<string, string>();

function getRoomSummaries(): RoomSummary[] {
  return Array.from(rooms.values())
    .filter((r) => r.room.visibility === "public" && r.room.status === "waiting")
    .map((r) => ({
      id: r.room.id,
      code: r.room.code,
      name: r.room.name,
      hostUsername: r.room.players.find((p) => p.userId === r.room.hostId)?.username ?? "Unknown",
      playerCount: r.room.players.length,
      maxPlayers: r.room.maxPlayers,
      status: r.room.status,
      visibility: r.room.visibility,
    }));
}

export function registerRoomHandlers(io: IoServer, socket: IoSocket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  socket.on("room:create", async (payload: CreateRoomPayload, cb) => {
    // Leave current room if in one
    const currentRoomId = socket.data.roomId;
    if (currentRoomId) {
      const currentRoom = rooms.get(currentRoomId);
      if (currentRoom) {
        currentRoom.removePlayer(userId);
        if (currentRoom.isEmpty) rooms.delete(currentRoomId);
        socket.leave(currentRoomId);
      }
    }

    const avatarId = (socket.handshake.auth.avatarId ?? "avatar_01") as AvatarId;
    const rank = socket.handshake.auth.rank ?? { tier: "bronze", stars: 0, totalStars: 0, points: 0 };
    const level = socket.handshake.auth.level ?? 1;

    const gameRoom = new GameRoom(payload, userId, username, avatarId, rank, level);
    rooms.set(gameRoom.room.id, gameRoom);
    codeIndex.set(gameRoom.room.code, gameRoom.room.id);

    socket.data.roomId = gameRoom.room.id;
    socket.join(gameRoom.room.id);

    io.emit("room:list:updated", getRoomSummaries());
    cb({ success: true, data: gameRoom.room });
  });

  socket.on("room:join", async (payload: JoinRoomPayload, cb) => {
    // Leave any previous room before joining a new one
    const prevRoomId = socket.data.roomId;
    if (prevRoomId && prevRoomId !== undefined) {
      const prevRoom = rooms.get(prevRoomId);
      if (prevRoom) {
        prevRoom.removePlayer(userId);
        socket.to(prevRoomId).emit("room:player:left", userId);
        if (prevRoom.isEmpty) {
          rooms.delete(prevRoomId);
          codeIndex.delete(prevRoom.room.code);
        } else {
          io.to(prevRoomId).emit("room:updated", prevRoom.room);
        }
      }
      socket.leave(prevRoomId);
      socket.data.roomId = undefined;
    }

    const roomId = codeIndex.get(payload.code.toUpperCase());
    if (!roomId) return cb({ success: false, error: "Room not found" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });
    if (gameRoom.isFull) return cb({ success: false, error: "Room is full" });
    if (gameRoom.room.status !== "waiting") {
      return cb({ success: false, error: gameRoom.room.status === "starting" ? "Game is starting..." : "Game already started" });
    }
    // Prevent duplicate join
    if (gameRoom.room.players.find((p) => p.userId === userId)) {
      // Already in this room — re-join socket room and return current state
      socket.data.roomId = roomId;
      socket.join(roomId);
      return cb({ success: true, data: gameRoom.room });
    }

    const avatarId = (socket.handshake.auth.avatarId ?? "avatar_01") as AvatarId;
    const rank = socket.handshake.auth.rank ?? { tier: "bronze", stars: 0, totalStars: 0, points: 0 };
    const level = socket.handshake.auth.level ?? 1;

    const player = gameRoom.addPlayer(userId, username, avatarId, rank, level);
    if (!player) return cb({ success: false, error: "Could not join room" });

    socket.data.roomId = roomId;
    socket.join(roomId);

    io.to(roomId).emit("room:updated", gameRoom.room);
    io.to(roomId).emit("room:player:joined", { id: player.id, username });
    io.emit("room:list:updated", getRoomSummaries());

    cb({ success: true, data: gameRoom.room });
  });

  socket.on("room:leave", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const gameRoom = rooms.get(roomId);
    if (gameRoom) {
      // Capture before removal
      const leftPlayer = gameRoom.room.players.find((p) => p.userId === userId);
      const wasPlaying = gameRoom.gameState?.status === "playing";

      gameRoom.removePlayer(userId);
      socket.to(roomId).emit("room:player:left", userId);

      const gs = gameRoom.gameState;

      if (wasPlaying && gs) {
        // Notify all remaining players with the player's name
        io.to(roomId).emit("game:player_left", {
          userId,
          username: leftPlayer?.username ?? "A player",
          remainingCount: gs.players.length,
        });

        if (gs.status === "finished") {
          // 0 or 1 players remain — end the game
          io.to(roomId).emit("game:finished", gs);
          persistMatchResult(gs).catch((e) =>
            console.error("[room:leave] persist failed:", e)
          );
          if (gameRoom.isEmpty) {
            rooms.delete(roomId);
            codeIndex.delete(gameRoom.room.code);
          }
        } else {
          // 2+ players remain — game continues without the left player
          io.to(roomId).emit("game:state", gs);
          io.to(roomId).emit("room:updated", gameRoom.room);
        }
      } else if (gameRoom.isEmpty) {
        rooms.delete(roomId);
        codeIndex.delete(gameRoom.room.code);
      } else {
        io.to(roomId).emit("room:updated", gameRoom.room);
      }
    }

    socket.leave(roomId);
    socket.data.roomId = undefined;
    io.emit("room:list:updated", getRoomSummaries());
  });

  // Explicit state refresh — called by clients that may have missed events
  socket.on("room:get_state", (cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });
    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });
    cb({ success: true, data: { room: gameRoom.room, gameState: gameRoom.gameState } });
  });

  socket.on("room:list", (cb) => {
    cb({ success: true, data: getRoomSummaries() });
  });

  socket.on("room:choose_color", ({ color }, cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });
    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });
    const ok = gameRoom.chooseColor(userId, color);
    if (!ok) return cb({ success: false, error: "Color already taken" });
    io.to(roomId).emit("room:updated", gameRoom.room);
    cb({ success: true, data: gameRoom.room });
  });

  socket.on("room:ready", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return;

    // Toggle ready state — host decides when to actually start
    gameRoom.setPlayerReady(userId);
    io.to(roomId).emit("room:updated", gameRoom.room);
  });

  socket.on("room:start", (cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });
    if (gameRoom.room.hostId !== userId) return cb({ success: false, error: "Only the host can start the game" });
    if (gameRoom.room.players.length < 2) return cb({ success: false, error: "Need at least 2 players to start" });
    if (gameRoom.room.status !== "waiting") return cb({ success: false, error: "Game already starting or started" });

    // Lock room so no new players can join during countdown
    gameRoom.room.status = "starting";
    io.to(roomId).emit("room:updated", gameRoom.room);
    io.emit("room:list:updated", getRoomSummaries());

    io.to(roomId).emit("room:countdown", { seconds: 3 });
    setTimeout(() => io.to(roomId).emit("room:countdown", { seconds: 2 }), 1000);
    setTimeout(() => io.to(roomId).emit("room:countdown", { seconds: 1 }), 2000);
    setTimeout(() => {
      const gameState = gameRoom.startGame();
      io.to(roomId).emit("game:started", gameState);
    }, 3000);

    cb({ success: true });
  });

  socket.on("room:ping_ready", async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const gameRoom = rooms.get(roomId);
    if (!gameRoom || gameRoom.room.status !== "waiting") return;

    // Only ready players can send reminders
    const sender = gameRoom.room.players.find((p) => p.userId === userId);
    if (!sender?.isReady) return;

    // Ping each unready player's socket individually
    const socketsInRoom = await io.in(roomId).fetchSockets();
    for (const s of socketsInRoom) {
      const player = gameRoom.room.players.find((p) => p.userId === s.data.userId && !p.isReady);
      if (player) {
        io.to(s.id).emit("room:remind_ready", { fromUsername: username });
      }
    }
  });
}

export { getRoomSummaries };
