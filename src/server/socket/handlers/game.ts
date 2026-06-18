import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/types/socket";
import { rooms, getRoomSummaries } from "./room";
import type { GameState } from "@/types/game";
import { pendingRejoinInvites } from "@/server/socket/rejoinStore";
import { persistMatchResult } from "./persist";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(io: IoServer, socket: IoSocket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  socket.on("game:roll", async (cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });

    const result = gameRoom.processRoll(userId);
    if (!result) return cb({ success: false, error: "Not your turn" });

    const { move, newState } = result;

    io.to(roomId).emit("game:move", { ...move, newState });
    io.to(roomId).emit("game:state", newState);

    if (newState.winner) {
      io.to(roomId).emit("game:finished", newState);
      persistMatchResult(newState).catch((err) => {
        console.error("[game] Failed to persist match result:", err);
      });
    } else {
      const nextPlayer = newState.players[newState.currentPlayerIndex];
      io.to(roomId).emit("game:turn", nextPlayer.userId);
    }

    cb({ success: true, data: move });
  });

  // ── Host kicks a disconnected/refusing player ─────────────────────────────
  // ── Any connected player can skip a disconnected player's turn ───────────
  socket.on("game:skip_turn", ({ targetUserId }, cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });

    const gs = gameRoom.gameState;
    if (!gs || gs.status !== "playing") return cb({ success: false, error: "Game not in progress" });

    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer.userId !== targetUserId)
      return cb({ success: false, error: "Not that player's turn" });
    if (currentPlayer.isConnected)
      return cb({ success: false, error: "Player is still connected" });

    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length;

    io.to(roomId).emit("game:state", gs);
    io.to(roomId).emit("game:turn", gs.players[gs.currentPlayerIndex].userId);
    io.to(roomId).emit("system:notification", {
      type: "info",
      message: `${currentPlayer.username}'s turn was skipped.`,
      timestamp: Date.now(),
    });

    cb({ success: true, data: gs });
  });

  // ── Any connected player can remove a disconnected player ─────────────────
  socket.on("game:kick_player", ({ targetUserId }, cb) => {
    const roomId = socket.data.roomId;
    if (!roomId) return cb({ success: false, error: "Not in a room" });

    const gameRoom = rooms.get(roomId);
    if (!gameRoom) return cb({ success: false, error: "Room not found" });

    const target = gameRoom.room.players.find((p) => p.userId === targetUserId);
    if (!target) return cb({ success: false, error: "Player not found in room" });
    if (target.isConnected) return cb({ success: false, error: "Cannot remove a connected player" });

    // Remove the player from game state and clear any pending invite
    gameRoom.removePlayer(targetUserId);
    pendingRejoinInvites.delete(targetUserId);

    const gs = gameRoom.gameState;
    if (!gs) return cb({ success: false, error: "No active game" });

    if (gs.players.length < 2) {
      gs.status = "finished";
      io.to(roomId).emit("game:finished", gs);
      persistMatchResult(gs).catch((err) => console.error("[game:kick] persist failed:", err));
    } else {
      io.to(roomId).emit("game:state", gs);
      io.to(roomId).emit("room:updated", gameRoom.room);
      io.to(roomId).emit("game:player_left", {
        userId: targetUserId,
        username: target.username,
        remainingCount: gs.players.length,
      });
    }

    io.emit("room:list:updated", getRoomSummaries());
    cb({ success: true, data: gs });
  });

  // ── Send/re-send a rejoin invite to a disconnected player ─────────────────
  socket.on("game:invite_rejoin", ({ targetUserId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const gameRoom = rooms.get(roomId);
    if (!gameRoom || gameRoom.gameState?.status !== "playing") return;

    const target = gameRoom.room.players.find((p) => p.userId === targetUserId);
    if (!target || target.isConnected) return;

    // Store/refresh the pending invite
    pendingRejoinInvites.set(targetUserId, {
      roomId,
      roomName: gameRoom.room.name,
      invitedBy: username,
      expiresAt: Date.now() + 90_000,
    });

    // If the target user has an active socket, deliver immediately
    const sockets = io.sockets.sockets;
    for (const [, s] of sockets) {
      if ((s as typeof socket).data.userId === targetUserId) {
        s.emit("game:rejoin_invite", {
          roomId,
          roomName: gameRoom.room.name,
          invitedBy: username,
        });
        break;
      }
    }
  });
}

// Re-export for any remaining consumers importing from this file
export { persistMatchResult } from "./persist";
