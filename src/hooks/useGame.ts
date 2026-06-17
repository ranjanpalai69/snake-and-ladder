"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { cellToCoords } from "@/lib/game/constants";

export function useGame() {
  const { gameState, isRolling, pendingMove } = useGameStore();
  const { user } = useAuthStore();

  const currentPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex] ?? null;
  }, [gameState]);

  const myPlayer = useMemo(() => {
    if (!gameState || !user) return null;
    return gameState.players.find((p) => p.userId === user.id) ?? null;
  }, [gameState, user]);

  const isMyTurn = useMemo(() => {
    return !!myPlayer && currentPlayer?.userId === user?.id;
  }, [myPlayer, currentPlayer, user]);

  const playerPositions = useMemo(() => {
    if (!gameState) return {};
    return Object.fromEntries(
      gameState.players.map((p) => [p.id, { ...cellToCoords(p.position), position: p.position }])
    );
  }, [gameState]);

  return {
    gameState,
    currentPlayer,
    myPlayer,
    isMyTurn,
    isRolling,
    pendingMove,
    playerPositions,
  };
}
