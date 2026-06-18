"use client";

import { useEffect, useRef, ReactNode } from "react";
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
  const { session, profile } = useAuthStore();
  const { setCurrentRoom, setPublicRooms, setConnected, setPersistedRoomId, setCountdown } = useRoomStore();
  const { setGameState, addChatMessage, setShowWinModal, setRolling, setReconnecting, setLastMove } = useGameStore();
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

    const onConnect = () => {
      setConnected(true);
      socket.emit("room:list", (res) => {
        if (res.success && res.data) setPublicRooms(res.data);
      });
      // Read fresh from store so we don't have a stale closure over persistedRoomId
      const { persistedRoomId } = useRoomStore.getState();
      if (persistedRoomId) {
        setReconnecting(true);
        socket.emit("room:reconnect", { roomId: persistedRoomId }, (res) => {
          setReconnecting(false);
          if (res.success && res.data) {
            setCurrentRoom(res.data.room);
            if (res.data.gameState) setGameState(res.data.gameState);
          } else {
            // Room gone — clear all stale state so we don't show orphaned game/room
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
      toast("Connection lost — reconnecting...", { icon: "⚡", duration: 3000 });
    };

    const onReconnectAttempt = (attempt: number) => {
      if (attempt > 1) setConnected(false);
    };

    const onReconnect = () => {
      socket.auth = { ...socket.auth, token: session.access_token };
      toast.success("Reconnected!", { duration: 2000 });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);

    socket.on("room:updated", (room) => setCurrentRoom(room));
    socket.on("room:list:updated", (rooms) => setPublicRooms(rooms));
    socket.on("room:countdown", ({ seconds }) => setCountdown(seconds));
    socket.on("game:started", (state) => { setCountdown(null); setGameState(state); toast.success("Game started! Good luck!"); });
    socket.on("game:state", (state) => setGameState(state));
    socket.on("game:move", ({ newState, ...move }) => { setGameState(newState); setLastMove(move as any); setRolling(false); });
    socket.on("game:finished", (state) => { setGameState(state); setShowWinModal(true); });
    socket.on("chat:message", (msg) => addChatMessage(msg));
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

    return () => {
      boundRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
      socket.off("room:updated");
      socket.off("room:list:updated");
      socket.off("room:countdown");
      socket.off("game:started");
      socket.off("game:state");
      socket.off("game:move");
      socket.off("game:finished");
      socket.off("chat:message");
      socket.off("system:error");
      socket.off("system:notification");
      socket.off("room:remind_ready");
    };
  }, [session?.access_token, profile?.id]);

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
