import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { createClient } from "@supabase/supabase-js";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/types/socket";
import { registerRoomHandlers, rooms } from "./handlers/room";
import { registerGameHandlers, persistMatchResult } from "./handlers/game";
import { registerChatHandlers } from "./handlers/chat";
import { getCachedProfile, setCachedProfile, refreshProfileTTL } from "@/server/cache/profileCache";
import { pendingRejoinInvites } from "@/server/socket/rejoinStore";

// userId → socketId index for O(1) duplicate-connection eviction
const userSocketIndex = new Map<string, string>();

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: (origin, cb) => {
          // Same-origin requests have no Origin header — always allow
          if (!origin) return cb(null, true);

          const allowed = new Set(
            [
              process.env.NEXT_PUBLIC_APP_URL,
              process.env.RENDER_EXTERNAL_URL,
            ].filter(Boolean) as string[]
          );

          if (
            allowed.has(origin) ||
            /\.onrender\.com$/.test(origin) ||
            /\.vercel\.app$/.test(origin) ||
            /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
          ) {
            cb(null, true);
          } else {
            console.warn(`[socket:cors] Blocked origin: ${origin}`);
            cb(new Error("CORS"));
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      },
      // Socket.io transport & perf settings
      transports: ["websocket", "polling"],
      pingTimeout: 20000,
      pingInterval: 10000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e5, // 100KB max payload
      connectTimeout: 15000,
    }
  );

  // ── Auth middleware ───────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // JWT verify — must always happen (validates the token)
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return next(new Error("Unauthorized"));

      socket.data.userId = user.id;

      // Profile: hit cache first, DB only on miss
      let profile = getCachedProfile(user.id);
      if (!profile) {
        const { data } = await supabase
          .from("profiles")
          .select("username,avatar_id,rank_tier,rank_stars,rank_points,level")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          const profileData = {
            username: data.username as string,
            avatar_id: data.avatar_id as string,
            rank_tier: data.rank_tier as string,
            rank_stars: data.rank_stars as number,
            rank_points: data.rank_points as number,
            level: data.level as number,
          };
          setCachedProfile(user.id, profileData);
          profile = getCachedProfile(user.id);
        }
      } else {
        refreshProfileTTL(user.id);
      }

      socket.data.username = profile?.username ?? user.email?.split("@")[0] ?? "Player";
      socket.handshake.auth.avatarId = profile?.avatar_id ?? "avatar_01";
      socket.handshake.auth.rank = {
        tier: profile?.rank_tier ?? "bronze",
        stars: profile?.rank_stars ?? 0,
        totalStars: 0,
        points: profile?.rank_points ?? 0,
      };
      socket.handshake.auth.level = profile?.level ?? 1;

      next();
    } catch (err) {
      console.error("[socket:auth]", err);
      next(new Error("Auth error"));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[socket] + ${socket.data.username} (${socket.id})`);

    // Evict previous connection from same user (tab refresh / duplicate tab)
    const prevSocketId = userSocketIndex.get(userId);
    if (prevSocketId && prevSocketId !== socket.id) {
      const prevSocket = io.sockets.sockets.get(prevSocketId);
      if (prevSocket) {
        // Transfer room ownership before kicking
        const prevRoomId = prevSocket.data.roomId;
        if (prevRoomId) socket.data.roomId = prevRoomId;
        prevSocket.emit("system:notification", { type: "info", message: "Reconnected from another tab", timestamp: Date.now() });
        prevSocket.disconnect(true);
      }
    }
    userSocketIndex.set(userId, socket.id);

    // ── Register handlers ─────────────────────────────────────────────────
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);

    // ── Deliver pending rejoin invite on connect ───────────────────────────
    const pendingInvite = pendingRejoinInvites.get(userId);
    if (pendingInvite && pendingInvite.expiresAt > Date.now()) {
      const { roomId: invRoomId, roomName, invitedBy } = pendingInvite;
      // Only deliver if game room still exists and is still playing
      const invRoom = rooms.get(invRoomId);
      if (invRoom && invRoom.gameState?.status === "playing") {
        socket.emit("game:rejoin_invite", { roomId: invRoomId, roomName, invitedBy });
      } else {
        pendingRejoinInvites.delete(userId);
      }
    }

    // ── Reconnect handler ─────────────────────────────────────────────────
    socket.on("room:reconnect", ({ roomId }, cb) => {
      const gameRoom = rooms.get(roomId);
      if (!gameRoom) return cb({ success: false, error: "Room no longer exists" });

      const player = gameRoom.room.players.find((p) => p.userId === userId);
      if (!player) return cb({ success: false, error: "You are not in this room" });

      // Rejoin the socket room
      socket.data.roomId = roomId;
      socket.join(roomId);
      gameRoom.setPlayerReconnected(userId);

      // Notify others
      socket.to(roomId).emit("room:updated", gameRoom.room);

      cb({
        success: true,
        data: {
          room: gameRoom.room,
          gameState: gameRoom.gameState,
        },
      });

      // Send current game state if in progress
      if (gameRoom.gameState) {
        socket.emit("game:state", gameRoom.gameState);
      }
    });

    socket.on("presence:ping", () => socket.emit("presence:pong"));

    // ── Disconnect handler ────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[socket] - ${socket.data.username} (${reason})`);

      // Only clean up index if this is still the active socket for this user
      if (userSocketIndex.get(userId) === socket.id) {
        userSocketIndex.delete(userId);
      }

      const roomId = socket.data.roomId;
      if (!roomId) return;

      const gameRoom = rooms.get(roomId);
      if (!gameRoom) return;

      gameRoom.setPlayerDisconnected(userId);
      io.to(roomId).emit("room:updated", gameRoom.room);
      // Push updated game state so clients see the disconnected badge immediately
      if (gameRoom.gameState) {
        io.to(roomId).emit("game:state", gameRoom.gameState);
      }

      if (gameRoom.room.status === "waiting") {
        // Remove immediately from lobby rooms
        gameRoom.removePlayer(userId);
        io.to(roomId).emit("room:player:left", userId);
        if (gameRoom.isEmpty) rooms.delete(roomId);
      } else {
        // Store pending rejoin invite (auto-invite when they reconnect)
        if (gameRoom.gameState?.status === "playing") {
          const hostPlayer = gameRoom.room.players.find((p) => p.userId === gameRoom.room.hostId);
          pendingRejoinInvites.set(userId, {
            roomId,
            roomName: gameRoom.room.name,
            invitedBy: hostPlayer?.username ?? "Host",
            expiresAt: Date.now() + 90_000,
          });
        }

        // Give 90s to reconnect during active game before removing
        setTimeout(() => {
          const room = rooms.get(roomId);
          if (!room) return;
          const p = room.room.players.find((pl) => pl.userId === userId);
          if (!p || p.isConnected) return; // reconnected — do nothing

          // Clear pending invite — they didn't come back
          pendingRejoinInvites.delete(userId);

          room.removePlayer(userId);
          io.to(roomId).emit("room:player:left", userId);

          const gs = room.gameState;
          if (!gs) return;

          const remaining = gs.players.filter((pl) => pl.userId !== userId);
          if (remaining.length === 0 || !room.room.players.some((pl) => pl.isConnected)) {
            // All players gone — abandon and persist
            gs.status = "finished";
            io.to(roomId).emit("game:finished", gs);
            persistMatchResult(gs, "abandoned").catch((e) =>
              console.error("[socket:disconnect] persist abandoned failed:", e)
            );
            rooms.delete(roomId);
          } else if (gs.players.length < 2) {
            // Only one player left in state — game over
            gs.status = "finished";
            io.to(roomId).emit("game:finished", gs);
            persistMatchResult(gs).catch((e) =>
              console.error("[socket:disconnect] persist failed:", e)
            );
          } else {
            // Advance turn index if it pointed at the removed slot
            if (gs.currentPlayerIndex >= gs.players.length) {
              gs.currentPlayerIndex = 0;
            }
            io.to(roomId).emit("game:state", gs);
            io.to(roomId).emit("system:notification", {
              type: "warning",
              message: `${p.username} left the game.`,
              timestamp: Date.now(),
            });
          }
        }, 90_000);
      }
    });
  });

  return io;
}
