"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "@/stores/roomStore";
import { useGameStore } from "@/stores/gameStore";
import { connectSocket, disconnectSocket } from "@/lib/socket/client";
import { playRemindReady } from "@/lib/sounds";

function AuthInitializer() {
  useAuth();
  return null;
}

/**
 * Binds ALL socket event listeners exactly once for the entire app lifetime.
 * No other component should call connectSocket or socket.on — they use
 * useSocket() for actions (emit) only.
 */
function SocketInitializer() {
  const router = useRouter();
  const { session, profile } = useAuthStore();
  const {
    setCurrentRoom,
    setPublicRooms,
    setConnected,
    setPersistedRoomId,
    setCountdown,
  } = useRoomStore();
  const {
    setGameState,
    addChatMessage,
    clearChatForRoom,
    setShowWinModal,
    setRolling,
    setReconnecting,
    setLastMove,
    setDiceReveal,
    setTypingUser,
    incrementUnread,
  } = useGameStore();
  const boundRef = useRef(false);

  useEffect(() => {
    // No session — ensure socket is torn down
    if (!session?.access_token || !profile) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    // Guard against React Strict Mode double-invoke and multi-consumer callers
    if (boundRef.current) return;
    boundRef.current = true;

    const socket = connectSocket(
      session.access_token,
      profile.avatar_id,
      { tier: profile.rank_tier, stars: profile.rank_stars, totalStars: 0, points: profile.rank_points },
      profile.level
    );

    // ── Connect / reconnect handlers ────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);

      // Refresh public room list
      socket.emit("room:list", (res) => {
        if (res.success && res.data) setPublicRooms(res.data);
      });

      // Attempt to rejoin a room from a previous session
      const { persistedRoomId } = useRoomStore.getState();
      if (persistedRoomId) {
        setReconnecting(true);
        socket.emit("room:reconnect", { roomId: persistedRoomId }, (res) => {
          setReconnecting(false);
          if (res.success && res.data) {
            setCurrentRoom(res.data.room);
            if (res.data.gameState) setGameState(res.data.gameState);
          } else {
            // Room gone — clear all stale state
            setPersistedRoomId(null);
            setCurrentRoom(null);
            setGameState(null);
          }
        });
      }
    };

    const onDisconnect = (reason: string) => {
      setConnected(false);
      if (reason === "io server disconnect" || reason === "io client disconnect") return;
      toast("Connection lost — reconnecting…", { icon: "⚡", duration: 3000 });
    };

    const onReconnectAttempt = (attempt: number) => {
      if (attempt > 1) setConnected(false);
    };

    // Always use the freshest token from the store — the closure here captures
    // the token at bind time, but Supabase may have silently refreshed it since
    const onReconnect = () => {
      const freshToken = useAuthStore.getState().session?.access_token;
      if (freshToken) socket.auth = { ...socket.auth, token: freshToken };
      setConnected(true);
      toast.success("Reconnected!", { duration: 2000 });
    };

    const onReconnectFailed = () => {
      toast.error("Could not reconnect. Please refresh the page.", { duration: 8000 });
      setPersistedRoomId(null);
      setCurrentRoom(null);
      setGameState(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.io.on("reconnect_failed", onReconnectFailed);

    // ── Room events ────────────────────────────────────────────────────────
    socket.on("room:updated", (room) => setCurrentRoom(room));
    socket.on("room:list:updated", (rooms) => setPublicRooms(rooms));
    socket.on("room:countdown", ({ seconds }) => setCountdown(seconds));

    socket.on("room:player:joined", ({ username }) => {
      toast(`${username} joined the room!`, {
        icon: "👋",
        duration: 3000,
        style: {
          background: "#1e1b4b",
          border: "1px solid rgba(99,102,241,0.4)",
          color: "#e2e8f0",
        },
      });
    });

    socket.on("room:player:left", (playerId) => {
      // Look up the player's name from the current room BEFORE room:updated removes them
      const { currentRoom } = useRoomStore.getState();
      const { gameState } = useGameStore.getState();
      // Only show this toast for lobby (not active game — game:player_left handles that)
      if (gameState?.status === "playing") return;
      const player = currentRoom?.players.find((p) => p.userId === playerId);
      const name = player?.username ?? "A player";
      toast(`${name} left the room.`, {
        icon: "🚪",
        duration: 3000,
        style: {
          background: "#1e1b4b",
          border: "1px solid rgba(99,102,241,0.3)",
          color: "#94a3b8",
        },
      });
    });

    // ── Game events ────────────────────────────────────────────────────────
    socket.on("game:started", (state) => {
      setCountdown(null);
      setGameState(state);
      // Clear chat so each game starts with a fresh, room-specific history
      clearChatForRoom(state.roomId);
      toast.success("Game started! Good luck!", { duration: 3000 });
    });

    socket.on("game:state", (state) => setGameState(state));

    socket.on("game:move", ({ newState, ...move }) => {
      const m = move as any;
      setGameState(newState);
      setRolling(false);
      setDiceReveal(m.diceValue ?? null);
      setTimeout(() => {
        setLastMove(m);
        setDiceReveal(null);
        if (m.rolledSix && !m.wasBlocked && !newState.winner) {
          toast("Rolled 6 — extra turn!", { icon: "🎲", duration: 2000, style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(99,102,241,0.4)" } });
        } else if (m.wasBlocked) {
          toast("Overshot 100 — turn passes!", { icon: "⛔", duration: 2000, style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(239,68,68,0.4)" } });
        }
      }, 1000);
    });

    socket.on("game:finished", (state) => {
      setGameState(state);
      setShowWinModal(true);
    });

    // game:turn is informational — currentPlayerIndex is already in game:move payload
    socket.on("game:turn", () => {});

    // ── Player left during active game ────────────────────────────────────
    socket.on("game:player_left", ({ username, remainingCount }) => {
      const message =
        remainingCount >= 2
          ? `${username} left the game. Match continues!`
          : `${username} left. You are the last player.`;

      toast(
        (t) => (
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13 }}>🚪 {message}</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: 8,
                padding: "3px 10px",
                cursor: "pointer",
                fontSize: 11,
                alignSelf: "flex-start",
              }}
            >
              Dismiss
            </button>
          </span>
        ),
        {
          duration: 8000,
          style: {
            background: "#1e1b4b",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#e2e8f0",
            borderRadius: 12,
            maxWidth: 320,
          },
        }
      );
    });

    // ── Rejoin invite — only delivered when host explicitly sends one ──────
    socket.on("game:rejoin_invite", ({ roomId, roomName, invitedBy }) => {
      toast(
        (t) => (
          <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>
              <strong>{invitedBy}</strong> invites you back to <strong>{roomName}</strong>
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(`/game/${roomId}`);
                }}
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Rejoin
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(148,163,184,0.3)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </span>
          </span>
        ),
        {
          duration: 30_000,
          style: {
            background: "#1e1b4b",
            border: "1px solid rgba(99,102,241,0.5)",
            color: "#e2e8f0",
            borderRadius: 12,
            maxWidth: 320,
          },
        }
      );
    });

    // ── Chat ───────────────────────────────────────────────────────────────
    socket.on("chat:message", (msg) => {
      const { gameState } = useGameStore.getState();
      const roomId = gameState?.roomId ?? "";
      addChatMessage(msg, roomId);
      incrementUnread();
    });

    socket.on("chat:typing", ({ userId, username, isTyping }) => {
      setTypingUser({ userId, username }, isTyping);
    });

    // ── System ────────────────────────────────────────────────────────────
    socket.on("system:error", (msg) => toast.error(msg));
    socket.on("system:notification", ({ type, message }) => {
      if (type === "success") toast.success(message);
      else if (type === "error") toast.error(message);
      else toast(message);
    });

    socket.on("room:remind_ready", ({ fromUsername }) => {
      playRemindReady();
      toast(`${fromUsername} is waiting — click Ready Up!`, {
        icon: "🔔",
        duration: 6000,
        style: {
          background: "#3b0764",
          border: "1px solid rgba(167,139,250,0.5)",
          color: "#e9d5ff",
          fontWeight: "600",
        },
      });
    });

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      boundRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.off("room:updated");
      socket.off("room:list:updated");
      socket.off("room:countdown");
      socket.off("room:player:joined");
      socket.off("room:player:left");
      socket.off("game:started");
      socket.off("game:state");
      socket.off("game:move");
      socket.off("game:finished");
      socket.off("game:turn");
      socket.off("game:player_left");
      socket.off("game:rejoin_invite");
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("system:error");
      socket.off("system:notification");
      socket.off("room:remind_ready");
    };
  }, [session?.access_token, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthInitializer />
      <SocketInitializer />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1b4b",
            color: "#e2e8f0",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </>
  );
}
