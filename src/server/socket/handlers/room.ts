import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/types/socket";
import type { CreateRoomPayload, JoinRoomPayload, RoomSummary } from "@/types/room";
import type { AvatarId } from "@/types/game";
import { GameRoom } from "@/server/game/GameRoom";
import { generateId } from "@/lib/utils";

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
    const roomId = codeIndex.get(payload.code.toUpperCase());
    if (!roomId) return cb({ success: false, error: "Room not found" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });
    if (gameRoom.isFull) return cb({ success: false, error: "Room is full" });
    if (gameRoom.room.status !== "waiting") return cb({ success: false, error: "Game already started" });

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
      gameRoom.removePlayer(userId);
      socket.to(roomId).emit("room:player:left", userId);
      if (gameRoom.isEmpty) {
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

    const allReady = gameRoom.setPlayerReady(userId);
    io.to(roomId).emit("room:updated", gameRoom.room);

    if (allReady) {
      // Broadcast countdown: 3 → 2 → 1, then start
      io.to(roomId).emit("room:countdown", { seconds: 3 });
      setTimeout(() => io.to(roomId).emit("room:countdown", { seconds: 2 }), 1000);
      setTimeout(() => io.to(roomId).emit("room:countdown", { seconds: 1 }), 2000);
      setTimeout(() => {
        const gameState = gameRoom.startGame();
        io.to(roomId).emit("game:started", gameState);
      }, 3000);
    }
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
