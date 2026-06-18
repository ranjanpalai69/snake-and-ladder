"use client";

import { useCallback } from "react";
import { getSocket } from "@/lib/socket/client";
import { useRoomStore } from "@/stores/roomStore";
import { useGameStore } from "@/stores/gameStore";
import type { CreateRoomPayload, Room } from "@/types/room";
import type { PlayerColor } from "@/types/game";
import toast from "react-hot-toast";

/**
 * Provides socket action functions (emit wrappers).
 * Event binding lives in SocketInitializer inside Providers — one place only —
 * so calling this hook from many components does NOT create duplicate listeners.
 */
export function useSocket() {
  const { setCurrentRoom } = useRoomStore();
  const { setRolling } = useGameStore();

  const rollDice = useCallback(() => {
    setRolling(true);
    getSocket().emit("game:roll", (res) => {
      if (!res.success) {
        setRolling(false);
        toast.error(res.error ?? "Roll failed");
      }
    });
  }, [setRolling]);

  const sendChat = useCallback((message: string) => {
    getSocket().emit("chat:message", message);
  }, []);

  const createRoom = useCallback(
    (payload: CreateRoomPayload): Promise<Room | null> =>
      new Promise((resolve) => {
        getSocket().emit("room:create", payload, (res) => {
          if (res.success && res.data) { setCurrentRoom(res.data); resolve(res.data); }
          else { toast.error(res.error ?? "Failed to create room"); resolve(null); }
        });
      }),
    [setCurrentRoom]
  );

  const joinRoom = useCallback(
    (code: string): Promise<Room | null> =>
      new Promise((resolve) => {
        getSocket().emit("room:join", { code }, (res) => {
          if (res.success && res.data) { setCurrentRoom(res.data); resolve(res.data); }
          else { toast.error(res.error ?? "Failed to join room"); resolve(null); }
        });
      }),
    [setCurrentRoom]
  );

  const leaveRoom = useCallback(() => {
    getSocket().emit("room:leave");
    setCurrentRoom(null);
  }, [setCurrentRoom]);

  const setReady = useCallback(() => {
    getSocket().emit("room:ready");
  }, []);

  const pingReady = useCallback(() => {
    getSocket().emit("room:ping_ready");
  }, []);

  const startGame = useCallback((): Promise<boolean> =>
    new Promise((resolve) => {
      getSocket().emit("room:start", (res) => {
        if (!res.success) toast.error(res.error ?? "Failed to start");
        resolve(res.success);
      });
    }), []);

  const chooseColor = useCallback(
    (color: PlayerColor): Promise<boolean> =>
      new Promise((resolve) => {
        getSocket().emit("room:choose_color", { color }, (res) => {
          if (res.success && res.data) setCurrentRoom(res.data);
          else toast.error(res.error ?? "Color taken");
          resolve(res.success);
        });
      }),
    [setCurrentRoom]
  );

  return { rollDice, sendChat, createRoom, joinRoom, leaveRoom, setReady, startGame, pingReady, chooseColor };
}
